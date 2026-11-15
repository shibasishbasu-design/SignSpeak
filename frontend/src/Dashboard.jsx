import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from './LanguageContext.jsx';
import {
  Hand,
  LayoutDashboard,
  History,
  Camera,
  Trash2,
  ArrowLeft,
  Languages,
  Clock,
  Activity
} from 'lucide-react';

import './Dashboard.css';

const STORAGE_KEY = 'signspeak_recognition_history';

function Dashboard() {
  const navigate = useNavigate();
  const { language } = useLanguage();

  const [history, setHistory] = useState([]);

  const translations = {
    English: {
      title: 'Your Dashboard',
      subtitle: 'Your SignSpeak activity at a glance.',
      total: 'Total predictions',
      languages: 'Languages used',
      latest: 'Latest activity',
      history: 'Recognition History',
      empty: 'No recognition history yet.',
      emptySub: 'Start your camera and demonstrate a sign.',
      camera: 'Open Camera',
      clear: 'Clear History',
      back: 'Back',
      sign: 'Predicted Sign',
      language: 'Language',
      date: 'Date and time',
      confirmation: 'Clear all recognition history?',
      footer: 'SignSpeak — Bridging worlds through gestures.'
    },
    Hindi: {
      title: 'आपका डैशबोर्ड',
      subtitle: 'आपकी SignSpeak गतिविधियों का विवरण।',
      total: 'कुल अनुमान',
      languages: 'उपयोग की गई भाषाएं',
      latest: 'नवीनतम गतिविधि',
      history: 'पहचान का इतिहास',
      empty: 'अभी कोई इतिहास नहीं है।',
      emptySub: 'कैमरा शुरू करें और संकेत दिखाएं।',
      camera: 'कैमरा खोलें',
      clear: 'इतिहास हटाएं',
      back: 'वापस',
      sign: 'अनुमानित संकेत',
      language: 'भाषा',
      date: 'दिनांक और समय',
      confirmation: 'क्या आप पूरा इतिहास हटाना चाहते हैं?',
      footer: 'SignSpeak — संकेतों से दुनिया को जोड़ना।'
    },
    Bengali: {
      title: 'আপনার ড্যাশবোর্ড',
      subtitle: 'আপনার SignSpeak কার্যকলাপের বিবরণ।',
      total: 'মোট পূর্বাভাস',
      languages: 'ব্যবহৃত ভাষা',
      latest: 'সর্বশেষ কার্যকলাপ',
      history: 'শনাক্তকরণের ইতিহাস',
      empty: 'এখনও কোনো ইতিহাস নেই।',
      emptySub: 'ক্যামেরা চালু করে একটি ইশারা দেখান।',
      camera: 'ক্যামেরা খুলুন',
      clear: 'ইতিহাস মুছুন',
      back: 'ফিরে যান',
      sign: 'পূর্বাভাস করা ইশারা',
      language: 'ভাষা',
      date: 'তারিখ ও সময়',
      confirmation: 'আপনি কি সম্পূর্ণ ইতিহাস মুছে ফেলতে চান?',
      footer: 'SignSpeak — ইশারায় বিশ্বকে যুক্ত করা।'
    }
  };

  const t = translations[language] || translations.English;

  useEffect(() => {
    try {
      const saved = JSON.parse(
        localStorage.getItem(STORAGE_KEY) || '[]'
      );

      setHistory(Array.isArray(saved) ? saved : []);
    } catch (error) {
      console.error('Could not load history:', error);
      setHistory([]);
    }
  }, []);

  const clearHistory = () => {
    if (!window.confirm(t.confirmation)) return;

    localStorage.removeItem(STORAGE_KEY);
    setHistory([]);
  };

  const uniqueLanguages = new Set(
    history.map(item => item.language).filter(Boolean)
  ).size;

  const latestActivity = history.length
    ? new Date(history[0].timestamp).toLocaleString()
    : '—';

  return (
    <div className="dashboard-page">

      <nav className="dashboard-navbar">
        <div className="dashboard-brand">
          <span className="dashboard-brand-icon">
            <Hand size={23} />
          </span>
          <span>
            Sign<span className="dashboard-brand-highlight">Speak</span>
          </span>
        </div>

        <div className="dashboard-nav-actions">
          <button
            className="dashboard-nav-button"
            onClick={() => navigate('/camera')}
          >
            <Camera size={17} />
            {t.camera}
          </button>

          <button
            className="dashboard-nav-button"
            onClick={() => navigate('/')}
          >
            <ArrowLeft size={17} />
            {t.back}
          </button>
        </div>
      </nav>

      <main className="dashboard-main">

        <section className="dashboard-heading">
          <div className="dashboard-heading-icon">
            <LayoutDashboard size={22} />
          </div>

          <h1>{t.title}</h1>
          <p>{t.subtitle}</p>
        </section>

        <section className="dashboard-stats">

          <div className="dashboard-stat-card">
            <div className="dashboard-stat-icon">
              <Activity size={22} />
            </div>
            <p>{t.total}</p>
            <h2>{history.length}</h2>
          </div>

          <div className="dashboard-stat-card">
            <div className="dashboard-stat-icon">
              <Languages size={22} />
            </div>
            <p>{t.languages}</p>
            <h2>{uniqueLanguages}</h2>
          </div>

          <div className="dashboard-stat-card">
            <div className="dashboard-stat-icon">
              <Clock size={22} />
            </div>
            <p>{t.latest}</p>
            <h3>{latestActivity}</h3>
          </div>

        </section>

        <section className="dashboard-history">

          <div className="dashboard-history-heading">
            <div>
              <History size={22} />
              <h2>{t.history}</h2>
            </div>

            {history.length > 0 && (
              <button
                className="dashboard-clear-button"
                onClick={clearHistory}
              >
                <Trash2 size={16} />
                {t.clear}
              </button>
            )}
          </div>

          {history.length === 0 ? (

            <div className="dashboard-empty">
              <div className="dashboard-empty-icon">
                <Hand size={38} />
              </div>
              <h3>{t.empty}</h3>
              <p>{t.emptySub}</p>

              <button
                className="dashboard-camera-button"
                onClick={() => navigate('/camera')}
              >
                <Camera size={18} />
                {t.camera}
              </button>
            </div>

          ) : (

            <div className="dashboard-history-list">

              {history.map((item, index) => (

                <div
                  className="dashboard-history-item"
                  key={item.id || index}
                >

                  <div className="history-item-icon">
                    <Hand size={21} />
                  </div>

                  <div className="history-item-details">
                    <h3>{item.predictedSign}</h3>
                    <p>
                      {t.language}: {item.language || 'English'}
                    </p>
                    <span>
                      {t.date}: {
                        new Date(item.timestamp).toLocaleString()
                      }
                    </span>
                  </div>

                  <span className="history-item-number">
                    #{history.length - index}
                  </span>

                </div>

              ))}

            </div>

          )}

        </section>

      </main>

      <footer className="dashboard-footer">
        {t.footer}
      </footer>

    </div>
  );
}

export default Dashboard;