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

  // Card component for content display
  const StepContent: React.FC<{ step: number }> = ({ step }) => {
    const stepData = steps[step - 1];
    const Icon = stepData.icon;

    // Determine card color based on step status
    let cardBgColor = 'bg-blue-50'; // Current step - light blue
    let cardBorderColor = 'border-blue-200';
    let iconBgColor = 'bg-blue-100';
    let iconColor = 'text-blue-600';

    if (stepData.completed) {
      // Completed steps - light gray
      cardBgColor = 'bg-gray-50';
      cardBorderColor = 'border-gray-200';
      iconBgColor = 'bg-gray-100';
      iconColor = 'text-gray-600';
    } else if (step === currentStep) {
      // Current active step - light green
      cardBgColor = 'bg-green-50';
      cardBorderColor = 'border-green-200';
      iconBgColor = 'bg-green-100';
      iconColor = 'text-green-600';
    }

    // Step 1 - Conditional content based on profile completion
    if (step === 1 && currentStep === 1) {
      return (
        <div className="w-full space-y-4">
          {!isProfileComplete ? (
            <>
              <p className="text-gray-700">
                Para continuar necesitas terminar de llenar tu información de perfil
              </p>
              <button
                onClick={() => window.location.href = '/escritorio/profile'}
                className="inline-flex items-center px-4 py-2 bg-green-700 text-white text-sm font-medium rounded-lg hover:bg-green-800 transition-colors shadow-sm"
              >
                Completar Perfil
              </button>
            </>
          ) : (
            <>
              <p className="text-gray-700 font-semibold">
                ¡Todo listo para comenzar tu perfilamiento bancario!
              </p>
              <button
                onClick={() => window.location.href = '/escritorio/perfilacion-bancaria'}
                className="inline-flex items-center px-4 py-2 bg-green-700 text-white text-sm font-medium rounded-lg hover:bg-green-800 transition-colors shadow-sm"
              >
                Comenzar perfilamiento
              </button>
            </>
          )}
        </div>
      );
    }

    return (
      <div className={`w-full rounded-lg border ${cardBorderColor} ${cardBgColor} p-6 shadow-sm`}>
        <div className="flex items-start gap-4">
          <div className={`rounded-full ${iconBgColor} p-3`}>
            <Icon className={`h-6 w-6 ${iconColor}`} />
          </div>
          <div className="flex-1">
            {step === 2 && currentStep === 2 && (
              <>
                {/* Show positive personalized message only if userName exists */}
                {userName && (
                  <div className="flex items-start gap-3 mb-4 bg-green-50 p-4 rounded-lg border-2 border-green-200">
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
              </>
            )}
            {step === 3 && currentStep === 3 && (
              <div className="space-y-3">
                <p className="text-gray-700">Ya puedes seleccionar tu vehículo.</p>
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
            )}
            {step === 4 && currentStep === 4 && (
              <div className="space-y-3">
                <p className="text-gray-700">Completa y envía tu solicitud.</p>
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
            )}
          </div>
        </div>
      </div>
    );
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
      <InteractiveStepper defaultValue={currentStep} className="w-full mb-6">
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

        {/* Step Contents */}
        {steps.map((_, index) => (
          <InteractiveStepperContent key={index + 1} step={index + 1} className="mt-6">
            <StepContent step={index + 1} />
          </InteractiveStepperContent>
        ))}
      </InteractiveStepper>

      {/* Progress Indicator */}
      <div className="mt-6 bg-muted/50 rounded-lg p-4 border border-border">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-medium text-muted-foreground">
            Progreso del proceso
          </span>
          <span className="text-xs font-bold text-primary">
            {currentStep === 1 ? '25' : currentStep === 2 ? '50' : currentStep === 3 ? '75' : '100'}% completado
          </span>
        </div>
        <div className="w-full bg-secondary rounded-full h-2">
          <div
            className="bg-primary h-2 rounded-full transition-all duration-500 ease-out"
            style={{
              width: currentStep === 1 ? '25%' : currentStep === 2 ? '50%' : currentStep === 3 ? '75%' : '100%'
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default OnboardingStepper;