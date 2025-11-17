import React, { useState } from 'react';
import { Route, Plus, Edit, Trash2, Play, Pause, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../components/ui/dialog';

interface FunnelStep {
  id: string;
  name: string;
  description: string;
  eventType: string;
  order: number;
}

interface CustomerJourney {
  id: string;
  name: string;
  route: string;
  description: string;
  status: 'active' | 'draft' | 'paused';
  steps: FunnelStep[];
  createdAt: string;
  updatedAt: string;
}

const CustomerJourneysPage: React.FC = () => {
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [journeyName, setJourneyName] = useState('');
  const [journeyRoute, setJourneyRoute] = useState('');
  const [journeyDescription, setJourneyDescription] = useState('');
  const [funnelSteps, setFunnelSteps] = useState<FunnelStep[]>([]);
  const [newStepName, setNewStepName] = useState('');
  const [newStepDescription, setNewStepDescription] = useState('');
  const [newStepEventType, setNewStepEventType] = useState('');

  // Initial journey data - Financiamientos
  const [journeys, setJourneys] = useState<CustomerJourney[]>([
    {
      id: '1',
      name: 'Financiamientos',
      route: '/financiamientos',
      description: 'Customer journey from landing page to loan application submission',
      status: 'active',
      steps: [
        {
          id: 'step-1',
          name: 'Visitas Landing Page',
          description: 'PageView a /financiamientos',
          eventType: 'PageView',
          order: 1
        },
        {
          id: 'step-2',
          name: 'Registro Completado',
          description: 'Usuario se registró en la plataforma',
          eventType: 'ConversionLandingPage',
          order: 2
        },
        {
          id: 'step-3',
          name: 'Información Personal',
          description: 'Usuario guardó su perfil personal',
          eventType: 'PersonalInformationComplete',
          order: 3
        },
        {
          id: 'step-4',
          name: 'Aplicación Iniciada',
          description: 'Usuario llegó a /escritorio/aplicacion',
          eventType: 'ComienzaSolicitud',
          order: 4
        },
        {
          id: 'step-5',
          name: 'Solicitud Enviada',
          description: 'Usuario envió solicitud de financiamiento',
          eventType: 'LeadComplete',
          order: 5
        }
      ],
      createdAt: '2024-01-15T00:00:00Z',
      updatedAt: '2024-01-15T00:00:00Z'
    }
  ]);

  const handleAddStep = () => {
    if (newStepName && newStepEventType) {
      const newStep: FunnelStep = {
        id: `step-${Date.now()}`,
        name: newStepName,
        description: newStepDescription,
        eventType: newStepEventType,
        order: funnelSteps.length + 1
      };
      setFunnelSteps([...funnelSteps, newStep]);
      setNewStepName('');
      setNewStepDescription('');
      setNewStepEventType('');
    }
  };

  const handleRemoveStep = (stepId: string) => {
    setFunnelSteps(funnelSteps.filter(step => step.id !== stepId));
  };

  const handleMoveStepUp = (index: number) => {
    if (index > 0) {
      const newSteps = [...funnelSteps];
      [newSteps[index - 1], newSteps[index]] = [newSteps[index], newSteps[index - 1]];
      newSteps.forEach((step, idx) => {
        step.order = idx + 1;
      });
      setFunnelSteps(newSteps);
    }
  };

  const handleMoveStepDown = (index: number) => {
    if (index < funnelSteps.length - 1) {
      const newSteps = [...funnelSteps];
      [newSteps[index], newSteps[index + 1]] = [newSteps[index + 1], newSteps[index]];
      newSteps.forEach((step, idx) => {
        step.order = idx + 1;
      });
      setFunnelSteps(newSteps);
    }
  };

  const handleCreateJourney = () => {
    const newJourney: CustomerJourney = {
      id: `journey-${Date.now()}`,
      name: journeyName,
      route: journeyRoute,
      description: journeyDescription,
      status: 'draft',
      steps: funnelSteps,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setJourneys([...journeys, newJourney]);
    setIsWizardOpen(false);
    resetWizard();
  };

  const resetWizard = () => {
    setCurrentStep(1);
    setJourneyName('');
    setJourneyRoute('');
    setJourneyDescription('');
    setFunnelSteps([]);
    setNewStepName('');
    setNewStepDescription('');
    setNewStepEventType('');
  };

  const toggleJourneyStatus = (journeyId: string) => {
    setJourneys(journeys.map(journey => {
      if (journey.id === journeyId) {
        return {
          ...journey,
          status: journey.status === 'active' ? 'paused' : 'active' as 'active' | 'paused'
        };
      }
      return journey;
    }));
  };

  const deleteJourney = (journeyId: string) => {
    if (confirm('¿Estás seguro de que deseas eliminar este customer journey?')) {
      setJourneys(journeys.filter(journey => journey.id !== journeyId));
    }
  };

  const getStatusColor = (status: CustomerJourney['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const renderWizardStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre del Customer Journey *
              </label>
              <input
                type="text"
                value={journeyName}
                onChange={(e) => setJourneyName(e.target.value)}
                placeholder="ej: Compra de Auto, Venta de Auto, etc."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ruta principal *
              </label>
              <input
                type="text"
                value={journeyRoute}
                onChange={(e) => setJourneyRoute(e.target.value)}
                placeholder="ej: /compra-auto, /venta, etc."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descripción
              </label>
              <textarea
                value={journeyDescription}
                onChange={(e) => setJourneyDescription(e.target.value)}
                placeholder="Describe el customer journey..."
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-indigo-800">
                Define los pasos del funnel en orden. Cada paso representa una acción que el usuario realiza en su journey.
              </p>
            </div>

            {/* List of current steps */}
            {funnelSteps.length > 0 && (
              <div className="space-y-2 mb-4">
                <h4 className="text-sm font-semibold text-gray-700">Pasos configurados ({funnelSteps.length}):</h4>
                {funnelSteps.map((step, index) => (
                  <div key={step.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-500">#{step.order}</span>
                        <span className="font-medium text-gray-900">{step.name}</span>
                        <Badge variant="outline" className="text-xs">{step.eventType}</Badge>
                      </div>
                      {step.description && (
                        <p className="text-xs text-gray-500 mt-1">{step.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleMoveStepUp(index)}
                        disabled={index === 0}
                        className="h-8 w-8 p-0"
                      >
                        ↑
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleMoveStepDown(index)}
                        disabled={index === funnelSteps.length - 1}
                        className="h-8 w-8 p-0"
                      >
                        ↓
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRemoveStep(step.id)}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add new step form */}
            <div className="border-t pt-4 space-y-3">
              <h4 className="text-sm font-semibold text-gray-700">Agregar nuevo paso:</h4>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre del paso *
                </label>
                <input
                  type="text"
                  value={newStepName}
                  onChange={(e) => setNewStepName(e.target.value)}
                  placeholder="ej: Visita Landing Page"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de evento *
                </label>
                <input
                  type="text"
                  value={newStepEventType}
                  onChange={(e) => setNewStepEventType(e.target.value)}
                  placeholder="ej: PageView, ConversionLandingPage, etc."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción (opcional)
                </label>
                <input
                  type="text"
                  value={newStepDescription}
                  onChange={(e) => setNewStepDescription(e.target.value)}
                  placeholder="ej: Usuario llegó a la página de inicio"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <Button onClick={handleAddStep} className="w-full" disabled={!newStepName || !newStepEventType}>
                <Plus className="w-4 h-4 mr-2" />
                Agregar Paso
              </Button>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-semibold text-green-900 mb-2">Resumen del Customer Journey</h4>
              <div className="space-y-3">
                <div>
                  <span className="text-sm font-medium text-green-800">Nombre:</span>
                  <p className="text-gray-900">{journeyName}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-green-800">Ruta:</span>
                  <p className="text-gray-900">{journeyRoute}</p>
                </div>
                {journeyDescription && (
                  <div>
                    <span className="text-sm font-medium text-green-800">Descripción:</span>
                    <p className="text-gray-900">{journeyDescription}</p>
                  </div>
                )}
                <div>
                  <span className="text-sm font-medium text-green-800">Pasos del Funnel:</span>
                  <div className="mt-2 space-y-2">
                    {funnelSteps.map((step, index) => (
                      <div key={step.id} className="flex items-start gap-2 text-sm">
                        <span className="font-bold text-gray-500">{index + 1}.</span>
                        <div>
                          <span className="font-medium text-gray-900">{step.name}</span>
                          <span className="text-gray-600"> ({step.eventType})</span>
                          {step.description && (
                            <p className="text-xs text-gray-500">{step.description}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Customer Journeys</h1>
            <p className="text-gray-600 mt-2">
              Configura y monitorea los customer journeys y funnels de conversión
            </p>
          </div>
          <Dialog open={isWizardOpen} onOpenChange={setIsWizardOpen}>
            <DialogTrigger asChild>
              <Button className="bg-indigo-600 hover:bg-indigo-700">
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Customer Journey
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Crear Customer Journey</DialogTitle>
                <DialogDescription>
                  Paso {currentStep} de 3: {currentStep === 1 ? 'Información básica' : currentStep === 2 ? 'Configurar pasos del funnel' : 'Revisar y confirmar'}
                </DialogDescription>
              </DialogHeader>

              {renderWizardStep()}

              <div className="flex justify-between mt-6 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => {
                    if (currentStep === 1) {
                      setIsWizardOpen(false);
                      resetWizard();
                    } else {
                      setCurrentStep(currentStep - 1);
                    }
                  }}
                >
                  {currentStep === 1 ? 'Cancelar' : 'Anterior'}
                </Button>
                <Button
                  onClick={() => {
                    if (currentStep === 3) {
                      handleCreateJourney();
                    } else {
                      setCurrentStep(currentStep + 1);
                    }
                  }}
                  disabled={
                    (currentStep === 1 && (!journeyName || !journeyRoute)) ||
                    (currentStep === 2 && funnelSteps.length === 0)
                  }
                >
                  {currentStep === 3 ? 'Crear Journey' : 'Siguiente'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Journeys List */}
      <div className="grid grid-cols-1 gap-6">
        {journeys.map((journey) => (
          <Card key={journey.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Route className="w-5 h-5 text-indigo-600" />
                    <CardTitle>{journey.name}</CardTitle>
                    <Badge className={getStatusColor(journey.status)}>
                      {journey.status === 'active' ? 'Activo' : journey.status === 'paused' ? 'Pausado' : 'Borrador'}
                    </Badge>
                  </div>
                  <CardDescription className="text-sm">
                    <span className="font-mono text-indigo-600">{journey.route}</span>
                  </CardDescription>
                  {journey.description && (
                    <p className="text-sm text-gray-600 mt-2">{journey.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toggleJourneyStatus(journey.id)}
                  >
                    {journey.status === 'active' ? (
                      <><Pause className="w-4 h-4 mr-1" /> Pausar</>
                    ) : (
                      <><Play className="w-4 h-4 mr-1" /> Activar</>
                    )}
                  </Button>
                  <Button size="sm" variant="outline">
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => deleteJourney(journey.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Pasos del Funnel ({journey.steps.length})
                </h4>
                <div className="space-y-2">
                  {journey.steps.map((step, index) => (
                    <div key={step.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-bold text-indigo-700">{step.order}</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">{step.name}</span>
                          <Badge variant="secondary" className="text-xs">{step.eventType}</Badge>
                        </div>
                        {step.description && (
                          <p className="text-xs text-gray-500 mt-1">{step.description}</p>
                        )}
                      </div>
                      {index < journey.steps.length - 1 && (
                        <div className="text-gray-400">→</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-4 pt-4 border-t flex items-center justify-between text-xs text-gray-500">
                <span>Creado: {new Date(journey.createdAt).toLocaleDateString()}</span>
                <span>Actualizado: {new Date(journey.updatedAt).toLocaleDateString()}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default CustomerJourneysPage;
