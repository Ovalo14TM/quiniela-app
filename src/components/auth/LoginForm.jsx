// src/components/auth/LoginForm.jsx - Versión con estilos inline para arreglar el problema
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

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

  // Estilos inline para asegurar que funcionen
  const containerStyle = {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 50%, #2563eb 100%)',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    overflow: 'hidden',
    padding: '0'
  };

  const contentStyle = {
    position: 'relative',
    zIndex: 10,
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    padding: '32px 16px',
    minHeight: '100vh'
  };

  const cardStyle = {
    width: '100%',
    maxWidth: '400px',
    margin: '0 auto',
    background: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(20px)',
    borderRadius: '16px',
    padding: '24px',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    boxShadow: '0 25px 45px rgba(0, 0, 0, 0.1)'
  };

  const inputStyle = {
    width: '100%',
    padding: '16px',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    border: 'none',
    borderRadius: '12px',
    fontSize: '16px',
    color: '#374151',
    outline: 'none',
    marginBottom: '16px'
  };

  const buttonStyle = {
    width: '100%',
    padding: '16px',
    background: 'rgba(255, 255, 255, 0.2)',
    border: '2px solid rgba(255, 255, 255, 0.3)',
    borderRadius: '12px',
    color: 'white',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px'
  };

  const testAccountStyle = {
    width: '100%',
    padding: '12px',
    background: 'rgba(255, 255, 255, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '8px',
    color: 'white',
    cursor: 'pointer',
    marginBottom: '8px',
    transition: 'all 0.2s ease'
  };

  return (
    <div style={containerStyle}>
      {/* Elementos decorativos de fondo */}
      <div style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'none'
      }}>
        <div style={{
          position: 'absolute',
          top: '-80px',
          right: '-80px',
          width: '160px',
          height: '160px',
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '50%',
          animation: 'pulse 3s ease-in-out infinite'
        }}></div>
        <div style={{
          position: 'absolute',
          bottom: '-80px',
          left: '-80px',
          width: '180px',
          height: '180px',
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '50%',
          animation: 'pulse 4s ease-in-out infinite'
        }}></div>
      </div>

      <div style={contentStyle}>
        {/* Logo y header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '80px',
            height: '80px',
            background: 'rgba(255, 255, 255, 0.2)',
            backdropFilter: 'blur(10px)',
            borderRadius: '16px',
            marginBottom: '16px',
            fontSize: '40px'
          }}>
            🏆
          </div>
          <h1 style={{
            fontSize: '36px',
            fontWeight: 'bold',
            color: 'white',
            marginBottom: '8px',
            margin: '0 0 8px 0'
          }}>
            Quiniela Primos
          </h1>
          <p style={{
            color: 'rgba(219, 234, 254, 1)',
            fontSize: '18px',
            margin: '0'
          }}>
            Compite, predice y gana
          </p>
        </div>

        {/* Formulario principal */}
        <div style={cardStyle}>
          {/* Header del formulario */}
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <h2 style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: 'white',
              marginBottom: '8px',
              margin: '0 0 8px 0'
            }}>
              {isRegistering ? 'Crear Cuenta' : 'Iniciar Sesión'}
            </h2>
            <p style={{
              color: 'rgba(219, 234, 254, 1)',
              fontSize: '14px',
              margin: '0'
            }}>
              {isRegistering 
                ? 'Únete a la competencia' 
                : 'Bienvenido de vuelta'
              }
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Campo Email */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                color: 'white',
                fontSize: '14px',
                fontWeight: '600',
                marginBottom: '8px'
              }}>
                📧 Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={inputStyle}
                placeholder="tu@email.com"
                required
              />
            </div>

            {/* Campo Contraseña */}
            <div style={{ marginBottom: '20px', position: 'relative' }}>
              <label style={{
                display: 'block',
                color: 'white',
                fontSize: '14px',
                fontWeight: '600',
                marginBottom: '8px'
              }}>
                🔒 Contraseña
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={inputStyle}
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '38px',
                  background: 'none',
                  border: 'none',
                  fontSize: '18px',
                  cursor: 'pointer'
                }}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>

            {/* Error message */}
            {error && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.2)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                borderRadius: '12px',
                padding: '12px',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center'
              }}>
                <span style={{ marginRight: '8px', fontSize: '18px' }}>⚠️</span>
                <span style={{ fontSize: '14px', color: 'rgba(254, 202, 202, 1)' }}>{error}</span>
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                ...buttonStyle,
                opacity: loading ? 0.5 : 1,
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.target.style.background = 'rgba(255, 255, 255, 0.3)';
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.5)';
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                }
              }}
            >
              {loading ? (
                <>
                  <div style={{
                    width: '20px',
                    height: '20px',
                    border: '2px solid rgba(255, 255, 255, 0.3)',
                    borderTop: '2px solid white',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }}></div>
                  Procesando...
                </>
              ) : (
                <>
                  <span style={{ fontSize: '18px' }}>
                    {isRegistering ? '🚀' : '👋'}
                  </span>
                  {isRegistering ? 'Crear Cuenta' : 'Iniciar Sesión'}
                </>
              )}
            </button>
          </form>

          {/* Toggle entre login/registro */}
          <div style={{ marginTop: '24px', textAlign: 'center' }}>
            <button
              type="button"
              onClick={() => {
                setIsRegistering(!isRegistering);
                setError('');
              }}
              style={{
                background: 'none',
                border: 'none',
                color: 'white',
                fontSize: '14px',
                textDecoration: 'underline',
                cursor: 'pointer'
              }}
            >
              {isRegistering 
                ? '¿Ya tienes cuenta? Inicia sesión' 
                : '¿No tienes cuenta? Regístrate'
              }
            </button>
          </div>
        </div>


        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: '32px' }}>
          <p style={{
            color: 'rgba(219, 234, 254, 1)',
            fontSize: '14px',
            margin: '0 0 8px 0'
          }}>
            Sistema de quinielas
          </p>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '16px',
            fontSize: '12px',
            color: 'rgba(147, 197, 253, 1)'
          }}>
            <span>🏆 Predicciones</span>
            <span>📊 Rankings</span>
            <span>💰 Pagos</span>
          </div>
        </div>
      </div>

      {/* CSS para animaciones */}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 0.1; }
          50% { opacity: 0.2; }
        }
        
        * {
          box-sizing: border-box;
        }
      `}</style>
    </div>
  );
}