import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AnalysisDetail.css';

const AnalysisDetail = ({ analysisId, onBack }) => {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAnalysis();
  }, [analysisId]);

  const fetchAnalysis = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/analysis/${analysisId}`);
      setAnalysis(response.data.data.analysis);
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load analysis details');
    } finally {
      setLoading(false);
    }
  };

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
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="analysis-detail">
        <div className="loading-state">
          <h3>Loading analysis details...</h3>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="analysis-detail">
        <div className="error-state">
          <h3>❌ Error Loading Analysis</h3>
          <p>{error}</p>
          <div className="error-actions">
            <button onClick={fetchAnalysis} className="retry-btn">
              Try Again
            </button>
            <button onClick={onBack} className="back-btn">
              Back to History
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="analysis-detail">
        <div className="error-state">
          <h3>Analysis not found</h3>
          <button onClick={onBack} className="back-btn">
            Back to History
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="analysis-detail">
      <div className="detail-header">
        <button onClick={onBack} className="back-btn">
          ← Back to History
        </button>
        <div className="analysis-date">
          Analyzed on {formatDate(analysis.createdAt)}
        </div>
      </div>

      <div className="detail-content">
        <div className="video-section">
          <h2>🎥 Video Information</h2>
          <div className="video-info-detail">
            <p><strong>URL:</strong> <a href={analysis.videoUrl} target="_blank" rel="noopener noreferrer">{analysis.videoUrl}</a></p>
            {analysis.videoTitle && <p><strong>Title:</strong> {analysis.videoTitle}</p>}
            {analysis.videoDuration && <p><strong>Duration:</strong> {analysis.videoDuration}</p>}
            {analysis.channelName && <p><strong>Channel:</strong> {analysis.channelName}</p>}
          </div>
        </div>

        <div className="intention-section">
          <h2>🎯 Learning Intention</h2>
          <div className="learning-intention-detail">
            <p>{analysis.learningIntention}</p>
          </div>
        </div>

        <div className="results-section">
          <h2>📊 Analysis Results</h2>
          
          <div className="match-score-detail">
            <div className="score-display-large">
              <div className="score-number-large">{analysis.analysisResults.matchScore}%</div>
              <div 
                className="recommendation-large"
                style={{ color: getRecommendationColor(analysis.analysisResults.recommendation) }}
              >
                {getRecommendationText(analysis.analysisResults.recommendation)}
              </div>
            </div>
          </div>

          {analysis.analysisResults.keyPoints && analysis.analysisResults.keyPoints.length > 0 && (
            <div className="key-points-detail">
              <h3>🔑 Key Points</h3>
              <ul>
                {analysis.analysisResults.keyPoints.map((point, index) => (
                  <li key={index}>{point}</li>
                ))}
              </ul>
            </div>
          )}

          {analysis.analysisResults.insights && analysis.analysisResults.insights.length > 0 && (
            <div className="insights-detail">
              <h3>💡 Insights</h3>
              <ul>
                {analysis.analysisResults.insights.map((insight, index) => (
                  <li key={index}>{insight}</li>
                ))}
              </ul>
            </div>
          )}

          {analysis.analysisResults.reasoning && (
            <div className="reasoning-detail">
              <h3>🤔 Reasoning</h3>
              <p>{analysis.analysisResults.reasoning}</p>
            </div>
          )}

          {analysis.analysisResults.relevantTimestamps && analysis.analysisResults.relevantTimestamps.length > 0 && (
            <div className="timestamps-detail">
              <h3>⏰ Relevant Sections</h3>
              {analysis.analysisResults.relevantTimestamps.map((timestamp, index) => (
                <div key={index} className="timestamp-item-detail">
                  <strong>{timestamp.description}</strong>
                  <p>{timestamp.relevance}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="metadata-section">
          <h3>📈 Analysis Metadata</h3>
          <div className="metadata-grid">
            <div className="metadata-item">
              <strong>Processing Time:</strong>
              <span>{analysis.processingTime}ms</span>
            </div>
            <div className="metadata-item">
              <strong>Transcript Length:</strong>
              <span>{analysis.transcript?.length || 0} characters</span>
            </div>
            <div className="metadata-item">
              <strong>Analysis ID:</strong>
              <span className="analysis-id">{analysis._id}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalysisDetail;