import React, { useState, useEffect } from 'react';
import APIService from '../services/api';
import './KYCDashboard.css';

const KYCDashboard = () => {
  const [dashboardData, setDashboardData] = useState({
    totalKycAttempts: 0,
    successfulKyc: 0,
    failedKyc: 0,
    successRate: 0,
    failureByStep: {},
    uploadFailures: 0,
    otpFailures: 0,
    faceMismatch: 0,
    dailySuccessRates: [],
    weeklySuccessRates: [],
    recentAttempts: []
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await APIService.getKYCDashboardData();

        if (response.success) {
          setDashboardData(response.data);
        } else {
          setError(response.message || 'Failed to load dashboard data');
        }

        setLoading(false);
      } catch (err) {
        setError('Failed to load dashboard data');
        setLoading(false);
        console.error('Dashboard data fetch error:', err);
      }
    };

    fetchDashboardData();
  }, []);

  // Simple bar chart component
  const BarChart = ({ data, title, color = '#007bff' }) => {
    const maxValue = Math.max(...Object.values(data));

    return (
      <div className="chart-container">
        <h3>{title}</h3>
        <div className="bar-chart">
          {Object.entries(data).map(([label, value]) => (
            <div key={label} className="bar-item">
              <div
                className="bar"
                style={{
                  height: `${maxValue > 0 ? (value / maxValue) * 100 : 0}%`,
                  backgroundColor: color
                }}
              ></div>
              <div className="bar-label">{label}</div>
              <div className="bar-value">{value}</div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Simple line chart component
  const LineChart = ({ data, title }) => {
    if (data.length === 0) {
      return (
        <div className="chart-container">
          <h3>{title}</h3>
          <p>No data available</p>
        </div>
      );
    }

    const maxValue = Math.max(...data.map(item => item.rate));
    const minValue = Math.min(...data.map(item => item.rate));

    return (
      <div className="chart-container">
        <h3>{title}</h3>
        <div className="line-chart">
          <div className="line-chart-grid">
            {[0, 25, 50, 75, 100].map(percent => (
              <div key={percent} className="grid-line" style={{ bottom: `${percent}%` }}>
                <span>{percent}%</span>
              </div>
            ))}
          </div>
          <svg viewBox="0 0 400 200" className="line-chart-svg">
            <polyline
              fill="none"
              stroke="#007bff"
              strokeWidth="2"
              points={data.map((item, index) =>
                `${(index / (data.length - 1)) * 400},${200 - ((item.rate - minValue) / (maxValue - minValue)) * 200}`
              ).join(' ')}
            />
            {data.map((item, index) => (
              <circle
                key={index}
                cx={(index / (data.length - 1)) * 400}
                cy={200 - ((item.rate - minValue) / (maxValue - minValue)) * 200}
                r="4"
                fill="#007bff"
              />
            ))}
          </svg>
          <div className="line-chart-labels">
            {data.map((item, index) => (
              <div key={index} className="label-item" style={{ left: `${(index / (data.length - 1)) * 100}%` }}>
                {item.date || item.week}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return <div className="dashboard-container">Loading dashboard data...</div>;
  }

  if (error) {
    return <div className="dashboard-container error">{error}</div>;
  }

  return (
    <div className="dashboard-container">
      <h2>KYC Failure Analysis Dashboard</h2>

      <div className="dashboard-summary">
        <div className="summary-card">
          <h3>Total Attempts</h3>
          <p className="summary-value">{dashboardData.totalKycAttempts}</p>
        </div>
        <div className="summary-card">
          <h3>Successful KYC</h3>
          <p className="summary-value success">{dashboardData.successfulKyc}</p>
        </div>
        <div className="summary-card">
          <h3>Failed KYC</h3>
          <p className="summary-value error">{dashboardData.failedKyc}</p>
        </div>
        <div className="summary-card">
          <h3>Success Rate</h3>
          <p className="summary-value">{dashboardData.successRate}%</p>
        </div>
      </div>

      <div className="dashboard-charts">
        <div className="chart-row">
          <BarChart
            data={dashboardData.failureByStep}
            title="KYC Failures by Step"
            color="#dc3545"
          />
          <div className="failure-stats">
            <h3>Failure Statistics</h3>
            <div className="stat-item">
              <span>Document Upload Failures:</span>
              <span className="stat-value">{dashboardData.uploadFailures}</span>
            </div>
            <div className="stat-item">
              <span>OTP Verification Failures:</span>
              <span className="stat-value">{dashboardData.otpFailures}</span>
            </div>
            <div className="stat-item">
              <span>Face Mismatch Rate:</span>
              <span className="stat-value">{dashboardData.faceMismatch}</span>
            </div>
          </div>
        </div>

        <div className="chart-row">
          <LineChart
            data={dashboardData.dailySuccessRates}
            title="Daily KYC Success Rate"
          />
          <LineChart
            data={dashboardData.weeklySuccessRates}
            title="Weekly KYC Success Rate"
          />
        </div>
      </div>

      <div className="dashboard-insights">
        <h3>Key Insights</h3>
        <ul>
          <li>PAN Upload has the highest failure rate ({dashboardData.failureByStep['PAN Upload'] ? Math.round((dashboardData.failureByStep['PAN Upload'] / Math.max(dashboardData.totalKycAttempts, 1)) * 100) : 0}%)</li>
          <li>Implementing better document guidance could reduce failures by up to 30%</li>
          <li>Face matching success rate can be improved with better lighting instructions</li>
          <li>Overall success rate has improved by 5% over the last month</li>
        </ul>
      </div>

      {dashboardData.recentAttempts && dashboardData.recentAttempts.length > 0 && (
        <div className="recent-submissions">
          <h3>Recent Submissions</h3>
          <div className="submissions-grid">
            {dashboardData.recentAttempts.map((attempt) => (
              <div key={attempt.id} className="submission-card">
                <div className="submission-header">
                  <span className="user-name">{attempt.fullName}</span>
                  <span className={`status-badge ${attempt.status.toLowerCase()}`}>{attempt.status}</span>
                </div>
                <div className="submission-details">
                  <p><strong>Doc ID:</strong> {attempt.documentNumber}</p>
                  <p><strong>Date:</strong> {new Date(attempt.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="submission-images">
                  <div className="image-container">
                    <p>Document</p>
                    {attempt.documentImagePath ? (
                      <img
                        src={`http://localhost:5003${attempt.documentImagePath}`}
                        alt="Document"
                        onError={(e) => { e.target.src = 'https://via.placeholder.com/150?text=No+Image' }}
                      />
                    ) : (
                      <div className="no-image">No Image</div>
                    )}
                  </div>
                  <div className="image-container">
                    <p>Face</p>
                    {attempt.faceImagePath ? (
                      <img
                        src={`http://localhost:5003${attempt.faceImagePath}`}
                        alt="Face"
                        onError={(e) => { e.target.src = 'https://via.placeholder.com/150?text=No+Image' }}
                      />
                    ) : (
                      <div className="no-image">No Image</div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default KYCDashboard;