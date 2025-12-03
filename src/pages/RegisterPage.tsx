import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Checkbox } from '../components/ui/checkbox';
import { CheckCircleIcon, ArrowLeftIcon } from '../components/icons';
import useSEO from '../hooks/useSEO';

type RegisterStep = 'form' | 'verify_sms' | 'complete';

const RegisterPage: React.FC = () => {
  useSEO({
    title: 'Crear Cuenta | Portal TREFA',
    description: 'Crea tu cuenta en TREFA para acceder a nuestros servicios de financiamiento automotriz.',
    keywords: 'registro trefa, crear cuenta, nueva cuenta'
  });

  const [step, setStep] = useState<RegisterStep>('form');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Datos del formulario
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  // OTP de SMS
  const [smsOtp, setSmsOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  // Generar código OTP de 6 dígitos
  const generateOtp = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  // Enviar código SMS
  const sendSmsOtp = async () => {
    try {
      setLoading(true);
      setError(null);

      const otp = generateOtp();

      // Llamar a la Edge Function para enviar SMS
      const { data, error: smsError } = await supabase.functions.invoke('send-sms-otp', {
        body: { phone, otp }
      });

      if (smsError) {
        console.error('Error enviando SMS:', smsError);
        throw new Error('No se pudo enviar el código SMS. Verifica tu número de teléfono.');
      }

      console.log('SMS enviado exitosamente:', data);
      setOtpSent(true);
      setStep('verify_sms');
    } catch (err: any) {
      console.error('Error en sendSmsOtp:', err);
      setError(err.message || 'Error al enviar código SMS');
    } finally {
      setLoading(false);
    }
  };

  // Verificar código SMS
  const verifySmsOtp = async () => {
    try {
      setLoading(true);
      setError(null);

      // Verificar el código OTP usando la función RPC
      const { data, error: verifyError } = await supabase.rpc('verify_sms_otp', {
        p_phone: phone.startsWith('+') ? phone : `+52${phone.replace(/\D/g, '')}`,
        p_otp_code: smsOtp
      });

      if (verifyError) {
        console.error('Error verificando OTP:', verifyError);
        throw new Error('Error al verificar el código');
      }

      if (!data || !data.success) {
        throw new Error(data?.message || 'Código inválido o expirado');
      }

      console.log('✅ Código SMS verificado exitosamente');

      // Ahora crear el usuario en Supabase Auth
      await createUserAccount();

    } catch (err: any) {
      console.error('Error en verifySmsOtp:', err);
      setError(err.message || 'Código inválido. Por favor, intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  // Crear cuenta de usuario
  const createUserAccount = async () => {
    try {
      setLoading(true);
      setError(null);

      // Crear usuario con email OTP (sin contraseña)
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password: Math.random().toString(36).slice(-16), // Contraseña temporal aleatoria
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            phone: phone,
          },
          emailRedirectTo: `${window.location.origin}/auth`,
        }
      });

      if (signUpError) {
        console.error('Error al crear cuenta:', signUpError);

        // Si el usuario ya existe, redirigir al login
        if (signUpError.message.includes('already registered')) {
          throw new Error('Este correo electrónico ya está registrado. Por favor, inicia sesión.');
        }

        throw signUpError;
      }

      if (!authData.user) {
        throw new Error('No se pudo crear la cuenta');
      }

      console.log('✅ Usuario creado exitosamente:', authData.user.id);

      // Actualizar el perfil con los datos completos (el trigger ya creó el perfil básico)
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          first_name: firstName,
          last_name: lastName,
          phone: phone,
        })
        .eq('id', authData.user.id);

      if (updateError) {
        console.error('⚠️ Error actualizando perfil:', updateError);
        // No fallar si no se puede actualizar el perfil
      }

      setStep('complete');

      // Redirigir después de 2 segundos
      setTimeout(() => {
        navigate('/auth');
      }, 2000);

    } catch (err: any) {
      console.error('Error creando cuenta:', err);
      setError(err.message || 'Error al crear la cuenta');
      setLoading(false);
    }
  };

  // Manejar envío del formulario inicial
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!firstName.trim() || !lastName.trim() || !email.trim() || !phone.trim()) {
      setError('Por favor, completa todos los campos');
      return;
    }

    if (!acceptedTerms) {
      setError('Debes aceptar los términos y condiciones');
      return;
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Por favor, ingresa un correo electrónico válido');
      return;
    }

    // Validar teléfono (10 dígitos)
    const phoneDigits = phone.replace(/\D/g, '');
    if (phoneDigits.length !== 10) {
      setError('Por favor, ingresa un número de teléfono válido de 10 dígitos');
      return;
    }

    await sendSmsOtp();
  };

  // Formulario de registro inicial
  const renderFormStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <Link to="/" className="inline-block mb-6">
          <img src="/images/trefalogo.png" alt="TREFA Logo" className="h-12 w-auto mx-auto" />
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Crea tu cuenta</h1>
        <p className="mt-2 text-gray-600">
          Completa tus datos para empezar
        </p>
      </div>

      {error && (
        <div className="p-3 rounded-md bg-red-50 border border-red-200">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="firstName">Nombre</Label>
          <Input
            id="firstName"
            type="text"
            placeholder="Tu nombre"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="lastName">Apellido</Label>
          <Input
            id="lastName"
            type="text"
            placeholder="Tu apellido"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="phone">Teléfono celular</Label>
          <Input
            id="phone"
            type="tel"
            placeholder="55 1234 5678"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            className="mt-1"
            maxLength={10}
          />
          <p className="text-xs text-gray-500 mt-1">
            Te enviaremos un código de verificación por SMS
          </p>
        </div>

        <div>
          <Label htmlFor="email">Correo electrónico</Label>
          <Input
            id="email"
            type="email"
            placeholder="tu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mt-1"
          />
        </div>

        <div className="flex items-start gap-3">
          <Checkbox
            id="terms"
            checked={acceptedTerms}
            onCheckedChange={(checked) => setAcceptedTerms(checked as boolean)}
            className="mt-1"
          />
          <Label htmlFor="terms" className="text-sm text-gray-600 cursor-pointer">
            Acepto los{' '}
            <Link to="/terminos" className="text-primary-600 hover:underline">
              Términos y Condiciones
            </Link>{' '}
            y la{' '}
            <Link to="/privacidad" className="text-primary-600 hover:underline">
              Política de Privacidad
            </Link>
          </Label>
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={loading}
        >
          {loading ? 'Enviando código...' : 'Continuar'}
        </Button>
      </form>

      <div className="text-center text-sm text-gray-600">
        ¿Ya tienes cuenta?{' '}
        <Link to="/auth" className="text-primary-600 hover:underline font-medium">
          Inicia sesión
        </Link>
      </div>
    </div>
  );

  // Pantalla de verificación SMS
  const renderVerifySmsStep = () => (
    <div className="space-y-6">
      <button
        onClick={() => {
          setStep('form');
          setError(null);
          setSmsOtp('');
        }}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
      >
        <ArrowLeftIcon className="w-4 h-4" />
        Volver
      </button>

      <div className="text-center">
        <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900">Verifica tu teléfono</h2>
        <p className="mt-2 text-gray-600">
          Hemos enviado un código de 6 dígitos al número
        </p>
        <p className="font-semibold text-gray-900 mt-1">{phone}</p>
      </div>

      {error && (
        <div className="p-3 rounded-md bg-red-50 border border-red-200">
          <p className="text-red-600 text-sm text-center">{error}</p>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <Label htmlFor="smsOtp">Código de verificación</Label>
          <Input
            id="smsOtp"
            type="text"
            inputMode="numeric"
            placeholder="000000"
            value={smsOtp}
            onChange={(e) => setSmsOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
            className="text-center text-2xl tracking-widest font-mono mt-1"
            maxLength={6}
            required
          />
        </div>

        <Button
          onClick={verifySmsOtp}
          className="w-full"
          disabled={loading || smsOtp.length !== 6}
        >
          {loading ? 'Verificando...' : 'Verificar y crear cuenta'}
        </Button>

        <button
          onClick={sendSmsOtp}
          disabled={loading}
          className="w-full text-center text-sm text-gray-600 hover:text-primary-600 underline"
        >
          Reenviar código
        </button>
      </div>
    </div>
  );

  // Pantalla de cuenta creada
  const renderCompleteStep = () => (
    <div className="space-y-6 text-center">
      <CheckCircleIcon className="w-20 h-20 text-green-500 mx-auto" />
      <div>
        <h2 className="text-2xl font-bold text-gray-900">¡Cuenta creada exitosamente!</h2>
        <p className="mt-2 text-gray-600">
          Redirigiendo al inicio de sesión...
        </p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8">
        {step === 'form' && renderFormStep()}
        {step === 'verify_sms' && renderVerifySmsStep()}
        {step === 'complete' && renderCompleteStep()}
      </div>
    </div>
  );
};

export default RegisterPage;
