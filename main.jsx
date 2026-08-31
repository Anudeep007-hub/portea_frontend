import React from 'react';
import { createRoot } from 'react-dom/client';
import Home from './app/page';
import OpsApp from './app/ops/OpsApp';
import './app/globals.css';

const App = window.location.pathname.startsWith('/ops') ? OpsApp : Home;

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
