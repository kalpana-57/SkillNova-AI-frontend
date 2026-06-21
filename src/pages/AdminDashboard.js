import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../App.css';

function AdminDashboard() {
  const [attempts, setAttempts] = useState([]);

  useEffect(() => {
    axios.get('http://localhost:8083/api/attempts/all')
      .then((response) => {
        setAttempts(response.data);
      })
      .catch(() => {
        alert('Failed to load attempts');
      });
  }, []);

  return (
    <div className="app">
      <h1>Admin Dashboard</h1>

      <div className="card">
        {attempts.length === 0 ? (
          <h2>No attempts yet</h2>
        ) : (
          attempts.map((a, index) => (
            <div className="admin-card" key={index}>
              <h2>{index + 1}. {a.name}</h2>

              <p><b>Email:</b> {a.email}</p>
              <p><b>Category:</b> {a.category}</p>
              <p><b>Score:</b> {a.score}</p>
              <p><b>Status:</b> {a.status}</p>

              {a.capturedImage && (
                <img
                  src={a.capturedImage}
                  alt="Captured"
                  className="captured-img"
                />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;