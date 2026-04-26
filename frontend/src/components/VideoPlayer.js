import React, { useRef, useEffect } from 'react';
import '../styles/components.css';

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

function VideoPlayer({ videoUrl, title, duration = 0 }) {
  const videoRef = useRef(null);

  // Use the proxy URL for OneDrive links, direct URL otherwise
  const effectiveUrl = isOneDriveUrl(videoUrl) ? getStreamUrl(videoUrl) : videoUrl;

  // Ensure volume is set on mount
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = 1;
    }
  }, []);

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
