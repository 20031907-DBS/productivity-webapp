import React, { useState } from 'react';
import './AnalyzerView.css';

const AnalyzerView = () => {
  const [videoUrl, setVideoUrl] = useState('');
  const [learningIntention, setLearningIntention] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setAnalysis(null);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          videoUrl,
          learningIntention,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Analysis failed');
      }

      setAnalysis(data.data);
    } catch (err) {
      setError(err.message);
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

  const clearForm = () => {
    setVideoUrl('');
    setLearningIntention('');
    setAnalysis(null);
    setError('');
  };

  return (
    <div className="analyzer-view">
      <div className="analyzer-header">
        <h2>🎯 Analyze YouTube Videos</h2>
        <p>Discover if videos match your learning goals with AI-powered analysis</p>
      </div>



      <div className="analyzer-container">
        <div className="analyzer-form-section">
          <form onSubmit={handleSubmit} className="analyzer-form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="videoUrl">
                  <span className="label-icon">🔗</span>
                  YouTube Video URL
                </label>
                <input
                  type="url"
                  id="videoUrl"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  required
                  className="url-input"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="learningIntention">
                  <span className="label-icon">🎯</span>
                  What do you want to learn?
                </label>
                <textarea
                  id="learningIntention"
                  value={learningIntention}
                  onChange={(e) => setLearningIntention(e.target.value)}
                  placeholder="Describe what you're hoping to learn from this video..."
                  rows="4"
                  required
                  minLength="10"
                  className="intention-input"
                />
                <div className="char-counter">
                  {learningIntention.length}/1000 characters
                </div>
              </div>
            </div>

            <div className="form-actions">
              <button 
                type="button" 
                onClick={clearForm}
                className="clear-btn"
                disabled={loading}
              >
                🗑️ Clear
              </button>
              <button 
                type="submit" 
                disabled={loading} 
                className="analyze-btn"
              >
                {loading ? (
                  <>
                    <span className="loading-spinner">⏳</span>
                    Analyzing...
                  </>
                ) : (
                  <>
                    <span className="analyze-icon">🔍</span>
                    Analyze Video
                  </>
                )}
              </button>
            </div>
          </form>

          {loading && (
            <div className="loading-indicator">
              <div className="loading-animation">
                <div className="loading-circle"></div>
                <div className="loading-circle"></div>
                <div className="loading-circle"></div>
              </div>
              <div className="loading-content">
                <h3>🤖 AI Analysis in Progress</h3>
                <p>🎵 Extracting audio and generating transcript with Whisper...</p>
                <p>🧠 Analyzing content relevance with Qwen3 local AI model...</p>
                <p>⚡ Processing learning insights and recommendations...</p>
                <div className="loading-note">
                  <strong>Note:</strong> This process runs entirely on your local machine for privacy
                </div>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="error-section">
            <div className="error-card">
              <span className="error-icon">❌</span>
              <div className="error-content">
                <h3>Analysis Failed</h3>
                <p>{error}</p>
                <button onClick={() => setError('')} className="dismiss-btn">
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}

        {analysis && (
          <div className="results-section">
            <div className="results-header">
              <h2>📊 Analysis Results</h2>
              <div className="results-meta">
                <span className="processing-time">
                  ⚡ Processed in {analysis.metadata.processingTime}ms
                </span>
                {analysis.metadata.saved && (
                  <span className="saved-indicator">
                    💾 Saved to history
                  </span>
                )}
              </div>
            </div>

            <div className="results-grid">
              <div className="result-card video-info-card">
                <h3>🎥 Video Information</h3>
                <div className="video-details">
                  {analysis.videoMetadata.title && (
                    <div className="video-title">
                      <strong>Title:</strong> {analysis.videoMetadata.title}
                    </div>
                  )}
                  {analysis.videoMetadata.channelName && (
                    <div className="video-channel">
                      <strong>Channel:</strong> {analysis.videoMetadata.channelName}
                    </div>
                  )}
                  {analysis.videoMetadata.duration && (
                    <div className="video-duration">
                      <strong>Duration:</strong> {analysis.videoMetadata.duration}
                    </div>
                  )}
                  <div className="video-url">
                    <strong>URL:</strong> <a href={analysis.videoMetadata.url} target="_blank" rel="noopener noreferrer">{analysis.videoMetadata.url}</a>
                  </div>
                  <div className="video-id">
                    <strong>Video ID:</strong> <code>{analysis.videoMetadata.videoId}</code>
                  </div>
                  <div className="analysis-meta">
                    <strong>Analyzed:</strong> {new Date(analysis.metadata.analyzedAt).toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="result-card match-score-card">
                <h3>🎯 Match Score</h3>
                <div className="score-display">
                  <div className="score-circle">
                    <div className="score-number">{analysis.analysis.matchScore}%</div>
                  </div>
                  <div 
                    className="recommendation-badge"
                    style={{ backgroundColor: getRecommendationColor(analysis.analysis.recommendation) }}
                  >
                    {getRecommendationText(analysis.analysis.recommendation)}
                  </div>
                </div>
              </div>

              <div className="result-card key-points-card">
                <h3>🔑 Key Points</h3>
                <ul className="points-list">
                  {analysis.analysis.keyPoints.map((point, index) => (
                    <li key={index} className="point-item">
                      <span className="point-bullet">•</span>
                      {point}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="result-card insights-card">
                <h3>💡 Insights</h3>
                <ul className="insights-list">
                  {analysis.analysis.insights.map((insight, index) => (
                    <li key={index} className="insight-item">
                      <span className="insight-icon">💡</span>
                      {insight}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="result-card reasoning-card">
                <h3>🤔 Reasoning</h3>
                <div className="reasoning-content">
                  <p>{analysis.analysis.reasoning}</p>
                </div>
              </div>

              {analysis.analysis.relevantTimestamps && analysis.analysis.relevantTimestamps.length > 0 && (
                <div className="result-card timestamps-card">
                  <h3>⏰ Smart Learning Timeline</h3>
                  <div className="timestamps-list">
                    {analysis.analysis.relevantTimestamps.map((timestamp, index) => (
                      <div key={index} className={`timestamp-item ${timestamp.skipRecommendation?.toLowerCase()}`}>
                        <div className="timestamp-header">
                          <div className="time-range">{timestamp.timeRange}</div>
                          <div className="learning-value-badge" data-value={timestamp.learningValue}>
                            {timestamp.learningValue}
                          </div>
                          <div className="skip-recommendation" data-rec={timestamp.skipRecommendation}>
                            {timestamp.skipRecommendation === 'MUST_WATCH' && '🎯 Must Watch'}
                            {timestamp.skipRecommendation === 'RECOMMENDED' && '👍 Recommended'}
                            {timestamp.skipRecommendation === 'OPTIONAL' && '⚪ Optional'}
                            {timestamp.skipRecommendation === 'SKIP' && '⏭️ Skip'}
                          </div>
                        </div>
                        <h4 className="timestamp-title">{timestamp.title}</h4>
                        <p className="timestamp-description">{timestamp.description}</p>
                        
                        {timestamp.keyTakeaways && (
                          <div className="key-takeaways">
                            <strong>🎯 Key Takeaways:</strong> {timestamp.keyTakeaways}
                          </div>
                        )}
                        
                        {timestamp.practicalApplication && (
                          <div className="practical-application">
                            <strong>🛠️ Practical Application:</strong> {timestamp.practicalApplication}
                          </div>
                        )}
                        
                        <div className="timestamp-meta">
                          <span className="relevance-score">
                            Relevance: {timestamp.relevanceScore}/10
                          </span>
                          <span className="actionable-content">
                            💡 {timestamp.actionableContent}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {analysis.analysis.timeEfficiencyTips && (
                <div className="result-card efficiency-tips-card">
                  <h3>⚡ Time-Saving Tips</h3>
                  <ul className="efficiency-tips-list">
                    {analysis.analysis.timeEfficiencyTips.map((tip, index) => (
                      <li key={index} className="efficiency-tip">
                        <span className="tip-icon">💡</span>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {(analysis.analysis.prerequisiteCheck || analysis.analysis.difficultyLevel || analysis.analysis.estimatedLearningTime) && (
                <div className="result-card learning-meta-card">
                  <h3>📋 Learning Information</h3>
                  <div className="learning-meta-grid">
                    {analysis.analysis.difficultyLevel && (
                      <div className="meta-item">
                        <span className="meta-label">Difficulty Level:</span>
                        <span className={`meta-value difficulty-${analysis.analysis.difficultyLevel.toLowerCase()}`}>
                          {analysis.analysis.difficultyLevel}
                        </span>
                      </div>
                    )}
                    {analysis.analysis.estimatedLearningTime && (
                      <div className="meta-item">
                        <span className="meta-label">Active Learning Time:</span>
                        <span className="meta-value">{analysis.analysis.estimatedLearningTime}</span>
                      </div>
                    )}
                    {analysis.analysis.prerequisiteCheck && (
                      <div className="meta-item full-width">
                        <span className="meta-label">Prerequisites:</span>
                        <span className="meta-value">{analysis.analysis.prerequisiteCheck}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {analysis.analysis.learningPath && (
                <div className="result-card learning-path-card">
                  <h3>🗺️ Learning Path</h3>
                  <div className="learning-path-steps">
                    <div className="path-step">
                      <div className="step-header">
                        <span className="step-icon">📚</span>
                        <h4>Before Watching</h4>
                      </div>
                      <p>{analysis.analysis.learningPath.beforeWatching}</p>
                    </div>
                    <div className="path-step">
                      <div className="step-header">
                        <span className="step-icon">🎥</span>
                        <h4>During Watching</h4>
                      </div>
                      <p>{analysis.analysis.learningPath.duringWatching}</p>
                    </div>
                    <div className="path-step">
                      <div className="step-header">
                        <span className="step-icon">🚀</span>
                        <h4>After Watching</h4>
                      </div>
                      <p>{analysis.analysis.learningPath.afterWatching}</p>
                    </div>
                  </div>
                </div>
              )}

              {analysis.analysis.contentQuality && (
                <div className="result-card content-quality-card">
                  <h3>⭐ Content Quality Assessment</h3>
                  <div className="quality-metrics">
                    <div className="quality-item">
                      <span className="quality-label">Teaching Clarity:</span>
                      <span className="quality-value">{analysis.analysis.contentQuality.teachingClarity}</span>
                    </div>
                    <div className="quality-item">
                      <span className="quality-label">Practical Examples:</span>
                      <span className="quality-value">{analysis.analysis.contentQuality.practicalExamples}</span>
                    </div>
                    <div className="quality-item">
                      <span className="quality-label">Comprehensiveness:</span>
                      <span className="quality-value">{analysis.analysis.contentQuality.comprehensiveness}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalyzerView;