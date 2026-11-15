import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from './LanguageContext.jsx';
import {
  Hand,
  ArrowLeft,
  ArrowRight,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  ShieldCheck
} from 'lucide-react';
import './Auth.css';

const API_URL = 'http://127.0.0.1:8000';

function Auth() {
  const navigate = useNavigate();
  const { authContent: t } = useLanguage();

  const [mode, setMode] = useState('login');
  const [userType, setUserType] = useState('Major');
  const [showPassword, setShowPassword] = useState(false);
  const [notice, setNotice] = useState('');
  const [noticeType, setNoticeType] = useState('success');
  const [loading, setLoading] = useState(false);
  const [generatedId, setGeneratedId] = useState('');

  const [formData, setFormData] = useState({
    fullName: '',
    guardianName: '',
    email: '',
    signSpeakId: '',
    password: '',
    confirmPassword: ''
  });

  const updateField = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));

    setNotice('');
  };

  const changeMode = (newMode) => {
    setMode(newMode);
    setNotice('');
    setGeneratedId('');
    setShowPassword(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setNotice('');
    setGeneratedId('');

    if (mode === 'signup') {
      if (userType === 'Minor' && !formData.guardianName.trim()) {
        setNoticeType('error');
        setNotice(t.errorGuardian);
        return;
      }

      if (formData.password.length < 8) {
        setNoticeType('error');
        setNotice(t.errorPassword);
        return;
      }

      if (formData.password !== formData.confirmPassword) {
        setNoticeType('error');
        setNotice(t.errorConfirm);
        return;
      }
    }

    setLoading(true);

    try {
      const endpoint =
        mode === 'signup' ? '/signup' : '/login';

      const payload =
        mode === 'signup'
          ? {
              fullName: formData.fullName.trim(),
              accountType: userType,
              guardianName: formData.guardianName.trim(),
              email: formData.email.trim(),
              password: formData.password
            }
          : {
              email: formData.email.trim(),
              signSpeakId: formData.signSpeakId.trim(),
              password: formData.password
            };

      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          typeof data.detail === 'string'
            ? data.detail
            : 'Something went wrong. Please try again.'
        );
      }

      if (mode === 'signup') {
        setNoticeType('success');
        setNotice(data.message || 'Account created successfully.');
        setGeneratedId(data.signSpeakId);

        setFormData((prev) => ({
          ...prev,
          signSpeakId: data.signSpeakId
        }));
      } else {
        setNoticeType('success');
        setNotice('Login successful! Welcome to SignSpeak.');

        // Store basic user details for the current session.
        sessionStorage.setItem(
          'signSpeakUser',
          JSON.stringify({
            signSpeakId: data.signSpeakId,
            fullName: data.fullName,
            email: data.email,
            accountType: data.accountType
          })
        );

        setTimeout(() => {
          navigate('/camera');
        }, 700);
      }
    } catch (error) {
      setNoticeType('error');
      setNotice(
        error.message === 'Failed to fetch'
          ? 'Cannot connect to the SignSpeak server. Please make sure the backend is running.'
          : error.message
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">

      <nav className="auth-navbar">
        <a
          className="auth-brand"
          href="/"
          onClick={(e) => {
            e.preventDefault();
            navigate('/');
          }}
        >
          <div className="auth-brand-icon">
            <Hand size={25} />
          </div>

          <span>
            Sign<span>Speak</span>
          </span>
        </a>

        <button
          className="back-home"
          onClick={() => navigate('/')}
        >
          <ArrowLeft size={17} />
          {t.backHome}
        </button>
      </nav>

      <main className="auth-container">

        <div className="auth-intro">
          <div className="auth-badge">
            <ShieldCheck size={15} />
            {t.secureAccess}
          </div>

          <h1>
            {t.heroTitle1}
            <br />
            {t.heroTitle2}
            <br />
            <span>{t.heroTitle3}</span>
          </h1>

          <p>{t.heroDescription}</p>

          <div className="auth-trust">
            <ShieldCheck size={19} />
            {t.trust}
          </div>
        </div>

        <div className="auth-card">

          <div className="auth-tabs">
            <button
              type="button"
              className={mode === 'login' ? 'active' : ''}
              onClick={() => changeMode('login')}
            >
              {t.login}
            </button>

            <button
              type="button"
              className={mode === 'signup' ? 'active' : ''}
              onClick={() => changeMode('signup')}
            >
              {t.signup}
            </button>
          </div>

          <div className="auth-heading">
            <h2>
              {mode === 'login'
                ? t.welcomeBack
                : t.createAccount}
            </h2>

            <p>
              {mode === 'login'
                ? t.loginDescription
                : t.signupDescription}
            </p>
          </div>

          <form onSubmit={handleSubmit}>

            {mode === 'signup' && (
              <>
                <label htmlFor="fullName">
                  {t.fullName}
                </label>

                <div className="auth-input">
                  <User size={18} />

                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    placeholder={t.fullNamePlaceholder}
                    value={formData.fullName}
                    onChange={updateField}
                    required
                  />
                </div>

                <label>{t.accountType}</label>

                <div className="auth-role">
                  <button
                    type="button"
                    className={userType === 'Minor' ? 'selected' : ''}
                    onClick={() => {
                      setUserType('Minor');
                      setNotice('');
                    }}
                  >
                    {t.minor}
                  </button>

                  <button
                    type="button"
                    className={userType === 'Major' ? 'selected' : ''}
                    onClick={() => {
                      setUserType('Major');
                      setNotice('');
                    }}
                  >
                    {t.major}
                  </button>
                </div>

                {userType === 'Minor' && (
                  <>
                    <label htmlFor="guardianName">
                      {t.guardianName}
                    </label>

                    <div className="auth-input">
                      <User size={18} />

                      <input
                        id="guardianName"
                        name="guardianName"
                        type="text"
                        placeholder={t.guardianPlaceholder}
                        value={formData.guardianName}
                        onChange={updateField}
                        required
                      />
                    </div>
                  </>
                )}
              </>
            )}

            <label htmlFor="email">
              {t.email}
            </label>

            <div className="auth-input">
              <Mail size={18} />

              <input
                id="email"
                name="email"
                type="email"
                placeholder={t.emailPlaceholder}
                value={formData.email}
                onChange={updateField}
                autoComplete="email"
                required
              />
            </div>

            {mode === 'login' && (
              <>
                <label htmlFor="signSpeakId">
                  {t.uniqueId}
                </label>

                <div className="auth-input">
                  <Lock size={18} />

                  <input
                    id="signSpeakId"
                    name="signSpeakId"
                    type="text"
                    placeholder={t.idPlaceholder}
                    value={formData.signSpeakId}
                    onChange={updateField}
                    autoComplete="off"
                    required
                  />
                </div>
              </>
            )}

            <label htmlFor="password">
              {mode === 'signup'
                ? t.createPassword
                : 'Password'}
            </label>

            <div className="auth-input">
              <Lock size={18} />

              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder={t.passwordPlaceholder}
                value={formData.password}
                onChange={updateField}
                autoComplete={
                  mode === 'signup'
                    ? 'new-password'
                    : 'current-password'
                }
                minLength={8}
                required
              />

              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={t.togglePassword}
              >
                {showPassword
                  ? <EyeOff size={18} />
                  : <Eye size={18} />}
              </button>
            </div>

            {mode === 'signup' && (
              <>
                <label htmlFor="confirmPassword">
                  {t.confirmPassword}
                </label>

                <div className="auth-input">
                  <Lock size={18} />

                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    placeholder={t.confirmPlaceholder}
                    value={formData.confirmPassword}
                    onChange={updateField}
                    autoComplete="new-password"
                    required
                  />
                </div>

                <p className="auth-small-note">
                  {t.idNote}
                </p>
              </>
            )}

            {notice && (
              <div
                className="auth-notice"
                role="status"
                aria-live="polite"
                data-type={noticeType}
              >
                {notice}
              </div>
            )}

            {generatedId && (
              <div className="auth-notice" data-type="success">
                <strong>Your SignSpeak ID:</strong>
                <br />
                {generatedId}
                <br />
                <small>
                  Save this ID. You will need it to log in.
                </small>
              </div>
            )}

            <button
              className="auth-submit"
              type="submit"
              disabled={loading}
            >
              {loading
                ? 'Please wait...'
                : mode === 'login'
                  ? t.loginButton
                  : t.signupButton}

              {!loading && <ArrowRight size={18} />}
            </button>

          </form>

          <div className="auth-switch">
            {mode === 'login'
              ? t.noAccount
              : t.haveAccount}

            <button
              type="button"
              onClick={() => {
                changeMode(mode === 'login' ? 'signup' : 'login');
              }}
            >
              {mode === 'login' ? t.signup : t.login}
            </button>
          </div>

          <div className="auth-security">
            <ShieldCheck size={16} />
            {t.security}
          </div>

        </div>
      </main>

      <footer className="auth-footer">
        {t.footer}
      </footer>

    </div>
  );
}

export default Auth;