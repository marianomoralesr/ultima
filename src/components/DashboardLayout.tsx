import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    HelpCircle,
    Users,
    BarChart3,
    Route,
    Building2,
    LogOut,
    Menu,
    X,
    ChevronRight,
    DollarSign
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
import BottomNav from './BottomNav';
import { motion } from 'framer-motion';

const DashboardLayout: React.FC = () => {
    const { profile, isAdmin, isSales, signOut } = useAuth();
    const location = useLocation();
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);

    // Navigation items based on user role - ADMIN/SALES ONLY
    const navItems = [
        ...(isAdmin ? [
            { to: '/escritorio/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: true },
            { to: '/escritorio/admin/business-analytics', label: 'Analytics', icon: BarChart3 },
            { to: '/escritorio/admin/crm', label: 'CRM', icon: Users },
            { to: '/escritorio/admin/compras', label: 'Compras', icon: DollarSign },
            { to: '/escritorio/admin/usuarios', label: 'Usuarios', icon: Users },
            { to: '/escritorio/admin/marketing', label: 'Marketing', icon: BarChart3 },
            { to: '/escritorio/admin/customer-journeys', label: 'Customer Journeys', icon: Route },
            { to: '/bancos/dashboard', label: 'Portal Bancario', icon: Building2 },
        ] : []),
        ...(isSales ? [
            { to: '/escritorio/ventas/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: true },
            { to: '/escritorio/ventas/crm', label: 'CRM', icon: Users },
            { to: '/escritorio/ventas/performance', label: 'Performance', icon: BarChart3 },
        ] : []),
    ];

    const secondaryNav = [
        { to: '/faq', label: 'Ayuda', icon: HelpCircle },
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
        <div className="flex min-h-screen w-full flex-col bg-gray-50">
            {/* Sidebar */}
            <motion.aside
                className="fixed inset-y-0 left-0 z-10 hidden flex-col border-r bg-background sm:flex"
                initial={{ width: "60px" }}
                animate={{ width: isSidebarExpanded ? "256px" : "60px" }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                onMouseEnter={() => setIsSidebarExpanded(true)}
                onMouseLeave={() => setIsSidebarExpanded(false)}
            >
                <nav className="flex flex-col gap-4 px-4 py-6 h-full">
                    {/* Logo */}
                    <Link
                        to="/"
                        className="group flex h-12 items-center rounded-lg px-3 text-lg font-semibold text-foreground hover:bg-accent overflow-hidden"
                    >
                        <img
                            src="/images/trefalogo.png"
                            alt="TREFA"
                            className={cn(
                                "h-8 w-auto object-contain transition-all",
                                isSidebarExpanded ? "mr-2" : "mr-0"
                            )}
                        />
                    </Link>

                    {/* User Profile Card */}
                    <div className={cn(
                        "flex items-center rounded-lg border bg-card transition-all",
                        isSidebarExpanded ? "gap-3 p-3" : "justify-center p-2"
                    )}>
                        <Avatar className="h-10 w-10 flex-shrink-0">
                            <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                                {profile?.first_name?.[0]?.toUpperCase() || 'U'}
                            </AvatarFallback>
                        </Avatar>
                        {isSidebarExpanded && (
                            <motion.div
                                className="flex-1 min-w-0"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.2 }}
                            >
                                <p className="text-sm font-medium leading-none truncate">
                                    {profile?.first_name || 'Usuario'}
                                </p>
                                <p className="text-xs text-muted-foreground truncate">
                                    {profile?.email}
                                </p>
                            </motion.div>
                        )}
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
                                        "flex items-center rounded-lg text-sm font-medium transition-all hover:bg-accent overflow-hidden",
                                        isSidebarExpanded ? "px-3 py-2" : "justify-center py-2",
                                        active
                                            ? "bg-accent text-accent-foreground"
                                            : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    <Icon className="h-5 w-5 shrink-0" />
                                    <motion.span
                                        animate={{
                                            opacity: isSidebarExpanded ? 1 : 0,
                                            width: isSidebarExpanded ? "auto" : 0,
                                            marginLeft: isSidebarExpanded ? "12px" : "0px"
                                        }}
                                        transition={{ duration: 0.2 }}
                                        className="whitespace-nowrap"
                                    >
                                        {item.label}
                                    </motion.span>
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
                                        "flex items-center rounded-lg text-sm font-medium transition-all hover:bg-accent overflow-hidden",
                                        isSidebarExpanded ? "px-3 py-2" : "justify-center py-2",
                                        active
                                            ? "bg-accent text-accent-foreground"
                                            : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    <Icon className="h-5 w-5 shrink-0" />
                                    <motion.span
                                        animate={{
                                            opacity: isSidebarExpanded ? 1 : 0,
                                            width: isSidebarExpanded ? "auto" : 0,
                                            marginLeft: isSidebarExpanded ? "12px" : "0px"
                                        }}
                                        transition={{ duration: 0.2 }}
                                        className="whitespace-nowrap"
                                    >
                                        {item.label}
                                    </motion.span>
                                </Link>
                            );
                        })}

                        {/* Sign Out Button */}
                        <button
                            onClick={() => signOut()}
                            className={cn(
                                "w-full flex items-center rounded-lg text-sm font-medium transition-all hover:bg-accent text-muted-foreground hover:text-foreground overflow-hidden",
                                isSidebarExpanded ? "px-3 py-2" : "justify-center py-2"
                            )}
                        >
                            <LogOut className="h-5 w-5 shrink-0" />
                            <motion.span
                                animate={{
                                    opacity: isSidebarExpanded ? 1 : 0,
                                    width: isSidebarExpanded ? "auto" : 0,
                                    marginLeft: isSidebarExpanded ? "12px" : "0px"
                                }}
                                transition={{ duration: 0.2 }}
                                className="whitespace-nowrap"
                            >
                                Cerrar Sesión
                            </motion.span>
                        </button>
                    </div>
                </nav>
            </motion.aside>

            {/* Subtle Handle Indicator - Outside Sidebar */}
            <motion.div
                className="fixed top-1/2 -translate-y-1/2 z-[5] hidden sm:flex items-center justify-center pointer-events-none"
                animate={{
                    left: isSidebarExpanded ? "256px" : "60px",
                    opacity: isSidebarExpanded ? 0 : 1
                }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
            >
                <div className="h-24 w-4 bg-gradient-to-r from-transparent via-black/5 to-transparent rounded-r-lg flex items-center justify-center">
                    <div className="bg-background/80 backdrop-blur-sm rounded-full p-1 shadow-sm border border-border/50">
                        <ChevronRight className="h-3 w-3 text-muted-foreground" />
                    </div>
                </div>
            </motion.div>

            {/* Main Content - Mobile-first responsive layout */}
            <div className="flex flex-col sm:gap-4 sm:pl-[60px]">
                <motion.div
                    className="hidden sm:block"
                    animate={{ paddingLeft: isSidebarExpanded ? "196px" : "0px" }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
                />
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

                    {/* Mobile Header - Logo and Hamburger (admins only) */}
                    <div className="flex items-center gap-2 sm:hidden">
                        {(isAdmin || isSales) && (
                            <button
                                onClick={() => setIsMobileSidebarOpen(true)}
                                className="p-2 hover:bg-accent rounded-lg"
                                aria-label="Abrir menú"
                            >
                                <Menu className="h-5 w-5" />
                            </button>
                        )}
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
                <main className="flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8 pb-20 sm:pb-4 w-full max-w-full overflow-x-hidden">
                    <Outlet />
                </main>
            </div>

            {/* Mobile Sidebar for Admins/Sales (triggered by hamburger) */}
            {(isAdmin || isSales) && (
                <>
                    {/* Overlay */}
                    <div
                        className={cn(
                            "fixed inset-0 z-40 bg-black/60 sm:hidden transition-opacity duration-300",
                            isMobileSidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
                        )}
                        onClick={() => setIsMobileSidebarOpen(false)}
                    />

                    {/* Mobile Sidebar */}
                    <aside
                        className={cn(
                            "fixed inset-y-0 left-0 z-50 w-64 bg-background border-r shadow-2xl sm:hidden transition-transform duration-300 overflow-y-auto",
                            isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
                        )}
                    >
                        <nav className="flex flex-col gap-4 px-4 py-6">
                            {/* Close Button */}
                            <div className="flex items-center justify-between">
                                <Link
                                    to="/"
                                    className="flex items-center gap-2"
                                    onClick={() => setIsMobileSidebarOpen(false)}
                                >
                                    <img
                                        src="/images/trefalogo.png"
                                        alt="TREFA"
                                        className="h-8 w-auto object-contain"
                                    />
                                </Link>
                                <button
                                    onClick={() => setIsMobileSidebarOpen(false)}
                                    className="p-2 hover:bg-accent rounded-lg"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

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
                                            onClick={() => setIsMobileSidebarOpen(false)}
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
                                            onClick={() => setIsMobileSidebarOpen(false)}
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

                                {/* Sign Out Button */}
                                <button
                                    onClick={() => {
                                        setIsMobileSidebarOpen(false);
                                        signOut();
                                    }}
                                    className={cn(
                                        "w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:bg-accent text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    <LogOut className="h-4 w-4" />
                                    Cerrar Sesión
                                </button>
                            </div>
                        </nav>
                    </aside>
                </>
            )}

            {/* Use the shared BottomNav component */}
            <BottomNav />
        </div>
    );
};

export default DashboardLayout;
