import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Camera from './Camera.jsx';

import Dashboard from './Dashboard.jsx';

import './index.css'
import App from './App.jsx'
import Auth from './Auth.jsx'
import { LanguageProvider } from './LanguageContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <LanguageProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/camera" element={<Camera />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </BrowserRouter>
    </LanguageProvider>
  </StrictMode>,
)