import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { Label } from '../components/ui/label';
import { Separator } from '../components/ui/separator';
import QRCode from 'qrcode';
import { supabase } from '../../supabaseClient';
import { toast } from 'sonner';
import { Gift, Lock, ArrowRight, ArrowLeft } from 'lucide-react';

// Compact, focused survey questions
const surveyQuestions = [
  // Demographics
  {
    id: 'age',
    question: '¿Cuál es tu rango de edad?',
    type: 'multiple-choice',
    options: [
      { value: '18-24', label: '18-24 años' },
      { value: '25-34', label: '25-34 años' },
      { value: '35-44', label: '35-44 años' },
      { value: '45-54', label: '45-54 años' },
      { value: '55+', label: '55+ años' }
    ]
  },
  {
    id: 'gender',
    question: '¿Cómo te identificas?',
    type: 'multiple-choice',
    options: [
      { value: 'masculino', label: 'Masculino' },
      { value: 'femenino', label: 'Femenino' },
      { value: 'otro', label: 'Otro' },
      { value: 'prefiero-no-decir', label: 'Prefiero no decir' }
    ]
  },
  {
    id: 'location',
    question: '¿En qué zona te encuentras?',
    type: 'multiple-choice',
    options: [
      { value: 'monterrey-centro', label: 'Monterrey Centro' },
      { value: 'san-pedro', label: 'San Pedro' },
      { value: 'santa-catarina', label: 'Santa Catarina' },
      { value: 'guadalupe', label: 'Guadalupe' },
      { value: 'san-nicolas', label: 'San Nicolás' },
      { value: 'apodaca', label: 'Apodaca' },
      { value: 'escobedo', label: 'Escobedo' },
      { value: 'otra-area-metro', label: 'Otra área metropolitana' },
      { value: 'fuera-monterrey', label: 'Fuera de Monterrey' }
    ]
  },
  {
    id: 'income',
    question: '¿Cuál es tu rango de ingreso mensual?',
    type: 'multiple-choice',
    options: [
      { value: 'menos-15k', label: 'Menos de $15,000' },
      { value: '15k-30k', label: '$15,000 - $30,000' },
      { value: '30k-50k', label: '$30,000 - $50,000' },
      { value: '50k-80k', label: '$50,000 - $80,000' },
      { value: '80k-120k', label: '$80,000 - $120,000' },
      { value: 'mas-120k', label: 'Más de $120,000' }
    ]
  },

  // How they found us
  {
    id: 'source',
    question: '¿Cómo nos conociste?',
    type: 'multiple-choice',
    options: [
      { value: 'google', label: 'Google/Búsqueda en internet' },
      { value: 'facebook', label: 'Facebook' },
      { value: 'instagram', label: 'Instagram' },
      { value: 'tiktok', label: 'TikTok' },
      { value: 'youtube', label: 'YouTube' },
      { value: 'recomendacion', label: 'Recomendación de conocido' },
      { value: 'publicidad', label: 'Publicidad (anuncios)' },
      { value: 'otro', label: 'Otro' }
    ]
  },

  // Trust factors
  {
    id: 'trust',
    question: '¿Qué fue lo que más te generó confianza en TREFA?',
    type: 'multiple-choice',
    options: [
      { value: 'transparencia-precios', label: 'Transparencia en precios' },
      { value: 'variedad-inventario', label: 'Variedad de inventario' },
      { value: 'plataforma-profesional', label: 'Plataforma profesional' },
      { value: 'opiniones-clientes', label: 'Opiniones de otros clientes' },
      { value: 'facilidad-proceso', label: 'Facilidad del proceso' },
      { value: 'atencion-personalizada', label: 'Atención personalizada' }
    ]
  },

  // What we could improve
  {
    id: 'improvement',
    question: '¿En qué podríamos mejorar?',
    type: 'multiple-choice',
    options: [
      { value: 'mas-inventario', label: 'Más variedad de inventario' },
      { value: 'mejores-precios', label: 'Mejores precios' },
      { value: 'mas-informacion', label: 'Más información de vehículos' },
      { value: 'proceso-mas-rapido', label: 'Proceso más rápido' },
      { value: 'mejor-comunicacion', label: 'Mejor comunicación' },
      { value: 'todo-bien', label: 'Todo está bien' }
    ]
  },

  // What they don't like
  {
    id: 'dislike',
    question: '¿Qué es lo que menos te gusta actualmente?',
    type: 'multiple-choice',
    options: [
      { value: 'tiempo-respuesta', label: 'Tiempo de respuesta' },
      { value: 'falta-opciones', label: 'Falta de opciones de pago' },
      { value: 'proceso-complicado', label: 'Proceso complicado' },
      { value: 'poca-transparencia', label: 'Poca transparencia' },
      { value: 'nada', label: 'No tengo quejas' }
    ]
  },

  // Importance of financing - Horizontal rating
  {
    id: 'financing-importance',
    question: '¿Qué tan importante es el financiamiento para tu compra?',
    type: 'rating-horizontal',
    min: 1,
    max: 10,
    labels: {
      min: 'Nada importante',
      max: 'Muy importante'
    }
  },

  // Overall satisfaction - 4 point scale
  {
    id: 'satisfaction',
    question: '¿Qué tan satisfecho estás con tu experiencia en TREFA?',
    type: 'likert-4',
    options: [
      { value: '1', label: 'Insatisfecho' },
      { value: '2', label: 'Poco satisfecho' },
      { value: '3', label: 'Satisfecho' },
      { value: '4', label: 'Muy satisfecho' }
    ]
  },

  // NPS - Horizontal rating
  {
    id: 'nps',
    question: '¿Qué tan probable es que recomiendes TREFA a un amigo?',
    type: 'rating-horizontal',
    min: 0,
    max: 10,
    labels: {
      min: 'Nada probable',
      max: 'Muy probable'
    }
  }
];

const AnonymousSurveyPage: React.FC = () => {
  const [showWelcome, setShowWelcome] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isCompleted, setIsCompleted] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const progress = ((currentQuestion + 1) / surveyQuestions.length) * 100;

  const generateCouponCode = () => {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 7);
    return `TREFA${timestamp}${random}`.toUpperCase();
  };

  const saveSurveyResponse = async (surveyData: any) => {
    try {
      const { error } = await supabase
        .from('anonymous_survey_responses')
        .insert([
          {
            responses: surveyData,
            coupon_code: surveyData.coupon_code,
            completed_at: new Date().toISOString()
          }
        ]);

      if (error) {
        console.error('Error saving survey:', error);
      }
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const handleAnswer = (value: string) => {
    setAnswers(prev => ({
      ...prev,
      [surveyQuestions[currentQuestion].id]: value
    }));
  };

  const handleNext = () => {
    if (currentQuestion < surveyQuestions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  const handleComplete = async () => {
    setIsSubmitting(true);

    const code = generateCouponCode();
    setCouponCode(code);

    const surveyData = {
      answers,
      coupon_code: code,
      timestamp: new Date().toISOString()
    };

    await saveSurveyResponse(surveyData);

    try {
      const qrUrl = await QRCode.toDataURL(code, {
        width: 300,
        margin: 2,
        color: {
          dark: '#ea580c',
          light: '#FFFFFF'
        }
      });
      setQrCodeUrl(qrUrl);
    } catch (err) {
      console.error('Error generating QR:', err);
    }

    setIsCompleted(true);
    setIsSubmitting(false);
    toast.success('¡Gracias por completar la encuesta!');
  };

  const currentQuestionData = surveyQuestions[currentQuestion];
  const isAnswered = answers[currentQuestionData?.id] !== undefined;

  // Welcome Screen
  if (showWelcome) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <Card className="shadow-2xl border-orange-200">
            <CardHeader className="text-center space-y-6 pb-8">
              <div className="mx-auto w-20 h-20 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center shadow-lg">
                <Gift className="w-10 h-10 text-white" />
              </div>
              <CardTitle className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent">
                ¡Gana un cupón exclusivo!
              </CardTitle>
              <CardDescription className="text-lg text-gray-700">
                Ayúdanos a mejorar y recibe un regalo especial
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8 pb-8">
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-xl border-2 border-orange-200 space-y-4">
                <div className="flex items-start gap-3">
                  <Lock className="w-5 h-5 text-orange-600 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">100% Anónimo</h3>
                    <p className="text-sm text-gray-700">
                      Tus respuestas son completamente anónimas y confidenciales
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Gift className="w-5 h-5 text-orange-600 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Recibe tu recompensa</h3>
                    <p className="text-sm text-gray-700">
                      Al completar la encuesta recibirás un cupón con promociones y regalos especiales para tu compra
                    </p>
                  </div>
                </div>
              </div>

              <div className="text-center space-y-2">
                <p className="text-2xl font-bold text-gray-900">Solo 11 preguntas</p>
                <p className="text-gray-600">Toma aproximadamente 2 minutos</p>
              </div>

              <Button
                onClick={() => setShowWelcome(false)}
                className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-lg"
              >
                Comenzar encuesta
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>

              <p className="text-center text-sm text-gray-500">
                Al participar aceptas compartir tus respuestas anónimas para mejorar nuestro servicio
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Completion Screen
  if (isCompleted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <Card className="shadow-2xl border-orange-200">
            <CardHeader className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <CardTitle className="text-3xl font-bold text-gray-900">
                ¡Gracias por tu tiempo!
              </CardTitle>
              <CardDescription className="text-lg text-gray-700">
                Tu opinión nos ayuda a mejorar cada día
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center space-y-4">
                <p className="text-gray-700 font-medium">
                  Aquí está tu cupón de descuento exclusivo:
                </p>

                <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-8 rounded-xl border-2 border-orange-300 shadow-inner">
                  <p className="text-sm text-gray-600 mb-2 uppercase tracking-wide">Código de cupón</p>
                  <p className="text-3xl font-bold text-orange-600 mb-6 font-mono tracking-wider">
                    {couponCode}
                  </p>

                  {qrCodeUrl && (
                    <div className="mt-6">
                      <p className="text-sm text-gray-600 mb-3">Escanea este código QR:</p>
                      <div className="bg-white p-4 rounded-lg inline-block shadow-md">
                        <img src={qrCodeUrl} alt="QR Code" className="mx-auto" />
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-amber-50 border-2 border-amber-300 rounded-lg p-4 mt-6">
                  <p className="text-sm text-amber-900 font-medium">
                    <strong>¿Cómo usar tu cupón?</strong><br/>
                    Presenta este código o escanea el QR al momento de tu compra para recibir promociones y regalos especiales.
                  </p>
                </div>

                <div className="mt-8 space-y-3">
                  <Button
                    onClick={() => window.print()}
                    variant="outline"
                    className="w-full border-orange-300 text-orange-700 hover:bg-orange-50"
                  >
                    Imprimir cupón
                  </Button>
                  <Button
                    onClick={() => window.location.href = '/'}
                    className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
                  >
                    Volver al inicio
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Survey Questions
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Progress Bar */}
        <div className="mb-6">
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-orange-500 to-orange-600 h-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Question Card */}
        <Card className="shadow-xl border-orange-100">
          <CardHeader>
            <CardTitle className="text-2xl text-gray-900 leading-relaxed">
              {currentQuestionData?.question}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Horizontal Rating */}
            {currentQuestionData?.type === 'rating-horizontal' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center gap-2 px-2">
                  {Array.from({ length: (currentQuestionData.max - currentQuestionData.min + 1) }, (_, i) => {
                    const value = String(currentQuestionData.min + i);
                    const isSelected = answers[currentQuestionData.id] === value;
                    return (
                      <button
                        key={value}
                        onClick={() => handleAnswer(value)}
                        className={`flex-1 aspect-square max-w-[60px] rounded-lg border-2 font-bold text-lg transition-all ${
                          isSelected
                            ? 'border-orange-500 bg-orange-500 text-white shadow-lg scale-110'
                            : 'border-gray-300 bg-white text-gray-700 hover:border-orange-300 hover:bg-orange-50'
                        }`}
                      >
                        {value}
                      </button>
                    );
                  })}
                </div>
                <div className="flex justify-between text-xs text-gray-600 px-2">
                  <span>{currentQuestionData.labels.min}</span>
                  <span>{currentQuestionData.labels.max}</span>
                </div>
              </div>
            )}

            {/* Multiple Choice / Likert-4 */}
            {(currentQuestionData?.type === 'multiple-choice' || currentQuestionData?.type === 'likert-4') && (
              <RadioGroup
                value={answers[currentQuestionData?.id] || ''}
                onValueChange={handleAnswer}
                className="space-y-3"
              >
                {currentQuestionData?.options.map((option) => (
                  <div
                    key={option.value}
                    className={`flex items-center space-x-3 rounded-lg border-2 p-4 cursor-pointer transition-all ${
                      answers[currentQuestionData.id] === option.value
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-gray-200 hover:border-orange-300 hover:bg-orange-50/50'
                    }`}
                  >
                    <RadioGroupItem value={option.value} id={option.value} className="border-orange-500" />
                    <Label
                      htmlFor={option.value}
                      className="flex-1 cursor-pointer text-base font-medium text-gray-900"
                    >
                      {option.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            )}

            <Separator className="my-6" />

            {/* Navigation Buttons */}
            <div className="flex justify-between items-center gap-4">
              <Button
                onClick={handlePrevious}
                disabled={currentQuestion === 0}
                variant="outline"
                className="px-6 border-gray-300"
              >
                <ArrowLeft className="mr-2 w-4 h-4" />
                Anterior
              </Button>

              <Button
                onClick={handleNext}
                disabled={!isAnswered || isSubmitting}
                className="px-8 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-md"
              >
                {currentQuestion === surveyQuestions.length - 1
                  ? isSubmitting
                    ? 'Enviando...'
                    : 'Finalizar'
                  : 'Siguiente'}
                {currentQuestion < surveyQuestions.length - 1 && (
                  <ArrowRight className="ml-2 w-4 h-4" />
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-6 text-sm text-gray-500 flex items-center justify-center gap-2">
          <Lock className="w-4 h-4" />
          <p>Encuesta 100% anónima y segura</p>
        </div>
      </div>
    </div>
  );
};

export default AnonymousSurveyPage;
