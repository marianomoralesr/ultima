'use client';

import React, { useState, useEffect } from 'react';
import { OnboardingStepper } from '@/components/OnboardingStepper';

/**
 * Example Dashboard Page with Onboarding Stepper
 *
 * This example shows how to integrate the OnboardingStepper component
 * into your dashboard page. The stepper tracks user progress through
 * the onboarding process.
 */
const DashboardWithOnboarding: React.FC = () => {
  // Track the current onboarding step (1-4)
  // Start at step 2 since registration (step 1) is already completed
  const [onboardingStep, setOnboardingStep] = useState(2);

  // Track whether to show the onboarding stepper
  const [showOnboarding, setShowOnboarding] = useState(true);

  // Example user data - replace with actual user data from your auth context
  const user = {
    name: 'Juan Pérez',
    email: 'juan@example.com',
    bankingProfileCompleted: false,
    vehicleSelected: false,
    applicationSubmitted: false,
  };

  // Update onboarding step based on user progress
  useEffect(() => {
    if (user.bankingProfileCompleted && !user.vehicleSelected) {
      setOnboardingStep(3);
    } else if (user.vehicleSelected && !user.applicationSubmitted) {
      setOnboardingStep(4);
    } else if (user.applicationSubmitted) {
      // Hide the onboarding stepper when all steps are complete
      setShowOnboarding(false);
    }
  }, [user.bankingProfileCompleted, user.vehicleSelected, user.applicationSubmitted]);

  // Handle step click - you can add navigation logic here
  const handleStepClick = (step: number) => {
    console.log('User clicked step:', step);
    // Add your navigation logic here
    // For example:
    // if (step === 2) navigate('/banking-profile');
    // if (step === 3) navigate('/vehicles');
    // if (step === 4) navigate('/application');
  };

  // Example functions to simulate user progress
  const completeBankingProfile = () => {
    // Simulate completing banking profile
    setOnboardingStep(3);
  };

  const selectVehicle = () => {
    // Simulate selecting a vehicle
    setOnboardingStep(4);
  };

  const submitApplication = () => {
    // Simulate submitting application
    setShowOnboarding(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Show onboarding stepper if user hasn't completed all steps */}
        {showOnboarding && (
          <div className="mb-8">
            <OnboardingStepper
              currentStep={onboardingStep}
              onStepClick={handleStepClick}
            />
          </div>
        )}

        {/* Main Dashboard Content */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Bienvenido, {user.name}
          </h1>

          <div className="space-y-4">
            <p className="text-gray-600">
              Este es un ejemplo de cómo integrar el OnboardingStepper en tu dashboard.
            </p>

            {/* Example action buttons for testing */}
            <div className="flex gap-4 mt-6">
              <button
                onClick={completeBankingProfile}
                className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors"
                disabled={onboardingStep > 2}
              >
                Completar Perfil Bancario
              </button>

              <button
                onClick={selectVehicle}
                className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors"
                disabled={onboardingStep > 3}
              >
                Seleccionar Vehículo
              </button>

              <button
                onClick={submitApplication}
                className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors"
                disabled={!showOnboarding}
              >
                Enviar Solicitud
              </button>
            </div>

            {/* Status information */}
            <div className="mt-8 p-4 bg-gray-100 rounded-md">
              <h3 className="font-semibold text-gray-900 mb-2">Estado Actual:</h3>
              <ul className="space-y-1 text-sm text-gray-600">
                <li> Registro completado</li>
                <li>{onboardingStep > 2 ? '' : 'Ë'} Perfil bancario completado</li>
                <li>{onboardingStep > 3 ? '' : 'Ë'} Vehículo seleccionado</li>
                <li>{!showOnboarding ? '' : 'Ë'} Solicitud enviada</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Additional dashboard widgets would go here */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="font-semibold text-gray-900 mb-2">Vehículos Disponibles</h3>
            <p className="text-gray-600 text-sm">Explora nuestra selección de vehículos</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="font-semibold text-gray-900 mb-2">Calculadora de Crédito</h3>
            <p className="text-gray-600 text-sm">Calcula tus pagos mensuales</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="font-semibold text-gray-900 mb-2">Documentos</h3>
            <p className="text-gray-600 text-sm">Sube y gestiona tus documentos</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardWithOnboarding;