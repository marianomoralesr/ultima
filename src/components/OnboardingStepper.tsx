'use client';

import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  InteractiveStepper,
  InteractiveStepperContent,
  InteractiveStepperDescription,
  InteractiveStepperIndicator,
  InteractiveStepperItem,
  InteractiveStepperSeparator,
  InteractiveStepperTitle,
  InteractiveStepperTrigger,
} from '@/components/ui/interactive-stepper';
import { CheckCircle, FileText, Car, Send, User } from 'lucide-react';
import { useScrollToTop } from '@/hooks/useScrollToTop';

interface OnboardingStepperProps {
  /**
   * Current step of the onboarding process (1-4)
   * Pass this prop to control which step is active
   */
  currentStep?: number;
  /**
   * Optional callback when a step is clicked
   */
  onStepClick?: (step: number) => void;
  /**
   * Optional className for custom styling
   */
  className?: string;
  /**
   * Whether the user's profile is complete (for conditional Step 2 logic)
   */
  isProfileComplete?: boolean;
  /**
   * User's first name for personalized messages (from nombre_completo field)
   * If undefined, personalized message won't be shown
   */
  userName?: string;
}

/**
 * Onboarding Stepper Component
 *
 * INTEGRATION INSTRUCTIONS:
 *
 * 1. Import this component in your DashboardPage:
 *    import { OnboardingStepper } from '@/components/OnboardingStepper';
 *
 * 2. Add state to track the current onboarding step in your dashboard:
 *    const [onboardingStep, setOnboardingStep] = useState(1);
 *
 * 3. Add state to track if user has completed onboarding:
 *    const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
 *
 * 4. Render the component conditionally at the top of your dashboard:
 *    {!hasCompletedOnboarding && (
 *      <div className="mb-8">
 *        <OnboardingStepper
 *          currentStep={onboardingStep}
 *          onStepClick={(step) => {
 *            // Handle step navigation if needed
 *            console.log('User clicked step:', step);
 *          }}
 *        />
 *      </div>
 *    )}
 *
 * 5. Update the step based on user actions:
 *    - Step 1 is already completed (registration)
 *    - Move to step 2 when user starts banking profile
 *    - Move to step 3 when banking profile is complete
 *    - Move to step 4 when vehicle is selected
 *    - Hide stepper when application is submitted
 *
 * Example implementation:
 * ```tsx
 * const DashboardPage = () => {
 *   const [onboardingStep, setOnboardingStep] = useState(2); // Start at step 2 since registration is done
 *   const [showOnboarding, setShowOnboarding] = useState(true);
 *
 *   // Update step based on user progress
 *   useEffect(() => {
 *     if (user?.bankingProfileCompleted) {
 *       setOnboardingStep(3);
 *     }
 *     if (user?.vehicleSelected) {
 *       setOnboardingStep(4);
 *     }
 *     if (user?.applicationSubmitted) {
 *       setShowOnboarding(false);
 *     }
 *   }, [user]);
 *
 *   return (
 *     <div>
 *       {showOnboarding && (
 *         <OnboardingStepper currentStep={onboardingStep} />
 *       )}
 *       // Rest of dashboard content
 *     </div>
 *   );
 * };
 * ```
 */
export const OnboardingStepper: React.FC<OnboardingStepperProps> = ({
  currentStep = 1,
  onStepClick,
  className = '',
  isProfileComplete = false,
  userName,
}) => {
  const navigate = useNavigate();
  const scrollToTop = useScrollToTop();

  // Define the onboarding steps with new descriptions
  const steps = [
    {
      title: 'Registro Completado',
      description: '¡Completado!',
      icon: User,
      completed: currentStep > 1,
      timeEstimate: '',
    },
    {
      title: 'Perfilamiento Bancario',
      description: '(menos de un minuto)',
      icon: FileText,
      completed: currentStep > 2,
      timeEstimate: 'menos de un minuto',
    },
    {
      title: 'Elige tu Auto',
      description: 'Personalizado para ti',
      icon: Car,
      completed: currentStep > 3,
      timeEstimate: '',
    },
    {
      title: 'Envía solicitud y documentos',
      description: '(menos de 3 minutos) ¡Así de fácil!',
      icon: Send,
      completed: currentStep > 4,
      timeEstimate: 'menos de 3 minutos',
    },
  ];

  // Card component for content display - Always shows information for current step
  const StepContent: React.FC<{ step: number }> = ({ step }) => {
    // Only show content for the current step
    if (step !== currentStep) {
      return null;
    }

    const stepData = steps[step - 1];
    const Icon = stepData.icon;

    // Current active step - light green
    const cardBgColor = 'bg-green-50';
    const cardBorderColor = 'border-green-200';
    const iconBgColor = 'bg-green-100';
    const iconColor = 'text-green-600';

    // Step 1 - Registration Complete
    if (step === 1) {
      return (
        <div className={`w-full rounded-lg border ${cardBorderColor} ${cardBgColor} p-6 shadow-sm`}>
          <div className="flex items-start gap-4">
            <div className={`rounded-full ${iconBgColor} p-3`}>
              <Icon className={`h-6 w-6 ${iconColor}`} />
            </div>
            <div className="flex-1 space-y-4">
              {!isProfileComplete ? (
                <>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Completa tu Perfil</h3>
                    <p className="text-gray-700">
                      Para continuar necesitas terminar de llenar tu información de perfil
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      scrollToTop();
                      navigate('/escritorio/profile');
                    }}
                    className="inline-flex items-center px-4 py-2 bg-green-700 text-white text-sm font-medium rounded-lg hover:bg-green-800 transition-colors shadow-sm"
                  >
                    Completar Perfil
                  </button>
                </>
              ) : (
                <>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">¡Perfil Completo!</h3>
                    <p className="text-gray-700">
                      ¡Todo listo para comenzar tu perfilamiento bancario!
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      scrollToTop();
                      navigate('/escritorio/perfilacion-bancaria');
                    }}
                    className="inline-flex items-center px-4 py-2 bg-green-700 text-white text-sm font-medium rounded-lg hover:bg-green-800 transition-colors shadow-sm"
                  >
                    Comenzar perfilamiento
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      );
    }

    // Step 2 - Banking Profile
    if (step === 2) {
      return (
        <div className={`w-full rounded-lg border ${cardBorderColor} ${cardBgColor} p-6 shadow-sm`}>
          <div className="flex items-start gap-4">
            <div className={`rounded-full ${iconBgColor} p-3`}>
              <Icon className={`h-6 w-6 ${iconColor}`} />
            </div>
            <div className="flex-1 space-y-4">
              {/* Show positive personalized message only if userName exists */}
              {userName && (
                <div className="flex items-start gap-3 bg-white p-4 rounded-lg border-2 border-green-300">
                  <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-gray-900 font-semibold text-base">
                      {userName}, ¡tu registro fue exitoso y cumples con las condiciones para continuar!
                    </p>
                    <p className="text-gray-700 text-sm mt-1">
                      Estás muy cerca de reservar tu vehículo ideal 🚗
                    </p>
                  </div>
                </div>
              )}

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Perfilamiento Bancario</h3>
                <p className="text-gray-700 text-sm">
                  Completa tu información bancaria para que podamos evaluar las mejores opciones de financiamiento para ti.
                </p>
              </div>

              {/* Conditional CTA based on profile completion */}
              {isProfileComplete ? (
                <button
                  onClick={() => {
                    scrollToTop();
                    navigate('/escritorio/perfilacion-bancaria');
                  }}
                  className="inline-flex items-center px-4 py-2 bg-green-700 text-white text-sm font-medium rounded-lg hover:bg-green-800 transition-colors shadow-sm"
                >
                  Comenzar perfilamiento bancario ahora
                </button>
              ) : (
                <button
                  onClick={() => {
                    scrollToTop();
                    navigate('/escritorio/profile');
                  }}
                  className="inline-flex items-center px-4 py-2 bg-green-700 text-white text-sm font-medium rounded-lg hover:bg-green-800 transition-colors shadow-sm"
                >
                  Completar la información de mi perfil
                </button>
              )}
            </div>
          </div>
        </div>
      );
    }

    // Step 3 - Vehicle Selection
    if (step === 3) {
      return (
        <div className={`w-full rounded-lg border ${cardBorderColor} ${cardBgColor} p-6 shadow-sm`}>
          <div className="flex items-start gap-4">
            <div className={`rounded-full ${iconBgColor} p-3`}>
              <Icon className={`h-6 w-6 ${iconColor}`} />
            </div>
            <div className="flex-1 space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Selecciona tu Vehículo</h3>
                <p className="text-gray-700 text-sm">
                  Ya puedes seleccionar tu vehículo. Explora nuestro inventario y elige el auto que mejor se adapte a tus necesidades.
                </p>
              </div>
              <button
                onClick={() => {
                  scrollToTop();
                  navigate('/escritorio/aplicacion');
                }}
                className="inline-flex items-center px-4 py-2 bg-green-700 text-white text-sm font-medium rounded-lg hover:bg-green-800 transition-colors shadow-sm"
              >
                Seleccionar Vehículo
              </button>
            </div>
          </div>
        </div>
      );
    }

    // Step 4 - Submit Application
    if (step === 4) {
      return (
        <div className={`w-full rounded-lg border ${cardBorderColor} ${cardBgColor} p-6 shadow-sm`}>
          <div className="flex items-start gap-4">
            <div className={`rounded-full ${iconBgColor} p-3`}>
              <Icon className={`h-6 w-6 ${iconColor}`} />
            </div>
            <div className="flex-1 space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Envía tu Solicitud</h3>
                <p className="text-gray-700 text-sm">
                  Completa y envía tu solicitud junto con los documentos requeridos. Nuestro equipo la revisará y te contactará pronto.
                </p>
              </div>
              <button
                onClick={() => {
                  scrollToTop();
                  navigate('/escritorio/aplicacion');
                }}
                className="inline-flex items-center px-4 py-2 bg-green-700 text-white text-sm font-medium rounded-lg hover:bg-green-800 transition-colors shadow-sm"
              >
                Enviar Solicitud
              </button>
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className={`w-full ${className} hidden md:block`}>
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">
          Proceso de Financiamiento
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          Sigue estos pasos para completar tu solicitud de crédito automotriz
        </p>
      </div>

      {/* Stepper Component with shadcn styling */}
      <InteractiveStepper defaultValue={currentStep} className="w-full">
        {steps.map((step, index) => (
          <InteractiveStepperItem key={index + 1} completed={step.completed}>
            <InteractiveStepperTrigger
              onClick={() => onStepClick?.(index + 1)}
              className="flex flex-col items-start gap-2 w-full"
            >
              <InteractiveStepperIndicator />
              <div className="flex flex-col gap-1">
                <InteractiveStepperTitle className="text-sm font-semibold text-left">
                  {step.title}
                </InteractiveStepperTitle>
                <InteractiveStepperDescription className="text-xs text-muted-foreground text-left">
                  {step.description}
                </InteractiveStepperDescription>
              </div>
            </InteractiveStepperTrigger>
            {index < steps.length - 1 && <InteractiveStepperSeparator />}
          </InteractiveStepperItem>
        ))}
      </InteractiveStepper>

      {/* Progress Indicator - Moved between steps and content */}
      <div className="mt-6 mb-6 bg-muted/50 rounded-lg p-4 border border-border">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-medium text-muted-foreground">
            Progreso del proceso
          </span>
          <span className="text-xs font-bold text-primary">
            {currentStep === 1 ? '25' : currentStep === 2 ? '50' : currentStep === 3 ? '75' : '99'}% completado
          </span>
        </div>
        <div className="w-full bg-secondary rounded-full h-2">
          <div
            className="bg-primary h-2 rounded-full transition-all duration-500 ease-out"
            style={{
              width: currentStep === 1 ? '25%' : currentStep === 2 ? '50%' : currentStep === 3 ? '75%' : '99%'
            }}
          />
        </div>
      </div>

      {/* Step Content - Always visible with information */}
      <div className="w-full">
        <InteractiveStepper defaultValue={currentStep}>
          {steps.map((_, index) => (
            <InteractiveStepperContent key={index + 1} step={index + 1}>
              <StepContent step={index + 1} />
            </InteractiveStepperContent>
          ))}
        </InteractiveStepper>
      </div>
    </div>
  );
};

export default OnboardingStepper;