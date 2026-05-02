const { https } = require('follow-redirects');
const nativeHttps = require('https');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Use local binary if present, otherwise fall back to system PATH (Docker / cloud)
const localFfmpeg = path.join(__dirname, '../../bin/ffmpeg');
const localFfprobe = path.join(__dirname, '../../bin/ffprobe');
const FFMPEG_BIN = fs.existsSync(localFfmpeg) ? localFfmpeg : 'ffmpeg';
const FFPROBE_BIN = fs.existsSync(localFfprobe) ? localFfprobe : 'ffprobe';

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
 * Check if a file needs transcoding for browser compatibility based on container.
 * Checks content-disposition, content-type, AND the original URL as fallbacks.
 */
function needsTranscode(contentDisposition, contentType, originalUrl) {
  const combined = `${contentDisposition || ''} ${contentType || ''} ${originalUrl || ''}`.toLowerCase();
  return combined.includes('.mkv') || 
         combined.includes('.avi') || 
         combined.includes('.wmv') || 
         combined.includes('.flv') ||
         combined.includes('.ts') ||
         combined.includes('video/x-msvideo') ||  // AVI MIME type
         combined.includes('video/x-matroska') ||  // MKV MIME type
         combined.includes('video/x-ms-wmv') ||    // WMV MIME type
         combined.includes('video/x-flv') ||
         combined.includes('video/mp2t');           // TS MIME type
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
 * Probe the video codec of a remote URL using FFprobe.
 * Returns the codec name (e.g. 'h264', 'hevc', 'mpeg4') or null on failure.
 */
function probeVideoCodec(downloadUrl) {
  return new Promise((resolve) => {
    const ffprobe = spawn(FFPROBE_BIN, [
      '-v', 'quiet',
      '-print_format', 'json',
      '-show_streams',
      '-select_streams', 'v:0',
      '-probesize', '5M',
      '-analyzeduration', '5M',
      downloadUrl
    ], { stdio: ['pipe', 'pipe', 'pipe'], timeout: 15000 });

    let stdout = '';
    ffprobe.stdout.on('data', (d) => { stdout += d.toString(); });

    ffprobe.on('close', () => {
      try {
        const info = JSON.parse(stdout);
        const codec = info?.streams?.[0]?.codec_name || null;
        console.log(`[Probe] Codec detected: ${codec}`);
        resolve(codec);
      } catch {
        console.warn('[Probe] Failed to parse ffprobe output');
        resolve(null);
      }
    });

    ffprobe.on('error', () => { resolve(null); });
  });
}

/** Browser-compatible video codecs that can play natively in most browsers */
const BROWSER_SAFE_CODECS = ['h264', 'vp8', 'vp9', 'av1'];

function transcodeUrlToMp4(req, res, sourceUrl) {
  res.writeHead(200, {
    'Content-Type': 'video/webm',
    'Transfer-Encoding': 'chunked',
    'Cache-Control': 'no-cache',
    'X-Content-Type-Options': 'nosniff',
  });

  const ffmpegArgs = [
    '-hide_banner',
    '-loglevel', 'warning',
    // Input: read directly from URL — allows FFmpeg to seek for AVI index etc.
    '-reconnect', '1',
    '-reconnect_streamed', '1',
    '-reconnect_delay_max', '5',
    '-user_agent', 'Mozilla/5.0',
    '-probesize', '10M',
    '-analyzeduration', '10M',
    '-err_detect', 'ignore_err',
    '-fflags', '+genpts+discardcorrupt+igndts',
    '-i', sourceUrl,
    // Map first video + first audio only (skip subtitles/attachments)
    '-map', '0:v:0?',
    '-map', '0:a:0?',
    '-sn',
    // Video: VP8 via libvpx (WebM is reliable for chunked streaming)
    '-c:v', 'libvpx',
    '-b:v', '2000k',
    '-crf', '20',
    '-g', '60',
    '-deadline', 'realtime',
    '-cpu-used', '8',
    // Limit to 1080p max to prevent live-transcode timeouts
    '-vf', "scale='w=min(iw,1920):h=min(ih,1080):force_original_aspect_ratio=decrease',pad='w=ceil(iw/2)*2:h=ceil(ih/2)*2'",
    // Audio: Vorbis
    '-c:a', 'libvorbis',
    '-b:a', '192k',
    '-ac', '2',
    '-ar', '48000',
    '-max_muxing_queue_size', '8192',
    '-f', 'webm',
    'pipe:1'
  ];

  console.log(`[FFmpeg] Transcoding URL directly with local binary: ${sourceUrl.substring(0, 80)}…`);

  const ffmpeg = spawn(FFMPEG_BIN, ffmpegArgs, {
    stdio: ['ignore', 'pipe', 'pipe']   // stdin=ignore (not used), stdout=pipe, stderr=pipe
  });

  // Pipe FFmpeg stdout → HTTP response
  ffmpeg.stdout.pipe(res);

  ffmpeg.stdout.on('error', () => {});

  ffmpeg.stderr.on('data', (data) => {
    const msg = data.toString().trim();
    if (msg) console.log('[FFmpeg]', msg);
  });

  ffmpeg.on('error', (err) => {
    console.error('[FFmpeg] Process error:', err.message);
    if (!res.writableEnded) res.end();
  });

  ffmpeg.on('close', (code) => {
    if (code !== 0 && code !== null) {
      console.error('[FFmpeg] Exited with code:', code);
    }
    if (!res.writableEnded) res.end();
  });

  // If client disconnects, kill FFmpeg
  req.on('close', () => {
    ffmpeg.kill('SIGTERM');
  });
}

/**
 * Proxy a video stream from OneDrive to the client.
 * - Non-browser containers (AVI, MKV, WMV, FLV, TS): transcodes via FFmpeg.
 * - MP4 with non-browser codecs (HEVC, MPEG4-ASP): transcodes via FFmpeg.
 * - Browser-native MP4 (H.264) / WebM: direct proxy with Range support.
 */
async function proxyOneDriveStream(req, res, downloadUrl, originalShareUrl) {
  const parsed = new URL(downloadUrl);

  // HEAD request to determine the file type
  const fileInfo = await getFileInfo(downloadUrl);
  let transcodeNeeded = needsTranscode(fileInfo.disposition, fileInfo.contentType, originalShareUrl || downloadUrl);

  // For MP4 files that look browser-native, probe the actual video codec.
  // Some MP4s use HEVC/H.265 which browsers can't decode (sound-only playback).
  if (!transcodeNeeded) {
    const combined = `${fileInfo.disposition || ''} ${fileInfo.contentType || ''}`.toLowerCase();
    const isMp4 = combined.includes('.mp4') || combined.includes('video/mp4');
    if (isMp4) {
      const codec = await probeVideoCodec(downloadUrl);
      if (codec && !BROWSER_SAFE_CODECS.includes(codec)) {
        console.log(`[Stream] MP4 uses non-browser codec "${codec}" — forcing FFmpeg transcode`);
        transcodeNeeded = true;
      }
    }
  }

  console.log(`[Stream] Final decision → ${transcodeNeeded ? 'FFmpeg TRANSCODE' : 'DIRECT PROXY'}`);

  if (transcodeNeeded) {
    // Route through FFmpeg — reads URL directly (not pipe), handles all formats
    transcodeUrlToMp4(req, res, downloadUrl);
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
 * Uses direct URL input to FFmpeg (same approach as OneDrive transcoding).
 */
function remuxDirectStream(req, res, sourceUrl) {
  transcodeUrlToMp4(req, res, sourceUrl);
}

module.exports = { resolveOneDriveUrl, proxyOneDriveStream, remuxDirectStream, getCachedUrl, setCachedUrl };
