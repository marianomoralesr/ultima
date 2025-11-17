import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    User,
    FileText,
    Heart,
    Car,
    Calendar,
    DollarSign,
    HelpCircle,
    Settings,
    Home,
    Users,
    BarChart3,
    Package
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from './ui/breadcrumb';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Separator } from './ui/separator';

const DashboardLayoutNew: React.FC = () => {
    const { profile, isAdmin, isSales } = useAuth();
    const location = useLocation();

    // Navigation items based on user role
    const navItems = [
        ...(!isAdmin && !isSales ? [
            { to: '/escritorio', label: 'Dashboard', icon: LayoutDashboard, end: true }
        ] : []),
        ...(isAdmin ? [
            { to: '/escritorio/admin', label: 'Admin Panel', icon: Settings, end: true },
            { to: '/escritorio/admin/users', label: 'Usuarios', icon: Users },
            { to: '/escritorio/admin/analytics', label: 'Analytics', icon: BarChart3 },
            { to: '/escritorio/admin/inventory', label: 'Inventario', icon: Package },
        ] : []),
        ...(isSales ? [
            { to: '/escritorio/ventas/crm', label: 'CRM', icon: Users, end: true },
            { to: '/escritorio/ventas/leads', label: 'Leads', icon: FileText },
        ] : []),
        { to: '/escritorio/profile', label: 'Mi Perfil', icon: User },
        { to: '/escritorio/favoritos', label: 'Favoritos', icon: Heart },
        { to: '/escritorio/seguimiento', label: 'Solicitudes', icon: FileText },
        { to: '/escritorio/citas', label: 'Citas', icon: Calendar },
        { to: '/escritorio/vende-tu-auto', label: 'Vender Auto', icon: DollarSign },
        { to: '/autos', label: 'Inventario', icon: Car },
    ];

    const secondaryNav = [
        { to: '/faq', label: 'Ayuda', icon: HelpCircle },
        { to: '/escritorio/settings', label: 'Configuración', icon: Settings },
    ];

    const isActiveLink = (path: string, end?: boolean) => {
        if (end) {
            return location.pathname === path;
        }
        return location.pathname.startsWith(path);
    };

    // Generate breadcrumbs from current path
    const generateBreadcrumbs = () => {
        const paths = location.pathname.split('/').filter(Boolean);
        const breadcrumbs = [{ label: 'Inicio', href: '/' }];

        let currentPath = '';
        paths.forEach((path, index) => {
            currentPath += `/${path}`;
            const navItem = [...navItems, ...secondaryNav].find(item => item.to === currentPath);

            if (navItem) {
                breadcrumbs.push({ label: navItem.label, href: currentPath });
            } else {
                // Capitalize and clean up path name
                const label = path.charAt(0).toUpperCase() + path.slice(1).replace(/-/g, ' ');
                breadcrumbs.push({ label, href: currentPath });
            }
        });

        return breadcrumbs;
    };

    const breadcrumbs = generateBreadcrumbs();

    return (
        <div className="flex min-h-screen w-full flex-col bg-muted/40">
            {/* Sidebar */}
            <aside className="fixed inset-y-0 left-0 z-10 hidden w-64 flex-col border-r bg-background sm:flex">
                <nav className="flex flex-col gap-4 px-4 py-6">
                    {/* Logo */}
                    <Link
                        to="/"
                        className="group flex h-12 items-center gap-2 rounded-lg px-3 text-lg font-semibold text-foreground hover:bg-accent"
                    >
                        <img
                            src="/images/trefalogo.png"
                            alt="TREFA"
                            className="h-8 w-auto object-contain"
                        />
                    </Link>

                    {/* User Profile Card */}
                    <div className="flex items-center gap-3 rounded-lg border bg-card p-3">
                        <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                                {profile?.first_name?.[0]?.toUpperCase() || 'U'}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 overflow-hidden">
                            <p className="text-sm font-medium leading-none truncate">
                                {profile?.first_name || 'Usuario'}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                                {profile?.email}
                            </p>
                        </div>
                    </div>

                    <Separator />

                    {/* Main Navigation */}
                    <div className="flex-1 space-y-1">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const active = isActiveLink(item.to, item.end);

                            return (
                                <Link
                                    key={item.to}
                                    to={item.to}
                                    className={cn(
                                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:bg-accent",
                                        active
                                            ? "bg-accent text-accent-foreground"
                                            : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    <Icon className="h-4 w-4" />
                                    {item.label}
                                </Link>
                            );
                        })}
                    </div>

                    <Separator />

                    {/* Secondary Navigation */}
                    <div className="space-y-1">
                        {secondaryNav.map((item) => {
                            const Icon = item.icon;
                            const active = isActiveLink(item.to);

                            return (
                                <Link
                                    key={item.to}
                                    to={item.to}
                                    className={cn(
                                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:bg-accent",
                                        active
                                            ? "bg-accent text-accent-foreground"
                                            : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    <Icon className="h-4 w-4" />
                                    {item.label}
                                </Link>
                            );
                        })}
                    </div>
                </nav>
            </aside>

            {/* Main Content */}
            <div className="flex flex-col sm:gap-4 sm:pl-64">
                {/* Top Bar with Breadcrumbs */}
                <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 sm:py-4">
                    <Breadcrumb className="hidden md:flex">
                        <BreadcrumbList>
                            {breadcrumbs.map((crumb, index) => (
                                <React.Fragment key={crumb.href}>
                                    {index > 0 && <BreadcrumbSeparator />}
                                    <BreadcrumbItem>
                                        {index === breadcrumbs.length - 1 ? (
                                            <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                                        ) : (
                                            <BreadcrumbLink asChild>
                                                <Link to={crumb.href}>{crumb.label}</Link>
                                            </BreadcrumbLink>
                                        )}
                                    </BreadcrumbItem>
                                </React.Fragment>
                            ))}
                        </BreadcrumbList>
                    </Breadcrumb>

                    {/* Mobile Header - Logo */}
                    <div className="flex items-center gap-2 sm:hidden">
                        <Link to="/" className="flex items-center gap-2">
                            <img
                                src="/images/trefalogo.png"
                                alt="TREFA"
                                className="h-6 w-auto object-contain"
                            />
                        </Link>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
                    <Outlet />
                </main>
            </div>

            {/* Mobile Bottom Navigation */}
            <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center justify-around border-t bg-background sm:hidden">
                {navItems.slice(0, 4).map((item) => {
                    const Icon = item.icon;
                    const active = isActiveLink(item.to, item.end);

                    return (
                        <Link
                            key={item.to}
                            to={item.to}
                            className={cn(
                                "flex flex-col items-center justify-center gap-1 px-3 py-2 text-xs font-medium",
                                active
                                    ? "text-primary"
                                    : "text-muted-foreground"
                            )}
                        >
                            <Icon className="h-5 w-5" />
                            <span className="truncate">{item.label}</span>
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
};

export default DashboardLayoutNew;
