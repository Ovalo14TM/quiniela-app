// src/components/auth/LoginForm.jsx
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

  return (
    <div className="min-h-screen bg-gradient-primary flex items-center justify-center p-4 relative overflow-hidden">
      {/* Elementos decorativos de fondo */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white opacity-10 rounded-full"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-white opacity-5 rounded-full"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-white opacity-5 rounded-full"></div>
      </div>

      {/* Contenedor principal */}
      <div className="relative z-10 w-full max-w-md">
        {/* Logo y header */}
        <div className="text-center mb-8 animate-fadeIn">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white bg-opacity-20 backdrop-filter backdrop-blur-lg rounded-2xl mb-4 animate-bounce-slow">
            <span className="text-4xl">🏆</span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">
            Quiniela Primos
          </h1>
          <p className="text-blue-100 text-lg">
            Compite, predice y gana
          </p>
        </div>

        {/* Formulario */}
        <div className="glass rounded-2xl p-8 animate-scaleIn">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-white mb-2">
              {isRegistering ? 'Crear Cuenta' : 'Iniciar Sesión'}
            </h2>
            <p className="text-blue-100">
              {isRegistering 
                ? 'Únete a la competencia' 
                : 'Bienvenido de vuelta'
              }
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-white text-sm font-semibold mb-2">
                  📧 Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input bg-white bg-opacity-90 border-0 text-gray-800 placeholder-gray-500"
                  placeholder="tu@email.com"
                  required
                />
              </div>

              <div>
                <label className="block text-white text-sm font-semibold mb-2">
                  🔒 Contraseña
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input bg-white bg-opacity-90 border-0 text-gray-800 placeholder-gray-500"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="error-state border rounded-xl p-4 animate-fadeIn">
                <div className="flex items-center">
                  <span className="text-red-500 mr-2">⚠️</span>
                  <span className="text-sm font-medium">{error}</span>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn w-full bg-white bg-opacity-20 hover:bg-opacity-30 text-white border-2 border-white border-opacity-30 hover:border-opacity-50 backdrop-filter backdrop-blur-sm"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="loading-spinner mr-3"></div>
                  Procesando...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <span className="mr-2">
                    {isRegistering ? '🚀' : '👋'}
                  </span>
                  {isRegistering ? 'Crear Cuenta' : 'Iniciar Sesión'}
                </div>
              )}
            </button>
          </form>

          {/* Toggle entre login/registro */}
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => {
                setIsRegistering(!isRegistering);
                setError('');
              }}
              className="text-white hover:text-blue-200 text-sm font-medium transition-colors duration-300"
            >
              {isRegistering 
                ? '¿Ya tienes cuenta? Inicia sesión' 
                : '¿No tienes cuenta? Regístrate'
              }
            </button>
          </div>

          {/* Cuentas de prueba */}
          <div className="mt-6 p-4 bg-black bg-opacity-20 rounded-xl">
            <p className="text-white text-xs text-center mb-2 font-semibold">
              🧪 Cuentas de Prueba
            </p>
            <div className="space-y-1 text-xs text-blue-100">
              <div className="flex justify-between">
                <span>Admin:</span>
                <span>admin@quiniela.com / 123456</span>
              </div>
              <div className="flex justify-between">
                <span>Usuario:</span>
                <span>primo1@quiniela.com / 123456</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 animate-fadeIn">
          <p className="text-blue-200 text-sm">
            Sistema de quinielas entre primos
          </p>
          <div className="flex justify-center space-x-4 mt-2 text-xs text-blue-300">
            <span>🏆 Predicciones</span>
            <span>📊 Rankings</span>
            <span>💰 Pagos</span>
          </div>
        </div>
      </div>
    </div>
  );
}