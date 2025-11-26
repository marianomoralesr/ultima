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
    const [isAdminSidebarExpanded, setIsAdminSidebarExpanded] = useState(false);

    // Toggle admin sidebar manually
    const toggleAdminSidebar = () => {
        setIsAdminSidebarExpanded(!isAdminSidebarExpanded);
    };

    // Admin navigation items (right sidebar)
    const adminNavItems = [
        { to: '/escritorio/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: true },
        { to: '/escritorio/admin/marketing', label: 'Dashboard General', icon: BarChart3 },
        { to: '/escritorio/admin/crm', label: 'CRM', icon: Users },
        { to: '/escritorio/admin/compras', label: 'Compras', icon: DollarSign },
        { to: '/escritorio/admin/usuarios', label: 'Usuarios', icon: Users },
        { to: '/escritorio/admin/survey-analytics', label: 'Encuestas', icon: MessageSquare },
        { to: '/escritorio/admin/valuation', label: 'Valuación', icon: TrendingUp },
        { to: '/escritorio/admin/bancos', label: 'Bancos', icon: Building2 },
        { to: '/changelog', label: 'Changelog', icon: FileText },
    ];

    // Sales navigation items (left sidebar - only visible to sales)
    const salesNavItems = [
        { to: '/escritorio/ventas/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: true },
        { to: '/escritorio/ventas/crm', label: 'CRM', icon: Users },
        { to: '/escritorio/ventas/performance', label: 'Performance', icon: BarChart3 },
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

        // Combine all navigation items
        const allNavItems = [
            ...(isAdmin ? adminNavItems : []),
            ...(isSales && !isAdmin ? salesNavItems : []),
            ...secondaryNav
        ];

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
            {/* Sales Sidebar (Left) - Only visible for sales agents */}
            {isSales && !isAdmin && (
                <aside className="fixed inset-y-0 left-0 z-10 hidden w-64 flex-col border-r bg-background sm:flex">
                    <nav className="flex flex-col gap-4 px-4 py-6 h-full">
                        {/* Logo */}
                        <Link
                            to="/"
                            className="group flex h-12 items-center rounded-lg px-3 text-lg font-semibold text-foreground hover:bg-accent"
                        >
                            <img
                                src="/images/trefalogo.png"
                                alt="TREFA"
                                className="h-8 w-auto object-contain mr-2"
                            />
                        </Link>

                        {/* User Profile Card */}
                        <div className="flex items-center gap-3 rounded-lg border bg-card p-3">
                            <Avatar className="h-10 w-10 flex-shrink-0">
                                <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                                    {profile?.first_name?.[0]?.toUpperCase() || 'U'}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium leading-none truncate">
                                    {profile?.first_name || 'Usuario'}
                                </p>
                                <p className="text-xs text-muted-foreground truncate">
                                    {profile?.email}
                                </p>
                            </div>
                        </div>

                        <Separator />

                        {/* Sales Navigation */}
                        <div className="flex-1 space-y-1">
                            {salesNavItems.map((item) => {
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
                                        <Icon className="h-5 w-5 shrink-0" />
                                        <span className="whitespace-nowrap">{item.label}</span>
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
                                        <Icon className="h-5 w-5 shrink-0" />
                                        <span className="whitespace-nowrap">{item.label}</span>
                                    </Link>
                                );
                            })}

                            {/* Sign Out Button */}
                            <button
                                onClick={() => signOut()}
                                className="w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:bg-accent text-muted-foreground hover:text-foreground"
                            >
                                <LogOut className="h-5 w-5 shrink-0" />
                                <span className="whitespace-nowrap">Cerrar Sesión</span>
                            </button>
                        </div>
                    </nav>
                </aside>
            )}

            {/* Admin Sidebar (Right) - Only visible for admins */}
            {isAdmin && (
                <motion.aside
                    className={cn(
                        "fixed inset-y-0 right-0 z-10 hidden flex-col border-l shadow-lg sm:flex",
                        isAdminSidebarExpanded ? "bg-background" : "bg-primary"
                    )}
                    initial={{ width: "60px" }}
                    animate={{ width: isAdminSidebarExpanded ? "256px" : "60px" }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                >
                    <nav className="flex flex-col gap-4 px-2 py-6 h-full">
                        {/* Admin Label with Toggle */}
                        <button
                            onClick={toggleAdminSidebar}
                            className={cn(
                                "flex items-center justify-center h-10 rounded-lg transition-colors",
                                isAdminSidebarExpanded ? "hover:bg-accent" : "hover:bg-primary-foreground/10"
                            )}
                        >
                            {isAdminSidebarExpanded ? (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="flex items-center gap-2 px-3"
                                >
                                    <p className="text-sm font-semibold">Panel Admin</p>
                                    <ChevronRight className="h-4 w-4" />
                                </motion.div>
                            ) : (
                                <div className="flex flex-col items-center">
                                    <p className="text-xs font-bold text-white">A</p>
                                </div>
                            )}
                        </button>

                        <Separator className={cn(isAdminSidebarExpanded ? "" : "bg-white/20")} />

                        {/* Admin Navigation */}
                        <div className="flex-1 space-y-1">
                            {adminNavItems.map((item) => {
                                const Icon = item.icon;
                                const active = isActiveLink(item.to, item.end);

                                return (
                                    <Link
                                        key={item.to}
                                        to={item.to}
                                        className={cn(
                                            "flex items-center rounded-lg text-sm font-medium transition-all overflow-hidden",
                                            isAdminSidebarExpanded ? "px-3 py-2 gap-3" : "justify-center py-2",
                                            active
                                                ? isAdminSidebarExpanded
                                                    ? "bg-accent text-accent-foreground"
                                                    : "bg-white/20 text-white"
                                                : isAdminSidebarExpanded
                                                    ? "text-muted-foreground hover:bg-accent hover:text-foreground"
                                                    : "text-white hover:bg-white/10"
                                        )}
                                        title={!isAdminSidebarExpanded ? item.label : undefined}
                                    >
                                        <Icon className="h-5 w-5 shrink-0" />
                                        {isAdminSidebarExpanded && (
                                            <motion.span
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                className="whitespace-nowrap"
                                            >
                                                {item.label}
                                            </motion.span>
                                        )}
                                    </Link>
                                );
                            })}
                        </div>

                        <Separator className={cn(isAdminSidebarExpanded ? "" : "bg-white/20")} />

                        {/* Sign Out Button */}
                        <button
                            onClick={() => signOut()}
                            className={cn(
                                "flex items-center rounded-lg text-sm font-medium transition-all overflow-hidden",
                                isAdminSidebarExpanded ? "px-3 py-2 gap-3" : "justify-center py-2",
                                isAdminSidebarExpanded
                                    ? "text-muted-foreground hover:bg-accent hover:text-foreground"
                                    : "text-white hover:bg-white/10"
                            )}
                            title={!isAdminSidebarExpanded ? "Cerrar Sesión" : undefined}
                        >
                            <LogOut className="h-5 w-5 shrink-0" />
                            {isAdminSidebarExpanded && (
                                <motion.span
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="whitespace-nowrap"
                                >
                                    Cerrar Sesión
                                </motion.span>
                            )}
                        </button>
                    </nav>
                </motion.aside>
            )}

            {/* Main Content - Responsive padding based on role and sidebar state */}
            <motion.div
                className={cn(
                    "flex flex-col sm:gap-4",
                    isSales && !isAdmin && "sm:pl-64"  // Sales: left sidebar
                )}
                animate={{
                    paddingRight: isAdmin ? (isAdminSidebarExpanded ? "256px" : "60px") : "0px"
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
                                {/* Admin Navigation for Mobile */}
                                {isAdmin && adminNavItems.map((item) => {
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

                                {/* Sales Navigation for Mobile */}
                                {isSales && !isAdmin && salesNavItems.map((item) => {
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
