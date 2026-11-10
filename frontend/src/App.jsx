import { useLanguage } from './LanguageContext.jsx';
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
const { language, setLanguage, content } = useLanguage();

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
        onClick={() => navigate('/auth')}
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
            onClick={() => navigate('/auth')}
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