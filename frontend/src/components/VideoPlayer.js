import React, { useState, useRef } from 'react';
import '../styles/components.css';

function VideoPlayer({ videoUrl, title, duration = 0 }) {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [fullscreen, setFullscreen] = useState(false);

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleFullscreen = () => {
    if (videoRef.current) {
      if (!fullscreen) {
        videoRef.current.requestFullscreen().catch((err) => {
          alert(`Error attempting to enable fullscreen: ${err.message}`);
        });
      } else {
        document.exitFullscreen();
      }
      setFullscreen(!fullscreen);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="video-player-container">
      <div className="video-player">
        <video
          ref={videoRef}
          onTimeUpdate={(e) => setCurrentTime(e.target.currentTime)}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        >
          <source src={videoUrl} type="video/mp4" />
          Your browser does not support the video tag.
        </video>

        <div className="player-controls">
          <div className="progress-bar">
            <input
              type="range"
              min="0"
              max={videoRef.current?.duration || 0}
              value={currentTime}
              onChange={(e) => {
                if (videoRef.current) {
                  videoRef.current.currentTime = e.target.value;
                  setCurrentTime(e.target.value);
                }
              }}
              className="progress-slider"
            />
          </div>

          <div className="controls-bottom">
            <button className="control-btn" onClick={handlePlayPause}>
              {isPlaying ? '⏸' : '▶'}
            </button>

            <div className="time-display">
              <span>{formatTime(currentTime)}</span>
              <span> / </span>
              <span>{formatTime(videoRef.current?.duration || 0)}</span>
            </div>

            <div className="volume-control">
              <span>🔊</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={(e) => {
                  setVolume(e.target.value);
                  if (videoRef.current) {
                    videoRef.current.volume = e.target.value;
                  }
                }}
                className="volume-slider"
              />
            </div>

            <button className="control-btn" onClick={handleFullscreen}>
              {fullscreen ? '⛶' : '⛶'}
            </button>
          </div>
        </div>
      </div>
      <h2>{title}</h2>
    </div>
  );
}

export default VideoPlayer;
