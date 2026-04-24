const https = require('https');
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

    const req = https.request(options, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        const location = res.headers.location;
        try {
          const redirectUrl = new URL(location);
          const cid = redirectUrl.searchParams.get('cid');
          
          const pathParts = parsed.pathname.split('/');
          const shareId = pathParts[pathParts.length - 1];
          const cidLower = cid ? cid.toLowerCase() : pathParts[pathParts.length - 2].toLowerCase();

          if (shareId && cidLower) {
            const downloadUrl = `https://my.microsoftpersonalcontent.com/personal/${cidLower}/_layouts/15/download.aspx?share=${shareId}`;
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
  return contentDisposition.includes('.mkv');
}

/**
 * Proxy a video stream from OneDrive to the client.
 * For MKV files, remuxes to MP4 on the fly using FFmpeg.
 * For MP4/WebM files, proxies directly with Range support.
 */
async function proxyOneDriveStream(req, res, downloadUrl) {
  const parsed = new URL(downloadUrl);

  // First, do a HEAD request to check the content type
  const fileInfo = await new Promise((resolve, reject) => {
    const headReq = https.request({
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      method: 'HEAD',
      headers: { 'User-Agent': 'Mozilla/5.0' },
    }, (headRes) => {
      const disposition = headRes.headers['content-disposition'] || '';
      resolve({ disposition, contentLength: headRes.headers['content-length'] });
    });
    headReq.on('error', reject);
    headReq.setTimeout(10000, () => { headReq.destroy(); reject(new Error('HEAD timeout')); });
    headReq.end();
  });

  if (needsRemux(fileInfo.disposition)) {
    // MKV file — remux to MP4 via FFmpeg
    // Do NOT forward Range headers — FFmpeg needs the full file sequentially
    console.log('[Stream] MKV detected — remuxing to MP4 via FFmpeg');

    res.writeHead(200, {
      'Content-Type': 'video/mp4',
      'Transfer-Encoding': 'chunked',
      'Cache-Control': 'no-cache',
    });

    // Fetch the full file from OneDrive (no Range header)
    const proxyReq = https.get({
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      headers: { 'User-Agent': 'Mozilla/5.0' },
    }, (proxyRes) => {
      const ffmpeg = spawn('ffmpeg', [
        '-hide_banner',
        '-loglevel', 'warning',
        '-probesize', '10M',
        '-analyzeduration', '10M',
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

      proxyRes.pipe(ffmpeg.stdin);
      ffmpeg.stdout.pipe(res);

      ffmpeg.stdin.on('error', () => {});
      ffmpeg.stdout.on('error', () => {});

      ffmpeg.stderr.on('data', (data) => {
        console.log('[FFmpeg]', data.toString().trim());
      });

      ffmpeg.on('error', (err) => {
        console.error('[FFmpeg] Process error:', err.message);
      });

      ffmpeg.on('close', (code) => {
        if (code !== 0 && code !== null) {
          console.error('[FFmpeg] Exited with code:', code);
        }
      });

      req.on('close', () => {
        ffmpeg.kill('SIGTERM');
        proxyReq.destroy();
      });
    });

    proxyReq.on('error', (err) => {
      console.error('MKV proxy error:', err);
      if (!res.headersSent) {
        res.status(502).json({ error: 'Failed to fetch video' });
      }
    });

  } else {
    // MP4/WebM — direct proxy with Range support
    const headers = {
      'User-Agent': 'Mozilla/5.0',
    };
    if (req.headers.range) {
      headers['Range'] = req.headers.range;
    }

    const proxyReq = https.get({
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      headers,
    }, (proxyRes) => {
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
        console.error('Proxy stream error:', err);
      });

      req.on('close', () => {
        proxyReq.destroy();
      });
    });

    proxyReq.on('error', (err) => {
      console.error('Proxy request error:', err);
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
