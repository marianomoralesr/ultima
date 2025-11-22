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
      title: 'Registro Completado',
      description: 'Has creado tu cuenta exitosamente',
      icon: CheckCircle,
      completed: true, // Always completed since user is in dashboard
    },
    {
      title: 'Perfilamiento Bancario',
      description: 'Completa tu perfil bancario para solicitudes de crédito',
      icon: User,
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

    return (
      <div className="w-full rounded-lg border border-orange-200 bg-orange-50 p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="rounded-full bg-orange-100 p-3">
            <Icon className="h-6 w-6 text-orange-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {stepData.title}
            </h3>
            <p className="text-gray-600 mb-4">
              {stepData.description}
            </p>
            {step === 1 && (
              <div className="text-sm text-green-600 font-medium">
                ✓ Este paso ya está completado
              </div>
            )}
            {step === 2 && (
              <div className="space-y-2">
                <p className="text-sm text-gray-700">Para continuar, necesitas:</p>
                <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                  <li>Información de ingresos mensuales</li>
                  <li>Historial crediticio</li>
                  <li>Referencias bancarias</li>
                </ul>
              </div>
            )}
            {step === 3 && (
              <div className="space-y-2">
                <p className="text-sm text-gray-700">En este paso podrás:</p>
                <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                  <li>Explorar vehículos disponibles</li>
                  <li>Comparar opciones de financiamiento</li>
                  <li>Calcular pagos mensuales</li>
                </ul>
              </div>
            )}
            {step === 4 && (
              <div className="space-y-2">
                <p className="text-sm text-gray-700">Documentos requeridos:</p>
                <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                  <li>Identificación oficial</li>
                  <li>Comprobante de domicilio</li>
                  <li>Comprobante de ingresos</li>
                </ul>
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
            {Math.round(((currentStep - 1) / 4) * 100)}% completado
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-orange-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentStep - 1) / 4) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default OnboardingStepper;