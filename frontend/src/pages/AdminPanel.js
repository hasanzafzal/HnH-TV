import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, Edit2, Trash2, CheckCircle2, XCircle, Plus, Film, Tv, Sparkles, Pause, Play, X } from 'lucide-react';
import '../styles/admin.css';
import api from '../utils/api';

const AdminPanel = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('content');
  const [contents, setContents] = useState([]);
  const [users, setUsers] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [genres, setGenres] = useState([]);
  const [loading, setLoading] = useState(false);
  const [genreDropdownOpen, setGenreDropdownOpen] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    contentType: 'movie',
    genre: [],
    releaseDate: '',
    duration: '',
    rating: 0,
    directors: '',
    cast: '',
    posterUrl: 'https://via.placeholder.com/300x450?text=Poster',
    thumbnailUrl: 'https://via.placeholder.com/400x300?text=Thumbnail',
    bannerUrl: 'https://via.placeholder.com/1200x400?text=Banner',
    videoUrl: '',
    ageRating: 'PG-13',
    language: 'English',
    qualityOptions: ['720p', '1080p'],
    isFeatured: false,
  });
  const [seasonsData, setSeasonsData] = useState([]);

  const checkAdminAccess = () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.role !== 'admin') {
      navigate('/');
      alert('Admin access required');
    }
  };

  useEffect(() => {
    checkAdminAccess();
    fetchContents();
    fetchGenres();
    fetchUsers();
    fetchSubscriptions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchContents = async () => {
    try {
      setLoading(true);
      const response = await api.get('/content?limit=100');
      setContents(response.data.data || []);
    } catch (error) {
      console.error('Error fetching contents:', error);
      alert('Failed to load contents');
    } finally {
      setLoading(false);
    }
  };

  const fetchGenres = async () => {
    try {
      const response = await api.get('/genres');
      setGenres(response.data.data || []);
    } catch (error) {
      console.error('Error fetching genres:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get('/auth/users');
      setUsers(response.data.data || response.data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchSubscriptions = async () => {
    try {
      const response = await api.get('/subscription/admin/all');
      setSubscriptions(response.data.data || response.data || []);
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleGenreToggle = (genreId) => {
    setFormData(prev => {
      const current = prev.genre || [];
      if (current.includes(genreId)) {
        return { ...prev, genre: current.filter(id => id !== genreId) };
      } else {
        return { ...prev, genre: [...current, genreId] };
      }
    });
  };

  const handleAddSeason = () => {
    setSeasonsData(prev => [
      ...prev,
      { seasonNumber: prev.length + 1, title: `Season ${prev.length + 1}`, episodes: [] }
    ]);
  };

  const handleRemoveSeason = (seasonIndex) => {
    setSeasonsData(prev => prev.filter((_, i) => i !== seasonIndex));
  };

  const handleAddEpisode = (seasonIndex) => {
    setSeasonsData(prev => {
      const updated = [...prev];
      const eps = updated[seasonIndex].episodes;
      updated[seasonIndex] = {
        ...updated[seasonIndex],
        episodes: [
          ...eps,
          { episodeNumber: eps.length + 1, title: `Episode ${eps.length + 1}`, videoUrl: '', duration: 0 }
        ]
      };
      return updated;
    });
  };

  const handleRemoveEpisode = (seasonIndex, episodeIndex) => {
    setSeasonsData(prev => {
      const updated = [...prev];
      updated[seasonIndex] = {
        ...updated[seasonIndex],
        episodes: updated[seasonIndex].episodes.filter((_, i) => i !== episodeIndex)
      };
      return updated;
    });
  };

  const handleSeasonChange = (seasonIndex, field, value) => {
    setSeasonsData(prev => {
      const updated = [...prev];
      updated[seasonIndex] = { ...updated[seasonIndex], [field]: value };
      return updated;
    });
  };

  const handleEpisodeChange = (seasonIndex, episodeIndex, field, value) => {
    setSeasonsData(prev => {
      const updated = [...prev];
      const episodes = [...updated[seasonIndex].episodes];
      episodes[episodeIndex] = { ...episodes[episodeIndex], [field]: value };
      updated[seasonIndex] = { ...updated[seasonIndex], episodes };
      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const payload = {
        ...formData,
        directors: formData.directors.split(',').map(d => d.trim()),
        cast: formData.cast.split(',').map(c => c.trim()),
        duration: parseInt(formData.duration) || 0,
        rating: parseFloat(formData.rating) || 0,
      };

      // For TV series, include seasons data and remove videoUrl
      if (formData.contentType === 'tv_series') {
        payload.seasons = seasonsData;
        if (!payload.videoUrl) {
          delete payload.videoUrl;
        }
      }

      if (editingId) {
        await api.put(`/content/${editingId}`, payload);
        alert('Content updated successfully');
      } else {
        await api.post('/content', payload);
        alert('Content created successfully');
      }

      resetForm();
      fetchContents();
    } catch (error) {
      console.error('Error saving content:', error);
      alert(error.response?.data?.message || 'Failed to save content');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (content) => {
    setFormData({
      title: content.title,
      description: content.description,
      contentType: content.contentType,
      genre: content.genre.map(g => g._id || g),
      releaseDate: content.releaseDate.split('T')[0],
      duration: content.duration || '',
      rating: content.rating || 0,
      directors: content.directors.join(', '),
      cast: content.cast.join(', '),
      posterUrl: content.posterUrl,
      thumbnailUrl: content.thumbnailUrl,
      bannerUrl: content.bannerUrl || '',
      videoUrl: content.videoUrl || '',
      ageRating: content.ageRating,
      language: content.language.join(', '),
      qualityOptions: content.qualityOptions || ['720p', '1080p'],
      isFeatured: content.isFeatured || false,
    });
    setSeasonsData(content.seasons || []);
    setEditingId(content._id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this content?')) {
      try {
        await api.delete(`/content/${id}`);
        alert('Content deleted successfully');
        fetchContents();
      } catch (error) {
        console.error('Error deleting content:', error);
        alert('Failed to delete content');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      contentType: 'movie',
      genre: [],
      releaseDate: '',
      duration: '',
      rating: 0,
      directors: '',
      cast: '',
      posterUrl: 'https://via.placeholder.com/300x450?text=Poster',
      thumbnailUrl: 'https://via.placeholder.com/400x300?text=Thumbnail',
      bannerUrl: 'https://via.placeholder.com/1200x400?text=Banner',
      videoUrl: '',
      ageRating: 'PG-13',
      language: 'English',
      qualityOptions: ['720p', '1080p'],
      isFeatured: false,
    });
    setSeasonsData([]);
    setEditingId(null);
    setShowForm(false);
  };

  const handleUpdateSubscription = async (userId, plan) => {
    try {
      setLoading(true);
      await api.put(`/subscription/admin/${userId}`, {
        plan,
        isActive: true
      });
      alert('✓ Subscription updated');
      fetchSubscriptions();
      fetchUsers();
    } catch (error) {
      console.error('Error updating subscription:', error);
      alert('Failed to update subscription');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSubscription = async (userId, currentActive) => {
    try {
      setLoading(true);
      const sub = subscriptions.find(s => (s.user?._id || s.user) === userId);
      await api.put(`/subscription/admin/${userId}`, {
        plan: sub?.plan || 'free',
        isActive: !currentActive
      });
      alert(`✓ Subscription ${!currentActive ? 'activated' : 'deactivated'}`);
      fetchSubscriptions();
    } catch (error) {
      console.error('Error toggling subscription:', error);
      alert('Failed to toggle subscription');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSubscription = async (userId) => {
    if (window.confirm('Are you sure you want to delete this subscription?')) {
      try {
        setLoading(true);
        await api.delete(`/subscription/admin/${userId}`);
        alert('✓ Subscription deleted');
        fetchSubscriptions();
      } catch (error) {
        console.error('Error deleting subscription:', error);
        alert('Failed to delete subscription');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleAssignSubscription = async (userId) => {
    try {
      setLoading(true);
      await api.put(`/subscription/admin/${userId}`, {
        plan: 'free',
        isActive: true
      });
      alert('✓ Subscription assigned (Free plan)');
      fetchSubscriptions();
    } catch (error) {
      console.error('Error assigning subscription:', error);
      alert('Failed to assign subscription');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await api.delete(`/auth/users/${userId}`);
        alert('✓ User deleted');
        fetchUsers();
        fetchSubscriptions();
      } catch (error) {
        console.error('Error deleting user:', error);
        alert('Failed to delete user');
      }
    }
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/login');
    }
  };

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <div className="admin-header-left">
          <h1>📺 Admin Panel</h1>
        </div>
        <div className="tab-buttons">
          <button
            className={`tab-btn ${activeTab === 'content' ? 'active' : ''}`}
            onClick={() => { setActiveTab('content'); setShowForm(false); }}
          >
            📼 Content ({contents.length})
          </button>
          <button
            className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => { setActiveTab('users'); setShowForm(false); }}
          >
            👥 Users ({users.length})
          </button>
          <button
            className={`tab-btn ${activeTab === 'subscriptions' ? 'active' : ''}`}
            onClick={() => { setActiveTab('subscriptions'); setShowForm(false); }}
          >
            💳 Subscriptions ({subscriptions.length})
          </button>
          <button
            className={`tab-btn ${activeTab === 'genres' ? 'active' : ''}`}
            onClick={() => { setActiveTab('genres'); setShowForm(false); }}
          >
            🏷️ Genres ({genres.length})
          </button>
        </div>
        <button 
          className="btn-logout"
          onClick={handleLogout}
          title="Logout from admin panel"
        >
          🚪 Logout
        </button>
      </div>

      {/* CONTENT TAB */}
      {activeTab === 'content' && (
        <>
          <div className="admin-header">
            <h2>Content Library ({contents.length})</h2>
            <button 
              className="btn-primary"
              onClick={() => setShowForm(!showForm)}
            >
              {showForm ? '✕ Close' : '+ Add New Content'}
            </button>
          </div>

          {showForm && (
            <div className="content-form">
              <h2>{editingId ? 'Edit Content' : 'Add New Content'}</h2>
              <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label>Title *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter content title"
                />
              </div>

              <div className="form-group">
                <label>Type *</label>
                <select
                  name="contentType"
                  value={formData.contentType}
                  onChange={handleInputChange}
                >
                  <option value="movie">Movie</option>
                  <option value="tv_series">TV Series</option>
                </select>
              </div>

              <div className="form-group">
                <label>Release Date *</label>
                <input
                  type="date"
                  name="releaseDate"
                  value={formData.releaseDate}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>{formData.contentType === 'tv_series' ? 'Seasons' : 'Duration (minutes)'}</label>
                <input
                  type="number"
                  name="duration"
                  value={formData.duration}
                  onChange={handleInputChange}
                  placeholder={formData.contentType === 'tv_series' ? 'e.g. 5' : '120'}
                />
              </div>

              <div className="form-group">
                <label>Rating (0-10)</label>
                <input
                  type="number"
                  name="rating"
                  min="0"
                  max="10"
                  step="0.1"
                  value={formData.rating}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label>Age Rating</label>
                <select
                  name="ageRating"
                  value={formData.ageRating}
                  onChange={handleInputChange}
                >
                  <option>G</option>
                  <option>PG</option>
                  <option>PG-13</option>
                  <option>R</option>
                  <option>NC-17</option>
                  <option>18+</option>
                </select>
              </div>

              <div className="form-group full-width">
                <label>Description *</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter content description"
                  rows="4"
                />
              </div>

              <div className="form-group full-width">
                <label>Genres *</label>
                <div className="genre-dropdown">
                  <button
                    type="button"
                    className="genre-dropdown-btn"
                    onClick={() => setGenreDropdownOpen(!genreDropdownOpen)}
                  >
                    {formData.genre.length > 0
                      ? genres.filter(g => formData.genre.includes(g._id)).map(g => g.name).join(', ')
                      : 'Select genres...'}
                    <span className="genre-dropdown-arrow">{genreDropdownOpen ? '▲' : '▼'}</span>
                  </button>
                  {genreDropdownOpen && (
                    <div className="genre-dropdown-menu">
                      {genres.length === 0 ? (
                        <div className="genre-dropdown-empty">No genres available</div>
                      ) : (
                        genres.map(genre => (
                          <label key={genre._id} className="genre-checkbox-item">
                            <input
                              type="checkbox"
                              checked={formData.genre.includes(genre._id)}
                              onChange={() => handleGenreToggle(genre._id)}
                            />
                            <span>{genre.name}</span>
                          </label>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="form-group full-width">
                <label>Directors (comma-separated)</label>
                <input
                  type="text"
                  name="directors"
                  value={formData.directors}
                  onChange={handleInputChange}
                  placeholder="Director 1, Director 2"
                />
              </div>

              <div className="form-group full-width">
                <label>Cast (comma-separated)</label>
                <input
                  type="text"
                  name="cast"
                  value={formData.cast}
                  onChange={handleInputChange}
                  placeholder="Actor 1, Actor 2"
                />
              </div>

              {formData.contentType !== 'tv_series' ? (
                <div className="form-group full-width">
                  <label>Video URL *</label>
                  <input
                    type="url"
                    name="videoUrl"
                    value={formData.videoUrl}
                    onChange={handleInputChange}
                    required
                    placeholder="https://drive.google.com/... or streaming URL"
                  />
                </div>
              ) : (
                <div className="form-group full-width">
                  <div className="seasons-manager">
                    <div className="seasons-header">
                      <label>📺 Seasons & Episodes</label>
                      <button type="button" className="btn-add-season" onClick={handleAddSeason}>
                        + Add Season
                      </button>
                    </div>

                    {seasonsData.length === 0 && (
                      <p className="seasons-empty">No seasons added yet. Click "Add Season" to start.</p>
                    )}

                    {seasonsData.map((season, sIdx) => (
                      <div key={sIdx} className="season-block">
                        <div className="season-header">
                          <div className="season-title-row">
                            <input
                              type="number"
                              value={season.seasonNumber}
                              onChange={(e) => handleSeasonChange(sIdx, 'seasonNumber', parseInt(e.target.value) || 1)}
                              className="season-number-input"
                              min="1"
                              title="Season number"
                            />
                            <input
                              type="text"
                              value={season.title}
                              onChange={(e) => handleSeasonChange(sIdx, 'title', e.target.value)}
                              placeholder="Season title"
                              className="season-title-input"
                            />
                            <button type="button" className="btn-remove-season" onClick={() => handleRemoveSeason(sIdx)}>
                              🗑 Remove Season
                            </button>
                          </div>
                          <button type="button" className="btn-add-episode" onClick={() => handleAddEpisode(sIdx)}>
                            + Add Episode
                          </button>
                        </div>

                        {season.episodes.length === 0 && (
                          <p className="episodes-empty">No episodes in this season.</p>
                        )}

                        {season.episodes.map((ep, eIdx) => (
                          <div key={eIdx} className="episode-row">
                            <span className="episode-number">E{ep.episodeNumber}</span>
                            <input
                              type="text"
                              value={ep.title}
                              onChange={(e) => handleEpisodeChange(sIdx, eIdx, 'title', e.target.value)}
                              placeholder="Episode title"
                              className="episode-title-input"
                            />
                            <input
                              type="url"
                              value={ep.videoUrl}
                              onChange={(e) => handleEpisodeChange(sIdx, eIdx, 'videoUrl', e.target.value)}
                              placeholder="Video URL (OneDrive direct link)"
                              className="episode-url-input"
                              required
                            />
                            <input
                              type="number"
                              value={ep.duration || ''}
                              onChange={(e) => handleEpisodeChange(sIdx, eIdx, 'duration', parseInt(e.target.value) || 0)}
                              placeholder="Min"
                              className="episode-duration-input"
                              title="Duration in minutes"
                            />
                            <button type="button" className="btn-remove-episode" onClick={() => handleRemoveEpisode(sIdx, eIdx)}>
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="form-group">
                <label>Poster URL</label>
                <input
                  type="url"
                  name="posterUrl"
                  value={formData.posterUrl}
                  onChange={handleInputChange}
                  placeholder="Poster image URL"
                />
              </div>

              <div className="form-group">
                <label>Thumbnail URL</label>
                <input
                  type="url"
                  name="thumbnailUrl"
                  value={formData.thumbnailUrl}
                  onChange={handleInputChange}
                  placeholder="Thumbnail image URL"
                />
              </div>

              <div className="form-group">
                <label>Banner URL</label>
                <input
                  type="url"
                  name="bannerUrl"
                  value={formData.bannerUrl}
                  onChange={handleInputChange}
                  placeholder="Banner image URL"
                />
              </div>

              <div className="form-group">
                <label>Language</label>
                <input
                  type="text"
                  name="language"
                  value={formData.language}
                  onChange={handleInputChange}
                  placeholder="English, Spanish"
                />
              </div>

              <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input
                  type="checkbox"
                  id="isFeatured"
                  name="isFeatured"
                  checked={formData.isFeatured}
                  onChange={(e) => setFormData(prev => ({ ...prev, isFeatured: e.target.checked }))}
                  style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                />
                <label htmlFor="isFeatured" style={{ margin: 0, cursor: 'pointer', fontWeight: 'bold', color: '#e50914' }}>
                  ★ Feature on Home (Our Picks)
                </label>
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-success" disabled={loading}>
                {loading ? 'Saving...' : editingId ? 'Update Content' : 'Create Content'}
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={resetForm}
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="contents-list">
        <h2>Content Library ({contents.length})</h2>
        {loading && <p className="loading">Loading...</p>}
        {contents.length === 0 ? (
          <p className="empty-state">No content found. Add your first content!</p>
        ) : (
          <div className="table-responsive">
            <table className="contents-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Type</th>
                  <th>Release Date</th>
                  <th>Rating</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {contents.map(content => (
                  <tr key={content._id}>
                    <td className="title-cell">{content.title}</td>
                    <td>
                      <span className={`badge badge-${content.contentType}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        {content.contentType === 'movie' ? <><Film size={14} /> Movie</> : <><Tv size={14} /> Series</>}
                      </span>
                    </td>
                    <td>{new Date(content.releaseDate).toLocaleDateString()}</td>
                    <td>
                      <span className={`rating`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Star size={14} color="#FFD700" fill="#FFD700" /> {content.rating}/10
                      </span>
                    </td>
                    <td>
                      <span className={`status ${content.isActive ? 'active' : 'inactive'}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        {content.isActive ? <><CheckCircle2 size={14} /> Active</> : <><XCircle size={14} /> Inactive</>}
                      </span>
                      {content.isFeatured && (
                        <span className="badge badge-featured" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginLeft: '5px', backgroundColor: '#ffd700', color: '#000' }}>
                          <Sparkles size={14} /> Featured
                        </span>
                      )}
                    </td>
                    <td className="actions">
                      <button
                        className="btn-edit"
                        onClick={() => handleEdit(content)}
                        title="Edit"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      >
                        <Edit2 size={14} /> Edit
                      </button>
                      <button
                        className="btn-delete"
                        onClick={() => handleDelete(content._id)}
                        title="Delete"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      >
                        <Trash2 size={14} /> Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      </>
      )}

      {/* USERS TAB */}
      {activeTab === 'users' && (
        <div className="users-section">
          <h2>User Management</h2>
          {loading && <p className="loading">Loading...</p>}
          {users.length === 0 ? (
            <p className="empty-state">No users found</p>
          ) : (
            <div className="table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>Name</th>
                    <th>Role</th>
                    <th>Joined</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user._id}>
                      <td>{user.email}</td>
                      <td>{user.name}</td>
                      <td>
                        <span className={`badge badge-${user.role}`}>
                          {user.role.toUpperCase()}
                        </span>
                      </td>
                      <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                      <td className="actions">
                        <button
                          className="btn-delete"
                          onClick={() => handleDeleteUser(user._id)}
                          title="Delete User"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        >
                          <Trash2 size={14} /> Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* SUBSCRIPTIONS TAB */}
      {activeTab === 'subscriptions' && (
        <div className="subscriptions-section">
          <h2>Subscription Management</h2>
          {loading && <p className="loading">Loading...</p>}

          {/* Users without subscriptions */}
          {(() => {
            const subUserIds = subscriptions.map(s => s.user?._id || s.user);
            const unsubscribed = users.filter(u => !subUserIds.includes(u._id));
            if (unsubscribed.length === 0) return null;
            return (
              <div className="bulk-import-section" style={{ marginBottom: '1.5rem' }}>
                <h3>⚡ Users Without Subscription</h3>
                <div className="table-responsive">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Email</th>
                        <th>Name</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {unsubscribed.map(u => (
                        <tr key={u._id}>
                          <td>{u.email}</td>
                          <td>{u.name}</td>
                          <td>
                              <button
                                className="btn-edit"
                                onClick={() => handleAssignSubscription(u._id)}
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                              >
                                <Plus size={14} /> Assign Free Plan
                              </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()}

          {subscriptions.length === 0 ? (
            <p className="empty-state">No subscriptions found</p>
          ) : (
            <div className="table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>User Email</th>
                    <th>Plan</th>
                    <th>Status</th>
                    <th>Start Date</th>
                    <th>End Date</th>
                    <th>Max Quality</th>
                    <th>Max Screens</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {subscriptions.map(sub => {
                    const user = users.find(u => u._id === sub.user?._id || u._id === sub.user);
                    const userId = sub.user?._id || sub.user;
                    return (
                      <tr key={sub._id}>
                        <td>{user?.email || sub.user?.email || 'Unknown'}</td>
                        <td>
                          <span className={`badge badge-${sub.plan}`}>
                            {sub.plan.toUpperCase()}
                          </span>
                        </td>
                        <td>
                          <span className={`status ${sub.isActive ? 'active' : 'inactive'}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            {sub.isActive ? <><CheckCircle2 size={14} /> Active</> : <><XCircle size={14} /> Inactive</>}
                          </span>
                        </td>
                        <td>{new Date(sub.startDate).toLocaleDateString()}</td>
                        <td>{sub.endDate ? new Date(sub.endDate).toLocaleDateString() : '—'}</td>
                        <td>{sub.maxQuality}</td>
                        <td>{sub.maxScreens}</td>
                        <td className="actions">
                          <select
                            className="plan-selector"
                            value={sub.plan}
                            onChange={(e) => handleUpdateSubscription(userId, e.target.value)}
                          >
                            <option value="free">Free</option>
                            <option value="basic">Basic</option>
                            <option value="premium">Premium</option>
                            <option value="vip">VIP</option>
                          </select>
                          <button
                            className="btn-edit"
                            onClick={() => handleToggleSubscription(userId, sub.isActive)}
                            title={sub.isActive ? 'Deactivate' : 'Activate'}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          >
                            {sub.isActive ? <><Pause size={14} /> Deactivate</> : <><Play size={14} fill="currentColor" /> Activate</>}
                          </button>
                          <button
                            className="btn-delete"
                            onClick={() => handleDeleteSubscription(userId)}
                            title="Delete Subscription"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          >
                            <Trash2 size={14} /> Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* GENRES TAB */}
      {activeTab === 'genres' && (
        <div className="genres-section">
          <div className="admin-header">
            <h2>Genre Management ({genres.length})</h2>
            <button 
              className="btn-primary"
              onClick={() => setShowForm(!showForm)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
            >
              {showForm ? <><X size={16} /> Close</> : <><Plus size={16} /> Add New Genre</>}
            </button>
          </div>

          {showForm && (
            <div className="content-form">
              <h2>Add New Genre</h2>
              <form onSubmit={async (e) => {
                e.preventDefault();
                const name = e.target.genreName.value;
                const description = e.target.genreDescription.value;
                try {
                  setLoading(true);
                  await api.post('/genres', { name, description });
                  alert('Genre added successfully');
                  e.target.reset();
                  setShowForm(false);
                  fetchGenres();
                } catch (error) {
                  alert(error.response?.data?.message || 'Failed to add genre');
                } finally {
                  setLoading(false);
                }
              }}>
                <div className="form-group">
                  <label>Genre Name *</label>
                  <input name="genreName" type="text" required placeholder="e.g. Anime, Documentary" />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea name="genreDescription" placeholder="Optional description" rows="2" />
                </div>
                <div className="form-actions">
                  <button type="submit" className="btn-success" disabled={loading}>
                    {loading ? 'Saving...' : 'Add Genre'}
                  </button>
                  <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                </div>
              </form>
            </div>
          )}

          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Description</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {genres.map(genre => (
                  <tr key={genre._id}>
                    <td><strong>{genre.name}</strong></td>
                    <td>{genre.description || '—'}</td>
                    <td className="actions">
                      <button
                        className="btn-delete"
                        onClick={async () => {
                          if (window.confirm(`Are you sure you want to delete "${genre.name}"?`)) {
                            try {
                              await api.delete(`/genres/${genre._id}`);
                              alert('Genre deleted');
                              fetchGenres();
                            } catch (error) {
                              alert('Failed to delete genre');
                            }
                          }
                        }}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      >
                        <Trash2 size={14} /> Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
