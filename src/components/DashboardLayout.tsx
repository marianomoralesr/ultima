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
    ChevronLeft,
    DollarSign,
    MessageSquare,
    TrendingUp,
    FileText,
    Database
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
    const [isSidebarExpanded, setIsSidebarExpanded] = useState(true); // Default abierta

    // Toggle sidebar manually
    const toggleSidebar = () => {
        setIsSidebarExpanded(!isSidebarExpanded);
    };

    // Unified navigation items based on role
    const getNavItems = () => {
        if (isAdmin) {
            return [
                { to: '/escritorio/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: true },
                { to: '/escritorio/admin/marketing', label: 'Marketing Hub', icon: BarChart3 },
                { to: '/escritorio/admin/crm', label: 'CRM', icon: Users },
                { to: '/escritorio/admin/compras', label: 'Compras', icon: DollarSign },
                { to: '/escritorio/admin/usuarios', label: 'Usuarios', icon: Users },
                { to: '/escritorio/admin/survey-analytics', label: 'Encuestas', icon: MessageSquare },
                { to: '/escritorio/admin/valuation', label: 'Valuación', icon: TrendingUp },
                { to: '/escritorio/admin/bancos', label: 'Bancos', icon: Building2 },
                { to: '/changelog', label: 'Changelog', icon: FileText },
            ];
        } else if (isSales) {
            return [
                { to: '/escritorio/ventas/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: true },
                { to: '/escritorio/ventas/crm', label: 'CRM', icon: Users },
                { to: '/escritorio/ventas/performance', label: 'Performance', icon: BarChart3 },
            ];
        }
        return [];
    };

    const navItems = getNavItems();

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

        const allNavItems = [...navItems, ...secondaryNav];

        let currentPath = '';
        paths.forEach((path, index) => {
            currentPath += `/${path}`;
            const navItem = allNavItems.find(item => item.to === currentPath);

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
            {/* Unified Sidebar (Left) - Visible for admin and sales */}
            {(isAdmin || isSales) && (
                <motion.aside
                    className={cn(
                        "fixed inset-y-0 left-0 z-10 hidden flex-col border-r shadow-sm sm:flex",
                        !isSidebarExpanded && isAdmin ? "bg-primary" : "bg-background"
                    )}
                    initial={false}
                    animate={{ width: isSidebarExpanded ? "256px" : "60px" }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                >
                    <nav className="flex flex-col gap-3 px-2 py-4 h-full">
                        {/* Logo + Toggle */}
                        <div className="flex items-center justify-between px-1 mb-2">
                            {isSidebarExpanded ? (
                                <Link to="/" className="flex items-center gap-2">
                                    <img
                                        src="/images/trefalogo.png"
                                        alt="TREFA"
                                        className="h-7 w-auto object-contain"
                                    />
                                </Link>
                            ) : (
                                <div className="w-full flex justify-center">
                                    <img
                                        src="/images/trefalogo.png"
                                        alt="TREFA"
                                        className="h-6 w-auto object-contain"
                                    />
                                </div>
                            )}
                            {isSidebarExpanded && (
                                <button
                                    onClick={toggleSidebar}
                                    className={cn(
                                        "p-1.5 rounded-lg transition-colors",
                                        isAdmin ? "hover:bg-accent" : "hover:bg-accent"
                                    )}
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </button>
                            )}
                        </div>

                        {!isSidebarExpanded && (
                            <button
                                onClick={toggleSidebar}
                                className={cn(
                                    "p-1.5 rounded-lg transition-colors flex justify-center",
                                    isAdmin ? "hover:bg-white/10 text-white" : "hover:bg-accent"
                                )}
                            >
                                <ChevronRight className="h-4 w-4" />
                            </button>
                        )}

                        <Separator className={cn(!isSidebarExpanded && isAdmin ? "bg-white/20" : "")} />

                        {/* User Profile Card */}
                        {isSidebarExpanded && (
                            <div className="flex items-center gap-2 rounded-lg border bg-card p-2 mx-1">
                                <Avatar className="h-8 w-8 flex-shrink-0">
                                    <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                                        {profile?.first_name?.[0]?.toUpperCase() || 'U'}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium leading-none truncate">
                                        {profile?.first_name || 'Usuario'}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground truncate">
                                        {isAdmin ? 'Admin' : isSales ? 'Ventas' : 'Usuario'}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Navigation */}
                        <div className="flex-1 space-y-0.5 overflow-y-auto px-1">
                            {navItems.map((item) => {
                                const Icon = item.icon;
                                const active = isActiveLink(item.to, item.end);

                                return (
                                    <Link
                                        key={item.to}
                                        to={item.to}
                                        className={cn(
                                            "flex items-center rounded-lg text-xs font-medium transition-all",
                                            isSidebarExpanded ? "px-2.5 py-2 gap-2.5" : "justify-center py-2",
                                            active
                                                ? isSidebarExpanded
                                                    ? "bg-accent text-accent-foreground"
                                                    : isAdmin
                                                        ? "bg-white/20 text-white"
                                                        : "bg-accent text-accent-foreground"
                                                : isSidebarExpanded
                                                    ? "text-muted-foreground hover:bg-accent hover:text-foreground"
                                                    : isAdmin
                                                        ? "text-white hover:bg-white/10"
                                                        : "text-muted-foreground hover:bg-accent"
                                        )}
                                        title={!isSidebarExpanded ? item.label : undefined}
                                    >
                                        <Icon className="h-4 w-4 shrink-0" />
                                        {isSidebarExpanded && (
                                            <span className="whitespace-nowrap truncate">{item.label}</span>
                                        )}
                                    </Link>
                                );
                            })}
                        </div>

                        <Separator className={cn(!isSidebarExpanded && isAdmin ? "bg-white/20" : "")} />

                        {/* Help */}
                        {secondaryNav.map((item) => {
                            const Icon = item.icon;
                            const active = isActiveLink(item.to);

                            return (
                                <Link
                                    key={item.to}
                                    to={item.to}
                                    className={cn(
                                        "flex items-center rounded-lg text-xs font-medium transition-all mx-1",
                                        isSidebarExpanded ? "px-2.5 py-2 gap-2.5" : "justify-center py-2",
                                        active
                                            ? isSidebarExpanded
                                                ? "bg-accent text-accent-foreground"
                                                : isAdmin ? "bg-white/20 text-white" : "bg-accent"
                                            : isSidebarExpanded
                                                ? "text-muted-foreground hover:bg-accent hover:text-foreground"
                                                : isAdmin ? "text-white hover:bg-white/10" : "text-muted-foreground hover:bg-accent"
                                    )}
                                    title={!isSidebarExpanded ? item.label : undefined}
                                >
                                    <Icon className="h-4 w-4 shrink-0" />
                                    {isSidebarExpanded && <span className="whitespace-nowrap">{item.label}</span>}
                                </Link>
                            );
                        })}

                        {/* Sign Out */}
                        <button
                            onClick={() => signOut()}
                            className={cn(
                                "flex items-center rounded-lg text-xs font-medium transition-all mx-1",
                                isSidebarExpanded ? "px-2.5 py-2 gap-2.5" : "justify-center py-2",
                                isSidebarExpanded
                                    ? "text-muted-foreground hover:bg-accent hover:text-foreground"
                                    : isAdmin ? "text-white hover:bg-white/10" : "text-muted-foreground hover:bg-accent"
                            )}
                            title={!isSidebarExpanded ? "Cerrar Sesión" : undefined}
                        >
                            <LogOut className="h-4 w-4 shrink-0" />
                            {isSidebarExpanded && <span className="whitespace-nowrap">Cerrar Sesión</span>}
                        </button>
                    </nav>
                </motion.aside>
            )}

            {/* Main Content - Responsive padding based on sidebar state */}
            <motion.div
                className="flex flex-col sm:gap-4"
                animate={{
                    paddingLeft: (isAdmin || isSales) ? (isSidebarExpanded ? "256px" : "60px") : "0px"
                }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
            >
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

                {/* Bottom Navigation - Mobile Only */}
                <BottomNav />
            </motion.div>

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
