require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
// Removed OAuth dependencies

// Database connection
const connectDB = require('./config/database');

// Routes
const analysisRoutes = require('./routes/analysis');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');

const YouTubeService = require('./services/YouTubeService');
const AIAnalysisService = require('./services/AIAnalysisService');

const app = express();
const PORT = process.env.PORT || 3001;

// Connect to database
connectDB();

// Initialize services
const youtubeService = new YouTubeService();
const aiAnalysisService = new AIAnalysisService();

// Middleware
app.set('trust proxy', 1); // Trust first proxy for rate limiting
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3001',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Removed OAuth session middleware

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Analysis rate limiting (more restrictive)
const analysisLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // limit each IP to 10 analysis requests per 5 minutes
  message: 'Too many analysis requests, please try again in a few minutes.'
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/analysis', analysisRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Test Ollama connection endpoint
app.get('/test-ollama', async (req, res) => {
  try {
    console.log('Testing Ollama connection...');
    const testResponse = await aiAnalysisService.ollama.chat({
      model: 'qwen3:8b',
      messages: [{
        role: 'user',
        content: 'Hello, respond with just "OK"'
      }]
    });
    
    console.log('Ollama test successful');
    res.json({
      status: 'Ollama connection OK',
      response: testResponse.message.content.substring(0, 100)
    });
  } catch (error) {
    console.log('Ollama test failed:', error.message);
    res.status(500).json({
      status: 'Ollama connection failed',
      error: error.message
    });
  }
});

// Request deduplication map
const activeAnalyses = new Map();

// MVP Analysis endpoint
app.post('/api/analyze', analysisLimiter, async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { videoUrl, learningIntention } = req.body;
    
    // Validation
    if (!videoUrl || !learningIntention) {
      return res.status(400).json({
        error: 'Both videoUrl and learningIntention are required',
        code: 'MISSING_REQUIRED_FIELDS'
      });
    }

    if (typeof videoUrl !== 'string' || typeof learningIntention !== 'string') {
      return res.status(400).json({
        error: 'videoUrl and learningIntention must be strings',
        code: 'INVALID_FIELD_TYPES'
      });
    }

    if (learningIntention.trim().length < 10) {
      return res.status(400).json({
        error: 'Learning intention must be at least 10 characters long',
        code: 'LEARNING_INTENTION_TOO_SHORT'
      });
    }

    // Validate YouTube URL
    if (!youtubeService.validateYouTubeUrl(videoUrl)) {
      return res.status(400).json({
        error: 'Invalid YouTube URL format',
        code: 'INVALID_YOUTUBE_URL'
      });
    }

    // Check for duplicate requests
    const requestKey = `${videoUrl}-${learningIntention.trim()}`;
    if (activeAnalyses.has(requestKey)) {
      return res.status(429).json({
        error: 'Analysis already in progress for this video and learning intention',
        code: 'ANALYSIS_IN_PROGRESS'
      });
    }

    activeAnalyses.set(requestKey, true);
    console.log(`Starting analysis for video: ${videoUrl}`);
    console.log(`Learning intention: "${learningIntention}"`);

    // Step 1: Validate and extract video ID
    const videoId = youtubeService.extractVideoId(videoUrl);
    if (!videoId) {
      return res.status(400).json({
        error: 'Invalid YouTube URL format',
        code: 'INVALID_YOUTUBE_URL'
      });
    }

    // Step 2: Extract transcript using local AI
    let transcript;
    try {
      console.log('Extracting transcript using local transcription...');
      transcript = await youtubeService.extractTranscript(videoUrl);
      console.log(`Transcript extracted: ${transcript.length} characters`);
    } catch (error) {
      console.error('Transcript extraction failed:', error.message);
      return res.status(422).json({
        error: error.message,
        code: 'TRANSCRIPT_EXTRACTION_FAILED'
      });
    }

    // Step 3: Get video metadata
    let videoMetadata;
    try {
      console.log('Fetching video metadata...');
      videoMetadata = await youtubeService.getVideoMetadata(videoUrl);
      console.log(`Metadata extracted: ${videoMetadata.title || 'N/A'}`);
    } catch (error) {
      console.error('Metadata extraction failed:', error.message);
      videoMetadata = {
        videoId: videoId,
        url: videoUrl,
        title: 'Video Title Not Available',
        extractedAt: new Date().toISOString()
      };
    }

    // Step 4: Perform AI analysis
    let analysisResults;
    try {
      console.log('Starting AI analysis...');
      analysisResults = await aiAnalysisService.analyzeContent(transcript, learningIntention);
      console.log(`Analysis completed: ${analysisResults.matchScore}% match score`);
    } catch (error) {
      console.error('AI analysis failed:', error.message);
      return res.status(503).json({
        error: error.message,
        code: 'AI_ANALYSIS_FAILED'
      });
    }

    const processingTime = Date.now() - startTime;

    // Format response
    const response = {
      success: true,
      data: {
        videoMetadata: {
          videoId: videoMetadata.videoId,
          url: videoUrl,
          title: videoMetadata.title || 'Video Title Not Available',
          duration: videoMetadata.duration || null,
          channelName: videoMetadata.channelName || null
        },
        learningIntention: learningIntention.trim(),
        analysis: {
          matchScore: analysisResults.matchScore,
          recommendation: analysisResults.recommendation,
          keyPoints: analysisResults.keyPoints,
          insights: analysisResults.insights,
          reasoning: analysisResults.reasoning,
          relevantTimestamps: analysisResults.relevantTimestamps
        },
        metadata: {
          processingTime: processingTime,
          analyzedAt: new Date().toISOString(),
          transcriptLength: transcript.length
        }
      }
    };

    console.log(`Analysis completed successfully in ${processingTime}ms`);
    
    // Clean up active analysis
    activeAnalyses.delete(requestKey);
    
    res.json(response);

  } catch (error) {
    console.error('Unexpected error during analysis:', error);
    
    const processingTime = Date.now() - startTime;
    
    // Clean up active analysis
    const requestKey = `${req.body.videoUrl}-${req.body.learningIntention?.trim()}`;
    activeAnalyses.delete(requestKey);
    
    res.status(500).json({
      error: 'An unexpected error occurred during analysis',
      code: 'INTERNAL_SERVER_ERROR',
      metadata: {
        processingTime: processingTime,
        timestamp: new Date().toISOString()
      }
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  
  res.status(500).json({
    error: 'Internal server error',
    code: 'INTERNAL_SERVER_ERROR',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    code: 'NOT_FOUND',
    path: req.originalUrl
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`YouTube Learning Analyzer API running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Local AI Models: Whisper (${process.env.WHISPER_MODEL || 'base'}) + Qwen3 (${process.env.OLLAMA_MODEL || 'qwen3:8b'})`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Analysis endpoint: http://localhost:${PORT}/api/analyze`);
  console.log(`Analysis history: http://localhost:${PORT}/api/analysis/history`);
});

module.exports = app;