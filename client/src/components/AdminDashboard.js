import React, { useState, useEffect } from 'react';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: 'user'
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users');
      const data = await response.json();
      
      if (response.ok) {
        console.log('Fetched users:', data.users); // Debug log
        setUsers(data.users);
      } else {
        setError('Failed to fetch users');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        setUsers([data.user, ...users]);
        setShowCreateForm(false);
        setFormData({
          username: '',
          email: '',
          password: '',
          firstName: '',
          lastName: '',
          role: 'user'
        });
        setError(''); // Clear any previous errors
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Network error');
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        setUsers(users.map(user => 
          user._id === editingUser.id ? data.user : user
        ));
        setEditingUser(null);
        setFormData({
          username: '',
          email: '',
          password: '',
          firstName: '',
          lastName: '',
          role: 'user'
        });
        setError(''); // Clear any previous errors
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Network error');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!userId) {
      setError('Invalid user ID');
      return;
    }

    if (!window.confirm('Are you sure you want to delete this user?')) {
      return;
    }

    try {
      console.log('Deleting user with ID:', userId); // Debug log
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (response.ok) {
        setUsers(users.filter(user => user._id !== userId));
        setError(''); // Clear any previous errors
      } else {
        setError(data.error || 'Failed to delete user');
      }
    } catch (err) {
      console.error('Delete error:', err);
      setError('Network error');
    }
  };

  const startEdit = (user) => {
    setEditingUser({ ...user, id: user._id });
    setFormData({
      username: user.username,
      email: user.email,
      password: '',
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role
    });
  };

  const cancelEdit = () => {
    setEditingUser(null);
    setShowCreateForm(false);
    setFormData({
      username: '',
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      role: 'user'
    });
  };

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="loading">Loading users...</div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <h2>👑 Admin Dashboard</h2>
        <p>Manage users and system settings</p>
      </div>

      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => setError('')} className="dismiss-btn">×</button>
        </div>
      )}

      <div className="admin-actions">
        <button 
          onClick={() => setShowCreateForm(true)}
          className="create-user-btn"
          disabled={showCreateForm || editingUser}
        >
          ➕ Create New User
        </button>
      </div>

      {(showCreateForm || editingUser) && (
        <div className="user-form-container">
          <div className="user-form">
            <h3>{editingUser ? 'Edit User' : 'Create New User'}</h3>
            <form onSubmit={editingUser ? handleUpdateUser : handleCreateUser}>
              <div className="form-row">
                <div className="form-group">
                  <label>First Name</label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Last Name</label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Username</label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Password {editingUser && '(leave blank to keep current)'}</label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required={!editingUser}
                    minLength="6"
                  />
                </div>
                <div className="form-group">
                  <label>Role</label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>

              <div className="form-actions">
                <button type="button" onClick={cancelEdit} className="cancel-btn">
                  Cancel
                </button>
                <button type="submit" className="save-btn">
                  {editingUser ? 'Update User' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="users-table-container">
        <h3>Users ({users.length})</h3>
        <div className="users-table">
          <div className="table-header">
            <div>Name</div>
            <div>Username</div>
            <div>Email</div>
            <div>Role</div>
            <div>Created</div>
            <div>Actions</div>
          </div>
          
          {users.map(user => {
            // Safety check for user object
            if (!user || !user._id) {
              console.error('Invalid user object:', user);
              return null;
            }
            
            return (
              <div key={user._id} className="table-row">
                <div>{user.firstName} {user.lastName}</div>
                <div>{user.username}</div>
                <div>{user.email}</div>
                <div>
                  <span className={`role-badge ${user.role}`}>
                    {user.role}
                  </span>
                </div>
                <div>{new Date(user.createdAt).toLocaleDateString()}</div>
                <div className="actions">
                  <button 
                    onClick={() => {
                      console.log('Edit user:', user); // Debug log
                      startEdit(user);
                    }}
                    className="edit-btn"
                    disabled={showCreateForm || editingUser}
                  >
                    ✏️
                  </button>
                  <button 
                    onClick={() => {
                      console.log('Delete user:', user, 'ID:', user._id); // Debug log
                      handleDeleteUser(user._id);
                    }}
                    className="delete-btn"
                    disabled={showCreateForm || editingUser}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;