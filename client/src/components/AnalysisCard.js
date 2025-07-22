import React from 'react';
import './AnalysisHistory.css';

const AnalysisCard = ({ analysis, onSelect, onDelete }) => {
  const getRecommendationColor = (recommendation) => {
    switch (recommendation) {
      case 'HIGHLY_RECOMMENDED': return '#4CAF50';
      case 'RECOMMENDED': return '#8BC34A';
      case 'PARTIALLY_RELEVANT': return '#FF9800';
      case 'NOT_RECOMMENDED': return '#F44336';
      default: return '#757575';
    }
  };

  const getRecommendationText = (recommendation) => {
    switch (recommendation) {
      case 'HIGHLY_RECOMMENDED': return 'Highly Recommended';
      case 'RECOMMENDED': return 'Recommended';
      case 'PARTIALLY_RELEVANT': return 'Partially Relevant';
      case 'NOT_RECOMMENDED': return 'Not Recommended';
      default: return recommendation;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const truncateText = (text, maxLength = 100) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const getYouTubeThumbnail = (videoUrl) => {
    const videoId = extractVideoId(videoUrl);
    return videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : null;
  };

  const extractVideoId = (url) => {
    const regexPatterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})/
    ];

    for (const pattern of regexPatterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    return null;
  };

  return (
    <div className="analysis-card">
      <div className="card-header">
        <div className="video-info">
          {getYouTubeThumbnail(analysis.videoUrl) && (
            <img 
              src={getYouTubeThumbnail(analysis.videoUrl)} 
              alt="Video thumbnail"
              className="video-thumbnail"
            />
          )}
          <div className="video-details">
            <h4 className="video-title">
              {analysis.videoTitle || 'YouTube Video'}
            </h4>
            <p className="video-url">
              {truncateText(analysis.videoUrl, 50)}
            </p>
          </div>
        </div>
        
        <div className="card-actions">
          <button 
            onClick={onSelect}
            className="view-btn"
            title="View full analysis"
          >
            👁️
          </button>
          <button 
            onClick={onDelete}
            className="delete-btn"
            title="Delete analysis"
          >
            🗑️
          </button>
        </div>
      </div>

      <div className="learning-intention">
        <strong>Learning Goal:</strong>
        <p>{truncateText(analysis.learningIntention, 120)}</p>
      </div>

      <div className="analysis-summary">
        <div className="match-score-small">
          <span className="score-number-small">{analysis.matchScore}%</span>
          <span 
            className="recommendation-small"
            style={{ color: getRecommendationColor(analysis.recommendation) }}
          >
            {getRecommendationText(analysis.recommendation)}
          </span>
        </div>
        
        <div className="analysis-meta">
          <span className="analysis-date">
            📅 {formatDate(analysis.createdAt)}
          </span>
          {analysis.processingTime && (
            <span className="processing-time">
              ⚡ {analysis.processingTime}ms
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalysisCard;