// src/main.jsx
import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'
// import './styles/login.css' // COMENTADO TEMPORALMENTE
import { AuthProvider } from './context/AuthContext'
// import { initializePWA } from './utils/pwaUtils'

// TEMPORALMENTE DESHABILITADO PARA DEBUG
// if (typeof window !== 'undefined') {
//   window.addEventListener('load', () => {
//     initializePWA();
//   });
// }

const container = document.getElementById('root');
const root = createRoot(container);

root.render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
)