import React, { useRef, useEffect, useCallback } from 'react';
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
 * Convert a OneDrive sharing URL to a backend proxy stream URL.
 */
function getStreamUrl(url) {
  let apiBase = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
  if (apiBase.includes('localhost') && window.location.hostname !== 'localhost') {
    apiBase = `http://${window.location.hostname}:5000/api`;
  }
  return `${apiBase}/stream?url=${encodeURIComponent(url)}`;
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
  const user = getUser();

  const effectiveUrl = isOneDriveUrl(videoUrl) ? getStreamUrl(videoUrl) : videoUrl;

  /* ── Save progress to backend ────────────────────── */
  const saveProgress = useCallback(async () => {
    const video = videoRef.current;
    if (!video || !contentId || !user) return;

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
  }, [contentId, user, duration, seasonNumber, episodeNumber]);

  /* ── Set volume & restore resume position on mount ── */
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.volume = 1;

    // Restore saved position once metadata is loaded
    const onLoaded = () => {
      if (startSeconds && startSeconds > 5) {
        video.currentTime = startSeconds;
      }
    };

    if (video.readyState >= 1) {
      onLoaded();
    } else {
      video.addEventListener('loadedmetadata', onLoaded, { once: true });
    }

    return () => video.removeEventListener('loadedmetadata', onLoaded);
  }, [startSeconds, effectiveUrl]); // re-run when URL changes (episode switch)

  /* ── Start / stop the 10-second autosave interval ── */
  useEffect(() => {
    if (!contentId || !user) return;

    saveIntervalRef.current = setInterval(saveProgress, 10000);

    return () => {
      clearInterval(saveIntervalRef.current);
      saveProgress(); // save on unmount / navigate away
    };
  }, [contentId, user, saveProgress]);

  /* ── Also save on pause and when video ends ─────── */
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !contentId || !user) return;

    video.addEventListener('pause', saveProgress);
    video.addEventListener('ended', saveProgress);

    return () => {
      video.removeEventListener('pause', saveProgress);
      video.removeEventListener('ended', saveProgress);
    };
  }, [saveProgress, contentId, user]);

  return (
    <div className="video-player-container">
      <div className="video-player">
        <video
          ref={videoRef}
          src={effectiveUrl}
          controls
          controlsList="nodownload"
          preload="auto"
          style={{ width: '100%', height: '100%', display: 'block' }}
        >
          Your browser does not support the video tag.
        </video>
      </div>
      <h2>{title}</h2>
    </div>
  );
}

export default VideoPlayer;
