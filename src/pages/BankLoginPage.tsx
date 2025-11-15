import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { BANKS, type BankName } from '../types/bank';
import { BankService } from '../services/BankService';

const BankLoginPage: React.FC = () => {
  const [selectedBank, setSelectedBank] = useState<BankName | null>(null);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<'selectBank' | 'enterEmail' | 'verifyOtp'>('selectBank');
  const navigate = useNavigate();

  useEffect(() => {
    // Check if already logged in as bank rep
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        try {
          const profile = await BankService.getBankRepProfile();
          if (profile && profile.is_approved) {
            navigate('/escritorio/bancos/clientes');
          } else if (profile && !profile.is_approved) {
            setError('Tu cuenta está pendiente de aprobación por un administrador.');
          }
        } catch (err) {
          // Not a bank rep, continue with login
        }
      }
    };
    checkAuth();
  }, [navigate]);

  const handleBankSelect = (bank: BankName) => {
    setSelectedBank(bank);
    setView('enterEmail');
    setError(null);
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !selectedBank) return;

    setLoading(true);
    setError(null);

    try {
      // Check if email exists in bank_representative_profiles
      const { data: existingProfile } = await supabase
        .from('bank_representative_profiles')
        .select('*')
        .eq('email', email.toLowerCase().trim())
        .single();

      if (existingProfile && existingProfile.bank_affiliation !== selectedBank) {
        setError(`Este correo está registrado con ${BANKS[existingProfile.bank_affiliation].name}. Por favor, selecciona el banco correcto.`);
        setLoading(false);
        return;
      }

      // Send OTP
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: email.toLowerCase().trim(),
        options: {
          shouldCreateUser: true
        }
      });

      if (otpError) {
        throw otpError;
      }

      setView('verifyOtp');
    } catch (err: any) {
      setError(err.message || 'Error al enviar código de verificación');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !otp || !selectedBank) return;

    setLoading(true);
    setError(null);

    try {
      // Verify OTP
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        email: email.toLowerCase().trim(),
        token: otp,
        type: 'email'
      });

      if (verifyError) {
        throw verifyError;
      }

      if (!data.user) {
        throw new Error('Error al verificar código');
      }

      // Check if bank rep profile exists
      const { data: existingProfile } = await supabase
        .from('bank_representative_profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (!existingProfile) {
        // Create new bank rep profile
        try {
          await BankService.createBankRepProfile({
            email: email.toLowerCase().trim(),
            first_name: '',
            last_name: '',
            bank_affiliation: selectedBank
          });
          setError('Cuenta creada. Pendiente de aprobación por un administrador.');
        } catch (createError: any) {
          setError('Cuenta creada. Completa tu perfil y espera aprobación del administrador.');
        }
      } else {
        // Check if approved
        if (!existingProfile.is_approved) {
          setError('Tu cuenta está pendiente de aprobación por un administrador.');
        } else if (!existingProfile.is_active) {
          setError('Tu cuenta ha sido desactivada. Contacta al administrador.');
        } else {
          // Update login tracking
          await BankService.updateLoginTracking();
          // Redirect to dashboard
          navigate('/escritorio/bancos/clientes');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Código incorrecto. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (view === 'verifyOtp') {
      setView('enterEmail');
      setOtp('');
    } else if (view === 'enterEmail') {
      setView('selectBank');
      setEmail('');
      setSelectedBank(null);
    }
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-5xl w-full">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="grid md:grid-cols-2 gap-0">
            {/* Left side - Branding */}
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-12 text-white flex flex-col justify-center">
              <div className="mb-8">
                <h1 className="text-4xl font-bold mb-4">Portal Bancario</h1>
                <p className="text-blue-100 text-lg">
                  Acceso exclusivo para representantes bancarios
                </p>
              </div>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="bg-blue-500 rounded-lg p-3 flex-shrink-0">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Gestión de solicitudes</h3>
                    <p className="text-blue-100 text-sm">Revisa y aprueba solicitudes de financiamiento en tiempo real</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="bg-blue-500 rounded-lg p-3 flex-shrink-0">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Documentación completa</h3>
                    <p className="text-blue-100 text-sm">Accede a todos los documentos y perfiles bancarios</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="bg-blue-500 rounded-lg p-3 flex-shrink-0">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Comunicación directa</h3>
                    <p className="text-blue-100 text-sm">Proporciona retroalimentación al equipo de ventas</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right side - Login Form */}
            <div className="p-12">
              {view === 'selectBank' && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Selecciona tu banco</h2>
                  <p className="text-gray-600 mb-8">Elige el banco al que perteneces para continuar</p>

                  <div className="grid grid-cols-2 gap-4">
                    {Object.values(BANKS).map((bank) => (
                      <button
                        key={bank.id}
                        onClick={() => handleBankSelect(bank.id)}
                        className="group relative p-6 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:shadow-lg transition-all duration-200 bg-white"
                      >
                        <div className="flex flex-col items-center justify-center h-full">
                          {/* Placeholder for bank logo - you'll need to add actual logos */}
                          <div className="w-16 h-16 mb-3 rounded-lg bg-gray-100 flex items-center justify-center group-hover:bg-blue-50 transition-colors">
                            <span className="text-2xl font-bold text-gray-400 group-hover:text-blue-600">
                              {bank.name.charAt(0)}
                            </span>
                          </div>
                          <span className="text-sm font-semibold text-gray-700 text-center">
                            {bank.name}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {view === 'enterEmail' && selectedBank && (
                <div>
                  <button
                    onClick={handleBack}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Volver
                  </button>

                  <div className="mb-6">
                    <div className="inline-flex items-center gap-3 px-4 py-2 bg-blue-50 rounded-lg">
                      <div className="w-8 h-8 rounded bg-white flex items-center justify-center">
                        <span className="text-lg font-bold text-blue-600">
                          {BANKS[selectedBank].name.charAt(0)}
                        </span>
                      </div>
                      <span className="font-semibold text-gray-900">{BANKS[selectedBank].name}</span>
                    </div>
                  </div>

                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Ingresa tu correo</h2>
                  <p className="text-gray-600 mb-8">Te enviaremos un código de verificación</p>

                  <form onSubmit={handleSendOtp} className="space-y-6">
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                        Correo electrónico corporativo
                      </label>
                      <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="tu.nombre@banco.com"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>

                    {error && (
                      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                        {error}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={loading || !email}
                      className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                    >
                      {loading ? 'Enviando...' : 'Enviar código'}
                    </button>
                  </form>
                </div>
              )}

              {view === 'verifyOtp' && (
                <div>
                  <button
                    onClick={handleBack}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Volver
                  </button>

                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Verifica tu código</h2>
                  <p className="text-gray-600 mb-8">
                    Ingresa el código de 6 dígitos enviado a <span className="font-semibold">{email}</span>
                  </p>

                  <form onSubmit={handleVerifyOtp} className="space-y-6">
                    <div>
                      <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-2">
                        Código de verificación
                      </label>
                      <input
                        id="otp"
                        type="text"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        placeholder="000000"
                        maxLength={6}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-2xl tracking-widest font-mono"
                        required
                      />
                    </div>

                    {error && (
                      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                        {error}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={loading || otp.length !== 6}
                      className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                    >
                      {loading ? 'Verificando...' : 'Verificar'}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setView('enterEmail');
                        setOtp('');
                        setError(null);
                      }}
                      className="w-full text-blue-600 hover:text-blue-700 font-medium text-sm"
                    >
                      Reenviar código
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-gray-600 text-sm">
          <p>¿Necesitas ayuda? Contacta al administrador del sistema</p>
        </div>
      </div>
    </div>
  );
};

export default BankLoginPage;
