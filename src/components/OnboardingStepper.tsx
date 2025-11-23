'use client';

import React from 'react';
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
}) => {
  // Define the onboarding steps
  const steps = [
    {
      title: 'Información Personal',
      description: 'Completa tu perfil personal',
      icon: User,
      completed: currentStep > 1,
    },
    {
      title: 'Perfilamiento Bancario',
      description: 'Completa tu perfil bancario para solicitudes de crédito',
      icon: FileText,
      completed: currentStep > 2,
    },
    {
      title: 'Seleccionar Vehículo',
      description: 'Explora nuestro inventario y selecciona tu vehículo ideal',
      icon: Car,
      completed: currentStep > 3,
    },
    {
      title: 'Enviar Solicitud',
      description: 'Completa y envía tu solicitud de financiamiento',
      icon: Send,
      completed: currentStep > 4,
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

    return (
      <div className={`w-full rounded-lg border ${cardBorderColor} ${cardBgColor} p-6 shadow-sm`}>
        <div className="flex items-start gap-4">
          <div className={`rounded-full ${iconBgColor} p-3`}>
            <Icon className={`h-6 w-6 ${iconColor}`} />
          </div>
          <div className="flex-1">
            {step === 1 && currentStep === 1 && (
              <>
                <p className="text-gray-700 mb-4">
                  Para continuar necesitas terminar de llenar tu información de perfil
                </p>
                <button
                  onClick={() => window.location.href = '/escritorio/profile'}
                  className="inline-flex items-center px-4 py-2 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700 transition-colors"
                >
                  Completar Perfil
                </button>
              </>
            )}
            {step === 2 && currentStep === 2 && (
              <>
                <div className="flex items-start gap-2 mb-4">
                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <p className="text-gray-700 font-medium">
                    Cumples con los requisitos para iniciar tu perfilamiento bancario
                  </p>
                </div>
                <button
                  onClick={() => window.location.href = '/escritorio/profile?tab=perfil-bancario'}
                  className="inline-flex items-center px-4 py-2 bg-green-700 text-white text-sm font-medium rounded-lg hover:bg-green-800 transition-colors shadow-sm"
                >
                  Comenzar Perfilacion Bancaria
                </button>
              </>
            )}
            {step === 3 && currentStep === 3 && (
              <div className="space-y-3">
                <p className="text-gray-700">Ya puedes seleccionar tu vehículo para continuar con tu solicitud.</p>
                <button
                  onClick={() => window.location.href = '/escritorio/aplicacion'}
                  className="inline-flex items-center px-4 py-2 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700 transition-colors"
                >
                  Seleccionar Vehículo
                </button>
              </div>
            )}
            {step === 4 && currentStep === 4 && (
              <div className="space-y-3">
                <p className="text-gray-700">Completa y envía tu solicitud de financiamiento.</p>
                <button
                  onClick={() => window.location.href = '/escritorio/aplicacion'}
                  className="inline-flex items-center px-4 py-2 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700 transition-colors"
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
    <div className={`w-full ${className}`}>
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          Proceso de Financiamiento
        </h2>
        <p className="text-gray-600 mt-1">
          Sigue estos pasos para completar tu solicitud de crédito automotriz
        </p>
      </div>

      {/* Stepper Component */}
      <InteractiveStepper defaultValue={currentStep} className="w-full">
        {steps.map((step, index) => (
          <InteractiveStepperItem key={index + 1} completed={step.completed}>
            <InteractiveStepperTrigger
              onClick={() => onStepClick?.(index + 1)}
            >
              <InteractiveStepperIndicator />
              <div>
                <InteractiveStepperTitle>{step.title}</InteractiveStepperTitle>
                <InteractiveStepperDescription>
                  {index === 0 ? 'Completado' : index < currentStep - 1 ? 'Completado' : index === currentStep - 1 ? 'Paso actual' : 'Pendiente'}
                </InteractiveStepperDescription>
              </div>
            </InteractiveStepperTrigger>
            {index < steps.length - 1 && <InteractiveStepperSeparator />}
          </InteractiveStepperItem>
        ))}

        {/* Step Contents */}
        {steps.map((_, index) => (
          <InteractiveStepperContent key={index + 1} step={index + 1}>
            <StepContent step={index + 1} />
          </InteractiveStepperContent>
        ))}
      </InteractiveStepper>

      {/* Progress Indicator */}
      <div className="mt-6 bg-gray-100 rounded-lg p-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">
            Progreso del proceso
          </span>
          <span className="text-sm font-medium text-orange-600">
            {currentStep === 1 ? '25' : currentStep === 2 ? '50' : currentStep === 3 ? '75' : '100'}% completado
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-orange-600 h-2 rounded-full transition-all duration-300"
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