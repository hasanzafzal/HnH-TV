import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../utils/api';
import { getUser } from '../utils/storage';
import '../styles/continue-watching.css';

/**
 * Netflix-style "Continue Watching" row.
 * Fetches items from GET /api/watch-history/continue-watching
 * and shows a horizontal scroll of cards with a progress bar.
 */
export default function ContinueWatching() {
    const user = getUser();
    const navigate = useNavigate();
    const [items, setItems] = useState([]);

    useEffect(() => {
        if (!user) return;
        apiClient
            .get('/watch-history/continue-watching')
            .then((res) => setItems(res.data.data || []))
            .catch(() => { });
    }, [user]);

    if (!user || items.length === 0) return null;

    const handleResume = (item) => {
        const contentId = item.content._id;
        if (item.seasonNumber && item.episodeNumber) {
            navigate(`/watch/${contentId}?season=${item.seasonNumber}&episode=${item.episodeNumber}`);
        } else {
            navigate(`/watch/${contentId}`);
        }
    };

    return (
        <section className="cw-section">
            <h2 className="cw-title">Continue Watching</h2>
            <div className="cw-row">
                {items.map((item) => {
                    const content = item.content;
                    const label = item.seasonNumber
                        ? `S${item.seasonNumber} E${item.episodeNumber}`
                        : null;

                    return (
                        <div
                            key={item._id}
                            className="cw-card"
                            onClick={() => handleResume(item)}
                            title={`Resume ${content.title}${label ? ` — ${label}` : ''}`}
                        >
                            {/* Thumbnail */}
                            <div className="cw-thumb">
                                <img
                                    src={content.posterUrl || content.bannerUrl}
                                    alt={content.title}
                                />
                                {/* Play overlay */}
                                <div className="cw-play-overlay">
                                    <span className="cw-play-icon">▶</span>
                                </div>
                                {/* Episode badge */}
                                {label && <span className="cw-badge">{label}</span>}
                            </div>

                            {/* Progress bar */}
                            <div className="cw-progress-track">
                                <div
                                    className="cw-progress-fill"
                                    style={{ width: `${item.progress}%` }}
                                />
                            </div>

                            {/* Title */}
                            <p className="cw-card-title">{content.title}</p>
                            <p className="cw-card-sub">
                                {item.isCompleted || item.progress >= 95 ? 'Already Watched' : `${item.progress}% watched`}
                            </p>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}
