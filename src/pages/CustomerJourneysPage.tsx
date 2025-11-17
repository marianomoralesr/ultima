import React, { useState, useEffect } from 'react';
import { Route, Plus, Edit, Trash2, Play, Pause, BarChart3, Loader2, AlertCircle } from 'lucide-react';
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
import { CustomerJourneyService, type CustomerJourney, type JourneyStep } from '../services/CustomerJourneyService';

const CustomerJourneysPage: React.FC = () => {
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [journeyName, setJourneyName] = useState('');
  const [journeyRoute, setJourneyRoute] = useState('');
  const [journeyLandingPage, setJourneyLandingPage] = useState('');
  const [journeyDescription, setJourneyDescription] = useState('');
  const [funnelSteps, setFunnelSteps] = useState<Omit<JourneyStep, 'id' | 'journey_id' | 'created_at' | 'updated_at'>[]>([]);
  const [newStepName, setNewStepName] = useState('');
  const [newStepPageRoute, setNewStepPageRoute] = useState('');
  const [newStepDescription, setNewStepDescription] = useState('');
  const [newStepEventType, setNewStepEventType] = useState('');
  const [newStepTriggerType, setNewStepTriggerType] = useState<'pageview' | 'button_click' | 'form_submit' | 'custom'>('pageview');

  // Database state
  const [journeys, setJourneys] = useState<CustomerJourney[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Load journeys from database on mount
  useEffect(() => {
    loadJourneys();
  }, []);

  const loadJourneys = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await CustomerJourneyService.getAllJourneys();
      setJourneys(data);
    } catch (err) {
      console.error('Error loading journeys:', err);
      setError('Error al cargar customer journeys');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddStep = () => {
    if (newStepName && newStepEventType && newStepPageRoute) {
      const newStep: Omit<JourneyStep, 'id' | 'journey_id' | 'created_at' | 'updated_at'> = {
        step_order: funnelSteps.length + 1,
        step_name: newStepName,
        step_description: newStepDescription || undefined,
        page_route: newStepPageRoute,
        event_type: newStepEventType,
        event_name: newStepName,
        trigger_type: newStepTriggerType
      };
      setFunnelSteps([...funnelSteps, newStep]);
      setNewStepName('');
      setNewStepPageRoute('');
      setNewStepDescription('');
      setNewStepEventType('');
      setNewStepTriggerType('pageview');
    }
  };

  const handleRemoveStep = (index: number) => {
    const newSteps = funnelSteps.filter((_, idx) => idx !== index);
    // Reorder remaining steps
    newSteps.forEach((step, idx) => {
      step.step_order = idx + 1;
    });
    setFunnelSteps(newSteps);
  };

  const handleMoveStepUp = (index: number) => {
    if (index > 0) {
      const newSteps = [...funnelSteps];
      [newSteps[index - 1], newSteps[index]] = [newSteps[index], newSteps[index - 1]];
      newSteps.forEach((step, idx) => {
        step.step_order = idx + 1;
      });
      setFunnelSteps(newSteps);
    }
  };

  const handleMoveStepDown = (index: number) => {
    if (index < funnelSteps.length - 1) {
      const newSteps = [...funnelSteps];
      [newSteps[index], newSteps[index + 1]] = [newSteps[index + 1], newSteps[index]];
      newSteps.forEach((step, idx) => {
        step.step_order = idx + 1;
      });
      setFunnelSteps(newSteps);
    }
  };

  const handleCreateJourney = async () => {
    try {
      setIsCreating(true);
      setError(null);

      const journeyData: Omit<CustomerJourney, 'id' | 'created_at' | 'updated_at'> = {
        name: journeyName,
        route: journeyRoute,
        landing_page: journeyLandingPage || journeyRoute,
        description: journeyDescription || undefined,
        status: 'draft',
        auto_tracking_enabled: true,
        gtm_enabled: true,
        facebook_pixel_enabled: true
      };

      await CustomerJourneyService.createJourney(journeyData, funnelSteps);

      // Reload journeys from database
      await loadJourneys();

      setIsWizardOpen(false);
      resetWizard();
    } catch (err) {
      console.error('Error creating journey:', err);
      setError('Error al crear customer journey');
    } finally {
      setIsCreating(false);
    }
  };

  const resetWizard = () => {
    setCurrentStep(1);
    setJourneyName('');
    setJourneyRoute('');
    setJourneyLandingPage('');
    setJourneyDescription('');
    setFunnelSteps([]);
    setNewStepName('');
    setNewStepPageRoute('');
    setNewStepDescription('');
    setNewStepEventType('');
    setNewStepTriggerType('pageview');
  };

  const toggleJourneyStatus = async (journeyId: string) => {
    try {
      setError(null);
      await CustomerJourneyService.toggleJourneyStatus(journeyId);
      await loadJourneys();
    } catch (err) {
      console.error('Error toggling journey status:', err);
      setError('Error al cambiar estado del journey');
    }
  };

  const deleteJourney = async (journeyId: string) => {
    if (confirm('¿Estás seguro de que deseas eliminar este customer journey?')) {
      try {
        setError(null);
        await CustomerJourneyService.deleteJourney(journeyId);
        await loadJourneys();
      } catch (err) {
        console.error('Error deleting journey:', err);
        setError('Error al eliminar customer journey');
      }
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
                Landing Page
              </label>
              <input
                type="text"
                value={journeyLandingPage}
                onChange={(e) => setJourneyLandingPage(e.target.value)}
                placeholder="ej: /compra-auto (deja vacío para usar la ruta principal)"
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
                  <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-500">#{step.step_order}</span>
                        <span className="font-medium text-gray-900">{step.step_name}</span>
                        <Badge variant="outline" className="text-xs">{step.event_type}</Badge>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{step.page_route}</p>
                      {step.step_description && (
                        <p className="text-xs text-gray-500">{step.step_description}</p>
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
                        onClick={() => handleRemoveStep(index)}
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
                  Ruta de la página *
                </label>
                <input
                  type="text"
                  value={newStepPageRoute}
                  onChange={(e) => setNewStepPageRoute(e.target.value)}
                  placeholder="ej: /compra-auto, /escritorio/aplicacion"
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
                  Tipo de trigger *
                </label>
                <select
                  value={newStepTriggerType}
                  onChange={(e) => setNewStepTriggerType(e.target.value as 'pageview' | 'button_click' | 'form_submit' | 'custom')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="pageview">Pageview</option>
                  <option value="button_click">Button Click</option>
                  <option value="form_submit">Form Submit</option>
                  <option value="custom">Custom</option>
                </select>
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
              <Button onClick={handleAddStep} className="w-full" disabled={!newStepName || !newStepEventType || !newStepPageRoute}>
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
                {journeyLandingPage && (
                  <div>
                    <span className="text-sm font-medium text-green-800">Landing Page:</span>
                    <p className="text-gray-900">{journeyLandingPage}</p>
                  </div>
                )}
                {journeyDescription && (
                  <div>
                    <span className="text-sm font-medium text-green-800">Descripción:</span>
                    <p className="text-gray-900">{journeyDescription}</p>
                  </div>
                )}
                <div>
                  <span className="text-sm font-medium text-green-800">Pasos del Funnel ({funnelSteps.length}):</span>
                  <div className="mt-2 space-y-2">
                    {funnelSteps.map((step, index) => (
                      <div key={index} className="flex items-start gap-2 text-sm">
                        <span className="font-bold text-gray-500">{index + 1}.</span>
                        <div>
                          <span className="font-medium text-gray-900">{step.step_name}</span>
                          <span className="text-gray-600"> ({step.event_type})</span>
                          <p className="text-xs text-gray-500">{step.page_route} - {step.trigger_type}</p>
                          {step.step_description && (
                            <p className="text-xs text-gray-500">{step.step_description}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="pt-3 border-t">
                  <span className="text-sm font-medium text-green-800">Configuración de tracking:</span>
                  <p className="text-xs text-gray-600 mt-1">
                    ✓ Auto-tracking habilitado<br />
                    ✓ GTM habilitado<br />
                    ✓ Facebook Pixel habilitado
                  </p>
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
      {/* Error banner */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-800">{error}</p>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-red-600 hover:text-red-800"
          >
            ✕
          </button>
        </div>
      )}

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
                  disabled={isCreating}
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
                    isCreating ||
                    (currentStep === 1 && (!journeyName || !journeyRoute)) ||
                    (currentStep === 2 && funnelSteps.length === 0)
                  }
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creando...
                    </>
                  ) : (
                    currentStep === 3 ? 'Crear Journey' : 'Siguiente'
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Journeys List */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-4" />
          <p className="text-gray-600">Cargando customer journeys...</p>
        </div>
      ) : journeys.length === 0 ? (
        <Card className="p-12">
          <div className="text-center">
            <Route className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay customer journeys</h3>
            <p className="text-gray-600 mb-6">
              Crea tu primer customer journey para comenzar a trackear el funnel de conversión.
            </p>
            <Button
              onClick={() => setIsWizardOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Crear Customer Journey
            </Button>
          </div>
        </Card>
      ) : (
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
                      onClick={() => journey.id && toggleJourneyStatus(journey.id)}
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
                      onClick={() => journey.id && deleteJourney(journey.id)}
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
                    Pasos del Funnel ({journey.steps?.length || 0})
                  </h4>
                  <div className="space-y-2">
                    {journey.steps?.map((step, index) => (
                      <div key={step.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-bold text-indigo-700">{step.step_order}</span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900">{step.step_name}</span>
                            <Badge variant="secondary" className="text-xs">{step.event_type}</Badge>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">{step.page_route}</p>
                          {step.step_description && (
                            <p className="text-xs text-gray-500">{step.step_description}</p>
                          )}
                        </div>
                        {index < (journey.steps?.length || 0) - 1 && (
                          <div className="text-gray-400">→</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                {journey.created_at && journey.updated_at && (
                  <div className="mt-4 pt-4 border-t flex items-center justify-between text-xs text-gray-500">
                    <span>Creado: {new Date(journey.created_at).toLocaleDateString()}</span>
                    <span>Actualizado: {new Date(journey.updated_at).toLocaleDateString()}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default CustomerJourneysPage;
