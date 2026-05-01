import React, { useRef, useEffect, useCallback, useState } from 'react';
import '../styles/components.css';
import apiClient from '../utils/api';
import { getUser } from '../utils/storage';

/**
 * Check if a URL is a OneDrive sharing link.
 */
function isOneDriveUrl(url) {
  if (!url) return false;
  return url.includes('1drv.ms') || url.includes('onedrive.live.com') || url.includes('sharepoint.com');
}

/**
 * Check if a direct URL points to a format that browsers cannot play natively
 * and therefore needs server-side remuxing to MP4.
 */
function needsRemux(url) {
  if (!url) return false;
  // Strip query string / hash before checking extension
  const path = url.split('?')[0].split('#')[0].toLowerCase();
  return path.endsWith('.avi') || path.endsWith('.wmv') || path.endsWith('.flv') || path.endsWith('.ts') || path.endsWith('.mkv');
}

/**
 * Build the API base URL, accounting for LAN access.
 */
function getApiBase() {
  let apiBase = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
  if (apiBase.includes('localhost') && window.location.hostname !== 'localhost') {
    apiBase = `http://${window.location.hostname}:5000/api`;
  }
  return apiBase;
}

/**
 * Convert a OneDrive sharing URL to a backend proxy stream URL.
 */
function getStreamUrl(url) {
  return `${getApiBase()}/stream?url=${encodeURIComponent(url)}`;
}

/**
 * Convert a direct video URL that needs remuxing to a backend remux proxy URL.
 */
function getRemuxUrl(url) {
  return `${getApiBase()}/remux?url=${encodeURIComponent(url)}`;
}

/**
 * Map browser MediaError codes to user-friendly messages.
 */
function getErrorMessage(video) {
  if (!video || !video.error) return null;
  switch (video.error.code) {
    case 1: // MEDIA_ERR_ABORTED
      return 'Playback was interrupted. Please try again.';
    case 2: // MEDIA_ERR_NETWORK
      return 'A network error occurred while loading the video.';
    case 3: // MEDIA_ERR_DECODE
      return 'This video format is not supported by your browser.';
    case 4: // MEDIA_ERR_SRC_NOT_SUPPORTED
      return 'This video is currently unavailable. Please try again later.';
    default:
      return 'An unexpected playback error occurred.';
  }
}

/**
 * VideoPlayer
 * Props:
 *   videoUrl      – source URL
 *   title         – display title
 *   duration      – content duration hint (seconds)
 *   contentId     – MongoDB content _id (required for progress saving)
 *   seasonNumber  – for TV episodes (optional)
 *   episodeNumber – for TV episodes (optional)
 *   startSeconds  – resume position in seconds (optional)
 */
function VideoPlayer({ videoUrl, title, duration = 0, contentId, seasonNumber, episodeNumber, startSeconds = 0 }) {
  const videoRef = useRef(null);
  const saveIntervalRef = useRef(null);
  const hasRestoredRef = useRef(false);
  const userRef = useRef(getUser());
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  const effectiveUrl = isOneDriveUrl(videoUrl)
    ? getStreamUrl(videoUrl)
    : needsRemux(videoUrl)
      ? getRemuxUrl(videoUrl)
      : videoUrl;

  /* ── Save progress to backend ────────────────────── */
  const saveProgress = useCallback(async () => {
    const video = videoRef.current;
    const user = userRef.current;
    if (!video || !contentId || !user) return;
    if (video.paused && video.currentTime === 0) return;

    const currentTime = video.currentTime;
    const totalDuration = video.duration || duration;
    if (!totalDuration || totalDuration < 1) return;

    const progressPct = Math.min(100, Math.round((currentTime / totalDuration) * 100));
    const isCompleted = progressPct >= 95;

    try {
      await apiClient.post(`/watch-history/${contentId}`, {
        watchedSeconds: Math.round(currentTime),
        duration: Math.round(totalDuration),
        progress: progressPct,
        isCompleted,
        seasonNumber: seasonNumber ?? null,
        episodeNumber: episodeNumber ?? null,
      });
    } catch (_) {
      // Silent — do not interrupt the viewer
    }
  }, [contentId, duration, seasonNumber, episodeNumber]);

  /* ── Set volume & restore resume position on mount ── */
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    hasRestoredRef.current = false;
    setError(null);
    video.volume = 1;

    const onLoaded = () => {
      if (hasRestoredRef.current) return;
      hasRestoredRef.current = true;
      if (startSeconds && startSeconds > 5) {
        video.currentTime = startSeconds;
      }
    };

    if (video.readyState >= 1) {
      onLoaded();
    } else {
      video.addEventListener('loadedmetadata', onLoaded);
    }

    return () => video.removeEventListener('loadedmetadata', onLoaded);
  }, [startSeconds, effectiveUrl]);

  /* ── Handle video errors gracefully ── */
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onError = (e) => {
      // Suppress AbortError from normal navigation / unmounts
      if (e?.target?.error?.code === 1) return;
      const msg = getErrorMessage(video);
      console.warn('[VideoPlayer] Error:', msg, video.error);
      setError(msg);
    };

    video.addEventListener('error', onError);
    return () => video.removeEventListener('error', onError);
  }, [effectiveUrl, retryCount]);

  /* ── Start / stop the 30-second autosave interval ── */
  useEffect(() => {
    const user = userRef.current;
    if (!contentId || !user) return;

    saveIntervalRef.current = setInterval(saveProgress, 30000);

    return () => {
      clearInterval(saveIntervalRef.current);
      saveProgress();
    };
  }, [contentId, saveProgress]);

  /* ── Also save on pause and when video ends ─────── */
  useEffect(() => {
    const video = videoRef.current;
    const user = userRef.current;
    if (!video || !contentId || !user) return;

    video.addEventListener('pause', saveProgress);
    video.addEventListener('ended', saveProgress);

    return () => {
      video.removeEventListener('pause', saveProgress);
      video.removeEventListener('ended', saveProgress);
    };
  }, [saveProgress, contentId]);

  const handleRetry = () => {
    setError(null);
    setRetryCount(c => c + 1);
    const video = videoRef.current;
    if (video) {
      hasRestoredRef.current = false;
      video.load();
    }
  };

  return (
    <div className="video-player-container">
      <div className="video-player">
        <video
          ref={videoRef}
          key={retryCount}
          src={effectiveUrl}
          controls
          controlsList="nodownload"
          preload="auto"
          style={{ width: '100%', height: '100%', display: 'block' }}
        >
          Your browser does not support the video tag.
        </video>

        {/* Netflix-style error overlay */}
        {error && (
          <div className="player-error-overlay">
            <div className="player-error-content">
              <div className="player-error-icon">⚠</div>
              <h3 className="player-error-title">Whoops, something went wrong...</h3>
              <p className="player-error-message">{error}</p>
              <p className="player-error-code">Error Code: HNH-{retryCount > 0 ? 'R' : 'P'}{Date.now().toString(36).slice(-4).toUpperCase()}</p>
              <div className="player-error-actions">
                <button className="player-error-btn primary" onClick={handleRetry}>
                  ↻ Try Again
                </button>
                <button className="player-error-btn secondary" onClick={() => window.history.back()}>
                  ← Go Back
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      <h2>{title}</h2>
    </div>
  );
}

export default VideoPlayer;
