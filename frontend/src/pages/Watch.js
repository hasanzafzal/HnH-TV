import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import VideoPlayer from '../components/VideoPlayer';
import SubscriptionGate from '../components/SubscriptionGate';
import '../styles/pages.css';
import apiClient from '../utils/api';
import { getUser } from '../utils/storage';
import { useSubscription } from '../utils/useSubscription';

function Watch() {
  const { contentId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const user = getUser();
  const { subscribed, loading: subLoading } = useSubscription();
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savedSeconds, setSavedSeconds] = useState(0);

  const seasonNum = parseInt(searchParams.get('season')) || null;
  const episodeNum = parseInt(searchParams.get('episode')) || null;

  const fetchContent = useCallback(async () => {
    try {
      const res = await apiClient.get(`/content/${contentId}`);
      setContent(res.data.data);

      // Fetch saved progress for resume
      try {
        const progressParams = {};
        if (seasonNum) progressParams.season = seasonNum;
        if (episodeNum) progressParams.episode = episodeNum;
        const progressRes = await apiClient.get(`/watch-history/${contentId}`, { params: progressParams });
        setSavedSeconds(progressRes.data.data?.watchedSeconds || 0);
      } catch (_) { }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching content:', error);
      setLoading(false);
    }
  }, [contentId, seasonNum, episodeNum]);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchContent();
  }, [contentId, user, navigate, fetchContent]);

  // Block unsubscribed users
  if (subLoading) return <div className="loading">Loading...</div>;
  if (!subscribed) return <SubscriptionGate />;

  if (loading) return <div className="loading">Loading...</div>;
  if (!content) return (
    <div className="coming-soon-page">
      <Header />
      <div className="coming-soon-container">
        <div className="coming-soon-icon">📺</div>
        <h1>Stay Tuned!</h1>
        <p>Coming Soon</p>
        <button className="btn btn-primary" onClick={() => navigate(-1)}>← Go Back</button>
      </div>
    </div>
  );

  // Determine what to play
  let videoUrl = content.videoUrl;
  let playingTitle = content.title;
  let currentSeason = null;
  let currentEpisode = null;
  let allEpisodes = [];
  let currentEpIndex = -1;

  const isTvSeries = content.contentType === 'tv_series' && content.seasons && content.seasons.length > 0;

  // For TV series without season/episode params, redirect to first available episode
  if (isTvSeries && (!seasonNum || !episodeNum)) {
    const firstSeason = content.seasons
      .sort((a, b) => a.seasonNumber - b.seasonNumber)[0];
    if (firstSeason && firstSeason.episodes && firstSeason.episodes.length > 0) {
      const firstEp = firstSeason.episodes
        .sort((a, b) => a.episodeNumber - b.episodeNumber)[0];
      navigate(`/watch/${contentId}?season=${firstSeason.seasonNumber}&episode=${firstEp.episodeNumber}`, { replace: true });
      return <div className="loading">Loading episode...</div>;
    }
  }

  if (isTvSeries && seasonNum && episodeNum) {
    currentSeason = content.seasons.find(s => s.seasonNumber === seasonNum);
    if (currentSeason) {
      currentEpisode = currentSeason.episodes.find(e => e.episodeNumber === episodeNum);
      if (currentEpisode) {
        videoUrl = currentEpisode.videoUrl;
        playingTitle = `${content.title} — S${seasonNum}E${episodeNum}: ${currentEpisode.title}`;
      }

      // Build flat list for next/prev navigation
      content.seasons.forEach(s => {
        s.episodes
          .sort((a, b) => a.episodeNumber - b.episodeNumber)
          .forEach(ep => {
            allEpisodes.push({ seasonNumber: s.seasonNumber, ...ep });
          });
      });
      currentEpIndex = allEpisodes.findIndex(
        ep => ep.seasonNumber === seasonNum && ep.episodeNumber === episodeNum
      );
    }
  }

  const handlePrevEpisode = () => {
    if (currentEpIndex > 0) {
      const prev = allEpisodes[currentEpIndex - 1];
      navigate(`/watch/${contentId}?season=${prev.seasonNumber}&episode=${prev.episodeNumber}`);
    }
  };

  const handleNextEpisode = () => {
    if (currentEpIndex < allEpisodes.length - 1) {
      const next = allEpisodes[currentEpIndex + 1];
      navigate(`/watch/${contentId}?season=${next.seasonNumber}&episode=${next.episodeNumber}`);
    }
  };

  // Show "Coming Soon" only for movies with no video URL (not for TV series)
  const showComingSoon = !videoUrl && !isTvSeries;

  return (
    <div className="watch-page">
      <Header />
      <div className="player-container">
        {showComingSoon ? (
          <div className="coming-soon-container" style={{ padding: '60px 20px', textAlign: 'center' }}>
            <div className="coming-soon-icon">🎬</div>
            <h1>Coming Soon!</h1>
            <p style={{ fontSize: '1.1rem', opacity: 0.8, maxWidth: '500px', margin: '12px auto' }}>
              Ask HnH AI Assistant for other recommendations which you'll like ;)
            </p>
            <button className="btn btn-primary" onClick={() => navigate(`/detail/${contentId}`)}>← Back to Details</button>
          </div>
        ) : (
          <VideoPlayer
            videoUrl={videoUrl}
            title={playingTitle}
            duration={currentEpisode?.duration || content.duration}
            contentId={contentId}
            seasonNumber={seasonNum}
            episodeNumber={episodeNum}
            startSeconds={savedSeconds}
          />
        )}
      </div>

      <div className="watch-info">
        <h1>{playingTitle}</h1>
        <p>{content.description}</p>

        {/* Episode navigation for TV series */}
        {isTvSeries && currentEpisode && (
          <div className="episode-navigation">
            <button
              className="btn btn-secondary"
              onClick={handlePrevEpisode}
              disabled={currentEpIndex <= 0}
            >
              ◀ Previous Episode
            </button>
            <span className="episode-current">
              Season {seasonNum}, Episode {episodeNum}
            </span>
            <button
              className="btn btn-secondary"
              onClick={handleNextEpisode}
              disabled={currentEpIndex >= allEpisodes.length - 1}
            >
              Next Episode ▶
            </button>
          </div>
        )}

        {/* Episode list for current season */}
        {isTvSeries && currentSeason && (
          <div className="watch-episode-list">
            <h3>{currentSeason.title || `Season ${currentSeason.seasonNumber}`}</h3>
            <div className="watch-episodes">
              {currentSeason.episodes
                .sort((a, b) => a.episodeNumber - b.episodeNumber)
                .map(ep => (
                  <div
                    key={ep.episodeNumber}
                    className={`watch-ep-item ${ep.episodeNumber === episodeNum ? 'active' : ''}`}
                    onClick={() => navigate(`/watch/${contentId}?season=${seasonNum}&episode=${ep.episodeNumber}`)}
                  >
                    <span className="watch-ep-num">E{ep.episodeNumber}</span>
                    <span className="watch-ep-title">{ep.title}</span>
                    {ep.duration > 0 && <span className="watch-ep-dur">{ep.duration}m</span>}
                  </div>
                ))}
            </div>
          </div>
        )}

        {content.cast.length > 0 && (
          <p><strong>Cast:</strong> {content.cast.join(', ')}</p>
        )}
        {content.directors.length > 0 && (
          <p><strong>Directors:</strong> {content.directors.join(', ')}</p>
        )}
      </div>

      <div className="back-link">
        <a href={`/detail/${contentId}`}>← Back to Details</a>
      </div>
    </div>
  );
}

export default Watch;
