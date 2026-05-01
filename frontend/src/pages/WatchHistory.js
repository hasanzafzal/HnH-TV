import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import '../styles/pages.css';
import '../styles/watch-history.css';
import apiClient from '../utils/api';
import { getUser } from '../utils/storage';

function WatchHistory() {
    const navigate = useNavigate();
    const user = getUser();
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const LIMIT = 20;

    const fetchHistory = useCallback(async (pageNum = 1) => {
        try {
            const res = await apiClient.get(`/watch-history?page=${pageNum}&limit=${LIMIT}`);
            setHistory(res.data.data || []);
            setTotalPages(res.data.pages || 1);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching watch history:', error);
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!user) { navigate('/login'); return; }
        fetchHistory(page);
    }, [user, navigate, page, fetchHistory]);

    const handleResume = (item) => {
        const id = item.content._id;
        if (item.seasonNumber && item.episodeNumber) {
            navigate(`/watch/${id}?season=${item.seasonNumber}&episode=${item.episodeNumber}`);
        } else {
            navigate(`/watch/${id}`);
        }
    };

    const formatDate = (dateStr) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const formatTime = (secs) => {
        if (!secs) return '—';
        const m = Math.floor(secs / 60);
        const s = Math.round(secs % 60);
        return `${m}m ${s}s`;
    };

    const handleClearHistory = async () => {
        if (!window.confirm("Are you sure you want to clear your entire watch history? This action cannot be undone.")) {
            return;
        }
        try {
            await apiClient.delete('/watch-history');
            setHistory([]);
            setTotalPages(1);
            setPage(1);
        } catch (error) {
            console.error('Error clearing watch history:', error);
            alert('Failed to clear watch history');
        }
    };

    if (loading) return <div className="loading">Loading...</div>;

    return (
        <div className="wh-page">
            <Header />

            <div className="wh-container">
                <div className="wh-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                        <h1>🕐 Watch History</h1>
                        <p className="wh-subtitle">Pick up where you left off</p>
                    </div>
                    {history.length > 0 && (
                        <button 
                            className="btn btn-secondary" 
                            style={{ backgroundColor: '#e50914', color: 'white', borderColor: '#e50914', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                            onClick={handleClearHistory}
                            title="Clear all watch history"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                <line x1="10" y1="11" x2="10" y2="17"></line>
                                <line x1="14" y1="11" x2="14" y2="17"></line>
                            </svg>
                            Clear History
                        </button>
                    )}
                </div>

                {history.length === 0 ? (
                    <div className="wh-empty">
                        <div className="wh-empty-icon">📺</div>
                        <h2>Nothing watched yet</h2>
                        <p>Start watching movies and series — your history will appear here.</p>
                        <button className="btn btn-primary" onClick={() => navigate('/explore')}>
                            Browse Content
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="wh-list">
                            {history.map((item) => {
                                const content = item.content;
                                if (!content) return null;
                                const episodeLabel = item.seasonNumber
                                    ? `Season ${item.seasonNumber}, Episode ${item.episodeNumber}`
                                    : null;
                                const isCompleted = item.isCompleted || item.progress >= 95;

                                return (
                                    <div key={item._id} className="wh-item">
                                        {/* Poster */}
                                        <div className="wh-poster" onClick={() => handleResume(item)}>
                                            <img src={content.posterUrl} alt={content.title} />
                                            <div className="wh-poster-overlay">
                                                <span className="wh-resume-icon">▶</span>
                                            </div>
                                            {isCompleted && <span className="wh-completed-badge">✓ Watched</span>}
                                        </div>

                                        {/* Info */}
                                        <div className="wh-info">
                                            <h3 className="wh-title" onClick={() => navigate(`/detail/${content._id}`)}>
                                                {content.title}
                                            </h3>
                                            {episodeLabel && (
                                                <span className="wh-episode">{episodeLabel}</span>
                                            )}
                                            <span className="wh-type">
                                                {content.contentType === 'tv_series' ? '📺 TV Series' : '🎬 Movie'}
                                            </span>
                                            <p className="wh-date">Watched on {formatDate(item.watchedAt)}</p>

                                            {/* Progress bar */}
                                            <div className="wh-progress-track">
                                                <div
                                                    className={`wh-progress-fill ${isCompleted ? 'wh-progress-fill--done' : ''}`}
                                                    style={{ width: `${Math.min(item.progress, 100)}%` }}
                                                />
                                            </div>
                                            <div className="wh-progress-meta">
                                                <span>{item.progress}% watched</span>
                                                {item.watchedSeconds > 0 && (
                                                    <span>Stopped at {formatTime(item.watchedSeconds)}</span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="wh-actions">
                                            {!isCompleted ? (
                                                <button
                                                    className="btn btn-primary wh-btn"
                                                    onClick={() => handleResume(item)}
                                                >
                                                    ▶ Resume
                                                </button>
                                            ) : (
                                                <button
                                                    className="btn btn-secondary wh-btn"
                                                    onClick={() => handleResume(item)}
                                                >
                                                    ↺ Rewatch
                                                </button>
                                            )}
                                            <button
                                                className="btn btn-secondary wh-btn"
                                                onClick={() => navigate(`/detail/${content._id}`)}
                                            >
                                                Details
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="wh-pagination">
                                <button
                                    className="btn btn-secondary"
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                >
                                    ← Prev
                                </button>
                                <span className="wh-page-info">Page {page} of {totalPages}</span>
                                <button
                                    className="btn btn-secondary"
                                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                >
                                    Next →
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

export default WatchHistory;
