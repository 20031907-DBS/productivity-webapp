require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const session = require('express-session');
const passport = require('./config/passport');

// Database connection
const connectDB = require('./config/database');

// Routes
const authRoutes = require('./routes/auth');
const analysisRoutes = require('./routes/analysis');

const YouTubeService = require('./services/YouTubeService');
const AIAnalysisService = require('./services/AIAnalysisService');
const ProgressLogger = require('./utils/ProgressLogger');

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

// Session middleware for Passport
app.use(session({
  secret: process.env.JWT_SECRET || 'fallback-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

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
app.use('/api/analysis', analysisRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

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

    // Initialize progress logger
    const sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const logger = new ProgressLogger(sessionId);
    
    logger.logHeader(videoUrl, learningIntention);

    // Step 1: Validate and extract video ID
    logger.logStep('Validating YouTube URL', 'start');
    const videoId = youtubeService.extractVideoId(videoUrl);
    if (!videoId) {
      logger.logError(new Error('Invalid YouTube URL format'), 'URL Validation');
      return res.status(400).json({
        error: 'Invalid YouTube URL format',
        code: 'INVALID_YOUTUBE_URL'
      });
    }
    logger.logStep('URL Validation', 'success', `Video ID: ${videoId}`);

    // Step 2: Extract transcript
    let transcript;
    try {
      logger.logStep('Extracting video transcript', 'start', 'Connecting to YouTube API...');
      logger.logProgress('Initializing YouTube client');
      
      transcript = await youtubeService.extractTranscript(videoUrl);
      
      logger.logStep('Transcript Extraction', 'success', `${transcript.length} characters extracted`);
      logger.logStep('Transcript Extraction', 'info', `First 100 chars: "${transcript.substring(0, 100)}..."`);
    } catch (error) {
      logger.logError(error, 'Transcript Extraction');
      return res.status(422).json({
        error: error.message,
        code: 'TRANSCRIPT_EXTRACTION_FAILED'
      });
    }

    // Step 3: Get video metadata
    let videoMetadata;
    try {
      logger.logStep('Fetching video metadata', 'start');
      videoMetadata = await youtubeService.getVideoMetadata(videoUrl);
      logger.logStep('Metadata Extraction', 'success', `Title: ${videoMetadata.title || 'N/A'}`);
    } catch (error) {
      logger.logStep('Metadata Extraction', 'error', error.message);
      logger.logStep('Metadata Extraction', 'info', 'Using fallback metadata');
      videoMetadata = {
        videoId: videoId,
        url: videoUrl,
        extractedAt: new Date().toISOString()
      };
    }

    // Step 4: Perform AI analysis
    let analysisResults;
    try {
      logger.logStep('AI Analysis', 'start', 'Sending to Ollama for processing...');
      logger.logProgress('Preparing transcript for AI analysis');
      
      // Show progress during AI analysis
      const analysisPromise = aiAnalysisService.analyzeContent(transcript, learningIntention);
      
      // Simulate progress updates (since we can't get real progress from Ollama)
      const progressInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        if (elapsed < 5000) {
          logger.logProgress('AI model processing content...', Math.min(20 + (elapsed / 250), 80));
        }
      }, 1000);
      
      analysisResults = await analysisPromise;
      clearInterval(progressInterval);
      
      logger.logStep('AI Analysis', 'success', `Match score: ${analysisResults.matchScore}%`);
      logger.logStep('AI Analysis', 'info', `Generated ${analysisResults.keyPoints?.length || 0} key points`);
      logger.logStep('AI Analysis', 'info', `Generated ${analysisResults.insights?.length || 0} insights`);
    } catch (error) {
      logger.logError(error, 'AI Analysis');
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

    // Log final results
    logger.logResults(response.data);
    
    res.json(response);

  } catch (error) {
    // Log error with progress logger if available
    if (typeof logger !== 'undefined') {
      logger.logError(error, 'Unexpected Error');
    } else {
      console.error('Unexpected error during analysis:', error);
    }
    
    const processingTime = Date.now() - startTime;
    
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
  console.log(`Mock AI Analysis: ${process.env.MOCK_AI_ANALYSIS === 'true' ? 'Enabled' : 'Disabled'}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Analysis endpoint: http://localhost:${PORT}/api/analysis/analyze`);
  console.log(`Auth endpoints: http://localhost:${PORT}/api/auth/*`);
  console.log(`Analysis history: http://localhost:${PORT}/api/analysis/history`);
});

module.exports = app;