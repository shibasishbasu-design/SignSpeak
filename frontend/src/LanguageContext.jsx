import { createContext, useContext, useState } from 'react';

const LanguageContext = createContext();

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

const authTranslations = {
  English: {
    backHome: 'Back to Home',
    secureAccess: 'SECURE ACCESS',
    heroTitle1: 'Your voice.',
    heroTitle2: 'Your identity.',
    heroTitle3: 'Your connection.',
    heroDescription: 'Join SignSpeak and experience a world where communication has no boundaries.',
    trust: 'Accessible. Inclusive. Intelligent.',
    login: 'Login',
    signup: 'Sign Up',
    welcomeBack: 'Welcome Back!',
    createAccount: 'Create Your Account',
    loginDescription: 'Enter your details to continue.',
    signupDescription: 'Join our inclusive communication community.',
    fullName: 'Full Name',
    fullNamePlaceholder: 'Enter your full name',
    accountType: 'Account Type',
    minor: 'Minor',
    major: 'Major',
    guardianName: 'Guardian Name',
    guardianPlaceholder: "Enter guardian's name",
    email: 'Email Address',
    emailPlaceholder: 'Enter your email',
    uniqueId: 'Unique SignSpeak ID',
    idPlaceholder: 'Enter your SignSpeak ID',
    createPassword: 'Create Password',
    passwordPlaceholder: 'Create a password (8+ characters)',
    confirmPassword: 'Confirm Password',
    confirmPlaceholder: 'Re-enter your password',
    idNote: 'Your unique SignSpeak ID will be generated during account registration after backend integration.',
    loginButton: 'Login to Account',
    signupButton: 'Create Account',
    noAccount: "Don't have an account? ",
    haveAccount: 'Already have an account? ',
    security: 'Your privacy and security matter to us.',
    footer: '© 2026 SignSpeak. Bridging worlds through gestures.',
    togglePassword: 'Toggle password visibility',
    errorLogin: 'Please enter your email address and SignSpeak ID.',
    loginSuccess: 'Your details have been validated. Actual login authentication will be enabled after backend integration.',
    errorGuardian: 'Please enter your guardian name.',
    errorPassword: 'Password must contain at least 8 characters.',
    errorConfirm: 'Passwords do not match. Please try again.',
    signupSuccess: 'Registration details validated successfully! Your unique SignSpeak ID will be generated after backend integration.'
  },

  Hindi: {
    backHome: 'होम पर वापस जाएँ',
    secureAccess: 'सुरक्षित प्रवेश',
    heroTitle1: 'आपकी आवाज़।',
    heroTitle2: 'आपकी पहचान।',
    heroTitle3: 'आपका जुड़ाव।',
    heroDescription: 'SignSpeak से जुड़ें और ऐसी दुनिया का अनुभव करें जहाँ संवाद की कोई सीमा नहीं है।',
    trust: 'सुलभ। समावेशी। बुद्धिमान।',
    login: 'लॉगिन',
    signup: 'साइन अप',
    welcomeBack: 'वापसी पर स्वागत है!',
    createAccount: 'अपना अकाउंट बनाएँ',
    loginDescription: 'आगे बढ़ने के लिए अपनी जानकारी दर्ज करें।',
    signupDescription: 'हमारे समावेशी संचार समुदाय से जुड़ें।',
    fullName: 'पूरा नाम',
    fullNamePlaceholder: 'अपना पूरा नाम दर्ज करें',
    accountType: 'अकाउंट का प्रकार',
    minor: 'नाबालिग',
    major: 'वयस्क',
    guardianName: 'अभिभावक का नाम',
    guardianPlaceholder: 'अभिभावक का नाम दर्ज करें',
    email: 'ईमेल पता',
    emailPlaceholder: 'अपना ईमेल दर्ज करें',
    uniqueId: 'यूनिक SignSpeak ID',
    idPlaceholder: 'अपना SignSpeak ID दर्ज करें',
    createPassword: 'पासवर्ड बनाएँ',
    passwordPlaceholder: 'पासवर्ड बनाएँ (कम से कम 8 अक्षर)',
    confirmPassword: 'पासवर्ड की पुष्टि करें',
    confirmPlaceholder: 'अपना पासवर्ड दोबारा दर्ज करें',
    idNote: 'बैकएंड इंटीग्रेशन के बाद अकाउंट रजिस्ट्रेशन के दौरान आपकी यूनिक SignSpeak ID बनाई जाएगी।',
    loginButton: 'अकाउंट में लॉगिन करें',
    signupButton: 'अकाउंट बनाएँ',
    noAccount: 'क्या आपका अकाउंट नहीं है? ',
    haveAccount: 'क्या आपका पहले से अकाउंट है? ',
    security: 'आपकी गोपनीयता और सुरक्षा हमारे लिए महत्वपूर्ण है।',
    footer: '© 2026 SignSpeak. इशारों के माध्यम से दुनिया को जोड़ते हुए।',
    togglePassword: 'पासवर्ड दिखाएँ या छिपाएँ',
    errorLogin: 'कृपया अपना ईमेल पता और SignSpeak ID दर्ज करें।',
    loginSuccess: 'आपकी जानकारी सत्यापित हो गई है। वास्तविक लॉगिन सुविधा बैकएंड इंटीग्रेशन के बाद उपलब्ध होगी।',
    errorGuardian: 'कृपया अपने अभिभावक का नाम दर्ज करें।',
    errorPassword: 'पासवर्ड में कम से कम 8 अक्षर होने चाहिए।',
    errorConfirm: 'पासवर्ड मेल नहीं खाते। कृपया दोबारा प्रयास करें।',
    signupSuccess: 'रजिस्ट्रेशन की जानकारी सफलतापूर्वक सत्यापित हो गई है! बैकएंड इंटीग्रेशन के बाद आपकी यूनिक SignSpeak ID बनाई जाएगी।'
  },

  Bengali: {
    backHome: 'হোমে ফিরে যান',
    secureAccess: 'নিরাপদ প্রবেশ',
    heroTitle1: 'আপনার কণ্ঠস্বর।',
    heroTitle2: 'আপনার পরিচয়।',
    heroTitle3: 'আপনার সংযোগ।',
    heroDescription: 'SignSpeak-এ যোগ দিন এবং এমন একটি বিশ্বের অভিজ্ঞতা নিন যেখানে যোগাযোগের কোনো সীমা নেই।',
    trust: 'সহজলভ্য। অন্তর্ভুক্তিমূলক। বুদ্ধিদীপ্ত।',
    login: 'লগইন',
    signup: 'সাইন আপ',
    welcomeBack: 'আবার স্বাগতম!',
    createAccount: 'আপনার অ্যাকাউন্ট তৈরি করুন',
    loginDescription: 'চালিয়ে যেতে আপনার তথ্য লিখুন।',
    signupDescription: 'আমাদের অন্তর্ভুক্তিমূলক যোগাযোগ সম্প্রদায়ে যোগ দিন।',
    fullName: 'পুরো নাম',
    fullNamePlaceholder: 'আপনার পুরো নাম লিখুন',
    accountType: 'অ্যাকাউন্টের ধরন',
    minor: 'অপ্রাপ্তবয়স্ক',
    major: 'প্রাপ্তবয়স্ক',
    guardianName: 'অভিভাবকের নাম',
    guardianPlaceholder: 'অভিভাবকের নাম লিখুন',
    email: 'ইমেল ঠিকানা',
    emailPlaceholder: 'আপনার ইমেল লিখুন',
    uniqueId: 'ইউনিক SignSpeak ID',
    idPlaceholder: 'আপনার SignSpeak ID লিখুন',
    createPassword: 'পাসওয়ার্ড তৈরি করুন',
    passwordPlaceholder: 'পাসওয়ার্ড তৈরি করুন (কমপক্ষে ৮ অক্ষর)',
    confirmPassword: 'পাসওয়ার্ড নিশ্চিত করুন',
    confirmPlaceholder: 'আপনার পাসওয়ার্ড আবার লিখুন',
    idNote: 'ব্যাকএন্ড ইন্টিগ্রেশনের পরে অ্যাকাউন্ট নিবন্ধনের সময় আপনার ইউনিক SignSpeak ID তৈরি হবে।',
    loginButton: 'অ্যাকাউন্টে লগইন করুন',
    signupButton: 'অ্যাকাউন্ট তৈরি করুন',
    noAccount: 'আপনার কি অ্যাকাউন্ট নেই? ',
    haveAccount: 'আপনার কি আগে থেকেই অ্যাকাউন্ট আছে? ',
    security: 'আপনার গোপনীয়তা ও নিরাপত্তা আমাদের কাছে গুরুত্বপূর্ণ।',
    footer: '© 2026 SignSpeak. ইশারার মাধ্যমে বিশ্বকে সংযুক্ত করছি।',
    togglePassword: 'পাসওয়ার্ড দেখান বা লুকান',
    errorLogin: 'অনুগ্রহ করে আপনার ইমেল ঠিকানা এবং SignSpeak ID লিখুন।',
    loginSuccess: 'আপনার তথ্য যাচাই করা হয়েছে। ব্যাকএন্ড ইন্টিগ্রেশনের পরে প্রকৃত লগইন সুবিধা চালু হবে।',
    errorGuardian: 'অনুগ্রহ করে আপনার অভিভাবকের নাম লিখুন।',
    errorPassword: 'পাসওয়ার্ডে কমপক্ষে ৮টি অক্ষর থাকতে হবে।',
    errorConfirm: 'পাসওয়ার্ড মিলছে না। অনুগ্রহ করে আবার চেষ্টা করুন।',
    signupSuccess: 'নিবন্ধনের তথ্য সফলভাবে যাচাই করা হয়েছে! ব্যাকএন্ড ইন্টিগ্রেশনের পরে আপনার ইউনিক SignSpeak ID তৈরি হবে।'
  }
};

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    const savedLanguage = localStorage.getItem('signspeak-language');

    return translations[savedLanguage] ? savedLanguage : 'English';
  });

  const setLanguage = (newLanguage) => {
    if (translations[newLanguage]) {
      setLanguageState(newLanguage);
      localStorage.setItem('signspeak-language', newLanguage);
    }
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        content: translations[language],
        authContent: authTranslations[language]
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error('useLanguage must be used inside LanguageProvider');
  }

  return context;
}