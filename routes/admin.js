const express = require('express');
const User = require('../models/User');

const router = express.Router();

// Get all users
router.get('/users', async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json({
      success: true,
      users
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      error: 'Failed to fetch users'
    });
  }
});

// Create new user
router.post('/users', async (req, res) => {
  try {
    const { username, email, password, firstName, lastName, role = 'user' } = req.body;

    if (!username || !email || !password || !firstName || !lastName) {
      return res.status(400).json({
        error: 'All fields are required'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      return res.status(400).json({
        error: existingUser.email === email ? 'Email already registered' : 'Username already taken'
      });
    }

    const user = new User({
      username,
      email,
      password,
      firstName,
      lastName,
      role
    });

    await user.save();

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: {
        id: user._id,
        _id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        createdAt: user.createdAt
      }
    });

  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({
      error: 'User creation failed'
    });
  }
});

// Update user
router.put('/users/:id', async (req, res) => {
  try {
    const { firstName, lastName, email, username, role, password } = req.body;
    
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    // Update fields
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (email) user.email = email;
    if (username) user.username = username;
    if (role) user.role = role;
    if (password && password.trim() !== '') {
      user.password = password; // This will be hashed by the pre-save middleware
    }

    await user.save();

    res.json({
      success: true,
      message: 'User updated successfully',
      user: {
        id: user._id,
        _id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        createdAt: user.createdAt
      }
    });

  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      error: 'User update failed'
    });
  }
});

// Delete user
router.delete('/users/:id', async (req, res) => {
  try {
    console.log('Delete request received for user ID:', req.params.id);
    
    if (!req.params.id || req.params.id === 'undefined') {
      console.log('Invalid user ID received:', req.params.id);
      return res.status(400).json({
        error: 'Invalid user ID'
      });
    }

    const user = await User.findByIdAndDelete(req.params.id);
    
    if (!user) {
      console.log('User not found with ID:', req.params.id);
      return res.status(404).json({
        error: 'User not found'
      });
    }

    console.log('User deleted successfully:', user.username);
    res.json({
      success: true,
      message: 'User deleted successfully'
    });

  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      error: 'User deletion failed',
      details: error.message
    });
  }
});

module.exports = router;