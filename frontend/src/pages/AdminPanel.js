import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  });
  const [bulkLinksInput, setBulkLinksInput] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedSubscription, setSelectedSubscription] = useState(null);

  useEffect(() => {
    fetchContents();
    fetchGenres();
    fetchUsers();
    fetchSubscriptions();
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.role !== 'admin') {
      navigate('/');
      alert('Admin access required');
    }
  };

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
      const response = await api.get('/genre');
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

  const handleGenreChange = (e) => {
    const options = e.target.options;
    const selected = [];
    for (let i = 0; i < options.length; i++) {
      if (options[i].selected) {
        selected.push(options[i].value);
      }
    }
    setFormData(prev => ({
      ...prev,
      genre: selected,
    }));
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
      videoUrl: content.videoUrl,
      ageRating: content.ageRating,
      language: content.language.join(', '),
      qualityOptions: content.qualityOptions || ['720p', '1080p'],
    });
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
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleBulkImportLinks = async () => {
    if (!bulkLinksInput.trim()) {
      alert('Please enter content links');
      return;
    }
    
    const links = bulkLinksInput
      .split('\n')
      .filter(line => line.trim())
      .map(line => line.trim());

    if (links.length === 0) {
      alert('No valid links found');
      return;
    }

    try {
      setLoading(true);
      let importedCount = 0;

      for (const link of links) {
        const isGoogleDrive = link.includes('drive.google.com');
        const videoUrl = isGoogleDrive 
          ? link.includes('id=') ? link : `https://drive.google.com/uc?id=${link.split('/d/')[1]?.split('/')[0]}`
          : link;

        await api.post('/content', {
          title: `Content - ${new Date().getTime()}`,
          description: 'Added via bulk import',
          contentType: 'movie',
          genre: genres.length > 0 ? [genres[0]._id] : [],
          releaseDate: new Date().toISOString(),
          videoUrl,
          posterUrl: 'https://via.placeholder.com/300x450?text=Poster',
          thumbnailUrl: 'https://via.placeholder.com/400x300?text=Thumbnail',
          rating: 0,
          ageRating: 'PG-13'
        });
        importedCount++;
      }

      alert(`✓ Successfully imported ${importedCount} content links`);
      setBulkLinksInput('');
      fetchContents();
    } catch (error) {
      console.error('Error importing links:', error);
      alert('Failed to import some links. Please check the format.');
    } finally {
      setLoading(false);
    }
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

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <h1>📺 Admin Panel</h1>
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
        </div>
      </div>

      {/* CONTENT TAB */}
      {activeTab === 'content' && (
        <>
          <div className="bulk-import-section">
            <h3>🔗 Bulk Import Links</h3>
            <textarea
              placeholder="Paste Google Drive links or video URLs (one per line)&#10;Examples:&#10;https://drive.google.com/uc?id=FILE_ID&#10;https://example.com/video.mp4"
              value={bulkLinksInput}
              onChange={(e) => setBulkLinksInput(e.target.value)}
              rows="6"
              className="bulk-import-textarea"
            />
            <div className="bulk-import-actions">
              <button
                className="btn-import"
                onClick={handleBulkImportLinks}
                disabled={loading || !bulkLinksInput.trim()}
              >
                {loading ? '⏳ Importing...' : '📤 Import Links'}
              </button>
              <button
                className="btn-secondary"
                onClick={() => setBulkLinksInput('')}
              >
                Clear
              </button>
            </div>
          </div>

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
                <label>Duration (minutes)</label>
                <input
                  type="number"
                  name="duration"
                  value={formData.duration}
                  onChange={handleInputChange}
                  placeholder="120"
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
                <select
                  multiple
                  name="genre"
                  value={formData.genre}
                  onChange={handleGenreChange}
                  size={Math.min(genres.length, 5)}
                >
                  {genres.map(genre => (
                    <option key={genre._id} value={genre._id}>
                      {genre.name}
                    </option>
                  ))}
                </select>
                <small>Hold Ctrl/Cmd to select multiple</small>
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
                      <span className={`badge badge-${content.contentType}`}>
                        {content.contentType === 'movie' ? '🎬 Movie' : '📺 Series'}
                      </span>
                    </td>
                    <td>{new Date(content.releaseDate).toLocaleDateString()}</td>
                    <td>
                      <span className="rating">⭐ {content.rating}/10</span>
                    </td>
                    <td>
                      <span className={`status ${content.isActive ? 'active' : 'inactive'}`}>
                        {content.isActive ? '✓ Active' : '✕ Inactive'}
                      </span>
                    </td>
                    <td className="actions">
                      <button
                        className="btn-edit"
                        onClick={() => handleEdit(content)}
                        title="Edit"
                      >
                        ✎ Edit
                      </button>
                      <button
                        className="btn-delete"
                        onClick={() => handleDelete(content._id)}
                        title="Delete"
                      >
                        🗑 Delete
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
                        >
                          🗑 Delete
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
                    return (
                      <tr key={sub._id}>
                        <td>{user?.email || sub.user?.email || 'Unknown'}</td>
                        <td>
                          <span className={`badge badge-${sub.plan}`}>
                            {sub.plan.toUpperCase()}
                          </span>
                        </td>
                        <td>
                          <span className={`status ${sub.isActive ? 'active' : 'inactive'}`}>
                            {sub.isActive ? '✓ Active' : '✕ Inactive'}
                          </span>
                        </td>
                        <td>{new Date(sub.startDate).toLocaleDateString()}</td>
                        <td>{sub.endDate ? new Date(sub.endDate).toLocaleDateString() : '—'}</td>
                        <td>{sub.maxQuality}</td>
                        <td>{sub.maxScreens}</td>
                        <td className="actions">
                          <select
                            className="plan-selector"
                            defaultValue={sub.plan}
                            onChange={(e) => handleUpdateSubscription(sub.user?._id || sub.user, e.target.value)}
                          >
                            <option value={sub.plan}>---</option>
                            <option value="free">Free</option>
                            <option value="basic">Basic</option>
                            <option value="premium">Premium</option>
                            <option value="vip">VIP</option>
                          </select>
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
    </div>
  );
};

export default AdminPanel;
