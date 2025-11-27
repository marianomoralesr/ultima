# Cambios Pendientes para Formulario Mejorado

## Estado Actual

✅ **Completado:**
1. Creado `VehicleFinancingStep.tsx` - Vehículo + Calculadora de financiamiento integrada
2. Creado `AdditionalDetailsStep.tsx` - Preguntas tipo pill (vivienda, dependientes, estudios)
3. Creado `PersonalInfoStepSimplified.tsx` - Solo información personal y dirección

## ⏳ Cambios Pendientes

### 1. Actualizar EnhancedApplication.tsx

**Archivo:** `src/components/application/EnhancedApplication.tsx`

**Cambios necesarios:**

```typescript
// Línea ~31: Actualizar imports
import VehicleFinancingStep from './steps/VehicleFinancingStep';
import PersonalInfoStepSimplified from './steps/PersonalInfoStepSimplified';
import AdditionalDetailsStep from './steps/AdditionalDetailsStep';
import EmploymentStep from './steps/EmploymentStep';
import ReferencesStep from './steps/ReferencesStep';
import ConsentStep from './steps/ConsentStep';
import ReviewSubmitStep from './steps/ReviewSubmitStep';
import CompletedStep from './steps/CompletedStep';

// Línea ~99: Actualizar stepper definition
const { useStepper, utils } = Stepperize.defineStepper(
  { id: 'vehicle-financing', title: 'Vehículo', description: 'Auto y financiamiento', icon: FileText },
  { id: 'personal-info', title: 'Personal', description: 'Información personal', icon: User },
  { id: 'employment', title: 'Empleo', description: 'Información laboral', icon: Building2 },
  { id: 'additional-details', title: 'Detalles', description: 'Info complementaria', icon: Home }, // NUEVO
  { id: 'references', title: 'Referencias', description: 'Referencias personales', icon: Users },
  { id: 'consent', title: 'Consentimiento', description: 'Términos y condiciones', icon: PenSquare },
  { id: 'review', title: 'Revisión', description: 'Revisar y enviar', icon: FileText },
  { id: 'complete', title: 'Completado', description: 'Solicitud enviada', icon: CheckCircle }
);

// Línea ~282: Actualizar stepFieldsMap en handleNext
const stepFieldsMap: Record<string, string[]> = {
  'vehicle-financing': [], // Validación manejada en el componente
  'personal-info': [], // Solo dirección si es necesario
  'employment': ['fiscal_classification', 'company_name', 'company_phone', 'supervisor_name', 'company_address', 'company_industry', 'job_title', 'job_seniority', 'net_monthly_income'],
  'additional-details': ['time_at_address', 'housing_type', 'dependents', 'grado_de_estudios'], // NUEVO
  'references': ['friend_reference_name', 'friend_reference_phone', 'friend_reference_relationship', 'family_reference_name', 'family_reference_phone', 'parentesco'],
  'consent': ['terms_and_conditions'],
  'review': []
};

// Línea ~563: Actualizar stepper.switch
{stepper.switch({
  'vehicle-financing': () => (
    <VehicleFinancingStep
      stepper={stepper}
      vehicleInfo={vehicleInfo}
      control={control}
      setValue={setValue}
      onVehicleSelect={handleVehicleSelect}
      onNext={handleNext}
    />
  ),
  'personal-info': () => (
    <PersonalInfoStepSimplified
      stepper={stepper}
      control={control}
      errors={errors}
      isMarried={isMarried}
      profile={profile}
      setValue={setValue}
      trigger={trigger}
      onNext={handleNext}
    />
  ),
  'employment': () => (
    <EmploymentStep
      stepper={stepper}
      control={control}
      errors={errors}
      setValue={setValue}
      onNext={handleNext}
    />
  ),
  'additional-details': () => (
    <AdditionalDetailsStep
      stepper={stepper}
      control={control}
      errors={errors}
      onNext={handleNext}
    />
  ),
  'references': () => (
    <ReferencesStep
      stepper={stepper}
      control={control}
      errors={errors}
      profile={profile}
      getValues={getValues}
      onNext={handleNext}
    />
  ),
  'consent': () => (
    <ConsentStep
      stepper={stepper}
      control={control}
      errors={errors}
      setValue={setValue}
      onNext={handleNext}
    />
  ),
  'review': () => (
    <ReviewSubmitStep
      stepper={stepper}
      control={control}
      getValues={getValues}
      setValue={setValue}
      profile={profile}
      vehicleInfo={vehicleInfo}
      bank={recommendedBank}
      onSubmit={handleSubmit(onSubmit)}
      isSubmitting={isSubmitting}
      submissionError={submissionError}
    />
  ),
  'complete': () => (
    <CompletedStep
      vehicleInfo={vehicleInfo}
      applicationId={applicationId}
    />
  )
})}
```

### 2. Actualizar Status al Enviar

**Archivo:** `src/components/application/EnhancedApplication.tsx`
**Función:** `onSubmit` (línea ~318)

**Cambio necesario:**

```typescript
const payload = {
  personal_info_snapshot: profile,
  car_info: vehicleInfo,
  application_data: data,
  selected_banks: [recommendedBank],
  status: 'pending_documents', // CAMBIAR DE 'submitted' a 'pending_documents'
};

const updatedApp = await ApplicationService.updateApplication(applicationId, payload);
```

### 3. Mejorar CompletedStep

**Archivo:** `src/components/application/steps/CompletedStep.tsx`

**Necesita incluir:**
- Instrucciones claras sobre próximos pasos
- Lista de documentos necesarios
- Botón para subir documentos
- Información similar a `/seguimiento/:id`

**Ejemplo de contenido a agregar:**

```tsx
{/* Next Steps */}
<div className="w-full max-w-lg bg-white border rounded-lg p-6">
  <h3 className="font-bold text-lg mb-4">Próximos Pasos</h3>
  <ol className="space-y-3 text-sm">
    <li className="flex gap-3">
      <span className="font-bold text-primary-600">1.</span>
      <span>Sube los documentos requeridos (INE, comprobante de domicilio, comprobante de ingresos, estado de cuenta)</span>
    </li>
    <li className="flex gap-3">
      <span className="font-bold text-primary-600">2.</span>
      <span>Espera la revisión del banco (1-3 días hábiles)</span>
    </li>
    <li className="flex gap-3">
      <span className="font-bold text-primary-600">3.</span>
      <span>Recibe notificación de aprobación</span>
    </li>
    <li className="flex gap-3">
      <span className="font-bold text-primary-600">4.</span>
      <span>¡Separa tu vehículo!</span>
    </li>
  </ol>
</div>

{/* Documents List */}
<div className="w-full max-w-lg bg-yellow-50 border border-yellow-200 rounded-lg p-6">
  <h4 className="font-semibold mb-3 flex items-center gap-2">
    <FileText className="w-5 h-5" />
    Documentos Requeridos
  </h4>
  <ul className="space-y-2 text-sm">
    <li>✓ Identificación oficial (INE/Pasaporte)</li>
    <li>✓ Comprobante de domicilio (no mayor a 3 meses)</li>
    <li>✓ Comprobante de ingresos</li>
    <li>✓ Estado de cuenta bancario</li>
  </ul>
</div>
```

### 4. Verificar ApplicationService

**Archivo:** `src/services/ApplicationService.ts`

**Verificar que el método `updateApplication` acepte el campo `status`:**

```typescript
// Debe permitir actualizar el status a 'pending_documents'
export const updateApplication = async (applicationId: string, updates: any) => {
  // ... código existente
  // Asegurar que 'status' sea incluido en el update
};
```

### 5. Eliminar ReviewSubmitStep Calculadora

**Archivo:** `src/components/application/steps/ReviewSubmitStep.tsx`

**Cambios:**
- Remover toda la sección de "Preferencias de Financiamiento" (líneas ~80-140)
- Ya está en VehicleFinancingStep
- Mantener solo el resumen de información

## 📋 Resumen de Nueva Estructura

**8 Pasos Totales:**

1. 🚗 **Vehículo + Financiamiento** (VehicleFinancingStep)
   - Selección de auto
   - Plazo de crédito (seleccionable)
   - Enganche (con botones mínimo/recomendado)
   - Calculadora de monto a financiar

2. 👤 **Personal** (PersonalInfoStepSimplified)
   - Resumen de datos personales
   - Confirmación de dirección

3. 💼 **Empleo** (EmploymentStep)
   - Clasificación fiscal
   - Datos de la empresa
   - Puesto y antigüedad
   - Ingreso mensual

4. 📋 **Detalles Adicionales** (AdditionalDetailsStep) - NUEVO
   - Tiempo en domicilio (pills)
   - Tipo de vivienda (pills)
   - Dependientes económicos (pills)
   - Nivel de estudios (pills)

5. 👥 **Referencias** (ReferencesStep)
   - Referencia de amistad
   - Referencia familiar

6. ✅ **Consentimiento** (ConsentStep)
   - Declaraciones
   - Términos y condiciones
   - Encuesta opcional

7. 📝 **Revisión** (ReviewSubmitStep)
   - Resumen personal
   - Resumen laboral
   - Confirmación final

8. 🎊 **Completado** (CompletedStep)
   - Mensaje de éxito
   - Instrucciones próximos pasos
   - Lista de documentos requeridos
   - Botón para subir documentos

## 🎯 Beneficios de la Reorganización

✅ **Mejor UX:**
- Calculadora de financiamiento junto con selección de auto (más lógico)
- Preguntas tipo pill agrupadas en un solo paso (más rápido)
- Flujo más natural y semántico

✅ **Mejor conversión:**
- Usuario configura financiamiento temprano (mayor compromiso)
- Pasos más cortos y específicos
- Menos abandono

✅ **Status correcto:**
- `pending_documents` al enviar
- Trigger correcto para banco dashboard
- Instrucciones claras post-envío

## ⚠️ Importante

Antes de hacer estos cambios:
1. Hacer backup del código actual
2. Probar cada paso después de implementar
3. Verificar que la validación funcione
4. Confirmar que el status se actualice correctamente
5. Probar el flujo completo end-to-end
