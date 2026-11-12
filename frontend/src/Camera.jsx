import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from './LanguageContext.jsx';
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
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

function Camera() {
  const navigate = useNavigate();
  const { language } = useLanguage();

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const handLandmarkerRef = useRef(null);
  const animationFrameRef = useRef(null);

  const [handDetected, setHandDetected] = useState(false);
  const [gestureResult, setGestureResult] = useState("");

  const [detectedHandsCount, setDetectedHandsCount] = useState(0); 

  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [recognizedText, setRecognizedText] = useState('');

  const translations = {
    English: {
      back: 'Back to Home',
      badge: 'SIGN RECOGNITION STUDIO',
      title: 'Let your hands',
      titleAccent: 'do the talking.',
      description: 'Show your hand gestures to the camera and experience a new way to communicate.',
      cameraTitle: 'Camera Workspace',
      cameraSubtitle: 'Position your hand clearly inside the frame.',
      start: 'Start Camera',
      stop: 'Stop Camera',
      active: 'Camera is active',
      inactive: 'Camera is not active',
      waiting: 'Waiting for hand detection',
      detection: 'Hand Detection',
      detectionText: 'MediaPipe integration will be added in the next development stage.',
      result: 'Recognition Result',
      resultPlaceholder: 'Your recognized sign will appear here.',
      clear: 'Clear Result',
      privacy: 'Your camera is accessed only after you grant permission.',
      error: 'Unable to access your camera. Please allow camera permission and try again.',
      noCamera: 'No camera stream is available.',
      backLogin: 'Back to Login',
      footer: '© 2026 SignSpeak. Bridging worlds through gestures.'
    },
    Hindi: {
      back: 'होम पर वापस जाएं',
      badge: 'साइन रिकग्निशन स्टूडियो',
      title: 'अपने हाथों से',
      titleAccent: 'बात कहें।',
      description: 'कैमरे के सामने हाथों के संकेत दिखाएं और संवाद का नया तरीका अनुभव करें।',
      cameraTitle: 'कैमरा कार्यक्षेत्र',
      cameraSubtitle: 'अपने हाथ को फ्रेम के अंदर स्पष्ट रूप से रखें।',
      start: 'कैमरा शुरू करें',
      stop: 'कैमरा बंद करें',
      active: 'कैमरा चालू है',
      inactive: 'कैमरा चालू नहीं है',
      waiting: 'हाथ की पहचान की प्रतीक्षा है',
      detection: 'हाथ की पहचान',
      detectionText: 'MediaPipe का एकीकरण अगले विकास चरण में जोड़ा जाएगा।',
      result: 'पहचान का परिणाम',
      resultPlaceholder: 'पहचाना गया संकेत यहां दिखाई देगा।',
      clear: 'परिणाम हटाएं',
      privacy: 'कैमरा केवल आपकी अनुमति के बाद उपयोग किया जाएगा।',
      error: 'कैमरा उपलब्ध नहीं है। अनुमति दें और फिर प्रयास करें।',
      noCamera: 'कैमरा स्ट्रीम उपलब्ध नहीं है।',
      backLogin: 'लॉगिन पर वापस जाएं',
      footer: '© 2026 SignSpeak. संकेतों से दुनिया को जोड़ना।'
    },
    Bengali: {
      back: 'হোমে ফিরে যান',
      badge: 'সাইন রিকগনিশন স্টুডিও',
      title: 'আপনার হাতই',
      titleAccent: 'কথা বলুক।',
      description: 'ক্যামেরার সামনে হাতের ইশারা দেখান এবং যোগাযোগের নতুন অভিজ্ঞতা নিন।',
      cameraTitle: 'ক্যামেরা ওয়ার্কস্পেস',
      cameraSubtitle: 'আপনার হাতটি ফ্রেমের মধ্যে স্পষ্টভাবে রাখুন।',
      start: 'ক্যামেরা চালু করুন',
      stop: 'ক্যামেরা বন্ধ করুন',
      active: 'ক্যামেরা চালু আছে',
      inactive: 'ক্যামেরা চালু নেই',
      waiting: 'হাত শনাক্ত করার অপেক্ষায়',
      detection: 'হাত শনাক্তকরণ',
      detectionText: 'MediaPipe পরবর্তী উন্নয়ন পর্যায়ে যুক্ত করা হবে।',
      result: 'শনাক্তকরণের ফলাফল',
      resultPlaceholder: 'শনাক্ত করা ইশারা এখানে দেখা যাবে।',
      clear: 'ফলাফল মুছুন',
      privacy: 'আপনার অনুমতি ছাড়া ক্যামেরা ব্যবহার করা হবে না।',
      error: 'ক্যামেরা ব্যবহার করা যাচ্ছে না। অনুমতি দিয়ে আবার চেষ্টা করুন।',
      noCamera: 'ক্যামেরা স্ট্রিম উপলব্ধ নেই।',
      backLogin: 'লগইনে ফিরে যান',
      footer: '© ২০২৬ SignSpeak. ইশারায় বিশ্বকে যুক্ত করা।'
    }
  };

useEffect(() => {
  const initializeHandLandmarker = async () => {
    try {
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.2.3/wasm'
      );

      const handLandmarker = await HandLandmarker.createFromOptions(
        vision,
        {
          baseOptions: {
            modelAssetPath: '/models/hand_landmarker.task',
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numHands: 2,
          minHandDetectionConfidence: 0.3,
          minHandPresenceConfidence: 0.3,
          minTrackingConfidence: 0.3,

        }
      );

      handLandmarkerRef.current = handLandmarker;
      console.log('Hand Landmarker initialized successfully!');
    } catch (error) {
      console.error('Hand Landmarker initialization failed:', error);
    }
  };

  initializeHandLandmarker();

  return () => {
    handLandmarkerRef.current?.close();
    handLandmarkerRef.current = null;
  };
}, []);

  const t = translations[language] || translations.English;

  const startCamera = async () => {
    setCameraError('');

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError(t.error);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setCameraActive(true);
      requestAnimationFrame(detectHands);
    } catch (error) {
      console.error('Camera error:', error);
      setCameraError(t.error);
      setCameraActive(false);
    }
  };

  const detectHands = () => {
  const video = videoRef.current;
  const handLandmarker = handLandmarkerRef.current;

  if (!video || !handLandmarker || video.readyState < 2) {
    return;
  }

  const results = handLandmarker.detectForVideo(
    video,
    performance.now()
  );

  if (results.landmarks && results.landmarks.length > 0) {
    const detectedCount = results.landmarks.length;
    setDetectedHandsCount(detectedCount);

    setHandDetected(true);
    setGestureResult('${detectedCount} hand(s) detected');

    console.log('Number of Detected hands:', detectedCount);
    console.log('Hand landmarks:', results.landmarks);
    console.log('Handedness', results.handedness);
  } else {
    setHandDetected(false);
    setGestureResult('');
    setDetectedHandsCount(0);
  }

  animationFrameRef.current = requestAnimationFrame(detectHands);
};

  const stopCamera = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }  
          if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setCameraActive(false);
    setHandDetected(false);
    setGestureResult('');
  };

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const clearResult = () => {
    setRecognizedText('');
  };

  return (
    <div className="camera-page">

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
          <span>Sign<span className="camera-brand-highlight">Speak</span></span>
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
</div>
      </nav>

      <main className="camera-main">

        <section className="camera-intro">
          <div className="camera-badge">
            <Scan size={15} />
            {t.badge}
          </div>

          <h1>
            {t.title}
            <br />
            <span>{t.titleAccent}</span>
          </h1>

          <p>{t.description}</p>
        </section>

        <section className="camera-layout">

          <div className="camera-workspace">

            <div className="workspace-heading">
              <div>
                <h2>{t.cameraTitle}</h2>
                <p>{t.cameraSubtitle}</p>
              </div>

              <span className={`camera-status ${cameraActive ? 'online' : ''}`}>
                <span className="status-dot"></span>
                {cameraActive ? t.active : t.inactive}
              </span>
            </div>

            <div className="video-container">

              <video
                ref={videoRef}
                className={`camera-video ${cameraActive ? 'visible' : ''}`}
                autoPlay
                muted
                playsInline
              />

              {!cameraActive && (
                <div className="camera-placeholder">
                  <div className="camera-placeholder-icon">
                    <CameraIcon size={42} />
                  </div>
                  <h3>{t.inactive}</h3>
                  <p>{t.privacy}</p>
                </div>
              )}

              <div className="camera-frame-corner top-left"></div>
              <div className="camera-frame-corner top-right"></div>
              <div className="camera-frame-corner bottom-left"></div>
              <div className="camera-frame-corner bottom-right"></div>

              {cameraActive && (
                <div className="camera-live-label">
                  <span></span> LIVE
                </div>
              )}

            </div>

            {cameraError && (
              <div className="camera-error">
                <CircleAlert size={18} />
                {cameraError}
              </div>
            )}

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

          <aside className="camera-side-panel">

            <div className="detection-card">
              <div className="side-card-icon">
                <Hand size={23} />
              </div>

              <h3>{t.detection}</h3>

              <div className="detection-status">
                <span className="status-dot"></span>
                {
                  detectedHandsCount === 0 ? 'No hands detected'
                   : `${detectedHandsCount} ${detectedHandsCount === 1 ? 'hand' : 'hands'} detected`}
              </div>

          
            </div>

            <div className="result-card">
              <div className="result-heading">
                <Languages size={21} />
                <h3>{t.result}</h3>
              </div>

              <div className="result-content">
                {recognizedText || t.resultPlaceholder}
              </div>

              <div className="result-language">
                {language}
              </div>
            </div>

            <div className="camera-privacy">
              <ShieldCheck size={20} />
              <p>{t.privacy}</p>
            </div>

          </aside>

        </section>

      </main>

      <footer className="camera-footer">
        {t.footer}
      </footer>

    </div>
  );
}

export default Camera;