import React, { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import VehicleService from '../services/VehicleService';
import CarStudioService, { CarStudioApiError } from '../services/CarStudioService';
import type { WordPressVehicle } from '../types/types';
import { Loader2, Send, ServerCrash, Info, Trash2, Camera, History, Layers } from 'lucide-react';
import LazyImage from '../components/LazyImage';
import { DEFAULT_PLACEHOLDER_IMAGE } from '../utils/constants';
import { ImageService } from '../services/ImageService';
import { SaveIcon } from '../components/icons';

type SubTab = 'generator' | 'webEditorHistory' | 'orderHistory';

const InputField: React.FC<{
    id: string;
    label: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    placeholder?: string;
    type?: string;
}> = ({ id, label, value, onChange, placeholder, type = "text" }) => (
    <div>
        <label htmlFor={id} className="text-sm font-medium text-gray-700">{label}</label>
        <input
            id={id}
            type={type}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            className="mt-1 w-full bg-white text-gray-900 rounded-lg px-4 py-2.5 border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
    </div>
);

const CarStudioPage: React.FC = () => {
    const [activeSubTab, setActiveSubTab] = useState<SubTab>('generator');
    const { data, isLoading, error } = useQuery({
        queryKey: ['vehicles-car-studio'],
        queryFn: () => VehicleService.getAllVehicles(),
    });

    const vehicles = data?.vehicles || [];
    const globalError = error ? String(error) : null;

    const subTabs = [
        { id: 'generator', label: 'Generar Imágenes', icon: Camera },
        { id: 'webEditorHistory', label: 'Historial Web Editor', icon: History },
        { id: 'orderHistory', label: 'Historial de Órdenes', icon: Layers },
    ];

    return (
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Depurador de API Car Studio</h1>
                <p className="mt-2 text-gray-600">Herramientas para procesar imágenes y consultar historiales de la API de Car Studio.</p>
            </div>

             <div className="border-b border-gray-200 mb-8">
                <nav className="-mb-px flex space-x-6 overflow-x-auto">
                    {subTabs.map(tab => (
                        <button key={tab.id} onClick={() => setActiveSubTab(tab.id as SubTab)}
                            className={`whitespace-nowrap flex items-center gap-2 py-4 px-1 border-b-2 font-semibold text-sm transition-colors ${activeSubTab === tab.id ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                           <tab.icon className="w-5 h-5" />
                           {tab.label}
                        </button>
                    ))}
                </nav>
            </div>
            
            {activeSubTab === 'generator' && <ImageGeneratorTab vehicles={vehicles} isLoading={isLoading} globalError={globalError} />}
            {activeSubTab === 'webEditorHistory' && <WebEditorHistoryTab />}
            {activeSubTab === 'orderHistory' && <OrderHistoryTab vehicles={vehicles} />}

        </div>
    );
};

// =================================================================================
// TABS & SUB-COMPONENTS
// =================================================================================

const ImageComparison: React.FC<{
    images: { original: string; processed: string }[];
    onSave: () => void;
    onDiscard: () => void;
    saveStatus: 'idle' | 'saving' | 'success' | 'error';
    saveError: string | null;
    replaceFeatureImage: boolean;
    onToggleFeatureImage: (checked: boolean) => void;
}> = ({ images, onSave, onDiscard, saveStatus, saveError, replaceFeatureImage, onToggleFeatureImage }) => {
    const [viewMode, setViewMode] = useState<'grid' | 'slider'>('grid');

    return (
        <div className="mt-4 space-y-4 pt-4 border-t">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-600">Revisa y Confirma las Imágenes</h3>
                <div className="flex gap-2">
                    <button
                        onClick={() => setViewMode('grid')}
                        className={`px-3 py-1 text-xs rounded ${viewMode === 'grid' ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-700'}`}
                    >
                        Grid
                    </button>
                    <button
                        onClick={() => setViewMode('slider')}
                        className={`px-3 py-1 text-xs rounded ${viewMode === 'slider' ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-700'}`}
                    >
                        Slider
                    </button>
                </div>
            </div>

            <div className="max-h-80 overflow-y-auto space-y-4 pr-2">
                {viewMode === 'grid' ? (
                    images.map((img, index) => (
                        <div key={index} className="grid grid-cols-2 gap-2 p-2 border rounded-lg bg-gray-50">
                            <div>
                                <p className="text-xs text-center mb-1 font-medium text-gray-600">Original</p>
                                <LazyImage src={img.original} alt="Original" className="w-full h-32 rounded object-cover" />
                            </div>
                            <div>
                                <p className="text-xs text-center mb-1 font-medium text-gray-600">Procesada</p>
                                <LazyImage src={img.processed} alt="Processed" className="w-full h-32 rounded object-cover" />
                            </div>
                        </div>
                    ))
                ) : (
                    <ImageSlider images={images} />
                )}
            </div>

            <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <input
                    type="checkbox"
                    id="replaceFeatureImage"
                    checked={replaceFeatureImage}
                    onChange={(e) => onToggleFeatureImage(e.target.checked)}
                    className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                />
                <label htmlFor="replaceFeatureImage" className="text-sm text-gray-700 cursor-pointer">
                    Reemplazar imagen destacada con la primera imagen procesada
                </label>
            </div>

            <div className="flex gap-4">
                <button
                    onClick={onSave}
                    disabled={saveStatus === 'saving'}
                    className="w-full flex items-center justify-center gap-2 bg-green-600 text-white font-semibold py-2.5 rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors"
                >
                    {saveStatus === 'saving' ? <Loader2 className="w-5 h-5 animate-spin" /> : <SaveIcon className="w-5 h-5" />}
                    {saveStatus === 'saving' ? 'Guardando...' : 'Guardar y Reemplazar'}
                </button>
                <button
                    onClick={onDiscard}
                    className="w-full flex items-center justify-center gap-2 bg-red-600 text-white font-semibold py-2.5 rounded-lg hover:bg-red-700 transition-colors"
                >
                    <Trash2 className="w-5 h-5" />
                    Descartar
                </button>
            </div>
            {saveStatus === 'success' && (
                <p className="p-2 text-center bg-green-100 text-sm text-green-800 rounded-md font-medium">
                    ¡Imágenes guardadas exitosamente!
                </p>
            )}
            {saveStatus === 'error' && <ErrorDisplay title="Error al Guardar" message={saveError || 'Ocurrió un error desconocido.'} />}
        </div>
    );
};

const ImageSlider: React.FC<{ images: { original: string; processed: string }[] }> = ({ images }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [sliderPosition, setSliderPosition] = useState(50);

    const handleNext = () => setCurrentIndex((prev) => (prev + 1) % images.length);
    const handlePrev = () => setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);

    return (
        <div className="space-y-3">
            <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
                <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}>
                    <img src={images[currentIndex].processed} alt="Processed" className="w-full h-full object-cover" />
                </div>
                <div className="absolute inset-0">
                    <img src={images[currentIndex].original} alt="Original" className="w-full h-full object-cover" />
                </div>
                <div
                    className="absolute inset-y-0 w-1 bg-white cursor-ew-resize shadow-lg"
                    style={{ left: `${sliderPosition}%` }}
                    onMouseDown={(e) => {
                        const handleMouseMove = (moveEvent: MouseEvent) => {
                            const rect = e.currentTarget.parentElement!.getBoundingClientRect();
                            const x = moveEvent.clientX - rect.left;
                            const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
                            setSliderPosition(percentage);
                        };
                        const handleMouseUp = () => {
                            document.removeEventListener('mousemove', handleMouseMove);
                            document.removeEventListener('mouseup', handleMouseUp);
                        };
                        document.addEventListener('mousemove', handleMouseMove);
                        document.addEventListener('mouseup', handleMouseUp);
                    }}
                >
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center">
                        <div className="text-xs">⟷</div>
                    </div>
                </div>
                <div className="absolute top-2 left-2 bg-black/60 text-white px-2 py-1 rounded text-xs">Original</div>
                <div className="absolute top-2 right-2 bg-black/60 text-white px-2 py-1 rounded text-xs">Procesada</div>
            </div>
            <div className="flex items-center justify-between">
                <button onClick={handlePrev} className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 text-sm">
                    ← Anterior
                </button>
                <span className="text-sm text-gray-600">
                    {currentIndex + 1} / {images.length}
                </span>
                <button onClick={handleNext} className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 text-sm">
                    Siguiente →
                </button>
            </div>
        </div>
    );
};

interface ImageGeneratorTabProps {
    vehicles: WordPressVehicle[];
    isLoading: boolean;
    globalError: string | null;
}

const ImageGeneratorTab: React.FC<ImageGeneratorTabProps> = ({ vehicles, isLoading, globalError }) => {
    // Filter vehicles to show only those with galleries (exterior photos)
    const vehiclesWithGalleries = vehicles.filter(v => {
        const exteriorImages = (v.galeria_exterior || v.fotos_exterior_url || []).filter((url): url is string =>
            !!url && url !== DEFAULT_PLACEHOLDER_IMAGE
        );
        return exteriorImages.length > 0;
    });

    // Component State
    const [selectedVehicle, setSelectedVehicle] = useState<WordPressVehicle | null>(null);
    const [uploadImages, setUploadImages] = useState<{ fileUrl: string; position: string }[]>([]);
    const [fileExtension, setFileExtension] = useState<'PNG' | 'JPG'>('PNG');
    const [replaceFeatureImage, setReplaceFeatureImage] = useState<boolean>(false);

    // Additional payload options
    const [chassisNumber, setChassisNumber] = useState('');
    const [platformUrl, setPlatformUrl] = useState('');

    const [requestStatus, setRequestStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [apiResponse, setApiResponse] = useState<string | null>(null);
    const [interpretedError, setInterpretedError] = useState<string | null>(null);
    const [comparisonImages, setComparisonImages] = useState<{ original: string, processed: string }[]>([]);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
    const [saveError, setSaveError] = useState<string | null>(null);

     const handleSelectVehicle = (vehicle: WordPressVehicle) => {
        setSelectedVehicle(vehicle);
        setApiResponse(null);
        setRequestStatus('idle');
        setInterpretedError(null);
        setSaveStatus('idle');
        setSaveError(null);
        setComparisonImages([]);
        setReplaceFeatureImage(false);

        // Reset/pre-populate additional fields
        setChassisNumber(vehicle.ordencompra || '');
        setPlatformUrl('https://trefa.mx');

        const exteriorImages = (vehicle.galeria_exterior || vehicle.fotos_exterior_url || []).filter((url): url is string => !!url && url !== DEFAULT_PLACEHOLDER_IMAGE);

        setUploadImages(exteriorImages.slice(0, 15).map(url => ({ fileUrl: url, position: 'OTHER' })));
    };

    const handleSendRequest = useCallback(async () => {
        if (!selectedVehicle || uploadImages.length === 0) return;
        setRequestStatus('loading');
        setApiResponse(null);
        setInterpretedError(null);
        setComparisonImages([]);
        setSaveStatus('idle');
        setSaveError(null);

        try {
            const options: any = {
                fileExtension,
                blurBackground: false, // Explicitly disable blur as requested
            };
            if (chassisNumber) options.chassisNumber = chassisNumber;
            if (platformUrl) options.platformUrl = platformUrl;

            const response = await CarStudioService.uploadImagesWithUrlV2(uploadImages, options);

            if (response.success && response.return?.afterStudioImages) {
                const originalUrls = uploadImages.map(img => img.fileUrl);
                const processedUrls = response.return.afterStudioImages.map((img: any) => img.imageUrl);
                const comparisons = processedUrls.map((pUrl: string, index: number) => ({ original: originalUrls[index], processed: pUrl }));
                setComparisonImages(comparisons);
            }
            setApiResponse(JSON.stringify(response, null, 2));
            setRequestStatus('success');
        } catch (error: any) {
            setRequestStatus('error');
            if (error instanceof CarStudioApiError) {
                setInterpretedError(error.interpretedMessage);
                setApiResponse(JSON.stringify(error.rawResponse, null, 2));
            } else {
                setInterpretedError(error.message);
                setApiResponse(JSON.stringify({ status: 'client_error', message: error.message }, null, 2));
            }
        }
    }, [selectedVehicle, uploadImages, fileExtension, chassisNumber, platformUrl]);

    const handleSaveImages = useCallback(async () => {
        if (!selectedVehicle || comparisonImages.length === 0) return;
        setSaveStatus('saving');
        setSaveError(null);
        try {
            const processedUrls = comparisonImages.map(img => img.processed);
            await ImageService.processAndSaveImages(
                selectedVehicle.id,
                processedUrls,
                replaceFeatureImage ? processedUrls[0] : undefined
            );
            setSaveStatus('success');
            setTimeout(() => {
                setComparisonImages([]);
                setRequestStatus('idle');
                setReplaceFeatureImage(false);
            }, 2000);
        } catch (error: any) {
            setSaveStatus('error');
            setSaveError(error.message || 'An unknown error occurred.');
        }
    }, [selectedVehicle, comparisonImages, replaceFeatureImage]);

    const handleDiscardImages = () => {
        setComparisonImages([]);
        setRequestStatus('idle');
    };

    const isSendDisabled = requestStatus === 'loading' || !selectedVehicle || uploadImages.length === 0;

    return (
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-1 space-y-4 h-[calc(100vh-16rem)] overflow-y-auto pr-2">
                <h3 className="font-semibold text-gray-800">1. Selecciona un auto</h3>
                 {isLoading ? (
                    <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-primary-500" /></div>
                ) : globalError ? (
                    <ErrorDisplay title="Fallo al Cargar autos" message={globalError} />
                ) : vehiclesWithGalleries.length === 0 ? (
                    <div className="p-4 bg-gray-50 rounded-lg text-center text-gray-500">
                        No hay vehículos con galerías disponibles
                    </div>
                ) : (
                    vehiclesWithGalleries.map(vehicle => (
                        <div key={vehicle.id} className={`w-full text-left bg-white rounded-xl shadow-sm border p-4 transition-all duration-200 ${selectedVehicle?.id === vehicle.id ? 'border-primary-500 ring-2 ring-primary-500/50' : 'border-gray-200'}`}>
                            <button onClick={() => handleSelectVehicle(vehicle)} className='w-full text-left'>
                                <h2 className="font-bold text-gray-800 truncate">{vehicle.titulo}</h2>
                                <p className="text-sm text-gray-500 mb-2">ID: {vehicle.id}</p>
                            </button>
                            {selectedVehicle?.id === vehicle.id && comparisonImages.length > 0 && (
                                <ImageComparison
                                    images={comparisonImages}
                                    onSave={handleSaveImages}
                                    onDiscard={handleDiscardImages}
                                    saveStatus={saveStatus}
                                    saveError={saveError}
                                    replaceFeatureImage={replaceFeatureImage}
                                    onToggleFeatureImage={setReplaceFeatureImage}
                                />
                            )}
                        </div>
                    ))
                )}
            </div>
            <div className="lg:col-span-2 sticky top-24">
                 <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
                    <h2 className="text-xl font-bold text-gray-800">2. Configura y Envía</h2>
                    {/* Form Fields */}
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="fileExtension" className="text-sm font-medium text-gray-700">Extensión de Archivo</label>
                            <select id="fileExtension" value={fileExtension} onChange={e => setFileExtension(e.target.value as 'PNG'|'JPG')} className="mt-1 w-full bg-white text-gray-900 rounded-lg px-4 py-2.5 border border-gray-300">
                                <option value="PNG">PNG</option>
                                <option value="JPG">JPG</option>
                            </select>
                        </div>
                        
                        <InputField id="chassisNumber" label="ID del Auto (Chassis Number)" value={chassisNumber} onChange={e => setChassisNumber(e.target.value)} placeholder="VIN" />
                        <InputField id="platformUrl" label="URL de Plataforma" value={platformUrl} onChange={e => setPlatformUrl(e.target.value)} placeholder="https://trefa.mx" />


                    </div>

                    <div className="space-y-4 pt-4 border-t">
                        <h3 className="text-sm font-medium text-gray-700 mb-2">Imágenes a Procesar ({uploadImages.length})</h3>
                        <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                             {uploadImages.map((img, index) => (
                                <div key={index} className="flex items-center gap-3 p-2 border rounded-md bg-gray-50">
                                    <img src={img.fileUrl} alt={`Preview ${index}`} className="w-16 h-16 object-cover rounded" />
                                    <div className="flex-grow min-w-0">
                                        <p className="text-xs text-gray-500 truncate" title={img.fileUrl}>{`Imagen ${index + 1}`}</p>
                                        <p className="text-sm font-semibold text-gray-800">Posición: EXTERIOR</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                     <button onClick={handleSendRequest} disabled={isSendDisabled} className="w-full flex items-center justify-center gap-2 py-3 bg-primary-600 text-white font-bold rounded-lg hover:bg-primary-700 disabled:opacity-50">
                        {requestStatus === 'loading' ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                        {requestStatus === 'loading' ? 'Enviando...' : 'Enviar Petición'}
                    </button>
                    {interpretedError && <ErrorDisplay title="Error de API" message={interpretedError} />}
                    {apiResponse && <ApiResponseViewer response={apiResponse} />}
                 </div>
            </div>
        </div>
    );
};

const WebEditorHistoryTab: React.FC = () => {
    const [history, setHistory] = useState<any | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [params] = useState({ pageNumber: 0, limit: 10, sortBy: 'createdDate', direction: 'DESC' as 'ASC' | 'DESC' });

    const fetchHistory = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await CarStudioService.listWebEditorRecords(params);
            setHistory(response);
        } catch (e: any) {
            setError(e.message || "Failed to fetch web editor history.");
        } finally {
            setLoading(false);
        }
    }, [params]);

    useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);
    
    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Historial de Trabajos (Web Editor)</h2>
            {/* TODO: Add pagination controls here */}
            {loading && <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-primary-500" /></div>}
            {error && <ErrorDisplay title="Error al Cargar Historial" message={error} />}
            {history && history.content && (
                <div className="space-y-4">
                    {history.content.map((item: any) => (
                        <div key={item._id} className="p-4 border rounded-lg">
                            <h3 className="font-semibold">{item.carStudio.projectName || `Trabajo ID: ${item.carStudio._id.slice(-6)}`}</h3>
                            <p className="text-xs text-gray-500">Fecha: {new Date(item.carStudio.createdDate).toLocaleString()}</p>
                            <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
                                {item.carStudio.afterStudioImages?.map((img: any, idx: number) => (
                                    <a key={idx} href={img.afterStudioImageUrl} target="_blank" rel="noopener noreferrer">
                                        <LazyImage src={img.afterStudioImageUrl} alt={`Processed image ${idx+1}`} className="aspect-square rounded-md" />
                                    </a>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

interface OrderHistoryTabProps {
    vehicles: WordPressVehicle[];
}

const OrderHistoryTab: React.FC<OrderHistoryTabProps> = ({ vehicles: _vehicles }) => {
    // Implementation for this tab would be similar to WebEditorHistoryTab
    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Historial de Órdenes (por Usuario)</h2>
            <InfoBox title="En Construcción">
                <p>Esta sección te permitirá ver las órdenes de procesamiento asociadas a tu cuenta, visualizar los resultados y asignarlos a un vehículo del inventario.</p>
            </InfoBox>
        </div>
    );
};


const ApiResponseViewer: React.FC<{ response: string }> = ({ response }) => (
    <div>
        <h3 className="text-sm font-semibold text-gray-600 mb-2 flex items-center gap-2"><ServerCrash className="w-4 h-4" /> Respuesta API</h3>
        <pre className="bg-gray-800 text-white p-4 rounded-md text-xs overflow-x-auto h-48"><code>{response}</code></pre>
    </div>
);

const ErrorDisplay: React.FC<{ title: string; message: string }> = ({ title, message }) => (
    <div className="p-3 bg-red-50 text-red-800 border-l-4 border-red-400">
        <p className="font-bold">{title}</p>
        <p className="text-sm mt-1">{message}</p>
    </div>
);

const InfoBox: React.FC<{title: string, children: React.ReactNode}> = ({ title, children }) => (
    <div className="mt-4 bg-blue-50 border-l-4 border-blue-400 text-blue-800 p-4 rounded-r-lg">
        <h4 className="font-bold flex items-center"><Info className="w-5 h-5 mr-2" />{title}</h4>
        <div className="text-sm mt-2 space-y-2 prose prose-sm max-w-none">{children}</div>
    </div>
);


export default CarStudioPage;