// src/App.jsx
import React from 'react';
import { useAuth } from './context/AuthContext';
import LoginForm from './components/auth/LoginForm';
import Dashboard from './components/Dashboard';

function App() {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando Quiniela App...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      {currentUser ? <Dashboard /> : <LoginForm />}
    </div>
  );
}

export default App;