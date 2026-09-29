import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import '@fontsource-variable/inter/wght.css';
import './styles/global.css';
import './styles/responsive.css';
import './styles/nocturne.css';
import './styles/nova.css';
import './styles/accessibility.css';
createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
