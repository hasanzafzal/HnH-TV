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
 * Check if a file needs remuxing for browser compatibility.
 * Checks content-disposition, content-type, AND the original URL as fallbacks.
 */
function needsRemux(contentDisposition, contentType, originalUrl) {
  const combined = `${contentDisposition || ''} ${contentType || ''} ${originalUrl || ''}`.toLowerCase();
  // Browser native formats: .mp4, .webm, .m4v, .mov
  // Needs remux: .mkv, .avi, .wmv, .flv, .ts
  return combined.includes('.mkv') || 
         combined.includes('.avi') || 
         combined.includes('.wmv') || 
         combined.includes('.flv') ||
         combined.includes('.ts') ||
         combined.includes('video/x-msvideo') ||  // AVI MIME type
         combined.includes('video/x-matroska') ||  // MKV MIME type
         combined.includes('video/x-ms-wmv') ||    // WMV MIME type
         combined.includes('video/x-flv');          // FLV MIME type
}

/**
 * Check if a file needs full video re-encoding (not just remuxing/stream-copy).
 * AVI and WMV use codecs (DivX, Xvid, WMV) that cannot be stream-copied into MP4.
 */
function needsReencode(contentDisposition, contentType, originalUrl) {
  const combined = `${contentDisposition || ''} ${contentType || ''} ${originalUrl || ''}`.toLowerCase();
  return combined.includes('.avi') || combined.includes('.wmv') || combined.includes('.flv') ||
         combined.includes('video/x-msvideo') || combined.includes('video/x-ms-wmv') || combined.includes('video/x-flv');
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
 * For browser-incompatible formats (AVI, MKV, WMV, FLV, TS) — re-encodes via FFmpeg.
 * For browser-native formats (MP4, WebM) — direct proxy with Range support.
 */
async function proxyOneDriveStream(req, res, downloadUrl, originalShareUrl) {
  const parsed = new URL(downloadUrl);

  // HEAD request to determine the file type
  const fileInfo = await getFileInfo(downloadUrl);
  const remuxNeeded = needsRemux(fileInfo.disposition, fileInfo.contentType, originalShareUrl || downloadUrl);
  console.log(`[Stream] Detection: disposition="${fileInfo.disposition.substring(0, 80)}", type="${fileInfo.contentType}" → ${remuxNeeded ? 'FFmpeg TRANSCODE' : 'DIRECT PROXY'}`);

  if (remuxNeeded) {
    // Non-browser-native format — re-encode to H.264/AAC via FFmpeg
    console.log(`[Stream] Non-native format — re-encoding via FFmpeg (type: ${fileInfo.contentType}, disposition: ${fileInfo.disposition.substring(0, 60)})`);

    res.writeHead(200, {
      'Content-Type': 'video/mp4',
      'Transfer-Encoding': 'chunked',
      'Cache-Control': 'no-cache',
      'X-Content-Type-Options': 'nosniff',
    });

    const proxyReq = https.get({
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      headers: { 'User-Agent': 'Mozilla/5.0' },
      maxRedirects: 10,
    }, (proxyRes) => {
      if (proxyRes.statusCode !== 200) {
        console.error(`[Stream] OneDrive returned status ${proxyRes.statusCode}`);
        if (!res.writableEnded) res.end();
        return;
      }

      const ffmpegArgs = [
        '-hide_banner',
        '-loglevel', 'info',
        '-probesize', '50M',
        '-analyzeduration', '50M',
        '-err_detect', 'ignore_err',
        '-fflags', '+genpts+discardcorrupt',
        '-i', 'pipe:0',
        '-map', '0:v:0?',
        '-map', '0:a?',
        '-c:v', 'libopenh264',
        '-b:v', '1500k',
        '-allow_skip_frames', '1',
        '-pix_fmt', 'yuv420p',
        '-c:a', 'aac',
        '-b:a', '192k',
        '-ac', '2',
        '-ar', '48000',
        '-max_muxing_queue_size', '4096',
        '-movflags', 'frag_keyframe+empty_moov+default_base_moof',
        '-f', 'mp4',
        'pipe:1'
      ];

      console.log('[FFmpeg] Args:', ffmpegArgs.join(' '));

      const ffmpeg = spawn('ffmpeg', ffmpegArgs, {
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
      proxyRes.on('end', () => { ffmpeg.stdin.end(); });
      proxyRes.on('error', () => { ffmpeg.stdin.end(); });

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
      console.error('FFmpeg proxy error:', err.message);
      if (!res.headersSent) {
        res.status(502).json({ error: 'Failed to fetch video' });
      }
    });

  } else {
    // MP4/WebM — direct proxy with Range support (preserves duration/seeking)
    const headers = { 'User-Agent': 'Mozilla/5.0' };
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

/**
 * Remux a direct (non-OneDrive) video URL to browser-compatible fragmented MP4.
 * Used for .avi, .wmv, .flv, .ts and other formats that browsers can't play natively.
 */
function remuxDirectStream(req, res, sourceUrl) {
  const parsed = new URL(sourceUrl);
  const httpModule = parsed.protocol === 'https:' ? https : require('follow-redirects').http;

  res.writeHead(200, {
    'Content-Type': 'video/mp4',
    'Transfer-Encoding': 'chunked',
    'Cache-Control': 'no-cache',
    'X-Content-Type-Options': 'nosniff',
  });

  const proxyReq = httpModule.get({
    hostname: parsed.hostname,
    port: parsed.port || undefined,
    path: parsed.pathname + parsed.search,
    headers: { 'User-Agent': 'Mozilla/5.0' },
    maxRedirects: 10,
  }, (proxyRes) => {
    if (proxyRes.statusCode !== 200) {
      console.error(`[Remux] Source returned status ${proxyRes.statusCode}`);
      if (!res.writableEnded) res.end();
      return;
    }

    const ffmpegArgs = [
      '-hide_banner',
      '-loglevel', 'info',
      '-probesize', '50M',
      '-analyzeduration', '50M',
      '-err_detect', 'ignore_err',
      '-fflags', '+genpts+discardcorrupt',
      '-i', 'pipe:0',
      '-map', '0:v:0?',
      '-map', '0:a?',
      // AVI often uses MPEG-4 ASP (DivX/Xvid) which can't be stream-copied
      // into MP4. Re-encode video to H.264 for guaranteed browser compatibility.
      '-c:v', 'libopenh264',
      '-b:v', '1500k',
      '-allow_skip_frames', '1',
      '-pix_fmt', 'yuv420p',
      '-c:a', 'aac',
      '-b:a', '192k',
      '-ac', '2',
      '-ar', '48000',
      '-max_muxing_queue_size', '2048',
      '-movflags', 'frag_keyframe+empty_moov+default_base_moof',
      '-f', 'mp4',
      'pipe:1'
    ];

    console.log('[FFmpeg/Remux] Args:', ffmpegArgs.join(' '));

    const ffmpeg = spawn('ffmpeg', ffmpegArgs, {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    // Pipe source → FFmpeg stdin with backpressure handling
    proxyRes.on('data', (chunk) => {
      const canWrite = ffmpeg.stdin.write(chunk);
      if (!canWrite) {
        proxyRes.pause();
        ffmpeg.stdin.once('drain', () => proxyRes.resume());
      }
    });
    proxyRes.on('end', () => { ffmpeg.stdin.end(); });
    proxyRes.on('error', () => { ffmpeg.stdin.end(); });

    // Pipe FFmpeg stdout → response
    ffmpeg.stdout.pipe(res);

    ffmpeg.stdin.on('error', () => {});
    ffmpeg.stdout.on('error', () => {});

    ffmpeg.stderr.on('data', (data) => {
      const msg = data.toString().trim();
      if (msg) console.log('[FFmpeg/Remux]', msg);
    });

    ffmpeg.on('error', (err) => {
      console.error('[FFmpeg/Remux] Process error:', err.message);
    });

    ffmpeg.on('close', (code) => {
      if (code !== 0 && code !== null) {
        console.error('[FFmpeg/Remux] Exited with code:', code);
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
    console.error('Remux proxy error:', err.message);
    if (!res.headersSent) {
      res.status(502).json({ error: 'Failed to fetch video for remuxing' });
    }
  });
}

module.exports = { resolveOneDriveUrl, proxyOneDriveStream, remuxDirectStream, getCachedUrl, setCachedUrl };
