import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import '../App.css';

function Interview() {
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [answered, setAnswered] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [scoreSaved, setScoreSaved] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);
  const [disqualified, setDisqualified] = useState(false);
  const [warning, setWarning] = useState('');

  const videoRef = useRef(null);

  useEffect(() => {
    const category = localStorage.getItem('category') || 'java';

    axios.get('http://localhost:8080/api/questions')
      .then((response) => {
        const filtered = response.data.filter(q => q.category === category);
        const shuffled = filtered.sort(() => Math.random() - 0.5);
        setQuestions(shuffled);
      })
      .catch(() => {
        alert('Backend not running');
      });
  }, []);

  useEffect(() => {
    startCamera();
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      setCameraOn(true);
    } catch (error) {
      setWarning('Camera permission denied');
      setDisqualified(true);
      setFinished(true);
    }
  };

  const openFullscreen = async () => {
    try {
      const elem = document.documentElement;
      if (elem.requestFullscreen) {
        await elem.requestFullscreen();
      }
    } catch (error) {
      alert('Fullscreen blocked. Please click button again.');
    }
  };

  useEffect(() => {
    const disqualify = () => {
      setDisqualified(true);
      setFinished(true);
      saveDisqualifiedStatus();
    };

    const handleVisibility = () => {
      if (document.hidden) {
        setWarning('Tab switched. Disqualified.');
        disqualify();
      }
    };

    const handleFullscreen = () => {
      if (!document.fullscreenElement && !finished) {
        setWarning('Fullscreen exited. Disqualified.');
        disqualify();
      }
    };

    const blockAction = (e) => {
      e.preventDefault();
      setWarning('Restricted action detected. Disqualified.');
      disqualify();
    };

    const blockKeys = (e) => {
      if (e.ctrlKey || e.altKey || e.key === 'F12' || e.key === 'PrintScreen') {
        e.preventDefault();
        setWarning('Restricted shortcut detected. Disqualified.');
        disqualify();
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    document.addEventListener('fullscreenchange', handleFullscreen);
    document.addEventListener('copy', blockAction);
    document.addEventListener('paste', blockAction);
    document.addEventListener('cut', blockAction);
    document.addEventListener('contextmenu', blockAction);
    document.addEventListener('keydown', blockKeys);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      document.removeEventListener('fullscreenchange', handleFullscreen);
      document.removeEventListener('copy', blockAction);
      document.removeEventListener('paste', blockAction);
      document.removeEventListener('cut', blockAction);
      document.removeEventListener('contextmenu', blockAction);
      document.removeEventListener('keydown', blockKeys);
    };
  }, [finished]);

  useEffect(() => {
    if (finished || questions.length === 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleNext();
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [current, finished, questions.length]);

  const submitAnswer = () => {
    if (answered) {
      alert('Already answered');
      return;
    }

    if (selectedAnswer === '') {
      alert('Select one option');
      return;
    }

    const correctAnswer = questions[current].answer;

    if (selectedAnswer === correctAnswer) {
      setScore((prev) => prev + 1);
      alert('Correct Answer');
    } else {
      setScore((prev) => prev - 1);
      alert('Wrong Answer. Correct: ' + correctAnswer);
    }

    setAnswered(true);
  };

  const saveScore = async (finalScore) => {
    if (scoreSaved) return;

    try {
      await axios.post('http://localhost:8080/api/scores/save', {
        username: localStorage.getItem('username') || 'User',
        score: finalScore,
        category: localStorage.getItem('category') || 'java'
      });

      await axios.post('http://localhost:8080/api/attempts/update-result', {
        email: localStorage.getItem('username'),
        score: finalScore,
        status: 'COMPLETED'
      });

      setScoreSaved(true);
    } catch (error) {
      alert('Score not saved');
    }
  };

  const saveDisqualifiedStatus = async () => {
    try {
      await axios.post('http://localhost:8080/api/attempts/update-result', {
        email: localStorage.getItem('username'),
        score: score,
        status: 'DISQUALIFIED'
      });
    } catch (error) {
      console.log(error);
    }
  };

  const handleNext = async () => {
    let finalScore = score;

    if (!answered && selectedAnswer !== '') {
      const correctAnswer = questions[current].answer;

      if (selectedAnswer === correctAnswer) {
        finalScore = score + 1;
      } else {
        finalScore = score - 1;
      }

      setScore(finalScore);
    }

    setSelectedAnswer('');
    setAnswered(false);
    setTimeLeft(30);

    if (current < questions.length - 1) {
      setCurrent((prev) => prev + 1);
    } else {
      await saveScore(finalScore);
      setFinished(true);
    }
  };

  if (questions.length === 0 && !finished) {
    return (
      <div className="app">
        <div className="card result">
          <h1>No questions found</h1>
        </div>
      </div>
    );
  }

  if (disqualified) {
    return (
      <div className="app">
        <div className="card result">
          <h1>Disqualified ❌</h1>
          <p>{warning}</p>
        </div>
      </div>
    );
  }

  if (finished) {
    return (
      <div className="app">
        <div className="card result">
          <h1>Test Completed 🎉</h1>
          <h2>Your Score: {score} / {questions.length}</h2>
          <h3>Percentage: {Math.round((score / questions.length) * 100)}%</h3>
        </div>
      </div>
    );
  }

  const q = questions[current];
  const progress = ((current + 1) / questions.length) * 100;

  return (
    <div className="app">
      <video ref={videoRef} autoPlay muted className="webcam"></video>

      {warning && <p className="warning-text">{warning}</p>}

      <h1>
        {localStorage.getItem('category') === 'aptitude'
          ? 'Aptitude Test'
          : 'Java Interview'}
      </h1>

      <button onClick={openFullscreen}>Start Fullscreen Mode</button>

      <div className="top-box">
        <h2>Score: {score}</h2>
        <h2>Time Left: {timeLeft}s</h2>
        <h2>{cameraOn ? 'Camera On' : 'Camera Off'}</h2>
      </div>

      <div className="progress-bg">
        <div className="progress-fill" style={{ width: `${progress}%` }}></div>
      </div>

      <h3>Question {current + 1} of {questions.length}</h3>

      <div className="card">
        <h2>{q.question}</h2>

        {[q.option1, q.option2, q.option3, q.option4].map((option, index) => (
          <label key={index}>
            <input
              type="radio"
              name="option"
              value={option}
              checked={selectedAnswer === option}
              onChange={(e) => setSelectedAnswer(e.target.value)}
            />
            {option}
          </label>
        ))}

        <button onClick={submitAnswer}>Submit Answer</button>
        <button onClick={handleNext}>Next Question</button>
      </div>
    </div>
  );
}

export default Interview;