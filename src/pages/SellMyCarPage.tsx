import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../context/AuthContext';
import { SellCarService } from '../services/SellCarService';
import { supabase } from '../../supabaseClient';
import { Car, Loader2, CheckCircle, ArrowRight, Upload } from 'lucide-react';
import ValuationApp from '../Valuation/App'; // Import the valuation app
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';

const MEXICAN_STATES = [ 'Aguascalientes', 'Baja California', 'Baja California Sur', 'Campeche', 'Chiapas', 'Chihuahua', 'Coahuila', 'Colima', 'Durango', 'Guanajuato', 'Guerrero', 'Hidalgo', 'Jalisco', 'México', 'Michoacán', 'Morelos', 'Nayarit', 'Nuevo León', 'Oaxaca', 'Puebla', 'Querétaro', 'Quintana Roo', 'San Luis Potosí', 'Sinaloa', 'Sonora', 'Tabasco', 'Tamaulipas', 'Tlaxcala', 'Veracruz', 'Yucatán', 'Zacatecas', ];
const BRANCHES = ['Monterrey', 'Guadalupe', 'Reynosa', 'Saltillo'];

const sellCarSchema = z.object({
  first_name: z.string().min(1, "El nombre es requerido."),
  last_name: z.string().min(1, "El apellido es requerido."),
  contact_email: z.string().email("Email inválido.").min(1, "El email es requerido."),
  contact_phone: z.string().min(10, "El teléfono debe tener al menos 10 dígitos."),
  owner_count: z.string().min(1, "El número de dueños es requerido."),
  key_info: z.string().min(1, "La información de las llaves es requerida."),
  invoice_status: z.enum(['liberada', 'financiada'], { message: "El estado de la factura es requerido." }),
  financing_entity_type: z.enum(['banco', 'agencia']).optional(),
  financing_entity_name: z.string().optional(),
  vehicle_state: z.string().min(1, "El estado del vehículo es requerido."),
  plate_registration_state: z.string().min(1, "El estado de las placas es requerido."),
  accident_history: z.string().min(1, "El historial de accidentes es requerido."),
  reason_for_selling: z.string().min(1, "El motivo de venta es requerido."),
  additional_details: z.string().optional(),
  inspection_branch: z.string().min(1, "Debes seleccionar una sucursal para la inspección."),
}).refine(data => {
    if (data.invoice_status === 'financiada') {
        return !!data.financing_entity_type && !!data.financing_entity_name;
    }
    return true;
}, {
    message: "Debes especificar el tipo y nombre de la entidad financiera.",
    path: ["financing_entity_name"],
});

type SellCarFormData = z.infer<typeof sellCarSchema>;

const SellMyCarPage: React.FC = () => {
    const { user } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    
    // Check for data passed from ValuationApp navigation, sessionStorage, or localStorage (for post-login redirect)
    const initialValuationData = location.state?.valuationData ||
                                  JSON.parse(sessionStorage.getItem('sellCarValuation') || 'null') ||
                                  JSON.parse(localStorage.getItem('pendingValuationData') || 'null');

    const [valuationData] = useState<any>(initialValuationData);
    const [status, setStatus] = useState<'form' | 'submitting' | 'success' | 'error'>('form');
    const [exteriorPhotos, setExteriorPhotos] = useState<File[]>([]);
    const [interiorPhotos, setInteriorPhotos] = useState<File[]>([]);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const { register, handleSubmit, watch, formState: { errors } } = useForm<SellCarFormData>({
        resolver: zodResolver(sellCarSchema),
        defaultValues: {
            first_name: valuationData?.contactInfo?.firstName || '',
            last_name: valuationData?.contactInfo?.lastName || '',
            contact_email: valuationData?.contactInfo?.email || user?.email || '',
            contact_phone: valuationData?.contactInfo?.phone || ''
        }
    });

    const invoiceStatus = watch('invoice_status');

    useEffect(() => {
        // If valuation data exists, save it to session storage to persist across reloads
        if (valuationData) {
            sessionStorage.setItem('sellCarValuation', JSON.stringify(valuationData));
            // Clear the pendingValuationData from localStorage after we've loaded it
            localStorage.removeItem('pendingValuationData');
        }
    }, [valuationData]);
    
    const uploadPhotos = async (files: File[], type: 'exterior' | 'interior'): Promise<string[]> => {
        if (!user) throw new Error("Usuario no autenticado");
        if (files.length === 0) return [];

        const uploadPromises = files.map(file => {
            const filePath = `${user.id}/sell-my-car/${type}/${Date.now()}-${file.name}`;
            return supabase.storage.from('user-car-photos').upload(filePath, file);
        });

        const results = await Promise.all(uploadPromises);
        const paths: string[] = [];
        for (const result of results) {
            if (result.error) throw result.error;
            paths.push(result.data.path);
        }
        return paths;
    };

    const onSubmit = async (data: SellCarFormData) => {
        if (!user || !valuationData) return;
        setStatus('submitting');
        setErrorMessage(null);

        try {
            // Update user profile with contact information
            await supabase
                .from('profiles')
                .update({
                    first_name: data.first_name,
                    last_name: data.last_name,
                    email: data.contact_email,
                    phone: data.contact_phone,
                })
                .eq('id', user.id);

            const [exterior_photos, interior_photos] = await Promise.all([
                uploadPhotos(exteriorPhotos, 'exterior'),
                uploadPhotos(interiorPhotos, 'interior')
            ]);

            const listingPayload = {
                user_id: user.id,
                status: 'in_inspection' as 'in_inspection',
                valuation_data: valuationData,
                exterior_photos,
                interior_photos,
                ...data,
                owner_count: parseInt(data.owner_count, 10),
            };

            await SellCarService.createOrUpdateSellListing(listingPayload);
            sessionStorage.removeItem('sellCarValuation');
            setStatus('success');

            // Redirect to Citas page with Cita de Inspección pre-selected after a short delay
            setTimeout(() => {
                navigate('/escritorio/citas', { state: { activeTab: 'cita-inspeccion' } });
            }, 2000);
        } catch (error: any) {
            console.error("Failed to submit sell car form:", error);
            setErrorMessage(error.message || "No se pudo guardar la información. Intenta de nuevo.");
            setStatus('form');
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<File[]>>) => {
        if (e.target.files) {
            setter(Array.from(e.target.files));
        }
    };
    
    // If there is no valuation data, render the valuation app to start the process.
    if (!valuationData) {
        return (
            <div className="w-full flex justify-center items-start py-8 sm:py-12">
                 <ValuationApp />
            </div>
        );
    }
    
    if (status === 'success') {
        return (
            <div className="max-w-2xl mx-auto py-12">
                <Card className="text-center">
                    <CardContent className="pt-12 pb-8">
                        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                        <h1 className="text-2xl font-semibold mb-3">¡Información Recibida!</h1>
                        <p className="text-muted-foreground">Hemos guardado los detalles de tu auto. El siguiente paso es la inspección. Un asesor se pondrá en contacto contigo para coordinar la cita en la sucursal que seleccionaste.</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6 p-4">
            <Card>
                <CardHeader className="text-center">
                    <div className="flex items-center justify-center gap-3 mb-2">
                        <Car className="w-8 h-8 text-primary"/>
                        <CardTitle className="text-3xl">Completa los Detalles de tu Auto</CardTitle>
                    </div>
                    <CardDescription className="text-base">Proporciona la siguiente información para continuar con la venta.</CardDescription>
                </CardHeader>
            </Card>

            <Card className="border-blue-200 bg-blue-50/50">
                <CardContent className="pt-6">
                    <div className="space-y-3">
                        <div>
                            <Label className="text-sm font-semibold text-blue-800">Vehículo a vender:</Label>
                            <p className="text-lg font-bold text-blue-900">{valuationData?.vehicle?.label}</p>
                        </div>
                        <div>
                            <Label className="text-sm font-semibold text-blue-800">Oferta Inicial:</Label>
                            <p className="text-2xl font-bold text-green-600">{new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(valuationData?.valuation?.suggestedOffer)}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Información de Contacto</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                            <FormField label="Nombre" error={errors.first_name?.message}>
                                <Input {...register('first_name')} placeholder="Tu nombre"/>
                            </FormField>
                            <FormField label="Apellido" error={errors.last_name?.message}>
                                <Input {...register('last_name')} placeholder="Tu apellido"/>
                            </FormField>
                            <FormField label="Email" error={errors.contact_email?.message}>
                                <Input {...register('contact_email')} type="email" placeholder="tu@email.com"/>
                            </FormField>
                            <FormField label="Teléfono" error={errors.contact_phone?.message}>
                                <Input {...register('contact_phone')} type="tel" placeholder="8123456789"/>
                            </FormField>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Detalles del Vehículo</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                            <FormField label="Número de dueños anteriores" error={errors.owner_count?.message}>
                                <select {...register('owner_count')} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                                    <option value="">Seleccionar...</option>
                                    <option value="1">1</option>
                                    <option value="2">2</option>
                                    <option value="3">3 o más</option>
                                </select>
                            </FormField>

                            <FormField label="¿Cuántos juegos de llaves tienes?" error={errors.key_info?.message}>
                                <select {...register('key_info')} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                                    <option value="">Seleccionar...</option>
                                    <option value="Duplicado">Duplicado (2 llaves)</option>
                                    <option value="Una llave">Una sola llave</option>
                                </select>
                            </FormField>
                        </div>

                        <FormField label="Estado de la factura" error={errors.invoice_status?.message}>
                            <select {...register('invoice_status')} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                                <option value="">Seleccionar...</option>
                                <option value="liberada">Liberada (Pagada por completo)</option>
                                <option value="financiada">Aún está financiada</option>
                            </select>
                        </FormField>

                        {invoiceStatus === 'financiada' && (
                            <Card className="border-muted">
                                <CardContent className="pt-6">
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <FormField label="Tipo de entidad" error={errors.financing_entity_type?.message}>
                                            <select {...register('financing_entity_type')} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                                                <option value="">Seleccionar...</option>
                                                <option value="banco">Banco</option>
                                                <option value="agencia">Agencia de autos</option>
                                            </select>
                                        </FormField>
                                        <FormField label="Nombre de la entidad" error={errors.financing_entity_name?.message}>
                                            <Input {...register('financing_entity_name')} placeholder="Ej: BBVA, GM Financial"/>
                                        </FormField>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        <div className="grid md:grid-cols-2 gap-4">
                            <FormField label="¿En qué estado se encuentra el vehículo?" error={errors.vehicle_state?.message}>
                                <select {...register('vehicle_state')} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                                    <option value="">Seleccionar...</option>
                                    {MEXICAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </FormField>
                            <FormField label="¿En qué estado están registradas las placas?" error={errors.plate_registration_state?.message}>
                                <select {...register('plate_registration_state')} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                                    <option value="">Seleccionar...</option>
                                    {MEXICAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </FormField>
                        </div>

                        <FormField label="¿El auto ha tenido algún accidente?" error={errors.accident_history?.message}>
                            <select {...register('accident_history')} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                                <option value="">Seleccionar...</option>
                                <option value="ninguno">No, ninguno</option>
                                <option value="leves">Sí, solo daños estéticos leves</option>
                                <option value="graves">Sí, con reparaciones estructurales</option>
                            </select>
                        </FormField>

                        <FormField label="¿Cuál es tu principal motivo para vender?" error={errors.reason_for_selling?.message}>
                            <select {...register('reason_for_selling')} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                                <option value="">Seleccionar...</option>
                                <option value="Quiero un auto más nuevo">Quiero un auto más nuevo</option>
                                <option value="Necesito el dinero">Necesito el dinero</option>
                                <option value="Ya no lo uso">Ya no lo uso</option>
                                <option value="Otro">Otro</option>
                            </select>
                        </FormField>

                        <div className="space-y-4 pt-2">
                            <FormField label="Sube fotos del exterior (opcional)">
                                <FileUpload id="exterior-upload" onChange={(e) => handleFileChange(e, setExteriorPhotos)} multiple filesCount={exteriorPhotos.length} />
                            </FormField>
                            <FormField label="Sube fotos del interior (opcional)">
                                <FileUpload id="interior-upload" onChange={(e) => handleFileChange(e, setInteriorPhotos)} multiple filesCount={interiorPhotos.length} />
                            </FormField>
                        </div>

                        <FormField label="Selecciona una sucursal para la inspección" error={errors.inspection_branch?.message}>
                            <select {...register('inspection_branch')} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                                <option value="">Seleccionar sucursal...</option>
                                {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
                            </select>
                        </FormField>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        {errorMessage && <p className="text-destructive text-center text-sm mb-4">{errorMessage}</p>}
                        <Button type="submit" disabled={status === 'submitting'} className="w-full h-12 text-base" size="lg">
                            {status === 'submitting' ? <Loader2 className="w-5 h-5 animate-spin"/> : <ArrowRight className="w-5 h-5"/>}
                            {status === 'submitting' ? 'Enviando...' : 'Agendar Inspección y Enviar'}
                        </Button>
                    </CardContent>
                </Card>
            </form>
        </div>
    );
};

const FormField: React.FC<{ label: string, error?: string, children: React.ReactNode }> = ({ label, error, children }) => (
    <div className="space-y-2">
        <Label className="text-sm font-medium">{label}</Label>
        {children}
        {error && <p className="text-destructive text-xs">{error}</p>}
    </div>
);
const FileUpload: React.FC<{ id: string, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, multiple?: boolean, filesCount?: number }> = ({ id, onChange, multiple, filesCount = 0 }) => (
    <div className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md transition-colors ${filesCount > 0 ? 'border-green-500 bg-green-50' : 'border-gray-300'}`}>
        <div className="space-y-1 text-center">
            {filesCount > 0 ? (
                <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
            ) : (
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
            )}
            <div className="flex flex-col items-center text-sm text-gray-600">
                <label htmlFor={id} className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 px-2 py-1">
                    <span>{filesCount > 0 ? 'Cambiar archivos' : 'Sube archivos'}</span>
                    <input id={id} type="file" className="sr-only" onChange={onChange} multiple={multiple} accept="image/*" />
                </label>
                {filesCount > 0 && (
                    <p className="text-green-600 font-semibold mt-2">{filesCount} archivo{filesCount !== 1 ? 's' : ''} seleccionado{filesCount !== 1 ? 's' : ''}</p>
                )}
            </div>
        </div>
    </div>
);

export default SellMyCarPage;