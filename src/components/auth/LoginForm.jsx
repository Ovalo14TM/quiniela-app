// src/components/auth/LoginForm.jsx - Versión mejorada con CSS externo
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import './LoginForm.css'; // Importamos los estilos

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const { login, register } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isRegistering) {
        await register(email, password);
      } else {
        await login(email, password);
      }
    } catch (error) {
      console.error('Error en autenticación:', error);
      
      const errorMessages = {
        'auth/user-not-found': 'Usuario no encontrado',
        'auth/wrong-password': 'Contraseña incorrecta',
        'auth/email-already-in-use': 'El email ya está registrado',
        'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres',
        'auth/invalid-email': 'Email inválido',
        'auth/too-many-requests': 'Demasiados intentos. Intenta más tarde',
        'auth/network-request-failed': 'Error de conexión. Verifica tu internet'
      };
      
      setError(errorMessages[error.code] || 'Error de autenticación');
    }

    setLoading(false);
  };

  const quickLogin = (email, password) => {
    setEmail(email);
    setPassword(password);
    setIsRegistering(false);
  };

  return (
    <div className="login-container">
      {/* Elementos decorativos de fondo */}
      <div className="background-decorations">
        <div className="bg-circle bg-circle-1"></div>
        <div className="bg-circle bg-circle-2"></div>
        <div className="bg-circle bg-circle-3"></div>
      </div>

      <div className="login-content">
        {/* Logo y header */}
        <div className="login-header">
          <div className="logo-container animate-bounce-slow">
            <span className="logo-icon">🏆</span>
          </div>
          <h1 className="main-title animate-fadeIn">
            Quiniela Primos
          </h1>
          <p className="main-subtitle animate-fadeIn">
            Compite, predice y gana
          </p>
        </div>

        {/* Formulario principal */}
        <div className="login-card glass-card animate-scaleIn">
          {/* Header del formulario */}
          <div className="form-header">
            <h2 className="form-title">
              {isRegistering ? 'Crear Cuenta' : 'Iniciar Sesión'}
            </h2>
            <p className="form-subtitle">
              {isRegistering 
                ? 'Únete a la competencia' 
                : 'Bienvenido de vuelta'
              }
            </p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            {/* Campo Email */}
            <div className="form-group">
              <label className="form-label">
                📧 Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-input input-focus"
                placeholder="tu@email.com"
                required
              />
            </div>

            {/* Campo Contraseña */}
            <div className="form-group">
              <label className="form-label">
                🔒 Contraseña
              </label>
              <div className="password-container">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-input input-focus"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="password-toggle"
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div className="error-message animate-fadeIn">
                <span className="error-icon">⚠️</span>
                <span className="error-text">{error}</span>
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className={`submit-button btn-glass ${loading ? 'loading' : ''}`}
            >
              {loading ? (
                <div className="button-loading">
                  <div className="loading-spinner"></div>
                  <span>Procesando...</span>
                </div>
              ) : (
                <div className="button-content">
                  <span className="button-icon">
                    {isRegistering ? '🚀' : '👋'}
                  </span>
                  <span>
                    {isRegistering ? 'Crear Cuenta' : 'Iniciar Sesión'}
                  </span>
                </div>
              )}
            </button>
          </form>

          {/* Toggle entre login/registro */}
          <div className="form-footer">
            <button
              type="button"
              onClick={() => {
                setIsRegistering(!isRegistering);
                setError('');
              }}
              className="toggle-button"
            >
              {isRegistering 
                ? '¿Ya tienes cuenta? Inicia sesión' 
                : '¿No tienes cuenta? Regístrate'
              }
            </button>
          </div>
        </div>


      </div>
    </div>
  );
}