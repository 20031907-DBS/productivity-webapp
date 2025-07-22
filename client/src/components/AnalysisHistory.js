import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AnalysisCard from './AnalysisCard';
import './AnalysisHistory.css';

const AnalysisHistory = ({ onSelectAnalysis }) => {
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchAnalyses(currentPage);
  }, [currentPage]);

  const fetchAnalyses = async (page = 1) => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/analysis/history?page=${page}&limit=10`);
      
      setAnalyses(response.data.data.analyses);
      setPagination(response.data.data.pagination);
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load analysis history');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAnalysis = async (analysisId) => {
    if (!window.confirm('Are you sure you want to delete this analysis?')) {
      return;
    }

    try {
      await axios.delete(`/api/analysis/${analysisId}`);
      
      // Remove from local state
      setAnalyses(analyses.filter(analysis => analysis.id !== analysisId));
      
      // If this was the last item on the page and we're not on page 1, go back a page
      if (analyses.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      } else {
        // Refresh current page
        fetchAnalyses(currentPage);
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete analysis');
    }
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  if (loading && analyses.length === 0) {
    return (
      <div className="analysis-history">
        <div className="loading-state">
          <h3>Loading your analysis history...</h3>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="analysis-history">
        <div className="error-state">
          <h3>❌ Error Loading History</h3>
          <p>{error}</p>
          <button onClick={() => fetchAnalyses(currentPage)} className="retry-btn">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (analyses.length === 0) {
    return (
      <div className="analysis-history">
        <div className="empty-state">
          <h3>📊 No Analysis History Yet</h3>
          <p>Your analyzed videos will appear here. Start by analyzing your first video!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="analysis-history">
      <div className="history-header">
        <h2>📊 Your Analysis History</h2>
        <p>
          {pagination?.totalCount} total analyses • 
          Page {pagination?.currentPage} of {pagination?.totalPages}
        </p>
      </div>

      <div className="analyses-grid">
        {analyses.map((analysis) => (
          <AnalysisCard
            key={analysis.id}
            analysis={analysis}
            onSelect={() => onSelectAnalysis(analysis.id)}
            onDelete={() => handleDeleteAnalysis(analysis.id)}
          />
        ))}
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={!pagination.hasPrev}
            className="pagination-btn"
          >
            ← Previous
          </button>
          
          <div className="pagination-info">
            Page {pagination.currentPage} of {pagination.totalPages}
          </div>
          
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={!pagination.hasNext}
            className="pagination-btn"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
};

export default AnalysisHistory;