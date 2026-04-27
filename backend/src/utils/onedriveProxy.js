const { https } = require('follow-redirects');
const nativeHttps = require('https');
const { spawn } = require('child_process');

/**
 * Resolve a OneDrive sharing URL to a direct download URL.
 *
 * OneDrive 1drv.ms links follow this pattern:
 *   https://1drv.ms/v/c/{CID}/{SHARE_ID}?e=...
 *
 * The direct download URL is:
 *   https://my.microsoftpersonalcontent.com/personal/{cid_lowercase}/_layouts/15/download.aspx?share={SHARE_ID}
 */
function resolveOneDriveUrl(shareUrl) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(shareUrl);
    const options = {
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      headers: { 'User-Agent': 'Mozilla/5.0' },
      method: 'HEAD',
    };

    // Use native https (no follow) to capture the first redirect
    const req = nativeHttps.request(options, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        const location = res.headers.location;
        try {
          const redirectUrl = new URL(location);
          const cid = redirectUrl.searchParams.get('cid');

          const pathParts = parsed.pathname.split('/');
          const shareId = pathParts[pathParts.length - 1];
          const cidLower = cid ? cid.toLowerCase() : pathParts[pathParts.length - 2].toLowerCase();

          if (shareId && cidLower) {
            // Clean up shareId in case it has extra query params attached (like ?download=1)
            const cleanShareId = shareId.split('?')[0];
            const downloadUrl = `https://my.microsoftpersonalcontent.com/personal/${cidLower}/_layouts/15/download.aspx?share=${cleanShareId}`;
            resolve(downloadUrl);
          } else {
            reject(new Error('Could not extract CID or Share ID from OneDrive URL'));
          }
        } catch (err) {
          reject(new Error('Failed to parse OneDrive redirect: ' + err.message));
        }
      } else {
        reject(new Error(`Unexpected status ${res.statusCode} from OneDrive`));
      }
    });

    req.on('error', reject);
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('OneDrive URL resolution timed out'));
    });
    req.end();
  });
}

/**
 * Check if a file needs remuxing (MKV → MP4) for browser compatibility.
 */
function needsRemux(contentDisposition) {
  if (!contentDisposition) return false;
  const lower = contentDisposition.toLowerCase();
  // Browser native formats: .mp4, .webm, .m4v (mostly), .mov (mostly)
  // Needs remux: .mkv, .avi, .wmv, .flv, .3gp, .ts
  return lower.includes('.mkv') || 
         lower.includes('.avi') || 
         lower.includes('.wmv') || 
         lower.includes('.flv') ||
         lower.includes('.ts');
}

/**
 * Do a HEAD request that follows redirects to get the final file info.
 */
function getFileInfo(downloadUrl) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(downloadUrl);
    const headReq = https.request({
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      method: 'HEAD',
      headers: { 'User-Agent': 'Mozilla/5.0' },
      maxRedirects: 10,
    }, (headRes) => {
      const disposition = headRes.headers['content-disposition'] || '';
      const contentLength = headRes.headers['content-length'] || '';
      const contentType = headRes.headers['content-type'] || '';
      console.log(`[Stream] HEAD → status=${headRes.statusCode}, type=${contentType}, length=${contentLength}, disposition=${disposition.substring(0, 80)}`);
      resolve({ disposition, contentLength, contentType });
    });
    headReq.on('error', reject);
    headReq.setTimeout(15000, () => { headReq.destroy(); reject(new Error('HEAD timeout')); });
    headReq.end();
  });
}

/**
 * Proxy a video stream from OneDrive to the client.
 * Uses follow-redirects to properly handle OneDrive CDN redirects.
 * For MKV files, remuxes to MP4 on the fly using FFmpeg.
 * For MP4/WebM files, proxies directly with Range support.
 */
async function proxyOneDriveStream(req, res, downloadUrl) {
  const parsed = new URL(downloadUrl);

  // First, do a HEAD request to check the content type
  const fileInfo = await getFileInfo(downloadUrl);

  if (needsRemux(fileInfo.disposition)) {
    // MKV file — remux to MP4 via FFmpeg
    console.log('[Stream] MKV detected — remuxing to MP4 via FFmpeg');

    res.writeHead(200, {
      'Content-Type': 'video/mp4',
      'Transfer-Encoding': 'chunked',
      'Cache-Control': 'no-cache',
      'X-Content-Type-Options': 'nosniff',
    });

    // Fetch the full file from OneDrive (follows redirects)
    const proxyReq = https.get({
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      headers: { 'User-Agent': 'Mozilla/5.0' },
      maxRedirects: 10,
    }, (proxyRes) => {
      if (proxyRes.statusCode !== 200) {
        console.error(`[Stream] OneDrive returned status ${proxyRes.statusCode} for MKV`);
        if (!res.writableEnded) res.end();
        return;
      }

      const ffmpeg = spawn('ffmpeg', [
        '-hide_banner',
        '-loglevel', 'warning',
        '-probesize', '50M',
        '-analyzeduration', '50M',
        '-fflags', '+genpts+discardcorrupt',
        '-i', 'pipe:0',
        '-map', '0:v:0',
        '-map', '0:a:0',
        '-c:v', 'copy',
        '-c:a', 'aac',
        '-b:a', '192k',
        '-ac', '2',
        '-ar', '48000',
        '-movflags', 'frag_keyframe+empty_moov+default_base_moof',
        '-f', 'mp4',
        'pipe:1'
      ], {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      // Pipe OneDrive → FFmpeg stdin with backpressure handling
      proxyRes.on('data', (chunk) => {
        const canWrite = ffmpeg.stdin.write(chunk);
        if (!canWrite) {
          proxyRes.pause();
          ffmpeg.stdin.once('drain', () => proxyRes.resume());
        }
      });
      proxyRes.on('end', () => {
        ffmpeg.stdin.end();
      });
      proxyRes.on('error', () => {
        ffmpeg.stdin.end();
      });

      // Pipe FFmpeg stdout → response
      ffmpeg.stdout.pipe(res);

      ffmpeg.stdin.on('error', () => {});
      ffmpeg.stdout.on('error', () => {});

      ffmpeg.stderr.on('data', (data) => {
        const msg = data.toString().trim();
        if (msg) console.log('[FFmpeg]', msg);
      });

      ffmpeg.on('error', (err) => {
        console.error('[FFmpeg] Process error:', err.message);
      });

      ffmpeg.on('close', (code) => {
        if (code !== 0 && code !== null) {
          console.error('[FFmpeg] Exited with code:', code);
        }
        if (!res.writableEnded) res.end();
      });

      req.on('close', () => {
        proxyRes.destroy();
        ffmpeg.kill('SIGTERM');
        proxyReq.destroy();
      });
    });

    proxyReq.on('error', (err) => {
      console.error('MKV proxy error:', err.message);
      if (!res.headersSent) {
        res.status(502).json({ error: 'Failed to fetch video' });
      }
    });

  } else {
    // MP4/WebM — direct proxy with Range support (follows redirects)
    const headers = {
      'User-Agent': 'Mozilla/5.0',
    };
    if (req.headers.range) {
      headers['Range'] = req.headers.range;
    }

    console.log(`[Stream] Direct proxy — Range: ${req.headers.range || 'none'}`);

    const proxyReq = https.get({
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      headers,
      maxRedirects: 10,
    }, (proxyRes) => {
      console.log(`[Stream] OneDrive responded: ${proxyRes.statusCode}, content-length: ${proxyRes.headers['content-length'] || 'unknown'}`);

      // If OneDrive returned an error, don't pipe garbage to the client
      if (proxyRes.statusCode >= 400) {
        console.error(`[Stream] OneDrive error: ${proxyRes.statusCode}`);
        if (!res.headersSent) {
          res.status(502).json({ error: 'Video source unavailable' });
        }
        return;
      }

      const responseHeaders = {
        'Content-Type': 'video/mp4',
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'public, max-age=3600',
      };

      if (proxyRes.headers['content-length']) {
        responseHeaders['Content-Length'] = proxyRes.headers['content-length'];
      }
      if (proxyRes.headers['content-range']) {
        responseHeaders['Content-Range'] = proxyRes.headers['content-range'];
      }

      const disposition = proxyRes.headers['content-disposition'] || '';
      if (disposition.includes('.webm')) {
        responseHeaders['Content-Type'] = 'video/webm';
      }

      const statusCode = proxyRes.statusCode === 206 ? 206 : 200;
      res.writeHead(statusCode, responseHeaders);
      proxyRes.pipe(res);

      proxyRes.on('error', (err) => {
        console.error('Proxy stream error:', err.message);
      });

      req.on('close', () => {
        proxyReq.destroy();
      });
    });

    proxyReq.on('error', (err) => {
      console.error('Proxy request error:', err.message);
      if (!res.headersSent) {
        res.status(502).json({ error: 'Failed to fetch video' });
      }
    });
  }
}

// URL cache
const urlCache = new Map();
const CACHE_TTL = 60 * 60 * 1000;

function getCachedUrl(shareUrl) {
  const cached = urlCache.get(shareUrl);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.downloadUrl;
  }
  urlCache.delete(shareUrl);
  return null;
}

function setCachedUrl(shareUrl, downloadUrl) {
  urlCache.set(shareUrl, { downloadUrl, timestamp: Date.now() });
}

module.exports = { resolveOneDriveUrl, proxyOneDriveStream, getCachedUrl, setCachedUrl };
