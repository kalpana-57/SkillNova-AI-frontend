import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../App.css';

function Category() {
  const navigate = useNavigate();

  const [attempted, setAttempted] = useState(false);
  const [userScore, setUserScore] = useState([]);

  useEffect(() => {
    const username = localStorage.getItem('username');

    axios.get(`http://localhost:8080/api/scores/user/${username}`)
      .then((response) => {
        setUserScore(response.data);

        if (response.data.length > 0) {
          setAttempted(true);
        }
      });
  }, []);

  const startInterview = (category) => {
    if (attempted) {
      alert('You already completed one test. You cannot attempt again.');
      return;
    }

    localStorage.setItem('category', category);
    navigate('/camera-check');
  };

  return (
    <div className="app">
      <div className="card result">
        <h1>Select Category</h1>

        {attempted ? (
          <div>
            <h2>You already attempted the exam</h2>

            {userScore.map((s, index) => (
              <h3 key={index}>
                Category: {s.category} | Score: {s.score}
              </h3>
            ))}
          </div>
        ) : (
          <div>
            <button onClick={() => startInterview('java')}>
              Java Interview
            </button>

            <button onClick={() => startInterview('aptitude')}>
              Aptitude Test
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Category;