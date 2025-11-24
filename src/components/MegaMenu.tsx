import React, { useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../supabaseClient';
import {
  UserCircleIcon,
  LogOutIcon,
  UserIcon,
  WhatsAppIcon,
  ArrowRightIcon,
  TagIcon,
  CarIcon,
  SellCarIcon,
  LayoutDashboardIcon,
  HeartIcon,
  FileTextIcon,
  SuvIcon,
  SedanIcon,
  PickupIcon,
  HatchbackIcon,
  LayoutGridIcon,
  AwardIcon,
  HelpCircleIcon
} from './icons';
import type { Profile } from '../types/types';
import { BRAND_LOGOS } from '../utils/constants';
import { useConfig } from '../context/ConfigContext';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';

interface MegaMenuProps {
  isOpen: boolean;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLButtonElement>;
}

const mainNavLinks = [
    { name: 'Inventario', to: '/autos', authRequired: false, icon: CarIcon },
    { name: 'Explorar', to: '/explorar', authRequired: false, icon: LayoutGridIcon },
    { name: 'Vender mi Auto', to: '/vender-mi-auto', authRequired: false, icon: SellCarIcon },
    { name: 'Promociones', to: '/promociones', authRequired: false, icon: TagIcon, featureFlag: 'show_promotions' },
    { name: 'Kit de Confianza', to: '/kit-trefa', authRequired: false, icon: AwardIcon },
    { name: 'Ayuda / FAQ', to: '/faq', authRequired: false, icon: HelpCircleIcon },
];

const accountNavLinks = [
    { name: 'Mi Escritorio', to: '/escritorio', authRequired: true, icon: LayoutDashboardIcon },
    { name: 'CRM Leads', to: '/escritorio/admin/leads', authRequired: true, adminRequired: true, icon: FileTextIcon },
    { name: 'Mis Favoritos', to: '/escritorio/favoritos', authRequired: true, icon: HeartIcon },
    { name: 'Mis Solicitudes', to: '/escritorio/seguimiento', authRequired: true, icon: FileTextIcon },
    { name: 'Mi Perfil', to: '/escritorio/profile', authRequired: true, icon: UserIcon },
];

const toolsNavLinks = [
    { name: 'Marketing Hub', to: '/escritorio/admin/marketing', authRequired: true, adminRequired: true, icon: LayoutDashboardIcon },
    { name: 'Survey Analytics', to: '/escritorio/admin/survey-analytics', authRequired: true, adminRequired: true, icon: FileTextIcon },
];

const PricingRangeWidget: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const navigate = useNavigate();
    const { data: brandsAndModels } = useQuery({
        queryKey: ['mega-menu-brands-models'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('inventario_cache')
                .select('automarca, automodelo, precio')
                .eq('ordenstatus', 'Comprado')
                .not('automarca', 'is', null)
                .not('automodelo', 'is', null);

            if (error) throw error;
            return data || [];
        },
        staleTime: 10 * 60 * 1000,
        gcTime: 30 * 60 * 1000,
    });

    // Calculate vehicle counts for each price range
    const getPriceRangeCounts = () => {
        if (!brandsAndModels) return {};

        const ranges = {
            '1': 0, // $250,000 o menos
            '2': 0, // $250,000 - $300,000
            '3': 0, // $300,000 - $350,000
            '4': 0, // $350,000 - $450,000
            '5': 0, // $450,000 o más
        };

        brandsAndModels.forEach(v => {
            const precio = v.precio;
            if (!precio) return;

            if (precio < 250000) ranges['1']++;
            else if (precio >= 250000 && precio < 300000) ranges['2']++;
            else if (precio >= 300000 && precio < 350000) ranges['3']++;
            else if (precio >= 350000 && precio < 450000) ranges['4']++;
            else if (precio >= 450000) ranges['5']++;
        });

        return ranges;
    };

    const counts = getPriceRangeCounts();

    const priceRanges = [
        { label: '$250,000 o menos', min: 0, max: 250000, count: counts['1'] || 0 },
        { label: '$250,000 - $300,000', min: 250000, max: 300000, count: counts['2'] || 0 },
        { label: '$300,000 - $350,000', min: 300000, max: 350000, count: counts['3'] || 0 },
        { label: '$350,000 - $450,000', min: 350000, max: 450000, count: counts['4'] || 0 },
        { label: '$450,000 o más', min: 450000, max: 999999999, count: counts['5'] || 0 },
    ];

    const handlePriceClick = (min: number, max: number) => {
        onClose();
        const params = new URLSearchParams();
        params.set('preciomin', min.toString());
        params.set('preciomax', max.toString());
        navigate(`/autos?${params.toString()}`);
    };

    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="text-sm text-gray-500 font-semibold">Buscar por Precio</CardTitle>
                <CardDescription className="text-xs">
                    Encuentra autos en tu rango de presupuesto
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-1.5">
                    {priceRanges.map((range, index) => (
                        <Button
                            key={index}
                            onClick={() => handlePriceClick(range.min, range.max)}
                            variant="ghost"
                            size="sm"
                            className="w-full justify-between h-9 hover:bg-primary-50 hover:text-primary-700"
                        >
                            <span className="text-xs font-medium">
                                {range.label} {range.count > 0 && <span className="text-gray-500">({range.count})</span>}
                            </span>
                            <ArrowRightIcon className="w-3.5 h-3.5" />
                        </Button>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
};

const HelpWidget: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const handleContactClick = (e: React.MouseEvent) => {
        e.preventDefault();
        onClose();
        window.open('https://wa.me/5218187049079?text=Hola,%20quisiera%20recibir%20asesoría%20para%20encontrar%20mi%20próximo%20auto.', '_blank');
    };

    return (
        <Card className="bg-gradient-to-br from-blue-600 to-blue-800 text-white border-none">
            <CardHeader className="pb-3">
                <CardTitle className="text-lg font-bold">¿Necesitas Ayuda?</CardTitle>
                <CardDescription className="text-white/90 text-sm">
                    Un experto de TREFA está listo para ayudarte a encontrar tu auto ideal.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Button
                    onClick={handleContactClick}
                    className="w-full bg-green-500 hover:bg-green-600 text-white gap-2"
                    size="sm"
                >
                    <WhatsAppIcon className="w-4 h-4" />
                    Contactar Asesor
                </Button>
            </CardContent>
        </Card>
    );
};

const AccountWidget: React.FC<{ profile: Profile; onSignOut: () => void; onLinkClick: (to: string) => void; }> = ({ profile, onSignOut, onLinkClick }) => (
    <Card>
        <CardHeader className="pb-3">
            <CardTitle className="text-sm text-gray-500 font-semibold">Mi Cuenta</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
                <UserCircleIcon className="w-10 h-10 text-gray-400 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm text-gray-800 truncate">{profile.first_name} {profile.last_name}</p>
                    <p className="text-xs text-gray-500 truncate">{profile.email}</p>
                </div>
            </div>
            <Button
                onClick={() => onLinkClick('/escritorio/profile')}
                variant="outline"
                size="sm"
                className="w-full justify-between"
            >
                <span>Editar Perfil</span>
                <ArrowRightIcon className="w-3.5 h-3.5" />
            </Button>
            <Button
                onClick={onSignOut}
                variant="destructive"
                size="sm"
                className="w-full gap-2"
            >
                <LogOutIcon className="w-4 h-4" />
                Cerrar Sesión
            </Button>
        </CardContent>
    </Card>
);

const MegaMenu: React.FC<MegaMenuProps> = ({ isOpen, onClose, triggerRef }) => {
    const { session, profile, signOut, isAdmin } = useAuth();
    const { config } = useConfig();
    const navigate = useNavigate();
    const menuRef = useRef<HTMLDivElement>(null);

    // Fetch all brands and models for mega menu (independent of VehicleContext filters)
    const { data: brandsAndModels, isLoading: isBrandsLoading } = useQuery({
        queryKey: ['mega-menu-brands-models'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('inventario_cache')
                .select('automarca, automodelo')
                .eq('ordenstatus', 'Comprado')
                .not('automarca', 'is', null)
                .not('automodelo', 'is', null);

            if (error) {
                console.error('Error fetching brands/models for mega menu:', error);
                throw error;
            }
            console.log('Mega menu brands/models loaded:', data?.length || 0, 'items');
            return data || [];
        },
        staleTime: 10 * 60 * 1000, // 10 minutes - brands/models don't change frequently
        gcTime: 30 * 60 * 1000, // 30 minutes
        enabled: isOpen, // Only fetch when menu is open
    });

    // All carrocerias/body types
    const classifications = [
        { name: 'SUV', slug: 'suv', icon: SuvIcon, imageUrl: '/images/suv-filter.png' },
        { name: 'Sedán', slug: 'sedan', icon: SedanIcon, imageUrl: '/images/sedan-filter.png' },
        { name: 'Pick Up', slug: 'pick-up', icon: PickupIcon, imageUrl: '/images/pickup-filter.png' },
        { name: 'Hatchback', slug: 'hatchback', icon: HatchbackIcon, imageUrl: '/images/hatchback-filter.png' },
    ];

    // All brands (removed .slice(0, 12) limit)
    const marcas = useMemo(() => {
        if (!brandsAndModels) return [];
        const allMarcas = brandsAndModels.map(v => v.automarca).filter(Boolean);
        const uniqueMarcas = [...new Set(allMarcas)];
        return uniqueMarcas.sort().map(marcaName => ({
            id: marcaName,
            name: marcaName,
            slug: marcaName.toLowerCase().replace(/\s+/g, '-'),
            logoUrl: BRAND_LOGOS[marcaName] || '/images/trefalogo.png'
        }));
    }, [brandsAndModels]);

    // All models sorted alphabetically with brand logos
    const models = useMemo(() => {
        if (!brandsAndModels) return [];
        const modelSet = new Map<string, { model: string; brand: string; }>();

        brandsAndModels.forEach(v => {
            if (v.automodelo && v.automarca) {
                const key = `${v.automarca}-${v.automodelo}`;
                if (!modelSet.has(key)) {
                    modelSet.set(key, {
                        model: v.automodelo,
                        brand: v.automarca,
                    });
                }
            }
        });

        return Array.from(modelSet.values())
            .sort((a, b) => a.model.localeCompare(b.model))
            .map(item => ({
                id: `${item.brand}-${item.model}`,
                name: item.model,
                brand: item.brand,
                slug: item.model.toLowerCase().replace(/\s+/g, '-'),
                logoUrl: BRAND_LOGOS[item.brand] || '/images/trefalogo.png'
            }));
    }, [brandsAndModels]);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose();
        };
        const handleClickOutside = (event: MouseEvent) => {
            if (
                menuRef.current && !menuRef.current.contains(event.target as Node) &&
                triggerRef.current && !triggerRef.current.contains(event.target as Node)
            ) {
                onClose();
            }
        };
        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onClose, triggerRef]);

    const handleSignOut = () => {
        onClose();
        signOut();
    };

    const handleLinkClick = (to: string, authRequired: boolean) => {
        onClose();
        if (authRequired && !session) {
            localStorage.setItem('loginRedirect', to);
            navigate('/acceder');
        } else {
            navigate(to);
        }
    };

    const handleFilterClick = (filterKey: string, filterValue: string) => {
        onClose();
        if (filterKey === 'automarca') {
            navigate(`/marcas/${filterValue.toLowerCase()}`);
        } else if (filterKey === 'classification') {
            navigate(`/carroceria/${filterValue.toLowerCase()}`);
        } else if (filterKey === 'automodelo') {
            const params = new URLSearchParams();
            params.set('automodelo', filterValue);
            navigate(`/autos?${params.toString()}`);
        } else {
            const params = new URLSearchParams();
            if (filterValue) {
                 params.set(filterKey, filterValue);
            }
            navigate(`/autos?${params.toString()}`);
        }
    };

    const visibleAccountLinks = accountNavLinks.filter(link => {
        if (!link.authRequired || !session) return false;
        if (link.adminRequired && !isAdmin) return false;
        return true;
    });

    const visibleToolsLinks = toolsNavLinks.filter(link => {
        if (!link.authRequired || !session) return false;
        if (link.adminRequired && !isAdmin) return false;
        return true;
    });

    if (!isOpen || !triggerRef.current) return null;

    return (
        <div
            ref={menuRef}
            className="absolute top-full left-0 right-0 w-full animate-slideDown z-40"
            style={{ transformOrigin: 'top' }}
        >
            <div className="mt-2 bg-white rounded-b-2xl shadow-2xl border border-gray-200/80">
                <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-px">
                    {/* Main Content Section - 3 columns */}
                    <div className="lg:col-span-3 p-6 grid grid-cols-1 md:grid-cols-4 gap-6">
                        {/* Column 1: Navigation */}
                        <div className="space-y-4">
                            <div>
                                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Navegación</h3>
                                <nav className="space-y-0.5">
                                    {mainNavLinks.map(link => {
                                        if (link.authRequired && !session) return null;
                                        if (link.featureFlag && !config[link.featureFlag]) return null;
                                        const Icon = link.icon;
                                        return (
                                            <Button
                                                key={link.name}
                                                onClick={() => handleLinkClick(link.to, link.authRequired)}
                                                variant="ghost"
                                                size="sm"
                                                className="w-full justify-start gap-2 text-xs font-medium h-8"
                                            >
                                                <Icon className="w-4 h-4 text-primary-600" />
                                                {link.name}
                                            </Button>
                                        );
                                    })}
                                </nav>
                            </div>

                            {visibleAccountLinks.length > 0 && (
                                <div>
                                    <Separator className="my-3" />
                                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Mi Cuenta</h3>
                                    <nav className="space-y-0.5">
                                        {visibleAccountLinks.map(link => {
                                            const Icon = link.icon;
                                            return (
                                                <Button
                                                    key={link.name}
                                                    onClick={() => handleLinkClick(link.to, link.authRequired)}
                                                    variant="ghost"
                                                    size="sm"
                                                    className="w-full justify-start gap-2 text-xs font-medium h-8"
                                                >
                                                    <Icon className="w-4 h-4 text-primary-600" />
                                                    {link.name}
                                                </Button>
                                            );
                                        })}
                                    </nav>
                                </div>
                            )}

                            {visibleToolsLinks.length > 0 && (
                                <div>
                                    <Separator className="my-3" />
                                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Herramientas</h3>
                                    <nav className="space-y-0.5">
                                        {visibleToolsLinks.map(link => {
                                            const Icon = link.icon;
                                            return (
                                                <Button
                                                    key={link.name}
                                                    onClick={() => handleLinkClick(link.to, link.authRequired)}
                                                    variant="ghost"
                                                    size="sm"
                                                    className="w-full justify-start gap-2 text-xs font-medium h-8"
                                                >
                                                    <Icon className="w-4 h-4 text-primary-600" />
                                                    {link.name}
                                                </Button>
                                            );
                                        })}
                                    </nav>
                                </div>
                            )}
                        </div>

                        {/* Column 2: Carrocería */}
                        <div>
                            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Carrocería</h3>
                            <div className="grid grid-cols-1 gap-2">
                                {classifications.map(c => {
                                    const Icon = c.icon;
                                    return (
                                        <Button
                                            key={c.name}
                                            onClick={() => handleFilterClick('classification', c.slug)}
                                            variant="outline"
                                            size="sm"
                                            className="h-auto py-2 flex-col gap-1"
                                        >
                                            <img src={c.imageUrl} alt={c.name} className="w-16 h-16 object-contain" />
                                            <span className="text-xs font-medium">{c.name}</span>
                                        </Button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Column 3: Marcas */}
                        <div>
                            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Marcas</h3>
                            <ScrollArea className="h-[320px] pr-2">
                                <div className="space-y-0.5">
                                    {isBrandsLoading ? (
                                        <div className="flex items-center justify-center h-20">
                                            <p className="text-xs text-gray-400">Cargando marcas...</p>
                                        </div>
                                    ) : marcas.length === 0 ? (
                                        <div className="flex items-center justify-center h-20">
                                            <p className="text-xs text-gray-400">No hay marcas disponibles</p>
                                        </div>
                                    ) : (
                                        <>
                                            {marcas.map(marca => (
                                                <Button
                                                    key={marca.id}
                                                    onClick={() => handleFilterClick('automarca', marca.slug)}
                                                    variant="ghost"
                                                    size="sm"
                                                    className="w-full justify-start gap-2 text-xs font-medium h-8"
                                                >
                                                    <img src={marca.logoUrl} alt={`${marca.name} Logo`} className="w-5 h-5 object-contain" />
                                                    {marca.name}
                                                </Button>
                                            ))}
                                            <Button
                                                onClick={() => handleFilterClick('automarca', '')}
                                                variant="ghost"
                                                size="sm"
                                                className="w-full justify-start text-xs font-semibold text-primary-600 hover:text-primary-700 h-8"
                                            >
                                                Ver todas las marcas →
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </ScrollArea>
                        </div>

                        {/* Column 4: Modelos */}
                        <div>
                            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Modelos</h3>
                            <ScrollArea className="h-[320px] pr-2">
                                <div className="space-y-0.5">
                                    {isBrandsLoading ? (
                                        <div className="flex items-center justify-center h-20">
                                            <p className="text-xs text-gray-400">Cargando modelos...</p>
                                        </div>
                                    ) : models.length === 0 ? (
                                        <div className="flex items-center justify-center h-20">
                                            <p className="text-xs text-gray-400">No hay modelos disponibles</p>
                                        </div>
                                    ) : (
                                        <>
                                            {models.map(model => (
                                                <Button
                                                    key={model.id}
                                                    onClick={() => handleFilterClick('automodelo', model.slug)}
                                                    variant="ghost"
                                                    size="sm"
                                                    className="w-full justify-start gap-2 text-xs font-medium h-8"
                                                >
                                                    <img src={model.logoUrl} alt={`${model.brand} Logo`} className="w-5 h-5 object-contain flex-shrink-0" />
                                                    <span className="truncate">{model.name}</span>
                                                </Button>
                                            ))}
                                        </>
                                    )}
                                </div>
                            </ScrollArea>
                        </div>
                    </div>

                    {/* Widgets Section - 2 columns */}
                    <div className="lg:col-span-2 p-6 bg-gray-50 rounded-br-2xl space-y-4">
                        <PricingRangeWidget onClose={onClose} />
                        {session && profile ? (
                            <AccountWidget profile={profile} onSignOut={handleSignOut} onLinkClick={(to) => handleLinkClick(to, true)} />
                        ) : (
                            <HelpWidget onClose={onClose} />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MegaMenu;
