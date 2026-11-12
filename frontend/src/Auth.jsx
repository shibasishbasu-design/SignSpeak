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

function Auth() {
  const navigate = useNavigate();
  const { authContent: t } = useLanguage();

  const [mode, setMode] = useState('login');
  const [userType, setUserType] = useState('Major');
  const [showPassword, setShowPassword] = useState(false);
  const [notice, setNotice] = useState('');
  const [noticeType, setNoticeType] = useState('success');

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
    setShowPassword(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setNotice('');

   if (mode === 'login') {
  if (!formData.email.trim() || !formData.signSpeakId.trim()) {
    setNoticeType('error');
    setNotice(t.errorLogin);
    return;
  }

  navigate('/camera');
  return;
}

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

    setNoticeType('success');
    setNotice(t.signupSuccess);
  };

  return (
    <div className="auth-page">

      {/* Navigation */}

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

      {/* Main Authentication Section */}

      <main className="auth-container">

        {/* Left Introduction Section */}

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

          <p>
            {t.heroDescription}
          </p>

          <div className="auth-trust">
            <ShieldCheck size={19} />
            {t.trust}
          </div>

        </div>

        {/* Right Authentication Card */}

        <div className="auth-card">

          {/* Login and Signup Tabs */}

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

          {/* Heading */}

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

          {/* Authentication Form */}

          <form onSubmit={handleSubmit}>

            {/* Signup-only fields */}

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
                    className={
                      userType === 'Minor' ? 'selected' : ''
                    }
                    onClick={() => {
                      setUserType('Minor');
                      setNotice('');
                    }}
                  >
                    {t.minor}
                  </button>

                  <button
                    type="button"
                    className={
                      userType === 'Major' ? 'selected' : ''
                    }
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

            {/* Email */}

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

            {/* Login ID */}

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

            {/* Signup Password */}

            {mode === 'signup' && (
              <>

                <label htmlFor="password">
                  {t.createPassword}
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
                    autoComplete="new-password"
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

            {/* Feedback Message */}

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

            {/* Submit Button */}

            <button
              className="auth-submit"
              type="submit"
            >
              {mode === 'login'
                ? t.loginButton
                : t.signupButton}

              <ArrowRight size={18} />
            </button>

          </form>

          {/* Switch Login / Signup */}

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

          {/* Security Footer */}

          <div className="auth-security">
            <ShieldCheck size={16} />
            {t.security}
          </div>

        </div>

      </main>

      {/* Footer */}

      <footer className="auth-footer">
        {t.footer}
      </footer>

    </div>
  );
}

export default Auth;