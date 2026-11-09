import { useState } from 'react';
import { motion } from 'framer-motion';
import {
Hand,
Globe,
ArrowRight,
Camera,
MessageCircle,
ShieldCheck,
Accessibility,
Sparkles
} from 'lucide-react';
import './App.css';

function App() {
const [language, setLanguage] = useState('English');
const [started, setStarted] = useState(false);

const translations = {
English: {
navAbout: 'About Us',
navStart: 'Get Started',
heading: 'Every gesture tells a story.',
description: 'Breaking communication barriers through intelligent sign language recognition. Speak with your hands. Connect with the world.',
button: 'Get Started',
explore: 'Explore SignSpeak',
badge: 'AI-powered sign language communication',
trust: 'Accessible. Inclusive. Intelligent.',
system: 'AI RECOGNITION SYSTEM',
ready: 'READY',
recognition: 'SIGN RECOGNITION',
recognized: 'RECOGNIZED MESSAGE',
message: 'Hello, World!',
systemReady: 'System ready',
detection: 'Real-time detection',
communication: 'Communication for all',
offerLabel: 'WHAT WE OFFER',
offerTitle: 'Communication without boundaries.',
offerDescription: 'Technology that brings people closer, one gesture at a time.',
features: [
{
title: 'Real-time Recognition',
description: 'Recognize hand gestures using your device camera.'
},
{
title: 'Gesture to Text',
description: 'Convert recognized signs into understandable text.'
},
{
title: 'Multilingual Support',
description: 'Experience communication in multiple languages.'
}
],
welcome: 'Welcome to SignSpeak!',
welcomeDescription: 'Your journey towards barrier-free communication starts here. Account registration and camera setup will be available in the next development stage.',
continue: 'Continue Exploring',
footer: 'Bridging worlds through gestures. © 2026 SignSpeak.'
},

Hindi: {
  navAbout: 'हमारे बारे में',
  navStart: 'शुरू करें',
  heading: 'हर इशारा एक कहानी कहता है।',
  description: 'स्मार्ट सांकेतिक भाषा पहचान तकनीक के माध्यम से संचार की बाधाओं को दूर करें। अपने हाथों से बोलें और दुनिया से जुड़ें।',
  button: 'शुरू करें',
  explore: 'SignSpeak के बारे में जानें',
  badge: 'AI आधारित सांकेतिक भाषा संचार',
  trust: 'सुलभ। समावेशी। बुद्धिमान।',
  system: 'AI पहचान प्रणाली',
  ready: 'तैयार',
  recognition: 'संकेत पहचान',
  recognized: 'पहचाना गया संदेश',
  message: 'नमस्ते, दुनिया!',
  systemReady: 'सिस्टम तैयार है',
  detection: 'रीयल-टाइम पहचान',
  communication: 'सभी के लिए संचार',
  offerLabel: 'हमारी सेवाएँ',
  offerTitle: 'बिना किसी सीमा के संवाद।',
  offerDescription: 'ऐसी तकनीक जो हर इशारे के साथ लोगों को करीब लाती है।',
  features: [
    {
      title: 'रीयल-टाइम पहचान',
      description: 'अपने डिवाइस के कैमरे से हाथों के इशारों को पहचानें।'
    },
    {
      title: 'इशारों से टेक्स्ट',
      description: 'पहचाने गए संकेतों को समझने योग्य टेक्स्ट में बदलें।'
    },
    {
      title: 'बहुभाषी सहायता',
      description: 'कई भाषाओं में संवाद का अनुभव करें।'
    }
  ],
  welcome: 'SignSpeak में आपका स्वागत है!',
  welcomeDescription: 'बाधा-मुक्त संचार की आपकी यात्रा यहाँ से शुरू होती है। अकाउंट रजिस्ट्रेशन और कैमरा सेटअप अगले विकास चरण में उपलब्ध होंगे।',
  continue: 'आगे बढ़ें',
  footer: 'इशारों के माध्यम से दुनिया को जोड़ते हुए। © 2026 SignSpeak.'
},

Bengali: {
  navAbout: 'আমাদের সম্পর্কে',
  navStart: 'শুরু করুন',
  heading: 'প্রতিটি ইশারা একটি গল্প বলে।',
  description: 'স্মার্ট সাইন ল্যাঙ্গুয়েজ শনাক্তকরণ প্রযুক্তির মাধ্যমে যোগাযোগের বাধা দূর করুন। হাতের ইশারায় কথা বলুন এবং বিশ্বের সঙ্গে যুক্ত হন।',
  button: 'শুরু করুন',
  explore: 'SignSpeak সম্পর্কে জানুন',
  badge: 'AI চালিত সাংকেতিক ভাষা যোগাযোগ',
  trust: 'সহজলভ্য। অন্তর্ভুক্তিমূলক। বুদ্ধিদীপ্ত।',
  system: 'AI শনাক্তকরণ ব্যবস্থা',
  ready: 'প্রস্তুত',
  recognition: 'ইশারা শনাক্তকরণ',
  recognized: 'শনাক্ত করা বার্তা',
  message: 'হ্যালো, বিশ্ব!',
  systemReady: 'সিস্টেম প্রস্তুত',
  detection: 'রিয়েল-টাইম শনাক্তকরণ',
  communication: 'সবার জন্য যোগাযোগ',
  offerLabel: 'আমাদের পরিষেবা',
  offerTitle: 'যোগাযোগের কোনো সীমানা নেই।',
  offerDescription: 'এমন প্রযুক্তি যা প্রতিটি ইশারার মাধ্যমে মানুষকে আরও কাছে আনে।',
  features: [
    {
      title: 'রিয়েল-টাইম শনাক্তকরণ',
      description: 'আপনার ডিভাইসের ক্যামেরা ব্যবহার করে হাতের ইশারা শনাক্ত করুন।'
    },
    {
      title: 'ইশারা থেকে টেক্সট',
      description: 'শনাক্ত করা ইশারাগুলিকে সহজবোধ্য লেখায় রূপান্তর করুন।'
    },
    {
      title: 'বহুভাষিক সহায়তা',
      description: 'একাধিক ভাষায় যোগাযোগের অভিজ্ঞতা উপভোগ করুন।'
    }
  ],
  welcome: 'SignSpeak-এ আপনাকে স্বাগতম!',
  welcomeDescription: 'বাধাহীন যোগাযোগের পথে আপনার যাত্রা এখান থেকেই শুরু। অ্যাকাউন্ট নিবন্ধন এবং ক্যামেরা সেটআপ পরবর্তী উন্নয়ন পর্যায়ে উপলব্ধ হবে।',
  continue: 'আরও দেখুন',
  footer: 'ইশারার মাধ্যমে বিশ্বকে সংযুক্ত করছি। © 2026 SignSpeak.'
}

};

const content = translations[language];

return (
<div className="app">

  <nav className="navbar">
    <a className="brand" href="#home">
      <div className="brand-icon">
        <Hand size={25} />
      </div>
      <span>Sign<span className="brand-highlight">Speak</span></span>
    </a>

    <div className="nav-right">
      <div className="language-select">
        <Globe size={17} />
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
        >
          <option value="English">English</option>
          <option value="Hindi">हिन्दी</option>
          <option value="Bengali">বাংলা</option>
        </select>
      </div>

      <a href="#about" className="nav-link">{content.navAbout}</a>

      <button
        className="nav-button"
        onClick={() => setStarted(true)}
      >
        {content.navStart} <ArrowRight size={16} />
      </button>
    </div>
  </nav>

  <main id="home">

    <section className="hero">

      <motion.div
        className="hero-content"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <div className="eyebrow">
          <Sparkles size={15} />
          {content.badge}
        </div>

        <h1>{content.heading}</h1>

        <p className="hero-description">
          {content.description}
        </p>

        <div className="hero-actions">
          <button
            className="primary-button"
            onClick={() => setStarted(true)}
          >
            {content.button}
            <ArrowRight size={19} />
          </button>

          <a href="#about" className="secondary-button">
            {content.explore}
          </a>
        </div>

        <div className="trust-note">
          <ShieldCheck size={18} />
          <span>{content.trust}</span>
        </div>
      </motion.div>

      <motion.div
        className="hero-visual"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1 }}
      >
        <div className="visual-glow"></div>

        <div className="visual-card">
          <div className="visual-top">
            <span className="live-dot"></span>
            {content.system}
            <span className="visual-status">{content.ready}</span>
          </div>

          <div className="hand-display">
            <div className="hand-circle">
              <Hand size={115} strokeWidth={1.3} />
            </div>
            <span className="gesture-label">{content.recognition}</span>
          </div>

          <div className="recognition-result">
            <div>
              <span className="result-label">{content.recognized}</span>
              <h3>{content.message}</h3>
            </div>
            <div className="result-icon">
              <MessageCircle size={23} />
            </div>
          </div>

          <div className="visual-footer">
            <span><span className="live-dot"></span> {content.systemReady}</span>
            <span>SignSpeak AI</span>
          </div>
        </div>

        <div className="floating-tag tag-one">
          <Camera size={17} />
          {content.detection}
        </div>

        <div className="floating-tag tag-two">
          <Accessibility size={18} />
          {content.communication}
        </div>
      </motion.div>

    </section>

    <section className="features" id="about">
      <div className="section-heading">
        <span>{content.offerLabel}</span>
        <h2>{content.offerTitle}</h2>
        <p>{content.offerDescription}</p>
      </div>

      <div className="feature-grid">
        {content.features.map((feature, index) => {
          const FeatureIcon = [Camera, MessageCircle, Globe][index];

          return (
            <div className="feature-card" key={feature.title}>
              <FeatureIcon size={27} />
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </div>
          );
        })}
      </div>
    </section>

    {started && (
      <div className="modal-overlay">
        <div className="welcome-modal">
          <button
            className="modal-close"
            onClick={() => setStarted(false)}
          >
            ×
          </button>

          <div className="modal-icon">
            <Hand size={35} />
          </div>

          <h2>{content.welcome}</h2>

          <p>{content.welcomeDescription}</p>

          <button
            className="primary-button"
            onClick={() => setStarted(false)}
          >
            {content.continue} <ArrowRight size={18} />
          </button>
        </div>
      </div>
    )}

  </main>

  <footer>
    <a className="brand footer-brand" href="#home">
      <Hand size={21} />
      SignSpeak
    </a>
    <p>{content.footer}</p>
  </footer>

</div>

);
}

export default App;