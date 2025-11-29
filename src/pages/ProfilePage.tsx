import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { ProfileService } from '../services/profileService';
import { User, ArrowLeft, CheckCircle, Loader2, Info, ChevronRight, ChevronLeft } from 'lucide-react';
import type { Profile } from '../types/types';
import { calculateRFC } from '../utils/rfcCalculator';
import { toast } from 'sonner';
import { conversionTracking } from '../services/ConversionTrackingService';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { Button } from '../components/ui/button';
import { Progress } from '../components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';

const CELLPHONE_COMPANIES = [
  'Telcel', 'AT&T', 'Movistar', 'Unefon', 'Virgin Mobile', 'Weex (Dish)', 'Pillofon', 'Otro',
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

const normalizeNameToTitleCase = (name: string): string => {
  if (!name) return '';
  const lowercaseWords = ['de', 'del', 'la', 'los', 'las', 'y', 'e', 'van', 'von', 'da', 'di'];
  return name.trim().toLowerCase().split(' ').map((word, index) => {
    if (index === 0 || !lowercaseWords.includes(word)) {
      return word.charAt(0).toUpperCase() + word.slice(1);
    }
    return word;
  }).join(' ');
};

const profileSchema = z.object({
  first_name: z.string().min(2, 'Por favor, ingresa tu nombre (mínimo 2 caracteres)'),
  last_name: z.string().min(2, 'Por favor, ingresa tu apellido paterno (mínimo 2 caracteres)'),
  mother_last_name: z.string().min(2, 'Por favor, ingresa tu apellido materno (mínimo 2 caracteres)'),
  phone: z.string().optional().or(z.literal('')),
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
  message: 'Por favor, ingresa el nombre completo de tu cónyuge',
  path: ['spouse_name'],
});

type ProfileFormData = z.infer<typeof profileSchema>;

const STEPS = [
  { id: 1, title: 'Contacto', description: 'Información de contacto' },
  { id: 2, title: 'Personal', description: 'Datos personales' },
  { id: 3, title: 'Fiscal', description: 'Información fiscal' },
];

const ProfilePage: React.FC = () => {
  const { user, profile, loading, reloadProfile } = useAuth();
  const navigate = useNavigate();
  const formInitialized = useRef(false);

  const [currentStep, setCurrentStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [isFirstTimeUser, setIsFirstTimeUser] = useState(false);
  const [calculatedRfc, setCalculatedRfc] = useState('');
  const [hasPriorAdvisor, setHasPriorAdvisor] = useState<string>('no');
  const [selectedSalesAgentId, setSelectedSalesAgentId] = useState<string>('');
  const [profilePictureFile, setProfilePictureFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    mode: 'onBlur',
    defaultValues: {
      first_name: '',
      last_name: '',
      mother_last_name: '',
      phone: '',
      cellphone_company: '',
      birth_date: '',
      homoclave: '',
      fiscal_situation: '',
      civil_status: '',
      spouse_name: '',
      gender: '',
      how_did_you_know: '',
    }
  });

  const { watch, setValue, getValues, register, formState: { errors } } = profileForm;
  const civilStatus = watch('civil_status');
  const isMarried = civilStatus?.toLowerCase() === 'casado';

  // Initialize form ONCE when profile loads
  useEffect(() => {
    if (profile && !formInitialized.current) {
      formInitialized.current = true;

      const isComplete = !!(profile.first_name && profile.last_name && profile.mother_last_name &&
                           profile.phone && profile.birth_date && profile.homoclave);

      if (!isComplete) {
        setIsFirstTimeUser(true);
      }

      // Set form values without triggering re-renders
      profileForm.reset({
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
      }, { keepDefaultValues: false });

      setCalculatedRfc(profile.rfc || '');
      setPreviewUrl(profile.picture_url || null);

      if (profile.asesor_asignado_id) {
        setHasPriorAdvisor('yes');
        setSelectedSalesAgentId(profile.asesor_asignado_id);
      }
    }
  }, [profile, profileForm]);

  // Calculate RFC when relevant fields change
  const firstName = watch('first_name');
  const lastName = watch('last_name');
  const motherLastName = watch('mother_last_name');
  const birthDate = watch('birth_date');
  const homoclave = watch('homoclave');

  useEffect(() => {
    if (firstName && lastName && motherLastName && birthDate && homoclave?.length === 3) {
      const rfc = calculateRFC({
        first_name: firstName,
        last_name: lastName,
        mother_last_name: motherLastName,
        birth_date: birthDate,
        homoclave
      });
      if (rfc) setCalculatedRfc(rfc);
    }
  }, [firstName, lastName, motherLastName, birthDate, homoclave]);

  // Save current step data
  const saveStepData = useCallback(async (): Promise<boolean> => {
    if (!user) return false;

    setIsSaving(true);
    try {
      const formData = getValues();

      const payload: Partial<Profile> = {
        id: user.id,
        email: user.email,
        first_name: formData.first_name ? normalizeNameToTitleCase(formData.first_name) : undefined,
        last_name: formData.last_name ? normalizeNameToTitleCase(formData.last_name) : undefined,
        mother_last_name: formData.mother_last_name ? normalizeNameToTitleCase(formData.mother_last_name) : undefined,
        phone: formData.phone || undefined,
        cellphone_company: formData.cellphone_company || undefined,
        birth_date: formData.birth_date || undefined,
        homoclave: formData.homoclave || undefined,
        fiscal_situation: formData.fiscal_situation || undefined,
        civil_status: formData.civil_status || undefined,
        spouse_name: formData.spouse_name ? normalizeNameToTitleCase(formData.spouse_name) : undefined,
        gender: formData.gender || undefined,
        how_did_you_know: formData.how_did_you_know || undefined,
      };

      // Calculate and add RFC
      if (formData.first_name && formData.last_name && formData.mother_last_name &&
          formData.birth_date && formData.homoclave?.length === 3) {
        const rfc = calculateRFC({
          first_name: formData.first_name,
          last_name: formData.last_name,
          mother_last_name: formData.mother_last_name,
          birth_date: formData.birth_date,
          homoclave: formData.homoclave
        });
        if (rfc) payload.rfc = rfc;
      }

      // Handle advisor assignment
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

      // Handle profile picture
      if (profilePictureFile) {
        const pictureUrl = await ProfileService.uploadProfilePicture(user.id, profilePictureFile);
        payload.picture_url = pictureUrl;
      }

      await ProfileService.updateProfile(payload);
      return true;
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Error al guardar. Por favor, intenta de nuevo.');
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [user, getValues, hasPriorAdvisor, selectedSalesAgentId, profile, profilePictureFile]);

  // Handle next step
  const handleNextStep = async () => {
    // Validate current step fields
    let fieldsToValidate: (keyof ProfileFormData)[] = [];

    if (currentStep === 2) {
      fieldsToValidate = ['first_name', 'last_name', 'mother_last_name', 'birth_date', 'civil_status'];
      if (isMarried) fieldsToValidate.push('spouse_name');
    }

    if (fieldsToValidate.length > 0) {
      const isValid = await profileForm.trigger(fieldsToValidate);
      if (!isValid) {
        toast.error('Por favor, completa los campos obligatorios.');
        return;
      }
    }

    // Save current progress
    const saved = await saveStepData();
    if (!saved) return;

    // Move to next step
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Handle previous step
  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Handle final submit
  const handleFinalSubmit = async () => {
    // Validate all required fields for step 3
    const isValid = await profileForm.trigger(['homoclave', 'fiscal_situation']);
    if (!isValid) {
      toast.error('Por favor, completa la homoclave y situación fiscal.');
      return;
    }

    const saved = await saveStepData();
    if (!saved) return;

    // Check if profile is now complete
    const formData = getValues();
    const isComplete = !!(formData.first_name && formData.last_name && formData.mother_last_name &&
                         formData.phone && formData.birth_date && formData.homoclave);

    if (isComplete) {
      // Track completion event
      conversionTracking.trackProfile.updated({
        userId: user?.id,
        email: user?.email,
        profileComplete: true,
        hasProfilePicture: !!previewUrl,
        asesorAutorizado: hasPriorAdvisor === 'yes' || !!profile?.asesor_asignado_id
      });

      toast.success('¡Perfil completado! Redirigiendo a perfilación bancaria...');

      // Reload profile context and redirect
      await reloadProfile();
      setTimeout(() => {
        navigate('/escritorio/perfilacion-bancaria');
      }, 1000);
    } else {
      toast.info('Progreso guardado. Algunos campos obligatorios están pendientes.');
    }
  };

  const handlePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProfilePictureFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const progress = (currentStep / STEPS.length) * 100;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-16 w-16 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-6 lg:py-8">
      <Link
        to="/escritorio"
        className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4 lg:mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Volver al Dashboard
      </Link>

      {isFirstTimeUser && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 p-4 lg:p-5 mb-4 lg:mb-6 rounded-r-lg">
          <h3 className="font-bold text-gray-900 text-sm sm:text-base lg:text-lg">
            ¡Te has registrado con éxito!
          </h3>
          <p className="text-xs sm:text-sm lg:text-base text-gray-700 mt-2">
            Completa la información de tu perfil para continuar con tu solicitud de crédito.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Progress Bar */}
          <Card className="border-0 shadow-none bg-transparent">
            <CardContent className="p-0">
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center">
                  <User className="w-5 h-5 mr-2 sm:mr-3 text-primary-600" />
                  Completa tu perfil
                </h2>
                <span className="text-sm font-medium text-gray-600">
                  Paso {currentStep} de {STEPS.length}
                </span>
              </div>
              <Progress value={progress} className="h-2" />
              <div className="flex justify-between mt-2">
                {STEPS.map((step) => (
                  <div
                    key={step.id}
                    className={`text-xs text-center flex-1 ${
                      step.id === currentStep ? 'text-primary-700 font-bold' :
                      step.id < currentStep ? 'text-green-500 font-medium' : 'text-gray-400'
                    }`}
                  >
                    {step.title}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Form */}
          <form onSubmit={(e) => e.preventDefault()}>
            <Card className="mb-6">
              <CardContent className="p-4 sm:p-6 min-h-[400px]">

                {/* Step 1: Contact */}
                {currentStep === 1 && (
                  <div className="space-y-6">
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 sm:p-5 border-2 border-blue-200">
                      <div className="text-center mb-4">
                        <h4 className="text-base sm:text-lg font-bold text-gray-900 mb-1">Asignación de Asesor</h4>
                        <p className="text-xs sm:text-sm text-gray-600">¿Ya has sido atendido por un asesor de TREFA?</p>
                      </div>

                      <RadioGroup value={hasPriorAdvisor} onValueChange={setHasPriorAdvisor} className="flex gap-4">
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="no" id="no-prior" />
                          <Label htmlFor="no-prior" className="cursor-pointer">No</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="yes" id="yes-prior" />
                          <Label htmlFor="yes-prior" className="cursor-pointer">Sí</Label>
                        </div>
                      </RadioGroup>

                      {hasPriorAdvisor === 'yes' && (
                        <div className="mt-4">
                          <Label className="text-sm">Selecciona tu asesor</Label>
                          <select
                            value={selectedSalesAgentId}
                            onChange={(e) => setSelectedSalesAgentId(e.target.value)}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1"
                          >
                            <option value="">Selecciona...</option>
                            {SALES_AGENTS.map((agent) => (
                              <option key={agent.id} value={agent.id}>{agent.name}</option>
                            ))}
                          </select>
                        </div>
                      )}

                      {hasPriorAdvisor === 'no' && (
                        <p className="text-xs sm:text-sm text-blue-700 bg-blue-100 p-3 rounded-lg mt-4">
                          <Info className="w-4 h-4 inline mr-2" />
                          Se te asignará un asesor automáticamente.
                        </p>
                      )}
                    </div>

                    <div className="space-y-4">
                      <div className="text-center">
                        <h3 className="text-lg font-bold text-gray-900 mb-1">Información de Contacto</h3>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phone">Teléfono</Label>
                        <div className="flex">
                          <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-muted-foreground text-sm">MX +52</span>
                          <Input {...register('phone')} placeholder="10 dígitos" className="rounded-l-none" />
                        </div>
                        {errors.phone && <p className="text-sm text-red-600">{errors.phone.message}</p>}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="cellphone_company">Compañía Telefónica</Label>
                        <select {...register('cellphone_company')} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                          <option value="">Seleccionar...</option>
                          {CELLPHONE_COMPANIES.map((company) => (
                            <option key={company} value={company}>{company}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <Label>Correo Electrónico</Label>
                        <Input type="email" value={user?.email || ''} readOnly disabled />
                        <p className="text-xs text-muted-foreground">Este correo está vinculado a tu cuenta.</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 2: Personal */}
                {currentStep === 2 && (
                  <div className="space-y-5">
                    <div className="text-center mb-6">
                      <h3 className="text-lg font-bold text-gray-900 mb-1">Datos Personales</h3>
                      <p className="text-sm text-gray-600">Ingresa tu nombre como aparece en tu identificación</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Nombre(s) *</Label>
                        <Input {...register('first_name')} placeholder="Tu(s) nombre(s)" />
                        {errors.first_name && <p className="text-sm text-red-600">{errors.first_name.message}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label>Apellido Paterno *</Label>
                        <Input {...register('last_name')} placeholder="Apellido paterno" />
                        {errors.last_name && <p className="text-sm text-red-600">{errors.last_name.message}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label>Apellido Materno *</Label>
                        <Input {...register('mother_last_name')} placeholder="Apellido materno" />
                        {errors.mother_last_name && <p className="text-sm text-red-600">{errors.mother_last_name.message}</p>}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Fecha de Nacimiento *</Label>
                      <Input type="date" {...register('birth_date')} />
                      {errors.birth_date && <p className="text-sm text-red-600">{errors.birth_date.message}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label>Género</Label>
                      <RadioGroup value={watch('gender') || ''} onValueChange={(v) => setValue('gender', v)} className="grid grid-cols-2 gap-3">
                        {['Masculino', 'Femenino'].map((g) => (
                          <div key={g}>
                            <RadioGroupItem value={g} id={`gender-${g}`} className="peer sr-only" />
                            <Label
                              htmlFor={`gender-${g}`}
                              className="flex items-center justify-center rounded-lg border-2 border-muted bg-popover p-3 hover:bg-accent peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary peer-data-[state=checked]:text-primary-foreground cursor-pointer"
                            >
                              {g}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </div>

                    <div className="space-y-2">
                      <Label>Estado Civil *</Label>
                      <RadioGroup value={civilStatus || ''} onValueChange={(v) => setValue('civil_status', v)} className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {['soltero', 'casado', 'viudo', 'union', 'divorciado'].map((status) => (
                          <div key={status}>
                            <RadioGroupItem value={status} id={`civil-${status}`} className="peer sr-only" />
                            <Label
                              htmlFor={`civil-${status}`}
                              className="flex items-center justify-center rounded-lg border-2 border-muted bg-popover p-2.5 text-xs sm:text-sm hover:bg-accent peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary peer-data-[state=checked]:text-primary-foreground cursor-pointer"
                            >
                              {status === 'soltero' ? 'Soltero(a)' :
                               status === 'casado' ? 'Casado(a)' :
                               status === 'viudo' ? 'Viudo(a)' :
                               status === 'union' ? 'Unión Libre' : 'Divorciado(a)'}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                      {errors.civil_status && <p className="text-sm text-red-600">{errors.civil_status.message}</p>}
                    </div>

                    {isMarried && (
                      <div className="space-y-2">
                        <Label>Nombre del Cónyuge *</Label>
                        <Input {...register('spouse_name')} placeholder="Nombre completo del cónyuge" />
                        {errors.spouse_name && <p className="text-sm text-red-600">{errors.spouse_name.message}</p>}
                      </div>
                    )}
                  </div>
                )}

                {/* Step 3: Fiscal */}
                {currentStep === 3 && (
                  <div className="space-y-5">
                    <div className="text-center mb-6">
                      <h3 className="text-lg font-bold text-gray-900 mb-1">Información Fiscal</h3>
                      <p className="text-sm text-gray-600">Completa tus datos fiscales</p>
                    </div>

                    <div className="space-y-2">
                      <Label>Homoclave (RFC) *</Label>
                      <Input {...register('homoclave')} maxLength={3} placeholder="Últimos 3 dígitos" />
                      {errors.homoclave && <p className="text-sm text-red-600">{errors.homoclave.message}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label>RFC Calculado</Label>
                      <Input value={calculatedRfc} readOnly disabled className="font-mono font-bold" />
                      <p className="text-xs text-muted-foreground">Se calcula automáticamente.</p>
                    </div>

                    <div className="space-y-2">
                      <Label>Situación Fiscal *</Label>
                      <select {...register('fiscal_situation')} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                        <option value="">Seleccionar...</option>
                        <option value="asalariado">Empleado con nómina</option>
                        <option value="honorarios">Honorarios</option>
                        <option value="dividendos">Dividendos o acciones</option>
                        <option value="pensionado">Pensionado</option>
                        <option value="actividad_empresarial">Persona Física con Actividad Empresarial</option>
                      </select>
                      {errors.fiscal_situation && <p className="text-sm text-red-600">{errors.fiscal_situation.message}</p>}
                    </div>
                  </div>
                )}

              </CardContent>
            </Card>

            {/* Navigation */}
            <div className="flex justify-between items-center gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={handlePrevStep}
                disabled={currentStep === 1 || isSaving}
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Anterior
              </Button>

              {currentStep < STEPS.length ? (
                <Button
                  type="button"
                  onClick={handleNextStep}
                  disabled={isSaving}
                  style={{ backgroundColor: '#FF6801' }}
                >
                  {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Siguiente
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handleFinalSubmit}
                  disabled={isSaving}
                  style={{ backgroundColor: '#FF6801' }}
                >
                  {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                  {isSaving ? 'Guardando...' : 'Guardar y continuar'}
                </Button>
              )}
            </div>
          </form>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <Card className="sticky top-6">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-center">Foto de Perfil</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <label htmlFor="profile-picture" className="cursor-pointer group inline-block">
                  <div className="w-24 h-24 mx-auto rounded-full bg-gray-200 flex items-center justify-center overflow-hidden ring-2 ring-offset-2 ring-primary-500/50 group-hover:ring-primary-500/80">
                    {previewUrl ? (
                      <img src={previewUrl} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-12 h-12 text-gray-400" />
                    )}
                  </div>
                  <span className="text-xs font-semibold text-gray-500 mt-2 group-hover:text-primary-600 block">Cambiar foto</span>
                </label>
                <input id="profile-picture" type="file" accept="image/*" className="hidden" onChange={handlePictureChange} />
              </div>

              {(firstName || lastName) && (
                <div className="space-y-2 text-sm text-gray-600 bg-muted p-3 rounded-lg">
                  <div className="flex justify-between">
                    <span className="font-medium">Nombre:</span>
                    <span>{normalizeNameToTitleCase(firstName || '')} {normalizeNameToTitleCase(lastName || '')}</span>
                  </div>
                  {user?.email && (
                    <div className="flex justify-between">
                      <span className="font-medium">Email:</span>
                      <span className="truncate ml-2">{user.email}</span>
                    </div>
                  )}
                  {calculatedRfc && (
                    <div className="flex justify-between">
                      <span className="font-medium">RFC:</span>
                      <span className="font-mono font-bold text-primary-600">{calculatedRfc}</span>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
