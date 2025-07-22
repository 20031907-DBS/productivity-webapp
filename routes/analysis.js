const express = require('express');
const Analysis = require('../models/Analysis');
const User = require('../models/User');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const YouTubeService = require('../services/YouTubeService');
const AIAnalysisService = require('../services/AIAnalysisService');

const router = express.Router();

// Initialize services
const youtubeService = new YouTubeService();
const aiAnalysisService = new AIAnalysisService();

// @route   POST /api/analysis/analyze
// @desc    Analyze a YouTube video (updated from /api/analyze)
// @access  Public (but saves to user if authenticated)
router.post('/analyze', optionalAuth, async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { videoUrl, learningIntention } = req.body;

    // Validation
    if (!videoUrl || !learningIntention) {
      return res.status(400).json({
        success: false,
        error: 'Video URL and learning intention are required'
      });
    }

    if (!youtubeService.validateYouTubeUrl(videoUrl)) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a valid YouTube URL'
      });
    }

    if (learningIntention.trim().length < 10) {
      return res.status(400).json({
        success: false,
        error: 'Learning intention must be at least 10 characters long'
      });
    }

    // Extract transcript
    const transcript = await youtubeService.extractTranscript(videoUrl);
    
    // Get video metadata
    const videoMetadata = await youtubeService.getVideoMetadata(videoUrl);
    
    // Perform AI analysis
    const analysis = await aiAnalysisService.analyzeContent(transcript, learningIntention);
    
    const processingTime = Date.now() - startTime;
    analysis.processingTime = processingTime;

    // Save analysis if user is authenticated
    let savedAnalysis = null;
    if (req.user) {
      try {
        savedAnalysis = new Analysis({
          userId: req.user._id,
          videoUrl,
          videoTitle: videoMetadata.title || '',
          videoDuration: videoMetadata.duration || '',
          channelName: videoMetadata.channelName || '',
          learningIntention: learningIntention.trim(),
          transcript,
          analysisResults: analysis,
          processingTime
        });

        await savedAnalysis.save();
        
        // Increment user's analysis count
        await req.user.incrementAnalysisCount();
        
      } catch (saveError) {
        console.error('Error saving analysis:', saveError);
        // Continue without saving - don't fail the request
      }
    }

    res.json({
      success: true,
      data: {
        analysis: aiAnalysisService.formatAnalysisResults(analysis),
        videoMetadata,
        metadata: {
          processingTime,
          saved: !!savedAnalysis,
          analysisId: savedAnalysis?._id
        }
      }
    });

  } catch (error) {
    console.error('Analysis error:', error);
    
    let errorMessage = 'Analysis failed';
    let statusCode = 500;

    if (error.message.includes('Invalid YouTube URL')) {
      errorMessage = error.message;
      statusCode = 400;
    } else if (error.message.includes('transcript')) {
      errorMessage = error.message;
      statusCode = 422;
    } else if (error.message.includes('AI analysis failed')) {
      errorMessage = 'AI analysis service is currently unavailable';
      statusCode = 503;
    }

    res.status(statusCode).json({
      success: false,
      error: errorMessage,
      metadata: {
        processingTime: Date.now() - startTime
      }
    });
  }
});

// @route   GET /api/analysis/history
// @desc    Get user's analysis history
// @access  Private
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const analyses = await Analysis.findByUser(req.user._id, limit, skip);
    const totalCount = await Analysis.countDocuments({ userId: req.user._id });
    
    const analysisHistory = analyses.map(analysis => analysis.getSummary());

    res.json({
      success: true,
      data: {
        analyses: analysisHistory,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalCount / limit),
          totalCount,
          hasNext: skip + analyses.length < totalCount,
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error retrieving analysis history'
    });
  }
});

// @route   GET /api/analysis/:id
// @desc    Get specific analysis details
// @access  Private
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const analysis = await Analysis.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!analysis) {
      return res.status(404).json({
        success: false,
        error: 'Analysis not found'
      });
    }

    res.json({
      success: true,
      data: {
        analysis
      }
    });

  } catch (error) {
    console.error('Get analysis error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: 'Invalid analysis ID'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Server error retrieving analysis'
    });
  }
});

// @route   DELETE /api/analysis/:id
// @desc    Delete specific analysis
// @access  Private
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const analysis = await Analysis.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!analysis) {
      return res.status(404).json({
        success: false,
        error: 'Analysis not found'
      });
    }

    // Decrement user's analysis count
    if (req.user.analysisCount > 0) {
      req.user.analysisCount -= 1;
      await req.user.save();
    }

    res.json({
      success: true,
      message: 'Analysis deleted successfully'
    });

  } catch (error) {
    console.error('Delete analysis error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: 'Invalid analysis ID'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Server error deleting analysis'
    });
  }
});

// @route   GET /api/analysis/stats/summary
// @desc    Get user's analysis statistics
// @access  Private
router.get('/stats/summary', authenticateToken, async (req, res) => {
  try {
    const stats = await Analysis.getUserStats(req.user._id);
    
    res.json({
      success: true,
      data: {
        stats: {
          ...stats,
          averageMatchScore: Math.round(stats.averageMatchScore || 0)
        }
      }
    });

  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error retrieving statistics'
    });
  }
});

module.exports = router;