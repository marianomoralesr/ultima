import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { ProfileService } from '../services/profileService';
import { User, ArrowLeft, CheckCircle, Loader2, Info, ArrowRight, ChevronRight, ChevronLeft } from 'lucide-react';
import type { Profile } from '../types/types';
import { calculateRFC } from '../utils/rfcCalculator';
import { toast } from 'sonner';
import { conversionTracking } from '../services/ConversionTrackingService';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { OnboardingStepper } from '../components/OnboardingStepper';
import { ApplicationService } from '../services/ApplicationService';
import { BankProfilingService } from '../services/BankProfilingService';
import { Button } from '../components/ui/button';
import { Progress } from '../components/ui/progress';

const CELLPHONE_COMPANIES = [
  'Telcel',
  'AT&T',
  'Movistar',
  'Unefon',
  'Virgin Mobile',
  'Weex (Dish)',
  'Pillofon',
  'Otro',
];

const SALES_AGENTS = [
  { id: 'd21e808e-083c-48fd-be78-d52ee7837146', name: 'Anahi Garza Garcia' },
  { id: 'cb55da28-ef7f-4632-9fcd-a8d9f37f1463', name: 'Carlos Isidro Berrones' },
  { id: 'e49bf74c-308f-4e8d-b683-3575d7214e98', name: 'Daniel Rodríguez' },
  { id: '7e239ec5-aceb-4e9f-ae67-2ac16733609b', name: 'David Rojas' },
  { id: 'fe901e9e-c3f2-41a1-b5a0-6d95c9d81344', name: 'David Marconi Mazariegos' },
  { id: 'a4165ce3-e52b-4f8d-9123-327c0179f73c', name: 'Israel Ramírez' },
  { id: '4c8c43bb-c936-44a2-ab82-f40326387770', name: 'Ramón Araujo' },
];

// Utility function to normalize names to Title Case
const normalizeNameToTitleCase = (name: string): string => {
  if (!name) return '';

  const lowercaseWords = ['de', 'del', 'la', 'los', 'las', 'y', 'e', 'van', 'von', 'da', 'di'];

  return name
    .trim()
    .toLowerCase()
    .split(' ')
    .map((word, index) => {
      if (index === 0) {
        return word.charAt(0).toUpperCase() + word.slice(1);
      }
      if (lowercaseWords.includes(word)) {
        return word;
      }
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
};

// Schemas
const profileSchema = z.object({
  first_name: z.string().min(2, 'Por favor, ingresa tu nombre (mínimo 2 caracteres)'),
  last_name: z.string().min(2, 'Por favor, ingresa tu apellido paterno (mínimo 2 caracteres)'),
  mother_last_name: z.string().min(2, 'Por favor, ingresa tu apellido materno (mínimo 2 caracteres)'),
  phone: z.string().min(10, 'Por favor, ingresa un número de teléfono válido de 10 dígitos'),
  cellphone_company: z.string().optional().or(z.literal('')),
  birth_date: z.string().min(1, 'Por favor, selecciona tu fecha de nacimiento'),
  homoclave: z.string().length(3, 'La homoclave debe tener exactamente 3 caracteres'),
  fiscal_situation: z.string().min(1, 'Por favor, selecciona tu situación fiscal'),
  civil_status: z.string().min(1, 'Por favor, selecciona tu estado civil'),
  spouse_name: z.string().optional().or(z.literal('')),
  gender: z.string().optional().or(z.literal('')),
  how_did_you_know: z.string().optional().or(z.literal('')),
}).refine(data => {
  if (data.civil_status?.toLowerCase() === 'casado') {
    return data.spouse_name && data.spouse_name.length >= 2;
  }
  return true;
}, {
  message: 'Por favor, ingresa el nombre completo de tu cónyuge (este campo es obligatorio para personas casadas)',
  path: ['spouse_name'],
});

type ProfileFormData = z.infer<typeof profileSchema>;

const checkProfileCompleteness = (p: Profile | undefined): boolean => {
  if (!p) return false;

  const requiredFields: (keyof Profile)[] = [
    'first_name',
    'last_name',
    'mother_last_name',
    'phone',
    'birth_date',
    'homoclave'
  ];

  return requiredFields.every(field => {
    const value = p[field];
    return value != null && String(value).trim() !== '';
  });
};

const STEPS = [
  { id: 1, title: 'Contacto', description: 'Información de contacto y asesor' },
  { id: 2, title: 'Personal', description: 'Datos personales y estado civil' },
  { id: 3, title: 'Fiscal', description: 'Información fiscal' },
];

const ProfilePage: React.FC = () => {
  const { user, profile, loading, reloadProfile } = useAuth();
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(1);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [isProfileComplete, setIsProfileComplete] = useState(false);
  const [isFirstTimeUser, setIsFirstTimeUser] = useState(false);
  const [calculatedRfc, setCalculatedRfc] = useState('');
  const [assignedAgentName, setAssignedAgentName] = useState<string>();
  const [profilePictureFile, setProfilePictureFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [hasPriorAdvisor, setHasPriorAdvisor] = useState<string>('no');
  const [selectedSalesAgentId, setSelectedSalesAgentId] = useState<string>('');
  const [showOnboardingStepper, setShowOnboardingStepper] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(2);

  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    mode: 'onChange',
  });

  const { watch: watchProfileFields, reset: resetProfileForm } = profileForm;
  const civilStatus = watchProfileFields('civil_status');
  const isMarried = civilStatus?.toLowerCase() === 'casado';

  useEffect(() => {
    if (profile) {
      const isComplete = checkProfileCompleteness(profile);
      setIsProfileComplete(isComplete);
      if (!isComplete) {
        setIsFirstTimeUser(true);
      }
      resetProfileForm({
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        mother_last_name: profile.mother_last_name || '',
        phone: profile.phone || '',
        cellphone_company: profile.cellphone_company || '',
        birth_date: profile.birth_date || '',
        homoclave: profile.homoclave || '',
        fiscal_situation: profile.fiscal_situation || '',
        civil_status: profile.civil_status || '',
        spouse_name: profile.spouse_name || '',
        gender: profile.gender || '',
        how_did_you_know: profile.how_did_you_know || '',
      });
      setCalculatedRfc(profile.rfc || '');
      setPreviewUrl(profile.picture_url || null);

      if (profile.asesor_asignado_id) {
        setHasPriorAdvisor('yes');
        setSelectedSalesAgentId(profile.asesor_asignado_id);
        ProfileService.getProfile(profile.asesor_asignado_id).then(agentProfile => {
          if (agentProfile) {
            setAssignedAgentName(`${agentProfile.first_name || ''} ${agentProfile.last_name || ''}`.trim());
          }
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  // Check if user should see onboarding stepper
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (!user?.id) return;

      try {
        const applications = await ApplicationService.getUserApplications(user.id);
        const hasSubmittedApplication = applications.some(app => app.status !== 'draft');

        const bankProfileComplete = await BankProfilingService.isBankProfileComplete(user.id);

        setShowOnboardingStepper(!hasSubmittedApplication);

        if (bankProfileComplete) {
          setOnboardingStep(3);
        } else if (isProfileComplete) {
          setOnboardingStep(2);
        }
      } catch (error) {
        console.error('Error checking onboarding status:', error);
      }
    };

    if (!loading && user) {
      checkOnboardingStatus();
    }
  }, [user, loading, isProfileComplete]);

  const [firstName, lastName, motherLastName, birthDate, homoclave] = watchProfileFields(['first_name', 'last_name', 'mother_last_name', 'birth_date', 'homoclave']);

  useEffect(() => {
    if (firstName && lastName && motherLastName && birthDate && homoclave) {
      const rfc = calculateRFC({ first_name: firstName, last_name: lastName, mother_last_name: motherLastName, birth_date: birthDate, homoclave });
      if (rfc) {
        setCalculatedRfc(rfc);
      }
    } else {
      setCalculatedRfc('');
    }
  }, [firstName, lastName, motherLastName, birthDate, homoclave]);

  useEffect(() => {
    if (selectedSalesAgentId) {
      const selectedAgent = SALES_AGENTS.find(agent => agent.id === selectedSalesAgentId);
      if (selectedAgent) {
        setAssignedAgentName(selectedAgent.name);
      }
    }
  }, [selectedSalesAgentId]);

  // Auto-save form data when user changes fields (debounced)
  useEffect(() => {
    const subscription = watchProfileFields((formData) => {
      if (saveState === 'idle' && user && profile) {
        const timer = setTimeout(async () => {
          try {
            const payload: Partial<Profile> = {
              id: user.id,
              email: user.email,
              first_name: formData.first_name,
              last_name: formData.last_name,
              mother_last_name: formData.mother_last_name,
              phone: formData.phone,
              cellphone_company: formData.cellphone_company,
              birth_date: formData.birth_date,
              homoclave: formData.homoclave,
              fiscal_situation: formData.fiscal_situation,
              civil_status: formData.civil_status,
              spouse_name: formData.spouse_name,
              gender: formData.gender,
              how_did_you_know: formData.how_did_you_know,
            };

            await ProfileService.updateProfile(payload);
            // Reload profile after auto-save to keep context in sync
            await reloadProfile();
            console.log('Auto-saved profile');
          } catch (error) {
            console.error('Auto-save error:', error);
          }
        }, 2000);

        return () => clearTimeout(timer);
      }
    });

    return subscription.unsubscribe;
  }, [watchProfileFields, saveState, user, profile, reloadProfile]);

  const handlePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProfilePictureFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    const isValid = await profileForm.trigger();

    const currentValues = profileForm.getValues();

    if (!isValid) {
      const errors = profileForm.formState.errors;
      const missingFields: string[] = [];

      if (errors.first_name) missingFields.push('Nombre');
      if (errors.last_name) missingFields.push('Apellido Paterno');
      if (errors.mother_last_name) missingFields.push('Apellido Materno');
      if (errors.phone) missingFields.push('Teléfono');
      if (errors.birth_date) missingFields.push('Fecha de Nacimiento');
      if (errors.homoclave) missingFields.push('Homoclave');
      if (errors.fiscal_situation) missingFields.push('Situación Fiscal');
      if (errors.civil_status) missingFields.push('Estado Civil');
      if (errors.rfc) missingFields.push('RFC');

      if (missingFields.length > 0) {
        toast.warning(`Guardando progreso. Campos faltantes: ${missingFields.join(', ')}`);
      }
    }

    await handleProfileUpdate(currentValues);
  };

  const handleProfileUpdate = async (data: ProfileFormData) => {
    if (!user) return;
    setSaveState('saving');

    try {
      let pictureUrl = profile?.picture_url;
      if (profilePictureFile) {
        pictureUrl = await ProfileService.uploadProfilePicture(user.id, profilePictureFile);
      }

      const normalizedData = {
        ...data,
        first_name: data.first_name ? normalizeNameToTitleCase(data.first_name) : data.first_name,
        last_name: data.last_name ? normalizeNameToTitleCase(data.last_name) : data.last_name,
        mother_last_name: data.mother_last_name ? normalizeNameToTitleCase(data.mother_last_name) : data.mother_last_name,
        spouse_name: data.spouse_name ? normalizeNameToTitleCase(data.spouse_name) : undefined,
      };

      const finalRfc = calculateRFC(normalizedData);
      const payload: Partial<Profile> = {
        id: user.id,
        email: user.email,
        ...normalizedData,
        rfc: finalRfc ?? undefined,
        picture_url: pictureUrl
      };

      if (hasPriorAdvisor === 'yes' && selectedSalesAgentId) {
        payload.asesor_asignado_id = selectedSalesAgentId;
        payload.asesor_autorizado_acceso = true;
      } else if (!profile?.asesor_asignado_id) {
        const assignedAdvisorId = await ProfileService.assignAdvisorToUser(user.id);
        if (assignedAdvisorId) {
          payload.asesor_asignado_id = assignedAdvisorId;
          payload.asesor_autorizado_acceso = true;
        }
      }

      await ProfileService.updateProfile(payload);
      const reloadedProfile = await reloadProfile();

      const isComplete = checkProfileCompleteness(reloadedProfile || undefined);

      setIsProfileComplete(isComplete);

      if (isComplete) {
        // Track PersonalInformationComplete event
        conversionTracking.trackProfile.updated({
          userId: user.id,
          email: user.email,
          profileComplete: true,
          hasProfilePicture: !!pictureUrl,
          asesorAutorizado: !!payload.asesor_autorizado_acceso
        });

        setSaveState('saved');
        toast.success('¡Perfil completado! Redirigiendo a perfilación bancaria...');

        // Simplified redirect - single timeout
        setTimeout(() => {
          navigate('/escritorio/perfilacion-bancaria');
        }, 1500);
      } else {
        setSaveState('saved');
        toast.info('Progreso guardado. Completa todos los campos obligatorios para continuar.');
        // Reset save state after showing feedback
        setTimeout(() => setSaveState('idle'), 2000);
      }

    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No pudimos guardar tu perfil. Por favor, verifica que toda la información esté correcta e intenta nuevamente. Si el problema persiste, contacta con soporte.');
      setSaveState('idle');
    }
  };

  const goToNextStep = async () => {
    // Validate current step fields before moving forward
    let fieldsToValidate: (keyof ProfileFormData)[] = [];

    switch (currentStep) {
      case 1:
        // Step 1: Contact + Advisor
        fieldsToValidate = ['phone'];
        break;
      case 2:
        // Step 2: Personal + Civil Status
        fieldsToValidate = ['first_name', 'last_name', 'mother_last_name', 'birth_date', 'civil_status'];
        if (isMarried) {
          fieldsToValidate.push('spouse_name');
        }
        break;
    }

    const isValid = await profileForm.trigger(fieldsToValidate);

    if (!isValid) {
      // Show toast with specific validation errors
      const errors = profileForm.formState.errors;
      const errorFields = Object.keys(errors);
      if (errorFields.length > 0) {
        toast.error('Por favor, completa todos los campos obligatorios antes de continuar.');
      }
      // Scroll to first error
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const goToPrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Calculate progress: if profile is complete, always show 100%, otherwise show current step progress
  const progress = isProfileComplete ? 100 : (currentStep / STEPS.length) * 100;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      <Link
        to="/escritorio"
        className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4 lg:mb-6 transition-colors touch-manipulation min-h-[44px] -ml-2 pl-2 pr-3 py-2 rounded-lg hover:bg-gray-100"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Volver al Dashboard
      </Link>

      {/* Welcome Message for First-Time Users */}
      {isFirstTimeUser && !isProfileComplete && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 p-4 lg:p-5 mb-4 lg:mb-6 rounded-r-lg">
          <h3 className="font-bold text-gray-900 text-sm sm:text-base lg:text-lg">
            ¡Te has registrado con éxito!
          </h3>
          <p className="text-xs sm:text-sm lg:text-base text-gray-700 mt-2">
            Casi estás listo para comenzar tu solicitud de crédito, pero antes es importante que completes la información de tu perfil. Por favor rellena los datos tal como aparecen en tu identificación oficial para agilizar el proceso.
          </p>
        </div>
      )}

      {/* Layout con Grid: Form a la izquierda, Sidebar a la derecha */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Progress Bar */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center">
                <User className="w-5 h-5 mr-2 sm:mr-3 text-primary-600" />
                Completa tu perfil
              </h2>
              <span className={`text-sm font-medium ${isProfileComplete ? 'text-green-600 font-bold' : 'text-gray-600'}`}>
                {isProfileComplete ? '100% - ¡Perfil completado!' : `Paso ${currentStep} de ${STEPS.length}`}
              </span>
            </div>
            <Progress value={progress} className={`h-2 ${isProfileComplete ? '[&>div]:bg-green-500' : ''}`} />
            <div className="flex justify-between mt-2">
              {STEPS.map((step) => (
                <div
                  key={step.id}
                  className={`text-xs text-center flex-1 ${
                    isProfileComplete
                      ? step.id === currentStep
                        ? 'text-green-700 font-bold'
                        : 'text-green-500 font-medium'
                      : step.id === currentStep
                      ? 'text-green-700 font-bold'
                      : step.id < currentStep
                      ? 'text-green-500 font-medium'
                      : 'text-gray-400'
                  }`}
                >
                  {step.title}
                </div>
              ))}
            </div>
          </div>

      {/* Multi-Step Form */}
      <form onSubmit={(e) => e.preventDefault()} className="text-gray-900">
        <div className="bg-white border rounded-xl p-4 sm:p-6 mb-6 min-h-[400px]">

          {/* Step 1: Contact Information + Advisor */}
          {currentStep === 1 && (
            <div className="space-y-6">
              {/* Advisor Assignment - Destacado al inicio */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 sm:p-5 border-2 border-blue-200 shadow-sm">
                <div className="text-center mb-4">
                  <h4 className="text-base sm:text-lg font-bold text-gray-900 mb-1">Asignación de Asesor</h4>
                  <p className="text-xs sm:text-sm text-gray-600">¿Ya has sido atendido por un asesor de TREFA anteriormente?</p>
                </div>

                <div>
                  <Label className="text-xs sm:text-sm font-medium text-gray-700 mb-3 block">
                    ¿Ya he sido atendido por un asesor de TREFA?
                  </Label>
                  <RadioGroup value={hasPriorAdvisor} onValueChange={setHasPriorAdvisor} className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="no" id="no-prior-advisor" />
                      <Label htmlFor="no-prior-advisor" className="font-normal cursor-pointer text-sm">No</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="yes" id="yes-prior-advisor" />
                      <Label htmlFor="yes-prior-advisor" className="font-normal cursor-pointer text-sm">Sí</Label>
                    </div>
                  </RadioGroup>
                </div>

                {hasPriorAdvisor === 'yes' && (
                  <div className="mt-4">
                    <Label htmlFor="sales-agent-select" className="text-xs sm:text-sm font-medium text-gray-700 mb-2 block">
                      Selecciona tu asesor
                    </Label>
                    <Select value={selectedSalesAgentId} onValueChange={setSelectedSalesAgentId}>
                      <SelectTrigger id="sales-agent-select" className="w-full text-sm">
                        <SelectValue placeholder="Selecciona un asesor..." />
                      </SelectTrigger>
                      <SelectContent>
                        {SALES_AGENTS.map((agent) => (
                          <SelectItem key={agent.id} value={agent.id}>
                            {agent.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {assignedAgentName && selectedSalesAgentId && (
                      <p className="text-xs text-blue-600 mt-2 flex items-center">
                        <Info className="w-3 h-3 sm:w-4 sm:h-4 mr-1 flex-shrink-0" />
                        Se asignará a {assignedAgentName} como tu asesor y tendrá acceso a tu cuenta para dar seguimiento.
                      </p>
                    )}
                  </div>
                )}

                {hasPriorAdvisor === 'no' && (
                  <p className="text-xs sm:text-sm text-gray-600 bg-blue-100 p-3 rounded-lg border border-blue-300 mt-4">
                    <Info className="w-3 h-3 sm:w-4 sm:h-4 inline mr-2" />
                    Se te asignará un asesor automáticamente al guardar tu perfil.
                  </p>
                )}
              </div>

              {/* Contact Information */}
              <div className="space-y-4">
                <div className="text-center">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-1 sm:mb-2">Información de Contacto</h3>
                  <p className="text-xs sm:text-sm text-gray-600">Ingresa tus datos de contacto para que podamos comunicarnos contigo</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm">Teléfono *</Label>
                  <div className="flex">
                    <span className="inline-flex items-center px-2 sm:px-3 rounded-l-md border border-r-0 border-input bg-muted text-muted-foreground text-xs sm:text-sm font-medium whitespace-nowrap">MX +52</span>
                    <Input id="phone" {...profileForm.register('phone')} placeholder="10 dígitos" className="rounded-l-none text-sm flex-1" />
                  </div>
                  {profileForm.formState.errors.phone && <p className="text-xs sm:text-sm text-red-600">{profileForm.formState.errors.phone?.message as React.ReactNode}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cellphone_company" className="text-sm">Compañía Telefónica</Label>
                  <select id="cellphone_company" {...profileForm.register('cellphone_company')} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                    <option value="">Seleccionar...</option>
                    {CELLPHONE_COMPANIES.map((company) => (
                      <option key={company} value={company}>{company}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm">Correo Electrónico</Label>
                  <Input id="email" type="email" value={user?.email || ''} readOnly disabled className="text-sm" />
                  <p className="text-xs text-muted-foreground">Este correo está vinculado a tu cuenta y no puede ser modificado.</p>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Personal Information + Civil Status */}
          {currentStep === 2 && (
            <div className="space-y-4 sm:space-y-5">
              <div className="text-center mb-4 sm:mb-6">
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-1 sm:mb-2">Datos Personales</h3>
                <p className="text-xs sm:text-sm text-gray-600">Ingresa tu nombre completo tal como aparece en tu identificación oficial</p>
              </div>

              {/* Nombres en una sola fila - Optimizado para móvil */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name" className="text-sm">Nombre(s) *</Label>
                  <Input id="first_name" {...profileForm.register('first_name')} placeholder="Tu(s) nombre(s)" className="text-sm" />
                  {profileForm.formState.errors.first_name && <p className="text-xs sm:text-sm text-red-600">{profileForm.formState.errors.first_name?.message as React.ReactNode}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="last_name" className="text-sm">Apellido Paterno *</Label>
                  <Input id="last_name" {...profileForm.register('last_name')} placeholder="Apellido paterno" className="text-sm" />
                  {profileForm.formState.errors.last_name && <p className="text-xs sm:text-sm text-red-600">{profileForm.formState.errors.last_name?.message as React.ReactNode}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mother_last_name" className="text-sm">Apellido Materno *</Label>
                  <Input id="mother_last_name" {...profileForm.register('mother_last_name')} placeholder="Apellido materno" className="text-sm" />
                  {profileForm.formState.errors.mother_last_name && <p className="text-xs sm:text-sm text-red-600">{profileForm.formState.errors.mother_last_name?.message as React.ReactNode}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="birth_date" className="text-sm">Fecha de Nacimiento *</Label>
                <Input id="birth_date" type="date" {...profileForm.register('birth_date')} className="text-sm" />
                {profileForm.formState.errors.birth_date && <p className="text-xs sm:text-sm text-red-600">{profileForm.formState.errors.birth_date.message as React.ReactNode}</p>}
              </div>

              {/* Género con botones pill */}
              <div className="space-y-2">
                <Label className="text-sm">Género</Label>
                <RadioGroup
                  value={watchProfileFields('gender') || ''}
                  onValueChange={(value) => profileForm.setValue('gender', value)}
                  className="grid grid-cols-2 gap-3"
                >
                  <div>
                    <RadioGroupItem value="Masculino" id="gender-masculino" className="peer sr-only" />
                    <Label
                      htmlFor="gender-masculino"
                      className="flex items-center justify-center rounded-lg border-2 border-muted bg-popover p-2.5 sm:p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary peer-data-[state=checked]:text-primary-foreground cursor-pointer transition-all text-sm"
                    >
                      Masculino
                    </Label>
                  </div>
                  <div>
                    <RadioGroupItem value="Femenino" id="gender-femenino" className="peer sr-only" />
                    <Label
                      htmlFor="gender-femenino"
                      className="flex items-center justify-center rounded-lg border-2 border-muted bg-popover p-2.5 sm:p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary peer-data-[state=checked]:text-primary-foreground cursor-pointer transition-all text-sm"
                    >
                      Femenino
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Estado Civil con botones pill - Grid mejorado para móvil */}
              <div className="space-y-2">
                <Label className="text-sm">Estado Civil *</Label>
                <RadioGroup
                  value={civilStatus || ''}
                  onValueChange={(value) => profileForm.setValue('civil_status', value)}
                  className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 mt-2"
                >
                  <div>
                    <RadioGroupItem value="soltero" id="civil-soltero" className="peer sr-only" />
                    <Label
                      htmlFor="civil-soltero"
                      className="flex items-center justify-center rounded-lg border-2 border-muted bg-popover p-2.5 sm:p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary peer-data-[state=checked]:text-primary-foreground cursor-pointer transition-all text-xs sm:text-sm"
                    >
                      Soltero(a)
                    </Label>
                  </div>
                  <div>
                    <RadioGroupItem value="casado" id="civil-casado" className="peer sr-only" />
                    <Label
                      htmlFor="civil-casado"
                      className="flex items-center justify-center rounded-lg border-2 border-muted bg-popover p-2.5 sm:p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary peer-data-[state=checked]:text-primary-foreground cursor-pointer transition-all text-xs sm:text-sm"
                    >
                      Casado(a)
                    </Label>
                  </div>
                  <div>
                    <RadioGroupItem value="viudo" id="civil-viudo" className="peer sr-only" />
                    <Label
                      htmlFor="civil-viudo"
                      className="flex items-center justify-center rounded-lg border-2 border-muted bg-popover p-2.5 sm:p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary peer-data-[state=checked]:text-primary-foreground cursor-pointer transition-all text-xs sm:text-sm"
                    >
                      Viudo(a)
                    </Label>
                  </div>
                  <div>
                    <RadioGroupItem value="union" id="civil-union" className="peer sr-only" />
                    <Label
                      htmlFor="civil-union"
                      className="flex items-center justify-center rounded-lg border-2 border-muted bg-popover p-2.5 sm:p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary peer-data-[state=checked]:text-primary-foreground cursor-pointer transition-all text-xs sm:text-sm"
                    >
                      Unión Libre
                    </Label>
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <RadioGroupItem value="divorciado" id="civil-divorciado" className="peer sr-only" />
                    <Label
                      htmlFor="civil-divorciado"
                      className="flex items-center justify-center rounded-lg border-2 border-muted bg-popover p-2.5 sm:p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary peer-data-[state=checked]:text-primary-foreground cursor-pointer transition-all text-xs sm:text-sm"
                    >
                      Divorciado(a)
                    </Label>
                  </div>
                </RadioGroup>
                {profileForm.formState.errors.civil_status && <p className="text-xs sm:text-sm text-red-600">{profileForm.formState.errors.civil_status?.message as React.ReactNode}</p>}
              </div>

              {isMarried && (
                <div className="space-y-2">
                  <Label htmlFor="spouse_name" className="text-sm">Nombre Completo del Cónyuge *</Label>
                  <Input id="spouse_name" {...profileForm.register('spouse_name')} placeholder="Nombre completo del cónyuge" className="text-sm" />
                  {profileForm.formState.errors.spouse_name && <p className="text-xs sm:text-sm text-red-600">{profileForm.formState.errors.spouse_name.message as React.ReactNode}</p>}
                </div>
              )}

              <p className="text-xs text-blue-600 mt-3 flex items-center">
                <Info className="w-3 h-3 sm:w-4 sm:h-4 mr-1 flex-shrink-0" />
                Los nombres se formatearán automáticamente con mayúsculas y minúsculas apropiadas.
              </p>
            </div>
          )}

          {/* Step 3: Fiscal Information */}
          {currentStep === 3 && (
            <div className="space-y-4 sm:space-y-5">
              <div className="text-center mb-4 sm:mb-6">
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-1 sm:mb-2">Información Fiscal</h3>
                <p className="text-xs sm:text-sm text-gray-600">Completa tus datos fiscales para calcular tu RFC</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="homoclave" className="text-sm">Homoclave (RFC) *</Label>
                <Input id="homoclave" {...profileForm.register('homoclave')} maxLength={3} placeholder="Últimos 3 dígitos" className="text-sm" />
                {profileForm.formState.errors.homoclave && <p className="text-xs sm:text-sm text-red-600">{profileForm.formState.errors.homoclave.message as React.ReactNode}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="rfc" className="text-sm">RFC Calculado</Label>
                <Input
                  id="rfc"
                  type="text"
                  value={calculatedRfc}
                  readOnly
                  disabled
                  className="font-mono font-bold text-sm"
                />
                <p className="text-xs text-muted-foreground">Este campo se calcula automáticamente con los datos proporcionados.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fiscal_situation" className="text-sm">Situación Fiscal *</Label>
                <select {...profileForm.register('fiscal_situation')} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                  <option value="">Seleccionar...</option>
                  <option value="asalariado">Empleado con nómina</option>
                  <option value="honorarios">Honorarios</option>
                  <option value="dividendos">Dividendos o acciones</option>
                  <option value="pensionado">Pensionado</option>
                  <option value="actividad_empresarial">Persona Física con Actividad Empresarial</option>
                </select>
                {profileForm.formState.errors.fiscal_situation && <p className="text-xs sm:text-sm text-red-600">{profileForm.formState.errors.fiscal_situation?.message as React.ReactNode}</p>}
              </div>
            </div>
          )}

        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={goToPrevStep}
            disabled={currentStep === 1}
            className="flex-1 sm:flex-none"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Anterior
          </Button>

          {currentStep < STEPS.length ? (
            <Button
              type="button"
              onClick={goToNextStep}
              className="flex-1 sm:flex-none"
              style={{ backgroundColor: '#FF6801' }}
            >
              Siguiente
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleSaveProfile}
              disabled={saveState === 'saving'}
              className={`flex-1 sm:flex-none ${
                saveState === 'saved'
                  ? 'bg-green-500 hover:bg-green-600'
                  : ''
              }`}
              style={saveState !== 'saved' ? { backgroundColor: '#FF6801' } : {}}
            >
              {saveState === 'saving' && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {saveState === 'saved' && <CheckCircle className="w-4 h-4 mr-2" />}
              {saveState === 'saving' ? 'Guardando...' : saveState === 'saved' ? '¡Guardado!' : 'Guardar y continuar'}
            </Button>
          )}
        </div>
      </form>
        </div>

        {/* Sidebar - Profile Picture & Summary */}
        <div className="lg:col-span-1 space-y-6">
          {/* Profile Picture & Summary en Sidebar */}
          <div className="bg-white border rounded-xl p-4 sm:p-5 sticky top-6">
            <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-4 text-center">Foto de Perfil</h3>

            <div className="text-center mb-4">
              <label htmlFor="profile-picture-upload" className="cursor-pointer group inline-block">
                <div className="w-24 h-24 sm:w-28 sm:h-28 mx-auto rounded-full bg-gray-200 flex items-center justify-center overflow-hidden ring-2 ring-offset-2 ring-primary-500/50 group-hover:ring-primary-500/80 transition-all">
                  {previewUrl ? (
                    <img src={previewUrl} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-12 h-12 sm:w-14 sm:h-14 text-gray-400" />
                  )}
                </div>
                <span className="text-xs font-semibold text-gray-500 mt-2 group-hover:text-primary-600 block">Cambiar foto</span>
              </label>
              <input id="profile-picture-upload" type="file" accept="image/*" className="hidden" onChange={handlePictureChange} />
            </div>

            {profile && (
              <div className="space-y-2 text-xs sm:text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                <div className="flex justify-between">
                  <span className="font-medium text-gray-700">Nombre:</span>
                  <span className="text-right">{normalizeNameToTitleCase(profile.first_name || '')} {normalizeNameToTitleCase(profile.last_name || '')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-700">Email:</span>
                  <span className="text-right truncate ml-2">{profile.email}</span>
                </div>
                {calculatedRfc && (
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-700">RFC:</span>
                    <span className="font-mono font-bold text-primary-600">{calculatedRfc}</span>
                  </div>
                )}
                {profile.phone && (
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-700">Teléfono:</span>
                    <span className="text-right">+52 {profile.phone}</span>
                  </div>
                )}
                {profile.birth_date && (
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-700">Fecha de Nac.:</span>
                    <span className="text-right">{new Date(profile.birth_date).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                  </div>
                )}
                {profile.civil_status && (
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-700">Estado Civil:</span>
                    <span className="text-right">{profile.civil_status}</span>
                  </div>
                )}
                {profile.fiscal_situation && (
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-700">Situación Fiscal:</span>
                    <span className="text-right">{profile.fiscal_situation}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;
