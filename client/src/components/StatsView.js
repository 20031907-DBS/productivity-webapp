import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './StatsView.css';

const StatsView = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/analysis/stats/summary');
      setStats(response.data.data.stats);
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="stats-view">
        <div className="loading-state">
          <h3>Loading your statistics...</h3>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="stats-view">
        <div className="error-state">
          <h3>❌ Error Loading Statistics</h3>
          <p>{error}</p>
          <button onClick={fetchStats} className="retry-btn">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const getRecommendationPercentage = (count, total) => {
    return total > 0 ? Math.round((count / total) * 100) : 0;
  };

  return (
    <div className="stats-view">
      <div className="stats-header">
        <h2>📈 Your Learning Statistics</h2>
        <p>Insights into your video analysis patterns and learning journey</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card overview-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <h3>Total Analyses</h3>
            <div className="stat-number">{stats?.totalAnalyses || 0}</div>
            <p>Videos analyzed so far</p>
          </div>
        </div>

        <div className="stat-card score-card">
          <div className="stat-icon">🎯</div>
          <div className="stat-content">
            <h3>Average Match Score</h3>
            <div className="stat-number">{stats?.averageMatchScore || 0}%</div>
            <p>How well videos match your goals</p>
          </div>
        </div>

        <div className="stat-card recommendations-card">
          <h3>📋 Recommendation Breakdown</h3>
          <div className="recommendations-chart">
            <div className="recommendation-item highly-recommended">
              <div className="recommendation-bar">
                <div 
                  className="bar-fill" 
                  style={{ 
                    width: `${getRecommendationPercentage(stats?.highlyRecommended, stats?.totalAnalyses)}%`,
                    backgroundColor: '#4CAF50'
                  }}
                ></div>
              </div>
              <div className="recommendation-info">
                <span className="recommendation-label">Highly Recommended</span>
                <span className="recommendation-count">{stats?.highlyRecommended || 0}</span>
              </div>
            </div>

            <div className="recommendation-item recommended">
              <div className="recommendation-bar">
                <div 
                  className="bar-fill" 
                  style={{ 
                    width: `${getRecommendationPercentage(stats?.recommended, stats?.totalAnalyses)}%`,
                    backgroundColor: '#8BC34A'
                  }}
                ></div>
              </div>
              <div className="recommendation-info">
                <span className="recommendation-label">Recommended</span>
                <span className="recommendation-count">{stats?.recommended || 0}</span>
              </div>
            </div>

            <div className="recommendation-item partially-relevant">
              <div className="recommendation-bar">
                <div 
                  className="bar-fill" 
                  style={{ 
                    width: `${getRecommendationPercentage(stats?.partiallyRelevant, stats?.totalAnalyses)}%`,
                    backgroundColor: '#FF9800'
                  }}
                ></div>
              </div>
              <div className="recommendation-info">
                <span className="recommendation-label">Partially Relevant</span>
                <span className="recommendation-count">{stats?.partiallyRelevant || 0}</span>
              </div>
            </div>

            <div className="recommendation-item not-recommended">
              <div className="recommendation-bar">
                <div 
                  className="bar-fill" 
                  style={{ 
                    width: `${getRecommendationPercentage(stats?.notRecommended, stats?.totalAnalyses)}%`,
                    backgroundColor: '#F44336'
                  }}
                ></div>
              </div>
              <div className="recommendation-info">
                <span className="recommendation-label">Not Recommended</span>
                <span className="recommendation-count">{stats?.notRecommended || 0}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="stat-card insights-card">
          <h3>💡 Learning Insights</h3>
          <div className="insights-list">
            <div className="insight-item">
              <span className="insight-icon">🎯</span>
              <div className="insight-content">
                <strong>Learning Efficiency</strong>
                <p>
                  {stats?.averageMatchScore >= 70 
                    ? "You're great at finding relevant content!" 
                    : stats?.averageMatchScore >= 50
                    ? "You're finding moderately relevant content."
                    : "Consider refining your learning intentions for better matches."
                  }
                </p>
              </div>
            </div>

            <div className="insight-item">
              <span className="insight-icon">📈</span>
              <div className="insight-content">
                <strong>Analysis Activity</strong>
                <p>
                  {stats?.totalAnalyses >= 20 
                    ? "You're an active learner with lots of analyses!" 
                    : stats?.totalAnalyses >= 5
                    ? "You're building a good analysis history."
                    : "Keep analyzing videos to build your learning profile."
                  }
                </p>
              </div>
            </div>

            <div className="insight-item">
              <span className="insight-icon">🏆</span>
              <div className="insight-content">
                <strong>Success Rate</strong>
                <p>
                  {((stats?.highlyRecommended + stats?.recommended) / stats?.totalAnalyses * 100) >= 60
                    ? "High success rate in finding good content!"
                    : "Room for improvement in content selection."
                  }
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="stat-card tips-card">
          <h3>💡 Tips for Better Results</h3>
          <div className="tips-list">
            <div className="tip-item">
              <span className="tip-number">1</span>
              <p>Be specific about your learning goals in the intention field</p>
            </div>
            <div className="tip-item">
              <span className="tip-number">2</span>
              <p>Include the skill level you're targeting (beginner, intermediate, advanced)</p>
            </div>
            <div className="tip-item">
              <span className="tip-number">3</span>
              <p>Mention the type of content you prefer (tutorial, explanation, demo)</p>
            </div>
            <div className="tip-item">
              <span className="tip-number">4</span>
              <p>Review your analysis history to identify patterns in successful matches</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsView;