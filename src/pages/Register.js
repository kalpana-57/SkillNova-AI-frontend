import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import '../App.css';

function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);

  const navigate = useNavigate();

  const sendOtp = async () => {
    if (email.trim() === '') {
      alert('Please enter email');
      return;
    }

    const emailRegex =
      /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

    if (!emailRegex.test(email)) {
      alert('Please enter valid email address');
      return;
    }

    try {
      await axios.post(
        `http://localhost:8080/api/otp/send?email=${email}`
      );

      alert('OTP sent to your email');
      setOtpSent(true);
    } catch (error) {
      console.error(error);
      alert('Failed to send OTP. Check backend/mail settings.');
    }
  };

  const verifyOtp = async () => {
    if (otp.trim() === '') {
      alert('Please enter OTP');
      return;
    }

    try {
      const res = await axios.post(
        `http://localhost:8080/api/otp/verify?email=${email}&otp=${otp}`
      );

      if (res.data === 'OTP Verified') {
        alert('OTP verified successfully');
        setOtpVerified(true);
      } else {
        alert('Invalid OTP');
      }
    } catch (error) {
      console.error(error);
      alert('OTP verification failed');
    }
  };

  const registerUser = async () => {
    if (!otpVerified) {
      alert('Please verify OTP before registering');
      return;
    }

    if (
      name.trim() === '' ||
      email.trim() === '' ||
      password.trim() === ''
    ) {
      alert('Please fill all fields');
      return;
    }

    try {
      await axios.post(
        'http://localhost:8080/api/users/register',
        {
          name,
          email,
          password
        }
      );

      alert('Registration Successful');
      navigate('/');
    } catch (error) {
      console.error(error);
      alert('Registration failed');
    }
  };

  return (
    <div className="app">
      <div className="card result">
        <h1>Register</h1>

        <input
          type="text"
          placeholder="Enter name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <input
          type="email"
          placeholder="Enter email"
          value={email}
          disabled={otpVerified}
          onChange={(e) => setEmail(e.target.value)}
        />

        <button onClick={sendOtp} disabled={otpVerified}>
          {otpSent ? 'Resend OTP' : 'Send OTP'}
        </button>

        {otpSent && !otpVerified && (
          <>
            <input
              type="text"
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
            />

            <button onClick={verifyOtp}>
              Verify OTP
            </button>
          </>
        )}

        {otpVerified && (
          <p style={{ color: '#22c55e', fontWeight: 'bold' }}>
            Email Verified ✅
          </p>
        )}

        <input
          type="password"
          placeholder="Enter password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button onClick={registerUser}>
          Register
        </button>

        <p>
          Already have account? <Link to="/">Login</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;