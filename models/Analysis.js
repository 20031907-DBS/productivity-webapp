const mongoose = require('mongoose');

const analysisSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  videoUrl: {
    type: String,
    required: true,
    validate: {
      validator: function(url) {
        const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
        return youtubeRegex.test(url);
      },
      message: 'Please provide a valid YouTube URL'
    }
  },
  videoTitle: {
    type: String,
    default: ''
  },
  videoDuration: {
    type: String,
    default: ''
  },
  channelName: {
    type: String,
    default: ''
  },
  learningIntention: {
    type: String,
    required: true,
    trim: true,
    minlength: 10,
    maxlength: 1000
  },
  transcript: {
    type: String,
    required: true
  },
  analysisResults: {
    matchScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    recommendation: {
      type: String,
      required: true,
      enum: ['HIGHLY_RECOMMENDED', 'RECOMMENDED', 'PARTIALLY_RELEVANT', 'NOT_RECOMMENDED']
    },
    keyPoints: [{
      type: String,
      maxlength: 500
    }],
    insights: [{
      type: String,
      maxlength: 500
    }],
    reasoning: {
      type: String,
      maxlength: 1000
    },
    relevantTimestamps: [{
      description: {
        type: String,
        maxlength: 200
      },
      relevance: {
        type: String,
        maxlength: 300
      }
    }]
  },
  processingTime: {
    type: Number, // in milliseconds
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for better query performance
analysisSchema.index({ userId: 1, createdAt: -1 });
analysisSchema.index({ 'analysisResults.matchScore': -1 });
analysisSchema.index({ 'analysisResults.recommendation': 1 });

// Virtual for video ID extraction
analysisSchema.virtual('videoId').get(function() {
  const regexPatterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})/
  ];

  for (const pattern of regexPatterns) {
    const match = this.videoUrl.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  return null;
});

// Static method to find analyses by user
analysisSchema.statics.findByUser = function(userId, limit = 20, skip = 0) {
  return this.find({ userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip)
    .select('-transcript'); // Exclude transcript from list view for performance
};

// Static method to get user's analysis statistics
analysisSchema.statics.getUserStats = async function(userId) {
  const stats = await this.aggregate([
    { $match: { userId: mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: null,
        totalAnalyses: { $sum: 1 },
        averageMatchScore: { $avg: '$analysisResults.matchScore' },
        highlyRecommended: {
          $sum: {
            $cond: [{ $eq: ['$analysisResults.recommendation', 'HIGHLY_RECOMMENDED'] }, 1, 0]
          }
        },
        recommended: {
          $sum: {
            $cond: [{ $eq: ['$analysisResults.recommendation', 'RECOMMENDED'] }, 1, 0]
          }
        },
        partiallyRelevant: {
          $sum: {
            $cond: [{ $eq: ['$analysisResults.recommendation', 'PARTIALLY_RELEVANT'] }, 1, 0]
          }
        },
        notRecommended: {
          $sum: {
            $cond: [{ $eq: ['$analysisResults.recommendation', 'NOT_RECOMMENDED'] }, 1, 0]
          }
        }
      }
    }
  ]);

  return stats[0] || {
    totalAnalyses: 0,
    averageMatchScore: 0,
    highlyRecommended: 0,
    recommended: 0,
    partiallyRelevant: 0,
    notRecommended: 0
  };
};

// Instance method to get summary
analysisSchema.methods.getSummary = function() {
  return {
    id: this._id,
    videoUrl: this.videoUrl,
    videoId: this.videoId,
    videoTitle: this.videoTitle,
    learningIntention: this.learningIntention,
    matchScore: this.analysisResults.matchScore,
    recommendation: this.analysisResults.recommendation,
    createdAt: this.createdAt,
    processingTime: this.processingTime
  };
};

// Transform output (exclude large fields by default)
analysisSchema.methods.toJSON = function() {
  const analysisObject = this.toObject();
  delete analysisObject.__v;
  
  // Include virtual fields
  analysisObject.videoId = this.videoId;
  
  return analysisObject;
};

module.exports = mongoose.model('Analysis', analysisSchema);