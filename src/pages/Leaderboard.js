import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../App.css';

function Leaderboard() {

  const [scores, setScores] = useState([]);

  useEffect(() => {

    axios.get('http://localhost:8080/api/scores')
      .then((response) => {
        setScores(response.data);
      });

  }, []);

  return (
    <div className="app">

      <div className="card">

        <h1>🏆 Leaderboard</h1>

        {
          scores.map((s, index) => (

            <div key={index}>

              <h3>
                {index + 1}. {s.username} - {s.score}
              </h3>

            </div>
          ))
        }

      </div>

    </div>
  );
}

export default Leaderboard;