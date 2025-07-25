// src/components/auth/LoginForm.jsx
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import '../../styles/login.css'; // Importar CSS personalizado

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

  return (
    <div className="gradient-bg flex items-center justify-center p-4 relative overflow-hidden">
      {/* Elementos decorativos flotantes */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="floating-element absolute -top-20 -right-20 w-40 h-40 md:w-80 md:h-80 bg-white opacity-10 rounded-full"></div>
        <div className="floating-element absolute -bottom-20 -left-20 w-48 h-48 md:w-96 md:h-96 bg-white opacity-5 rounded-full"></div>
        <div className="floating-element absolute top-1/3 left-1/4 w-32 h-32 md:w-64 md:h-64 bg-white opacity-5 rounded-full"></div>
      </div>

      {/* Contenedor principal */}
      <div className="relative z-10 w-full max-w-sm mx-auto">
        {/* Logo y header */}
        <div className="text-center mb-6 fade-in">
          <div className="logo-bounce inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 glass rounded-2xl mb-3 shadow-lg">
            <span className="text-3xl md:text-4xl">🏆</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 tracking-tight">
            Quiniela Primos
          </h1>
          <p className="text-blue-100 text-base md:text-lg">
            Compite, predice y gana
          </p>
        </div>

        {/* Formulario principal */}
        <div className="glass rounded-2xl p-6 md:p-8 shadow-2xl">
          <div className="text-center mb-6">
            <h2 className="text-xl md:text-2xl font-bold text-white mb-2">
              {isRegistering ? 'Crear Cuenta' : 'Iniciar Sesión'}
            </h2>
            <p className="text-blue-100 text-sm md:text-base">
              {isRegistering 
                ? 'Únete a la competencia' 
                : 'Bienvenido de vuelta'
              }
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-4">
              {/* Campo Email */}
              <div>
                <label className="block text-white text-sm font-semibold mb-2">
                  📧 Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-focus w-full px-4 py-3 md:py-4 bg-white bg-opacity-90 border-0 rounded-xl text-gray-800 placeholder-gray-500 text-base"
                  placeholder="tu@email.com"
                  required
                />
              </div>

              {/* Campo Contraseña */}
              <div>
                <label className="block text-white text-sm font-semibold mb-2">
                  🔒 Contraseña
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-focus w-full px-4 py-3 md:py-4 bg-white bg-opacity-90 border-0 rounded-xl text-gray-800 placeholder-gray-500 text-base pr-12"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="password-toggle text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div className="fade-in bg-red-500 bg-opacity-20 border border-red-400 border-opacity-50 rounded-xl p-3">
                <div className="flex items-center">
                  <span className="text-red-200 mr-2">⚠️</span>
                  <span className="text-red-100 text-sm font-medium">{error}</span>
                </div>
              </div>
            )}

            {/* Botón Submit */}
            <button
              type="submit"
              disabled={loading}
              className="btn-glass w-full py-3 md:py-4 text-white rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="loading-spinner mr-3"></div>
                  Procesando...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <span className="mr-2 text-lg">
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
              className="text-white hover:text-blue-200 text-sm font-medium transition-colors duration-300 underline decoration-dotted underline-offset-4"
            >
              {isRegistering 
                ? '¿Ya tienes cuenta? Inicia sesión' 
                : '¿No tienes cuenta? Regístrate'
              }
            </button>
          </div>

          {/* Cuentas de prueba */}
          <div className="mt-6 p-4 glass rounded-xl">
            <p className="text-white text-xs text-center mb-3 font-semibold">
              🧪 Cuentas de Prueba
            </p>
            <div className="space-y-2">
              <div className="test-account-card rounded-lg p-2">
                <div className="text-xs text-blue-100">
                  <div className="font-medium text-white mb-1">Admin:</div>
                  <div className="break-words">admin@quiniela.com / 123456</div>
                </div>
              </div>
              <div className="test-account-card rounded-lg p-2">
                <div className="text-xs text-blue-100">
                  <div className="font-medium text-white mb-1">Usuario:</div>
                  <div className="break-words">primo1@quiniela.com / 123456</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 fade-in">
          <p className="text-blue-200 text-sm mb-2">
            Sistema de quinielas entre primos
          </p>
          <div className="flex justify-center space-x-4 text-xs text-blue-300">
            <span className="flex items-center">
              <span className="mr-1">🏆</span>
              Predicciones
            </span>
            <span className="flex items-center">
              <span className="mr-1">📊</span>
              Rankings
            </span>
            <span className="flex items-center">
              <span className="mr-1">💰</span>
              Pagos
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}