import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from './LanguageContext.jsx';
import {
  FilesetResolver,
  HandLandmarker
} from '@mediapipe/tasks-vision';

import {
  Hand,
  ArrowLeft,
  Camera as CameraIcon,
  CameraOff,
  RefreshCw,
  Scan,
  ShieldCheck,
  Languages,
  CircleAlert
} from 'lucide-react';

import './Camera.css';

// ==========================================
// 1. CONFIGURATION
// ==========================================

const API_URL = 'http://127.0.0.1:8000';

const SEQUENCE_LENGTH = 60;
const FEATURES_PER_FRAME = 126;

const FRAME_INTERVAL = 50;       // 20 samples/second
const PREDICTION_STRIDE = 10;    // Predict every 10 new frames

const MIN_HAND_FRAMES = 10;
const STABILITY_WINDOW = 5;
const REQUIRED_VOTES = 3;


// ==========================================
// 2. LANDMARK FEATURE CONVERSION
// ==========================================

function convertLandmarksToFeatures(landmarks) {

  const features = new Array(
    FEATURES_PER_FRAME
  ).fill(0);

  landmarks.slice(0, 2).forEach((hand, handIndex) => {

    if (!hand || hand.length !== 21) {
      return;
    }

    hand.forEach((point, pointIndex) => {

      const baseIndex =
        handIndex * 63 + pointIndex * 3;

      features[baseIndex] = point.x;
      features[baseIndex + 1] = point.y;
      features[baseIndex + 2] = point.z;

    });

  });

  return features;
}


// ==========================================
// 3. PREDICTION STABILIZATION
// ==========================================

function getStablePrediction(history) {

  const counts = {};

  history.forEach(sign => {

    counts[sign] = (counts[sign] || 0) + 1;

  });

  let bestSign = null;
  let bestCount = 0;

  Object.entries(counts).forEach(([sign, count]) => {

    if (count > bestCount) {

      bestSign = sign;
      bestCount = count;

    }

  });

  if (bestCount >= REQUIRED_VOTES) {
    return bestSign;
  }

  return null;
}


// ==========================================
// 4. CAMERA COMPONENT
// ==========================================

function Camera() {

  const navigate = useNavigate();

  const { language } = useLanguage();


  // ========================================
  // 5. REFERENCES
  // ========================================

  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const handLandmarkerRef = useRef(null);

  const animationFrameRef = useRef(null);

  // Rolling window containing 60 frames.
  const sequenceBufferRef = useRef([]);

  // Number of new frames since last prediction.
  const framesSincePredictionRef = useRef(0);

  // Prevent simultaneous API requests.
  const isPredictingRef = useRef(false);

  // Recent prediction history.
  const predictionHistoryRef = useRef([]);

  // Last confirmed sign.
  const lastStableSignRef = useRef('');

  // Camera session protection.
  const sessionIdRef = useRef(0);

  const lastCaptureTimeRef = useRef(0);

  const noHandFramesRef = useRef(0);

  const isMountedRef = useRef(true);


  // ========================================
  // 6. STATES
  // ========================================

  const [detectedHandsCount, setDetectedHandsCount] =
    useState(0);

  const [cameraActive, setCameraActive] =
    useState(false);

  const [cameraError, setCameraError] =
    useState('');

  const [recognizedText, setRecognizedText] =
    useState('');

  const [modelReady, setModelReady] =
    useState(false);

  const [predictionStatus, setPredictionStatus] =
    useState('Loading recognition model...');


  // ========================================
  // 7. TRANSLATIONS
  // ========================================

  const translations = {

    English: {

      back: 'Back to Home',
      badge: 'SIGN RECOGNITION STUDIO',
      title: 'Let your hands',
      titleAccent: 'do the talking.',

      description:
        'Show your hand gestures to the camera and experience a new way to communicate.',

      cameraTitle: 'Camera Workspace',

      cameraSubtitle:
        'Position your hand clearly inside the frame.',

      start: 'Start Camera',
      stop: 'Stop Camera',

      active: 'Camera is active',
      inactive: 'Camera is not active',

      detection: 'Hand Detection',

      result: 'Recognition Result',

      resultPlaceholder:
        'Your recognized sign will appear here.',

      clear: 'Clear Result',

      privacy:
        'Your camera is accessed only after you grant permission.',

      error:
        'Unable to access your camera. Please allow camera permission and try again.',

      backLogin: 'Back to Login',

      footer:
        '© 2026 SignSpeak. Bridging worlds through gestures.'

    },


    Hindi: {

      back: 'होम पर वापस जाएं',
      badge: 'साइन रिकग्निशन स्टूडियो',

      title: 'अपने हाथों से',
      titleAccent: 'बात कहें।',

      description:
        'कैमरे के सामने हाथों के संकेत दिखाएं और संवाद का नया तरीका अनुभव करें।',

      cameraTitle: 'कैमरा कार्यक्षेत्र',

      cameraSubtitle:
        'अपने हाथ को फ्रेम के अंदर स्पष्ट रूप से रखें।',

      start: 'कैमरा शुरू करें',
      stop: 'कैमरा बंद करें',

      active: 'कैमरा चालू है',
      inactive: 'कैमरा चालू नहीं है',

      detection: 'हाथ की पहचान',

      result: 'पहचान का परिणाम',

      resultPlaceholder:
        'पहचाना गया संकेत यहां दिखाई देगा।',

      clear: 'परिणाम हटाएं',

      privacy:
        'कैमरा केवल आपकी अनुमति के बाद उपयोग किया जाएगा।',

      error:
        'कैमरा उपलब्ध नहीं है। अनुमति दें और फिर प्रयास करें।',

      backLogin: 'लॉगिन पर वापस जाएं',

      footer:
        '© 2026 SignSpeak. संकेतों से दुनिया को जोड़ना।'

    },


    Bengali: {

      back: 'হোমে ফিরে যান',
      badge: 'সাইন রিকগনিশন স্টুডিও',

      title: 'আপনার হাতই',
      titleAccent: 'কথা বলুক।',

      description:
        'ক্যামেরার সামনে হাতের ইশারা দেখান এবং যোগাযোগের নতুন অভিজ্ঞতা নিন।',

      cameraTitle: 'ক্যামেরা ওয়ার্কস্পেস',

      cameraSubtitle:
        'আপনার হাতটি ফ্রেমের মধ্যে স্পষ্টভাবে রাখুন।',

      start: 'ক্যামেরা চালু করুন',
      stop: 'ক্যামেরা বন্ধ করুন',

      active: 'ক্যামেরা চালু আছে',
      inactive: 'ক্যামেরা চালু নেই',

      detection: 'হাত শনাক্তকরণ',

      result: 'শনাক্তকরণের ফলাফল',

      resultPlaceholder:
        'শনাক্ত করা ইশারা এখানে দেখা যাবে।',

      clear: 'ফলাফল মুছুন',

      privacy:
        'আপনার অনুমতি ছাড়া ক্যামেরা ব্যবহার করা হবে না।',

      error:
        'ক্যামেরা ব্যবহার করা যাচ্ছে না। অনুমতি দিয়ে আবার চেষ্টা করুন।',

      backLogin: 'লগইনে ফিরে যান',

      footer:
        '© ২০২৬ SignSpeak. ইশারায় বিশ্বকে যুক্ত করা।'

    }

  };


  const t =
    translations[language] || translations.English;


  // ========================================
  // 8. RESET RECOGNITION STATE
  // ========================================

  const resetRecognition = () => {

    sequenceBufferRef.current = [];

    framesSincePredictionRef.current = 0;

    predictionHistoryRef.current = [];

    lastStableSignRef.current = '';

    lastCaptureTimeRef.current = 0;

    noHandFramesRef.current = 0;

    isPredictingRef.current = false;

  };


  // ========================================
  // 9. INITIALIZE MEDIAPIPE
  // ========================================

  useEffect(() => {

    isMountedRef.current = true;

    let cancelled = false;

    let createdLandmarker = null;

    const initializeHandLandmarker = async () => {

      try {

        const vision =
          await FilesetResolver.forVisionTasks(
            'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.2.3/wasm'
          );


        if (cancelled) return;


        createdLandmarker =
          await HandLandmarker.createFromOptions(

            vision,

            {

              baseOptions: {

                modelAssetPath:
                  '/models/hand_landmarker.task',

                delegate: 'GPU'

              },

              runningMode: 'VIDEO',

              numHands: 2,

              minHandDetectionConfidence: 0.3,

              minHandPresenceConfidence: 0.3,

              minTrackingConfidence: 0.3

            }

          );


        if (cancelled) {

          createdLandmarker.close();

          return;

        }


        handLandmarkerRef.current =
          createdLandmarker;


        setModelReady(true);

        setPredictionStatus(
          'Recognition model ready'
        );


        console.log(
          'MediaPipe initialized successfully!'
        );

      }

      catch (error) {

        console.error(
          'MediaPipe initialization failed:',
          error
        );

        if (!cancelled) {

          setModelReady(false);

          setPredictionStatus(
            'Recognition model failed to load'
          );

        }

      }

    };


    initializeHandLandmarker();


    return () => {

      cancelled = true;

      isMountedRef.current = false;

      sessionIdRef.current++;

      if (animationFrameRef.current) {

        cancelAnimationFrame(
          animationFrameRef.current
        );

      }

      if (streamRef.current) {

        streamRef.current
          .getTracks()
          .forEach(track => track.stop());

        streamRef.current = null;

      }

      if (handLandmarkerRef.current) {

        handLandmarkerRef.current.close();

        handLandmarkerRef.current = null;

      }

    };

  }, []);


  // ========================================
  // 10. SEND SEQUENCE TO FASTAPI
  // ========================================

  const sendSequenceForPrediction = async (
    sequence,
    currentSession
  ) => {

    try {

      setPredictionStatus(
        'Analyzing sign...'
      );


      const response = await fetch(

        `${API_URL}/predict`,

        {

          method: 'POST',

          headers: {

            'Content-Type': 'application/json'

          },

          body: JSON.stringify({

            sequence

          })

        }

      );


      const data = await response.json();


      if (!response.ok) {

        throw new Error(
          data.detail || 'Prediction failed'
        );

      }


      // Ignore results from an old camera session.

      if (
        !isMountedRef.current ||
        currentSession !== sessionIdRef.current
      ) {
        return;
      }


      if (!data.success || !data.predicted_sign) {

        throw new Error(
          'Invalid prediction response'
        );

      }


      const predictedSign =
        data.predicted_sign;


      console.log(
        'Raw prediction:',
        predictedSign
      );


      // ==================================
      // STABILITY WINDOW
      // ==================================

      predictionHistoryRef.current.push(
        predictedSign
      );


      if (
        predictionHistoryRef.current.length >
        STABILITY_WINDOW
      ) {

        predictionHistoryRef.current.shift();

      }


      const stableSign =
        getStablePrediction(
          predictionHistoryRef.current
        );


      if (stableSign) {

        if (
          stableSign !== lastStableSignRef.current
        ) {

          lastStableSignRef.current = stableSign;

          setRecognizedText(stableSign);

          // SAVE RECOGNITION HISTORY

try {

  const existingHistory = JSON.parse(
    localStorage.getItem('signspeak_recognition_history') || '[]'
  );

  const newEntry = {
    id: Date.now(),
    predictedSign: stableSign,
    language: language,
    timestamp: new Date().toISOString()
  };

  existingHistory.unshift(newEntry);

  localStorage.setItem(
    'signspeak_recognition_history',
    JSON.stringify(existingHistory)
  );

  console.log('Recognition history saved:', newEntry);

} catch (error) {

  console.error('Unable to save recognition history:', error);

}

          console.log(
            'Stable recognized sign:',
            stableSign
          );

          setPredictionStatus(
            'Sign recognized successfully'
          );

        }

        else {

          setPredictionStatus(
            `Recognized: ${stableSign}`
          );

        }

      }

      else {

        setPredictionStatus(
          'Stabilizing prediction...'
        );

      }

    }

    catch (error) {

      console.error(
        'Prediction error:',
        error
      );

      if (
        isMountedRef.current &&
        currentSession === sessionIdRef.current
      ) {

        setPredictionStatus(
          'Prediction failed. Check backend.'
        );

      }

    }

    finally {

      isPredictingRef.current = false;

    }

  };


  // ========================================
  // 11. CONTINUOUS HAND DETECTION
  // ========================================

  const detectHands = () => {

    if (!isMountedRef.current) return;


    const video = videoRef.current;

    const landmarker =
      handLandmarkerRef.current;


    if (
      video &&
      landmarker &&
      video.readyState >= 2
    ) {

      try {

        const now = performance.now();


        // ==================================
        // FRAME SAMPLING
        // ==================================

        if (
          now - lastCaptureTimeRef.current >=
          FRAME_INTERVAL
        ) {

          lastCaptureTimeRef.current = now;


          const results =
            landmarker.detectForVideo(
              video,
              now
            );


          const landmarks =
            results.landmarks || [];


          const detectedCount =
            landmarks.length;


          setDetectedHandsCount(
            detectedCount
          );


          // ==================================
          // PRESERVE TRAINING FORMAT
          // ==================================

          // Always create a 126-feature frame.
          // If no hand exists, the frame is all zeros.
          // This matches the Python preprocessing.

          const frameFeatures =
            convertLandmarksToFeatures(
              landmarks
            );


          // ==================================
          // HAND DISAPPEARANCE
          // ==================================

          if (detectedCount === 0) {

            noHandFramesRef.current++;

          }

          else {

            noHandFramesRef.current = 0;

          }


          // Clear old prediction voting after
          // sustained hand absence.

          if (
            noHandFramesRef.current >= 20
          ) {

            predictionHistoryRef.current = [];

            lastStableSignRef.current = '';

            setRecognizedText('');

          }


          // ==================================
          // ROLLING 60-FRAME BUFFER
          // ==================================

          sequenceBufferRef.current.push(
            frameFeatures
          );


          if (
            sequenceBufferRef.current.length >
            SEQUENCE_LENGTH
          ) {

            sequenceBufferRef.current.shift();

          }


          framesSincePredictionRef.current++;


          // ==================================
          // CHECK WINDOW SIZE
          // ==================================

          const windowReady =
            sequenceBufferRef.current.length ===
            SEQUENCE_LENGTH;


          const predictionDue =
            framesSincePredictionRef.current >=
            PREDICTION_STRIDE;


          const handsInWindow =
            sequenceBufferRef.current.filter(

              frame => frame.some(
                value => value !== 0
              )

            ).length;


          // ==================================
          // CONTINUOUS PREDICTION
          // ==================================

          if (
            windowReady &&
            predictionDue &&
            !isPredictingRef.current
          ) {

            framesSincePredictionRef.current = 0;


            if (handsInWindow >= MIN_HAND_FRAMES) {

              const sequence =
                sequenceBufferRef.current.map(
                  frame => [...frame]
                );


              isPredictingRef.current = true;


              console.log(
                'Sending rolling window:',
                sequence.length
              );


              console.log(
                'Frames containing hands:',
                handsInWindow
              );


              sendSequenceForPrediction(

                sequence,

                sessionIdRef.current

              );

            }

            else {

              setPredictionStatus(
                'Waiting for a clear hand gesture'
              );

            }

          }


          // ==================================
          // COLLECTION STATUS
          // ==================================

          if (!windowReady) {

            setPredictionStatus(

              detectedCount > 0

                ? `Preparing recognition: ${
                    sequenceBufferRef.current.length
                  }/${SEQUENCE_LENGTH}`

                : 'Waiting for hand detection'

            );

          }

          else if (!isPredictingRef.current) {

            setPredictionStatus(
              'Continuously recognizing signs...'
            );

          }

        }

      }

      catch (error) {

        console.error(
          'Hand detection error:',
          error
        );

        setPredictionStatus(
          'Hand detection error'
        );

      }

    }


    // Keep camera loop running.

    animationFrameRef.current =
      requestAnimationFrame(detectHands);

  };


  // ========================================
  // 12. START CAMERA
  // ========================================

  const startCamera = async () => {

    setCameraError('');

    setRecognizedText('');

    resetRecognition();


    if (!navigator.mediaDevices?.getUserMedia) {

      setCameraError(t.error);

      return;

    }


    try {

      setPredictionStatus(
        'Starting camera...'
      );


      const stream =
        await navigator.mediaDevices.getUserMedia({

          video: {

            facingMode: 'user',

            width: {
              ideal: 1280
            },

            height: {
              ideal: 720
            }

          },

          audio: false

        });


      // Ignore a late camera response if
      // the component has already unmounted.

      if (!isMountedRef.current) {

        stream.getTracks().forEach(
          track => track.stop()
        );

        return;

      }


      streamRef.current = stream;


      if (videoRef.current) {

        videoRef.current.srcObject = stream;

        await videoRef.current.play();

      }


      const currentSession =
        ++sessionIdRef.current;


      setCameraActive(true);


      setPredictionStatus(

        modelReady

          ? 'Preparing continuous recognition...'

          : 'Waiting for MediaPipe model...'

      );


      if (animationFrameRef.current) {

        cancelAnimationFrame(
          animationFrameRef.current
        );

      }


      animationFrameRef.current =
        requestAnimationFrame(detectHands);


      console.log(
        'Camera started. Session:',
        currentSession
      );

    }

    catch (error) {

      console.error(
        'Camera error:',
        error
      );


      setCameraError(t.error);

      setCameraActive(false);

      setPredictionStatus(
        'Camera could not be started'
      );

    }

  };


  // ========================================
  // 13. STOP CAMERA
  // ========================================

  const stopCamera = () => {

    // Invalidate all pending responses.

    sessionIdRef.current++;


    if (animationFrameRef.current) {

      cancelAnimationFrame(
        animationFrameRef.current
      );

      animationFrameRef.current = null;

    }


    if (streamRef.current) {

      streamRef.current
        .getTracks()
        .forEach(track => track.stop());

      streamRef.current = null;

    }


    if (videoRef.current) {

      videoRef.current.srcObject = null;

    }


    resetRecognition();


    setCameraActive(false);

    setDetectedHandsCount(0);

    setRecognizedText('');

    setPredictionStatus(
      'Camera stopped'
    );

  };


  // ========================================
  // 14. CLEAR RESULT
  // ========================================

  const clearResult = () => {

    setRecognizedText('');

    predictionHistoryRef.current = [];

    lastStableSignRef.current = '';

    setPredictionStatus(
      cameraActive
        ? 'Continuously recognizing signs...'
        : 'Waiting for camera'
    );

  };


  // ========================================
  // 15. USER INTERFACE
  // ========================================

  return (

    <div className="camera-page">


      {/* NAVIGATION */}

      <nav className="camera-navbar">

        <a

          href="/"

          className="camera-brand"

          onClick={(e) => {

            e.preventDefault();

            navigate('/');

          }}

        >

          <span className="camera-brand-icon">

            <Hand size={24} />

          </span>

          <span>

            Sign

            <span className="camera-brand-highlight">
              Speak
            </span>

          </span>

        </a>


        <div className="camera-nav-actions">

          <button

            className="camera-back-button"

            onClick={() => navigate('/auth')}

          >

            <ArrowLeft size={17} />

            {t.backLogin}

          </button>


          <button

            className="camera-back-button"

            onClick={() => navigate('/')}

          >

            <ArrowLeft size={17} />

            {t.back}

          </button>

          <button
            className="camera-back-button"
            onClick={() => navigate('/dashboard')}
          >

          Go to Dashboard
          </button>

        </div>

      </nav>


      {/* MAIN CONTENT */}

      <main className="camera-main">


        {/* INTRODUCTION */}

        <section className="camera-intro">

          <div className="camera-badge">

            <Scan size={15} />

            {t.badge}

          </div>


          <h1>

            {t.title}

            <br />

            <span>
              {t.titleAccent}
            </span>

          </h1>


          <p>
            {t.description}
          </p>

        </section>


        {/* CAMERA LAYOUT */}

        <section className="camera-layout">


          {/* CAMERA WORKSPACE */}

          <div className="camera-workspace">


            <div className="workspace-heading">

              <div>

                <h2>
                  {t.cameraTitle}
                </h2>

                <p>
                  {t.cameraSubtitle}
                </p>

              </div>


              <span

                className={`camera-status ${
                  cameraActive ? 'online' : ''
                }`}

              >

                <span className="status-dot"></span>

                {cameraActive ? t.active : t.inactive}

              </span>

            </div>


            {/* VIDEO CONTAINER */}

            <div className="video-container">


              <video

                ref={videoRef}

                className={`camera-video ${
                  cameraActive ? 'visible' : ''
                }`}

                autoPlay

                muted

                playsInline

              />


              {!cameraActive && (

                <div className="camera-placeholder">

                  <div className="camera-placeholder-icon">

                    <CameraIcon size={42} />

                  </div>


                  <h3>
                    {t.inactive}
                  </h3>


                  <p>
                    {t.privacy}
                  </p>

                </div>

              )}


              <div className="camera-frame-corner top-left"></div>

              <div className="camera-frame-corner top-right"></div>

              <div className="camera-frame-corner bottom-left"></div>

              <div className="camera-frame-corner bottom-right"></div>


              {cameraActive && (

                <div className="camera-live-label">

                  <span></span>

                  LIVE

                </div>

              )}

            </div>


            {/* CAMERA ERROR */}

            {cameraError && (

              <div className="camera-error">

                <CircleAlert size={18} />

                {cameraError}

              </div>

            )}


            {/* CAMERA CONTROLS */}

            <div className="camera-controls">


              {!cameraActive ? (

                <button

                  className="camera-start-button"

                  onClick={startCamera}

                >

                  <CameraIcon size={19} />

                  {t.start}

                </button>

              ) : (

                <button

                  className="camera-stop-button"

                  onClick={stopCamera}

                >

                  <CameraOff size={19} />

                  {t.stop}

                </button>

              )}


              <button

                className="camera-clear-button"

                onClick={clearResult}

              >

                <RefreshCw size={17} />

                {t.clear}

              </button>

            </div>


          </div>


          {/* SIDE PANEL */}

          <aside className="camera-side-panel">


            {/* DETECTION CARD */}

            <div className="detection-card">

              <div className="side-card-icon">

                <Hand size={23} />

              </div>


              <h3>
                {t.detection}
              </h3>


              <div className="detection-status">

                <span className="status-dot"></span>

                {

                  detectedHandsCount === 0

                    ? 'No hands detected'

                    : `${detectedHandsCount} ${
                        detectedHandsCount === 1
                          ? 'hand'
                          : 'hands'
                      } detected`

                }

              </div>


              <p className="model-status">

                MediaPipe:

                {' '}

                {modelReady ? 'Ready' : 'Loading...'}

              </p>


            </div>


            {/* RECOGNITION CARD */}

            <div className="result-card">


              <div className="result-heading">

                <Languages size={21} />

                <h3>
                  {t.result}
                </h3>

              </div>


              <div className="result-content">

                {recognizedText || t.resultPlaceholder}

              </div>


              <p className="prediction-status">

                {predictionStatus}

              </p>


              <div className="result-language">

                {language}

              </div>


            </div>


            {/* PRIVACY CARD */}

            <div className="camera-privacy">

              <ShieldCheck size={20} />

              <p>
                {t.privacy}
              </p>

            </div>


          </aside>


        </section>


      </main>


      {/* FOOTER */}

      <footer className="camera-footer">

        {t.footer}

      </footer>


    </div>

  );

}


export default Camera;