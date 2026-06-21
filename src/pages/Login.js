import React, { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import '../App.css';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const navigate = useNavigate();

  const loginUser = async () => {

    if (email.trim() === '' || password.trim() === '') {
      alert('Please enter email and password');
      return;
    }

    try {
      const response = await axios.post(
        'http://localhost:8080/api/users/login',
        {
          email: email.trim(),
          password: password.trim()
        }
      );

      alert(response.data);

      if (response.data === 'Login Success') {
        localStorage.setItem('username', email.trim());
        navigate('/category');
      }

    } catch (error) {
      console.error(error);
      alert('API not reaching backend');
    }
  };

  return (
    <div className="app">
      <div className="card result">
        <h1>Login</h1>

        <input
          type="email"
          placeholder="Enter email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Enter password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button onClick={loginUser}>
          Login
        </button>

        <p>
          New user? <Link to="/register">Register here</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;