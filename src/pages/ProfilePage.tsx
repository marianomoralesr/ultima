import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { ProfileService } from '../services/profileService';
import { User, ArrowLeft, CheckCircle, Loader2, Info, ArrowRight } from 'lucide-react';
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


// Removed MEXICAN_STATES as it's not being used in this file

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

  // List of Spanish prepositions and articles that should stay lowercase
  const lowercaseWords = ['de', 'del', 'la', 'los', 'las', 'y', 'e', 'van', 'von', 'da', 'di'];

  return name
    .trim()
    .toLowerCase()
    .split(' ')
    .map((word, index) => {
      // First word should always be capitalized
      if (index === 0) {
        return word.charAt(0).toUpperCase() + word.slice(1);
      }
      // Check if word should stay lowercase
      if (lowercaseWords.includes(word)) {
        return word;
      }
      // Capitalize first letter
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

const ProfilePage: React.FC = () => {
  const { user, profile, loading, reloadProfile } = useAuth();
  const navigate = useNavigate();

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
  const [onboardingStep, setOnboardingStep] = useState(2); // Start at step 2 (profile)

  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
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
        // Check if user has submitted any applications
        const applications = await ApplicationService.getUserApplications(user.id);
        const hasSubmittedApplication = applications.some(app => app.status !== 'draft');

        // Check bank profile status
        const bankProfileComplete = await BankProfilingService.isBankProfileComplete(user.id);

        // Show stepper if user hasn't submitted their first application
        setShowOnboardingStepper(!hasSubmittedApplication);

        // Update step based on profile completion
        if (bankProfileComplete) {
          setOnboardingStep(3); // Move to vehicle selection step
        } else if (isProfileComplete) {
          setOnboardingStep(2); // Stay on bank profiling step
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
      setCalculatedRfc(rfc || 'Completa los campos para calcular');
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
      // Only auto-save if user is not currently saving and has made changes
      if (saveState === 'idle' && user && profile) {
        // Debounce auto-save by 2 seconds
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

            // Silent save without showing toast
            await ProfileService.updateProfile(payload);
            console.log('Auto-saved profile');
          } catch (error) {
            console.error('Auto-save error:', error);
          }
        }, 2000);

        return () => clearTimeout(timer);
      }
    });

    return subscription.unsubscribe;
  }, [watchProfileFields, saveState, user, profile]);

  const handlePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProfilePictureFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };
  
  const handleProfileUpdate = async (data: ProfileFormData) => {
    if (!user) return;
    setSaveState('saving');

    try {
      let pictureUrl = profile?.picture_url;
      if (profilePictureFile) {
        pictureUrl = await ProfileService.uploadProfilePicture(user.id, profilePictureFile);
      }

      // Normalize names to Title Case
      const normalizedData = {
        ...data,
        first_name: normalizeNameToTitleCase(data.first_name),
        last_name: normalizeNameToTitleCase(data.last_name),
        mother_last_name: normalizeNameToTitleCase(data.mother_last_name),
        spouse_name: data.spouse_name ? normalizeNameToTitleCase(data.spouse_name) : undefined,
      };

      const finalRfc = calculateRFC(normalizedData);
      const payload: Partial<Profile> = {
        id: user.id,
        email: user.email, // Ensure email is always included
        ...normalizedData,
        rfc: finalRfc ?? undefined,
        picture_url: pictureUrl
      };

      // If user has a prior advisor and selected one, assign it directly (skips round-robin)
      if (hasPriorAdvisor === 'yes' && selectedSalesAgentId) {
        payload.asesor_asignado_id = selectedSalesAgentId;
        payload.asesor_autorizado_acceso = true;
      } else if (!profile?.asesor_asignado_id) {
        // If no prior advisor and no advisor assigned yet, use round-robin
        const assignedAdvisorId = await ProfileService.assignAdvisorToUser(user.id);
        if (assignedAdvisorId) {
          payload.asesor_asignado_id = assignedAdvisorId;
          payload.asesor_autorizado_acceso = true;
        }
      }

      await ProfileService.updateProfile(payload);
      await reloadProfile();

      // Check if profile is complete
      const isComplete = checkProfileCompleteness(payload as Profile);

      // Track profile update conversion ONLY if profile is complete
      if (isComplete) {
        conversionTracking.trackProfile.updated({
          userId: user.id,
          email: user.email,
          profileComplete: true,
          hasProfilePicture: !!pictureUrl,
          asesorAutorizado: !!payload.asesor_autorizado_acceso
        });
      }

      setSaveState('saved');

      // Only redirect if profile is complete
      if (isComplete) {
        toast.success('¡Perfil guardado! Redirigiendo a perfilación bancaria...');
        setTimeout(() => {
          window.scrollTo({ top: 0, behavior: 'smooth' });
          setTimeout(() => {
            navigate('/escritorio/perfilacion-bancaria');
          }, 300);
        }, 4000);
      } else {
        toast.success('Perfil guardado. Completa todos los campos para continuar.');
      }

    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No pudimos guardar tu perfil. Por favor, verifica que toda la información esté correcta e intenta nuevamente. Si el problema persiste, contacta con soporte.');
      setSaveState('idle');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">
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

      <div className="space-y-4 sm:space-y-6 lg:space-y-8">

        {/* Profile Information */}
        <form onSubmit={profileForm.handleSubmit(handleProfileUpdate)} className="text-gray-900">
          <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center">
              <User className="w-5 h-5 mr-2 sm:mr-3 text-primary-600" />
              Resumen de tu perfil
            </h2>
            <div className="text-center">
              <label htmlFor="profile-picture-upload" className="cursor-pointer group inline-block">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden ring-2 ring-offset-2 ring-primary-500/50 group-hover:ring-primary-500/80 transition-all">
                  {previewUrl ? (
                    <img src={previewUrl} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400" />
                  )}
                </div>
                <span className="text-xs font-semibold text-gray-500 mt-2 group-hover:text-primary-600 block">Cambiar foto</span>
              </label>
              <input id="profile-picture-upload" type="file" accept="image/*" className="hidden" onChange={handlePictureChange} />
            </div>
          </div>


          {isProfileComplete ? (
            <div className="mb-4 lg:mb-6 p-4 sm:p-6 bg-green-50 border border-green-200 rounded-xl text-center">
                <CheckCircle className="w-10 h-10 sm:w-12 sm:h-12 text-green-500 mx-auto mb-3" />
                <h3 className="text-lg sm:text-xl font-bold text-green-900">¡Perfil Completo!</h3>
                <p className="text-sm sm:text-base text-gray-600 mt-2 mb-4">Has completado tu información personal. El siguiente paso es crear tu perfilamiento bancario para encontrar el banco con las mejores condiciones para tu caso específico.</p>
                <Link
                    to="/escritorio/perfilacion-bancaria"
                    className="inline-flex items-center justify-center py-2.5 px-6 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-green-50 focus:ring-green-500 touch-manipulation min-h-[44px] w-full sm:w-auto"
                >
                    Crear mi perfil bancario  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
            </div>
          ) : null}

          {/* Profile Summary Card */}
          {profile && (
            <div className="mb-4 lg:mb-6 p-4 sm:p-6 bg-gradient-to-br from-primary-50 to-primary-100 border-2 border-primary-300 rounded-xl">
              <h3 className="text-base sm:text-lg font-bold text-primary-900 mb-4">Resumen de tu Perfil</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
                <div>
                  <p className="text-primary-600 font-medium">Nombre Completo</p>
                  <p className="text-primary-900 font-semibold">
                    {normalizeNameToTitleCase(profile.first_name || '')} {normalizeNameToTitleCase(profile.last_name || '')} {normalizeNameToTitleCase(profile.mother_last_name || '')}
                  </p>
                </div>
                <div>
                  <p className="text-primary-600 font-medium">Correo Electrónico</p>
                  <p className="text-primary-900 font-semibold">{profile.email || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-primary-600 font-medium">Teléfono</p>
                  <p className="text-primary-900 font-semibold">{profile.phone || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-primary-600 font-medium">RFC</p>
                  <p className="text-primary-900 font-semibold">{profile.rfc || 'Completa tu perfil para calcular'}</p>
                </div>
              </div>
            </div>
          )}

          {/* Optimized two-column layout for desktop */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
            {/* Left Column */}
            <div className="space-y-4 lg:space-y-6">
              {/* Contact Information Section */}
              <div className="bg-gray-50 p-4 lg:p-6 rounded-xl border-2 border-gray-200">
                <h3 className="text-base lg:text-lg font-bold text-gray-900 mb-3 lg:mb-4 flex items-center">
                  <span className="bg-primary-600 text-white rounded-full w-7 h-7 lg:w-8 lg:h-8 flex items-center justify-center mr-2 lg:mr-3 text-xs lg:text-sm">1</span>
                  Información de Contacto
                </h3>
                <div className="space-y-3 lg:space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Teléfono</Label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-muted-foreground text-sm font-medium">MX +52</span>
                    <Input id="phone" {...profileForm.register('phone')} placeholder="10 dígitos" className="rounded-l-none" />
                  </div>
                  {profileForm.formState.errors.phone && <p className="text-sm text-red-600">{profileForm.formState.errors.phone?.message as React.ReactNode}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cellphone_company">Compañía Telefónica</Label>
                  <select id="cellphone_company" {...profileForm.register('cellphone_company')} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                    <option value="">Seleccionar...</option>
                    {CELLPHONE_COMPANIES.map((company) => (
                      <option key={company} value={company}>{company}</option>
                    ))}
                  </select>
                  {profileForm.formState.errors.cellphone_company && <p className="text-sm text-red-600">{profileForm.formState.errors.cellphone_company?.message as React.ReactNode}</p>}
                </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Correo Electrónico</Label>
                    <Input id="email" type="email" value={user?.email || ''} readOnly disabled />
                    <p className="text-xs text-muted-foreground">Este correo está vinculado a tu cuenta y no puede ser modificado.</p>
                  </div>
                </div>
              </div>

              {/* Personal Information Section */}
              <div className="bg-gray-50 p-4 lg:p-6 rounded-xl border-2 border-gray-200">
                <h3 className="text-base lg:text-lg font-bold text-gray-900 mb-3 lg:mb-4 flex items-center">
                  <span className="bg-primary-600 text-white rounded-full w-7 h-7 lg:w-8 lg:h-8 flex items-center justify-center mr-2 lg:mr-3 text-xs lg:text-sm">2</span>
                  Datos Personales
                </h3>
                <div className="space-y-3 lg:space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name">Nombre(s)</Label>
                  <Input id="first_name" {...profileForm.register('first_name')} placeholder="Tu(s) nombre(s)" />
                  {profileForm.formState.errors.first_name && <p className="text-sm text-red-600">{profileForm.formState.errors.first_name?.message as React.ReactNode}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name">Apellido Paterno</Label>
                  <Input id="last_name" {...profileForm.register('last_name')} placeholder="Apellido paterno" />
                  {profileForm.formState.errors.last_name && <p className="text-sm text-red-600">{profileForm.formState.errors.last_name?.message as React.ReactNode}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mother_last_name">Apellido Materno</Label>
                  <Input id="mother_last_name" {...profileForm.register('mother_last_name')} placeholder="Apellido materno" />
                  {profileForm.formState.errors.mother_last_name && <p className="text-sm text-red-600">{profileForm.formState.errors.mother_last_name?.message as React.ReactNode}</p>}
                </div>
                </div>
                <p className="text-xs text-blue-600 mt-3 flex items-center">
                  <Info className="w-4 h-4 mr-1" />
                  Los nombres se formatearán automáticamente con mayúsculas y minúsculas apropiadas.
                </p>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4 lg:space-y-6">
              {/* RFC and Fiscal Information Section */}
              <div className="bg-gray-50 p-4 lg:p-6 rounded-xl border-2 border-gray-200">
                <h3 className="text-base lg:text-lg font-bold text-gray-900 mb-3 lg:mb-4 flex items-center">
                  <span className="bg-primary-600 text-white rounded-full w-7 h-7 lg:w-8 lg:h-8 flex items-center justify-center mr-2 lg:mr-3 text-xs lg:text-sm">3</span>
                  Información Fiscal
                </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="birth_date">Fecha de Nacimiento</Label>
                  <Input id="birth_date" type="date" {...profileForm.register('birth_date')} />
                  {profileForm.formState.errors.birth_date && <p className="text-sm text-red-600">{profileForm.formState.errors.birth_date.message as React.ReactNode}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="homoclave">Homoclave (RFC)</Label>
                  <Input id="homoclave" {...profileForm.register('homoclave')} maxLength={3} placeholder="Últimos 3 dígitos" />
                  {profileForm.formState.errors.homoclave && <p className="text-sm text-red-600">{profileForm.formState.errors.homoclave.message as React.ReactNode}</p>}
                </div>
                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="rfc">RFC Calculado</Label>
                  <Input
                    id="rfc"
                    type="text"
                    value={calculatedRfc}
                    readOnly
                    disabled
                    className="font-mono font-bold"
                  />
                  <p className="text-xs text-muted-foreground">Este campo se calcula automáticamente con los datos proporcionados.</p>
                </div>
                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="fiscal_situation">Situación Fiscal</Label>
                  <select {...profileForm.register('fiscal_situation')} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                    <option value="">Seleccionar...</option>
                    <option value="asalariado">Empleado con nómina</option>
                    <option value="honorarios">Honorarios</option>
                    <option value="dividendos">Dividendos o acciones</option>
                    <option value="pensionado">Pensionado</option>
                    <option value="actividad_empresarial">Persona Física con Actividad Empresarial</option>
                  </select>
                  {profileForm.formState.errors.fiscal_situation && <p className="text-sm text-red-600">{profileForm.formState.errors.fiscal_situation?.message as React.ReactNode}</p>}
                </div>
              </div>
            </div>

              {/* Family Status Section */}
              <div className="bg-gray-50 p-4 lg:p-6 rounded-xl border-2 border-gray-200">
                <h3 className="text-base lg:text-lg font-bold text-gray-900 mb-3 lg:mb-4 flex items-center">
                  <span className="bg-primary-600 text-white rounded-full w-7 h-7 lg:w-8 lg:h-8 flex items-center justify-center mr-2 lg:mr-3 text-xs lg:text-sm">4</span>
                  Estado Civil y Género
                </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="civil_status">Estado Civil</Label>
                  <select {...profileForm.register('civil_status')} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                    <option value="">Seleccionar...</option>
                    <option value="soltero">Soltero(a)</option>
                    <option value="casado">Casado(a)</option>
                    <option value="viudo">Viudo(a)</option>
                    <option value="union">Unión Libre</option>
                  </select>
                  {profileForm.formState.errors.civil_status && <p className="text-sm text-red-600">{profileForm.formState.errors.civil_status?.message as React.ReactNode}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gender">Género</Label>
                  <select {...profileForm.register('gender')} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                    <option value="">Seleccionar...</option>
                    <option value="Masculino">Masculino</option>
                    <option value="Femenino">Femenino</option>
                  </select>
                  {profileForm.formState.errors.gender && <p className="text-sm text-red-600">{profileForm.formState.errors.gender?.message as React.ReactNode}</p>}
                </div>
                {isMarried && (
                  <div className="md:col-span-2 space-y-2">
                    <Label htmlFor="spouse_name">Nombre Completo del Cónyuge</Label>
                    <Input id="spouse_name" {...profileForm.register('spouse_name')} placeholder="Nombre completo del cónyuge" />
                    {profileForm.formState.errors.spouse_name && <p className="text-sm text-red-600">{profileForm.formState.errors.spouse_name.message as React.ReactNode}</p>}
                  </div>
                )}
              </div>
            </div>
            </div>
          </div>

          {/* Prior TREFA Advisor Section - Full width below the grid */}
          <div className="bg-amber-50 p-4 lg:p-6 rounded-xl border-2 border-amber-200 mt-4 lg:mt-6">
            <h3 className="text-base lg:text-lg font-bold text-gray-900 mb-3 lg:mb-4 flex items-center">
              <span className="bg-primary-600 text-white rounded-full w-7 h-7 lg:w-8 lg:h-8 flex items-center justify-center mr-2 lg:mr-3 text-xs lg:text-sm">5</span>
              Asignación de Asesor
            </h3>

              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-3 block">
                    ¿Ya he sido atendido por un asesor de TREFA?
                  </Label>
                  <RadioGroup value={hasPriorAdvisor} onValueChange={setHasPriorAdvisor} className="flex gap-4">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="no" id="no-prior-advisor" />
                      <Label htmlFor="no-prior-advisor" className="font-normal cursor-pointer">No</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="yes" id="yes-prior-advisor" />
                      <Label htmlFor="yes-prior-advisor" className="font-normal cursor-pointer">Sí</Label>
                    </div>
                  </RadioGroup>
                </div>

                {hasPriorAdvisor === 'yes' && (
                  <div>
                    <Label htmlFor="sales-agent-select" className="text-sm font-medium text-gray-700 mb-2 block">
                      Selecciona tu asesor
                    </Label>
                    <Select value={selectedSalesAgentId} onValueChange={setSelectedSalesAgentId}>
                      <SelectTrigger id="sales-agent-select" className="w-full">
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
                        <Info className="w-4 h-4 mr-1" />
                        Se asignará a {assignedAgentName} como tu asesor y tendrá acceso a tu cuenta para dar seguimiento.
                      </p>
                    )}
                  </div>
                )}

                {hasPriorAdvisor === 'no' && (
                  <p className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg border border-blue-200">
                    <Info className="w-4 h-4 inline mr-2" />
                    Se te asignará un asesor automáticamente al guardar tu perfil.
                  </p>
                )}
              </div>
            </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={saveState === 'saving'}
              className={`inline-flex items-center justify-center py-2.5 px-6 border border-transparent shadow-sm text-sm font-bold rounded-lg text-white transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white disabled:opacity-70 touch-manipulation min-h-[44px] w-full sm:w-auto
                ${saveState === 'saved'
                  ? 'bg-green-500 hover:bg-green-600 focus:ring-green-500'
                  : 'hover:opacity-90 focus:ring-[#FF6801]'
                }`}
              style={saveState !== 'saved' ? { backgroundColor: '#FF6801' } : {}}
            >
              {saveState === 'saving' && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {saveState === 'saved' && <CheckCircle className="w-4 h-4 mr-2" />}
              {saveState === 'saving' ? 'Guardando...' : saveState === 'saved' ? '¡Guardado!' : 'Guardar cambios y continuar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ProfilePage;