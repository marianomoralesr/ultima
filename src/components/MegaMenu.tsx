import React, { useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useVehicles } from '../context/VehicleContext';
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
import MiniValuationForm from './MiniValuationForm';
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
    const { vehicles: allVehicles } = useVehicles();
    const { config } = useConfig();
    const navigate = useNavigate();
    const menuRef = useRef<HTMLDivElement>(null);

    // All carrocerias/body types
    const classifications = [
        { name: 'SUV', slug: 'suv', icon: SuvIcon, imageUrl: '/images/suv-filter.png' },
        { name: 'Sedán', slug: 'sedan', icon: SedanIcon, imageUrl: '/images/sedan-filter.png' },
        { name: 'Pick Up', slug: 'pick-up', icon: PickupIcon, imageUrl: '/images/pickup-filter.png' },
        { name: 'Hatchback', slug: 'hatchback', icon: HatchbackIcon, imageUrl: '/images/hatchback-filter.png' },
    ];

    // All brands (removed .slice(0, 12) limit)
    const marcas = useMemo(() => {
        if (!allVehicles) return [];
        const allMarcas = allVehicles.map(v => v.automarca).filter(Boolean);
        const uniqueMarcas = [...new Set(allMarcas)];
        return uniqueMarcas.sort().map(marcaName => ({
            id: marcaName,
            name: marcaName,
            slug: marcaName.toLowerCase().replace(/\s+/g, '-'),
            logoUrl: BRAND_LOGOS[marcaName] || '/images/trefalogo.png'
        }));
    }, [allVehicles]);

    // All models sorted alphabetically with brand logos
    const models = useMemo(() => {
        if (!allVehicles) return [];
        const modelSet = new Map<string, { model: string; brand: string; }>();

        allVehicles.forEach(v => {
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
    }, [allVehicles]);

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
                                </div>
                            </ScrollArea>
                        </div>

                        {/* Column 4: Modelos */}
                        <div>
                            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Modelos</h3>
                            <ScrollArea className="h-[320px] pr-2">
                                <div className="space-y-0.5">
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
                                </div>
                            </ScrollArea>
                        </div>
                    </div>

                    {/* Widgets Section - 2 columns */}
                    <div className="lg:col-span-2 p-6 bg-gray-50 rounded-br-2xl space-y-4">
                        <MiniValuationForm onClose={onClose} />
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
