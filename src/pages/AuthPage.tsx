import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { CheckCircleIcon, HeartIcon, FileTextIcon, BellIcon, CalendarIcon, GoogleIcon } from '../components/icons';
import type { WordPressVehicle } from '../types/types';
import VehicleService from '../services/VehicleService';
import { formatPrice } from '../utils/formatters';
import useSEO from '../hooks/useSEO';
import { getVehicleImage } from '../utils/getVehicleImage';
import { getEmailRedirectUrl } from './config';
import { proxyImage } from '../utils/proxyImage';
import { conversionTracking } from '../services/ConversionTrackingService';
import { checkBasicProfileCompleteness } from '../components/AuthHandler';

// Admin email addresses that should be redirected to admin dashboard
const ADMIN_EMAILS = [
    'mariano.morales@autostrefa.mx',
    'alejandro.trevino@autostrefa.mx',
    'evelia.castillo@autostrefa.mx',
    'fernando.trevino@autostrefa.mx'
];

// Check if an email is an admin email
const isAdminEmail = (email: string | undefined): boolean => {
    if (!email) return false;
    return ADMIN_EMAILS.includes(email.toLowerCase().trim());
};

const VehicleFinanceCard: React.FC<{ vehicle: WordPressVehicle }> = ({ vehicle }) => (
  <div className="mb-6 bg-gray-100 p-4 rounded-lg border border-gray-200">
    <p className="text-sm font-semibold text-gray-700 mb-2">Para continuar con tu solicitud por:</p>
    <div className="flex items-center gap-4">
      <img src={getVehicleImage(vehicle)} alt={vehicle.titulo} className="w-24 h-18 object-cover rounded-md flex-shrink-0" />
      <div>
        <h3 className="font-bold text-gray-900">{vehicle.titulo}</h3>
        <p className="text-primary-600 font-semibold">{formatPrice(vehicle.precio)}</p>
      </div>
    </div>
  </div>
);

const VehicleSkeletonCard: React.FC = () => (
    <div className="mb-6 bg-gray-100 p-4 rounded-lg border border-gray-200 animate-pulse">
        <div className="h-5 bg-gray-200 rounded w-3/4 mb-3"></div>
        <div className="flex items-center gap-4">
            <div className="w-24 h-18 bg-gray-200 rounded-md"></div>
            <div className="flex-1 space-y-2">
                <div className="h-5 bg-gray-200 rounded w-full"></div>
                <div className="h-5 bg-gray-200 rounded w-1/2"></div>
            </div>
        </div>
    </div>
);


const allCustomerAvatars = [
    'https://randomuser.me/api/portraits/women/18.jpg',
    'https://randomuser.me/api/portraits/men/44.jpg',
    'https://randomuser.me/api/portraits/women/33.jpg',
    'https://randomuser.me/api/portraits/men/32.jpg',
    'https://randomuser.me/api/portraits/women/44.jpg',
    'https://randomuser.me/api/portraits/men/35.jpg',
    'https://randomuser.me/api/portraits/women/65.jpg',
    'https://randomuser.me/api/portraits/men/75.jpg',
    'https://randomuser.me/api/portraits/women/88.jpg',
    'https://randomuser.me/api/portraits/men/11.jpg',
    'https://randomuser.me/api/portraits/women/22.jpg',
    'https://randomuser.me/api/portraits/men/55.jpg',
];

const AuthPage: React.FC = () => {
    useSEO({
        title: 'Accede o Crea tu Cuenta | Portal TREFA',
        description: 'Inicia sesión en tu cuenta de TREFA para guardar favoritos, solicitar financiamiento y dar seguimiento a tus trámites. Proceso seguro y rápido.',
        keywords: 'iniciar sesión trefa, crear cuenta trefa, portal de clientes, acceso trefa'
    });

    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [view, setView] = useState<'signIn' | 'verifyOtp'>('signIn');
    const navigate = useNavigate();
    const { session, profile } = useAuth();
    const [searchParams] = useSearchParams();
    const [vehicleToFinance, setVehicleToFinance] = useState<WordPressVehicle | null>(null);
    const [isLoadingVehicle, setIsLoadingVehicle] = useState(false);
    const [isVideoLoaded, setIsVideoLoaded] = useState(false);
    const [customerAvatars, setCustomerAvatars] = useState(allCustomerAvatars.slice(0, 3));
    const [urlParamsString, setUrlParamsString] = useState('');

    useEffect(() => {
        // Shuffle avatars on mount
        const shuffled = [...allCustomerAvatars].sort(() => 0.5 - Math.random());
        setCustomerAvatars(shuffled.slice(0, 3));
    }, []);

    // Capturar URL params al inicio
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const paramString = params.toString();
        setUrlParamsString(paramString);
    }, []);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const sourceData: Record<string, string> = {};

        params.forEach((value, key) => {
            if (key.startsWith('utm_') || key === 'rfdm' || key === 'ordencompra' || key === 'fbclid' || key === 'source') {
                sourceData[key] = value;
            }
        });

        if (Object.keys(sourceData).length > 0) {
            sessionStorage.setItem('leadSourceData', JSON.stringify(sourceData));
        }

        if (session && profile) {
            // Check if there's a pending redirect
            let redirectPath = localStorage.getItem('loginRedirect');

            // Check if basic profile is incomplete for regular users
            if (profile.role === 'user' && !checkBasicProfileCompleteness(profile)) {
                // First-time users with incomplete profile go to profile page
                localStorage.removeItem('loginRedirect');
                navigate('/escritorio/profile', { replace: true });
                return;
            }

            // If no redirect is set, determine default based on email or role
            if (!redirectPath) {
                // Check if user email is an admin email (takes priority)
                if (isAdminEmail(session.user?.email)) {
                    redirectPath = '/escritorio/dashboard';
                } else if (profile?.role === 'admin' || profile?.role === 'sales') {
                    redirectPath = '/escritorio/dashboard';
                } else {
                    redirectPath = '/escritorio';
                }
            }

            localStorage.removeItem('loginRedirect'); // Clean up after use
            navigate(redirectPath, { replace: true });
        }
    }, [session, profile, navigate]);

    useEffect(() => {
        const ordenCompraFromUrl = searchParams.get('ordencompra');
        if (ordenCompraFromUrl) {
            setIsLoadingVehicle(true);
            sessionStorage.setItem('pendingOrdenCompra', ordenCompraFromUrl);
            localStorage.setItem('loginRedirect', `/escritorio/aplicacion?ordencompra=${ordenCompraFromUrl}`);
            VehicleService.getVehicleByOrdenCompra(ordenCompraFromUrl).then(vehicle => {
                if (vehicle) setVehicleToFinance(vehicle);
            }).catch(err => {
                console.error("Error fetching vehicle for AuthPage:", err);
                setError("No pudimos cargar la información del vehículo. Por favor, intenta nuevamente o continúa sin esta información.");
            }).finally(() => setIsLoadingVehicle(false));
        }
    }, [searchParams]);

    const handleEmailSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            // Validate email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                setError('Por favor, ingresa un correo electrónico válido.');
                setLoading(false);
                return;
            }

            // Set default redirect if not already set (will be adjusted after login based on role)
            if (!localStorage.getItem('loginRedirect')) {
                localStorage.setItem('loginRedirect', '/escritorio');
            }

            const source = sessionStorage.getItem('rfdm_source');
            const options: any = {
                shouldCreateUser: false, // Don't create user - they must register first
            };
            if (source) {
                options.data = { source };
            }

            console.log('Sending OTP to email:', email);

            const { data, error } = await supabase.auth.signInWithOtp({
                email,
                options
            });

            if (error) {
                console.error('OTP Send Error:', error);

                // Better error messages
                if (error.message.includes('rate limit')) {
                    throw new Error('Has solicitado demasiados códigos. Por favor espera unos minutos antes de intentar de nuevo.');
                } else if (error.message.includes('Email not confirmed')) {
                    throw new Error('Tu correo electrónico no ha sido confirmado. Por favor verifica tu bandeja de entrada.');
                } else if (error.message.includes('User not found') || error.message.includes('Signups not allowed') || error.message.includes('not allowed for otp')) {
                    // User doesn't exist - automatically redirect to registration preserving URL params
                    console.log('Usuario no encontrado, redirigiendo a registro...');
                    setLoading(false);
                    const redirectUrl = `/registro${urlParamsString ? `?${urlParamsString}` : ''}`;
                    navigate(redirectUrl);
                    return;
                } else {
                    throw error;
                }
            }

            console.log('✅ OTP sent successfully to:', email);

            // Track OTP request
            conversionTracking.trackAuth.otpRequested(email, {
                source: source || 'direct',
                vehicleId: searchParams.get('ordencompra') || undefined
            });

            setView('verifyOtp');
        } catch (error: any) {
            console.error('Full Email Submit Error:', error);
            setError(error.message || `No pudimos enviar el código de verificación. Por favor, verifica que tu correo electrónico esté escrito correctamente e inténtalo nuevamente. Si el problema persiste, contacta con soporte.`);
        } finally {
            setLoading(false);
        }
    };
    
    const handleOtpSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            // Validate OTP format (6 digits)
            if (otp.length !== 6 || !/^\d{6}$/.test(otp)) {
                setError('El código debe tener 6 dígitos numéricos.');
                setLoading(false);
                return;
            }

            const { data, error } = await supabase.auth.verifyOtp({
                email,
                token: otp,
                type: 'email'
            });

            if (error) {
                console.error('❌ OTP Verification Error:', error);

                // Provide specific error messages based on error type
                if (error.message.includes('expired') || error.message.includes('Token has expired')) {
                    throw new Error('El código ha expirado. Por favor solicita un nuevo código.');
                } else if (error.message.includes('invalid') || error.message.includes('Token')) {
                    throw new Error('El código ingresado es incorrecto. Por favor verifica e intenta de nuevo.');
                } else if (error.message.includes('not found') || error.message.includes('User not found')) {
                    throw new Error('No se encontró una cuenta con este correo electrónico. Por favor regístrate primero.');
                } else if (error.message.includes('too many')) {
                    throw new Error('Demasiados intentos fallidos. Por favor espera unos minutos antes de intentar de nuevo.');
                } else {
                    throw error;
                }
            }

            console.log('✅ OTP Verification Success:', data);

            // Check if this is a new user by checking their metadata or created_at timestamp
            const isNewUser = data.user?.created_at &&
                              new Date(data.user.created_at).getTime() > (Date.now() - 10000); // Within last 10 seconds

            // Track registration completion ONLY for first-time users
            if (isNewUser) {
                console.log('🎉 New user detected - tracking InitialRegistration');
                conversionTracking.trackAuth.otpVerified(data.user?.id || '', {
                    email: email,
                    vehicleId: searchParams.get('ordencompra') || undefined
                });

                // Wait 500ms to ensure Facebook Pixel event is sent before redirect
                await new Promise(resolve => setTimeout(resolve, 500));
            } else {
                console.log('👤 Returning user - skipping InitialRegistration event');
            }

            // Redirect path will be determined by the useEffect above based on profile role
            // But we'll check here in case the profile is already loaded
            let redirectPath = localStorage.getItem('loginRedirect');
            if (!redirectPath) {
                // Check if this is an admin email (takes priority)
                if (isAdminEmail(data.user?.email)) {
                    redirectPath = '/escritorio/dashboard';
                } else {
                    // Note: profile might not be loaded yet, so the useEffect will handle the redirect
                    redirectPath = '/escritorio';
                }
            }
            localStorage.removeItem('loginRedirect');
            navigate(redirectPath, { replace: true });

        } catch (error: any) {
             console.error('❌ Full OTP Verification Error:', error);
             setError(error.message || 'El código que ingresaste es inválido o ha expirado. Por favor, solicita un nuevo código o verifica que lo hayas ingresado correctamente.');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        setLoading(true);
        setError(null);

        // Track Google sign-in attempt
        conversionTracking.trackButtonClick('Google Sign In Initiated', {
            page: 'auth',
            vehicleId: searchParams.get('ordencompra') || undefined
        });

        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: getEmailRedirectUrl(),
            },
        });
        if (error) {
            setError('No pudimos completar el inicio de sesión con Google. Por favor, verifica que hayas autorizado el acceso y intenta nuevamente. Si el problema persiste, prueba iniciar sesión con tu correo electrónico.');
            setLoading(false);
        }
        // The AuthHandler component will handle the redirect after successful login.
    };
    

    if (session) {
        return (
            <div className="flex justify-center items-center h-screen w-full transparent">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary-600"></div>
            </div>
        );
    }
    

    const formInputClasses = "block w-full rounded-lg border border-gray-300 bg-gray-50 py-3 sm:py-4 px-4 text-base sm:text-lg text-gray-900 shadow-sm placeholder:text-gray-500 focus:ring-2 focus:ring-primary-500 min-h-[48px] sm:min-h-[52px]";
    const submitButtonClasses = "flex w-full justify-center rounded-lg bg-primary-600 px-4 py-4 sm:py-5 text-base sm:text-lg font-bold text-white shadow-lg hover:bg-primary-700 transition-all duration-300 transform hover:scale-105 disabled:opacity-70 disabled:cursor-not-allowed min-h-[52px] sm:min-h-[56px] touch-manipulation";

    const renderSignInView = () => (
        <div className="space-y-8">
            <div className="text-left lg:text-center">
                <Link to="/" className="inline-block mb-8 lg:hidden">
                    <img src="/images/trefalogo.png" alt="TREFA Logo" className="h-10 sm:h-12 w-auto mx-auto" />
                </Link>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-gray-900 tracking-tight lg:tracking-normal">Accede o crea tu cuenta</h1>
                <p className="mt-3 text-base sm:text-lg text-gray-600">
                    Usa tu cuenta de Google o ingresa tu correo para recibir un código de acceso seguro.
                </p>
            </div>
            <div>
                {error && <p className="text-red-600 text-sm p-3 rounded-md mb-4 text-center bg-red-50 border border-red-200">{error}</p>}
                
                {isLoadingVehicle ? (
                    <VehicleSkeletonCard />
                ) : vehicleToFinance ? (
                    <VehicleFinanceCard vehicle={vehicleToFinance} />
                ) : null}

                <form onSubmit={handleEmailSubmit} className="space-y-4">
                    <div>
                        <input id="email" placeholder="Correo electrónico" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required className={formInputClasses} />
                    </div>
                    <div>
                        <button type="submit" data-gtm-id="auth-otp-request-submit" disabled={loading} className={submitButtonClasses}>
                            {loading ? 'Enviando...' : 'Recibir código de acceso'}
                        </button>
                    </div>
                </form>

                <div className="relative mt-6">
                    <div className="absolute inset-0 flex items-center" aria-hidden="true">
                        <div className="w-full border-t border-gray-300" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="bg-white px-2 text-gray-500">O continúa con</span>
                    </div>
                </div>

                <div className="space-y-4 mt-6">
                    <button
                        type="button"
                        onClick={handleGoogleSignIn}
                        disabled={loading}
                        className="flex w-full items-center justify-center gap-3 rounded-md border-2 border-gray-300 bg-white px-4 py-4 sm:py-5 text-base sm:text-lg font-semibold text-gray-800 shadow-sm hover:bg-gray-50 disabled:opacity-50 transition-colors min-h-[52px] sm:min-h-[56px] touch-manipulation"
                    >
                        <GoogleIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                        <span>Iniciar sesión con Google</span>
                    </button>
                </div>

                <div className="text-center text-sm text-gray-600 mt-6">
                    ¿No tienes cuenta?{' '}
                    <Link to={`/registro${urlParamsString ? `?${urlParamsString}` : ''}`} className="text-primary-600 hover:underline font-medium">
                        Regístrate aquí
                    </Link>
                </div>
            </div>
        </div>
    );

    const renderVerifyOtpView = () => (
         <div className="space-y-6 text-center">
            <CheckCircleIcon className="w-14 h-14 sm:w-16 sm:h-16 text-green-500 mx-auto" />
            <h2 className="mt-2 text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Verifica tu correo</h2>
            <p className="text-base sm:text-lg text-gray-600">Hemos enviado un código de 6 dígitos a <strong>{email}</strong>. <br/><span className="mt-1 text-xs sm:text-sm text-gray-500">(Revisa tu buzón de correo no deseado)</span></p>
            {error && <p className="text-red-600 text-sm sm:text-base p-3 rounded-md mt-4 bg-red-50 border border-red-200">{error}</p>}
            <div className="mt-4">
                 <form onSubmit={handleOtpSubmit} className="space-y-4">
                    <div>
                         <input
                            id="otp"
                            placeholder="------"
                            type="text"
                            inputMode="numeric"
                            autoComplete="one-time-code"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                            required
                            className={`${formInputClasses} text-center tracking-[0.5em] font-mono text-2xl sm:text-3xl`}
                        />
                    </div>
                    <div>
                        <button type="submit" data-gtm-id="auth-otp-verify-submit" disabled={loading || otp.length < 6} className={submitButtonClasses}>
                            {loading ? 'Verificando...' : 'Verificar y Continuar'}
                        </button>
                    </div>
                 </form>
                 <button
                    onClick={() => { setView('signIn'); setError(null); }}
                    className="mt-6 text-base sm:text-lg text-gray-500 hover:text-primary-600 min-h-[44px] touch-manipulation inline-flex items-center justify-center"
                 >
                    Cambiar de correo
                 </button>
            </div>
        </div>
    );

     

    return (
     <div className="relative min-h-screen flex items-center justify-center p-4 bg-black">
        {/* Fullscreen Video Background */}
        <div className="absolute inset-0 w-full h-full">
            <video 
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${isVideoLoaded ? 'opacity-100' : 'opacity-0'}`}
                src={proxyImage("https://cufm.mx/wp-content/uploads/2025/04/testomimos-02.mp4")} 
                autoPlay
                loop
                muted 
                playsInline
                onLoadedData={() => setIsVideoLoaded(true)}
            />
            <div className="absolute inset-0 bg-black/40"></div>
        </div>
        <div className="relative w-full max-w-5xl mx-auto bg-transparent rounded-2xl shadow-xl overflow-hidden grid lg:grid-cols-2">
            <div className="relative hidden lg:flex flex-col justify-between h-full p-10 bg-white/60 backdrop-blur-sm text-gray-800 border-r border-white/20">
                <Link to="/" className="transition-transform hover:scale-105">
                    <img src="/images/trefalogo.png" alt="TREFA Logo" className="h-8 mb-2 w-auto" />
                </Link>

                <div className="flex-1 flex flex-col justify-center py-6">
                    <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 leading-tight">
                        Crea tu cuenta <span className="text-primary-600">gratis</span> y sin compromisos
                    </h2>
                    <p className="mt-3 text-base lg:text-lg text-gray-600">Al registrarte podrás:</p>
                                            <ul className="mt-6 space-y-4">
                                                <li>
                                                    <div>
                                                        <h3 className="font-semibold text-gray-900 text-sm lg:text-base">Guardar tus autos favoritos ❤️</h3>
                                                        <p className="text-xs lg:text-sm text-gray-600 mt-0.5">No pierdas de vista los autos que te interesan.</p>
                                                    </div>
                                                </li>
                                                <li>
                                                    <div>
                                                        <h3 className="font-semibold text-gray-900 text-sm lg:text-base">Aplicar a financiamiento en línea 📄</h3>
                                                        <p className="text-xs lg:text-sm text-gray-600 mt-0.5">Inicia tu solicitud 100% digital.</p>
                                                    </div>
                                                </li>
                                                <li>
                                                    <div>
                                                        <h3 className="font-semibold text-gray-900 text-sm lg:text-base">Recibir notificaciones de precios 🔔</h3>
                                                        <p className="text-xs lg:text-sm text-gray-600 mt-0.5">Te avisaremos si el precio baja.</p>
                                                    </div>
                                                </li>
                                                <li>
                                                    <div>
                                                        <h3 className="font-semibold text-gray-900 text-sm lg:text-base">Agendar visitas y pruebas de manejo 🗓️</h3>
                                                        <p className="text-xs lg:text-sm text-gray-600 mt-0.5">Coordina tu visita de forma fácil.</p>
                                                    </div>
                                                </li>
                                            </ul>                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500 border-t border-gray-200 pt-6">
                    <div className="flex -space-x-2">
                        {customerAvatars.map((avatar, index) => (
                            <img
                                key={index}
                                className="w-7 h-7 rounded-full border-2 border-white object-cover"
                                src={avatar}
                                alt={`Cliente satisfecho ${index + 1}`}
                            />
                        ))}
                    </div>
                    <span className="font-medium text-gray-700 text-xs">Únete a cientos de clientes satisfechos</span>
                </div>
            </div>

            <div className="bg-white p-6 sm:p-8 md:p-12 flex flex-col justify-center">
                {view === 'signIn' ? renderSignInView() : renderVerifyOtpView()}
            </div>
        </div>
    </div>
)
};

export default AuthPage;