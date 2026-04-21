import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import Header from '../components/Header';
import VideoPlayer from '../components/VideoPlayer';
import '../styles/pages.css';
import apiClient from '../utils/api';
import { getUser } from '../utils/storage';

function Watch() {
  const { contentId } = useParams();
  const user = getUser();
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchContent = useCallback(async () => {
    try {
      const res = await apiClient.get(`/content/${contentId}`);
      setContent(res.data.data);

      // Update watch history if user is logged in
      if (user) {
        await apiClient.post(`/watch-history/${contentId}`, {
          progress: 0,
          duration: 0,
        });
      }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching content:', error);
      setLoading(false);
    }
  }, [contentId, user]);

  useEffect(() => {
    fetchContent();
  }, [contentId, fetchContent]);

  if (loading) return <div className="loading">Loading...</div>;
  if (!content) return <div className="error">Content not found</div>;

  return (
    <div className="watch-page">
      <Header />
      <div className="player-container">
        <VideoPlayer
          videoUrl={content.videoUrl}
          title={content.title}
          duration={content.duration}
        />
      </div>

      <div className="watch-info">
        <h1>{content.title}</h1>
        <p>{content.description}</p>
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
