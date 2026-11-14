import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import './mission-control.css';
import './styles/ux-desktop.css';
import './styles/responsive-mobile.css';
import './styles/scroll-lock.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
