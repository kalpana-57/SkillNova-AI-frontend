import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as faceapi from 'face-api.js';
import axios from 'axios';
import '../App.css';

function CameraCheck() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const [cameraOn, setCameraOn] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [status, setStatus] = useState('Checking camera...');
  const [photoCaptured, setPhotoCaptured] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    loadModels();
    startCamera();
  }, []);

  const loadModels = async () => {
    try {
      await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
      await faceapi.nets.faceLandmark68Net.loadFromUri('/models');

      setModelsLoaded(true);
      setStatus('AI model loaded. Please look clearly at the camera.');
    } catch (error) {
      console.error(error);
      setStatus('AI model not loaded');
    }
  };

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
      console.error(error);
      setStatus('Camera permission denied');
    }
  };

  const checkFaceAndCapture = async () => {
    if (!modelsLoaded || !cameraOn) {
      alert('Camera or AI model not ready');
      return;
    }

    const video = videoRef.current;

    const detections = await faceapi
      .detectAllFaces(
        video,
        new faceapi.TinyFaceDetectorOptions({
          inputSize: 416,
          scoreThreshold: 0.5
        })
      )
      .withFaceLandmarks();

    if (detections.length === 0) {
      setPhotoCaptured(false);
      setStatus('No clear face detected. Remove covering and sit properly.');
      return;
    }

    if (detections.length > 1) {
      setPhotoCaptured(false);
      setStatus('Multiple faces detected. Only one person is allowed.');
      return;
    }

    const detection = detections[0];
    const score = detection.detection.score;
    const box = detection.detection.box;
    const landmarks = detection.landmarks;

    if (score < 0.75) {
      setPhotoCaptured(false);
      setStatus('Face is not clearly visible. Remove mask/hand covering.');
      return;
    }

    const faceWidth = box.width;
    const faceHeight = box.height;

    if (faceWidth < 120 || faceHeight < 120) {
      setPhotoCaptured(false);
      setStatus('Face is too far from camera. Come closer.');
      return;
    }

    if (faceWidth > video.videoWidth * 0.85 || faceHeight > video.videoHeight * 0.85) {
      setPhotoCaptured(false);
      setStatus('Face is too close to camera. Move slightly back.');
      return;
    }

    const leftEye = landmarks.getLeftEye();
    const rightEye = landmarks.getRightEye();
    const nose = landmarks.getNose();
    const mouth = landmarks.getMouth();

    if (
      !leftEye || leftEye.length === 0 ||
      !rightEye || rightEye.length === 0 ||
      !nose || nose.length === 0 ||
      !mouth || mouth.length === 0
    ) {
      setPhotoCaptured(false);
      setStatus('Full face not visible. Please remove covering.');
      return;
    }

    const eyeDistance = Math.abs(rightEye[0].x - leftEye[3].x);
    const mouthWidth = Math.abs(mouth[6].x - mouth[0].x);

    if (eyeDistance < 35 || mouthWidth < 25) {
      setPhotoCaptured(false);
      setStatus('Face landmarks unclear. Please show full face clearly.');
      return;
    }

    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext('2d');
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const photo = canvas.toDataURL('image/png');
    localStorage.setItem('examPhoto', photo);

    try {
      await axios.post('http://localhost:8080/api/attempts/save-photo', {
        name: localStorage.getItem('username'),
        email: localStorage.getItem('username'),
        category: localStorage.getItem('category'),
        capturedImage: photo
      });

      setPhotoCaptured(true);
      setStatus('Face verified and photo captured ✅');
    } catch (error) {
      console.error(error);
      setPhotoCaptured(false);
      setStatus('Failed to save photo');
    }
  };

  const enterExam = () => {
    if (!photoCaptured) {
      alert('Please complete camera check first');
      return;
    }

    navigate('/interview');
  };

  return (
    <div className="app">
      <div className="card result">
        <h1>Camera Verification</h1>

        <p>{status}</p>

        <video
          ref={videoRef}
          autoPlay
          muted
          className="camera-check-video"
        ></video>

        <canvas
          ref={canvasRef}
          style={{ display: 'none' }}
        ></canvas>

        <br />

        <button onClick={checkFaceAndCapture}>
          Check Camera & Capture Photo
        </button>

        <button onClick={enterExam}>
          Enter Exam
        </button>
      </div>
    </div>
  );
}

export default CameraCheck;