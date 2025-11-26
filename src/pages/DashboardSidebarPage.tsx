import React, { useState, useEffect } from 'react';
import {
  Home,
  MapPin,
  Package,
  FileText,
  Bell,
  CreditCard,
  User,
  Menu,
  X
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '../../supabaseClient';
import Logo from '@/assets/svg/logo';

interface MenuItem {
  icon: React.ReactNode;
  label: string;
  href: string;
}

const menuItems: MenuItem[] = [
  {
    label: 'Escritorio',
    href: '/escritorio',
    icon: <Home className="w-6 h-6" />
  },
  {
    label: 'Progreso',
    href: '/escritorio/seguimiento',
    icon: <MapPin className="w-6 h-6" />
  },
  {
    label: 'Inventario',
    href: '/autos',
    icon: <Package className="w-6 h-6" />
  },
  {
    label: 'Mis Solicitudes',
    href: '/escritorio/seguimiento',
    icon: <FileText className="w-6 h-6" />
  },
  {
    label: 'Notificaciones',
    href: '/escritorio',
    icon: <Bell className="w-6 h-6" />
  },
  {
    label: 'Documentos',
    href: '/escritorio',
    icon: <FileText className="w-6 h-6" />
  },
  {
    label: 'Mi Cuenta',
    href: '/escritorio/profile',
    icon: <User className="w-6 h-6" />
  }
];

const DashboardSidebarPage: React.FC = () => {
  const [isOpen, setIsOpen] = useState(true);
  const [stats, setStats] = useState({
    solicitudes: 0,
    documentosPendientes: 0,
    progreso: 0
  });
  const location = useLocation();

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Obtener solicitudes del usuario
      const { data: applications } = await supabase
        .from('financing_applications')
        .select('*')
        .eq('user_id', user.id);

      // Obtener documentos pendientes
      const { data: documents } = await supabase
        .from('uploaded_documents')
        .select('*')
        .in('application_id', applications?.map(app => app.id) || [])
        .eq('status', 'reviewing');

      // Calcular progreso basado en perfil y perfilación bancaria
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      const { data: bankProfile } = await supabase
        .from('bank_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      let progress = 0;
      if (profile?.first_name && profile?.phone) progress += 33;
      if (bankProfile?.is_complete) progress += 33;
      if (applications && applications.length > 0) progress += 34;

      setStats({
        solicitudes: applications?.length || 0,
        documentosPendientes: documents?.length || 0,
        progreso: Math.min(progress, 100)
      });
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-gray-50">
      {/* Sidebar */}
      <aside
        className={`${
          isOpen ? 'w-64' : 'w-20'
        } bg-white border-r border-gray-200 transition-all duration-300 ease-in-out flex flex-col`}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          {isOpen ? (
            <>
              <Link to="/" className="flex items-center gap-2">
                <Logo className="w-8 h-8 text-primary-600" />
                <span className="text-xl font-bold text-gray-800">TREFA</span>
              </Link>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-gray-100 rounded-md"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsOpen(true)}
              className="p-1 hover:bg-gray-100 rounded-md mx-auto"
            >
              <Menu className="w-5 h-5 text-gray-600" />
            </button>
          )}
        </div>

        {/* Menu Items */}
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <li key={item.label}>
                  <Link
                    to={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-primary-50 text-primary-600'
                        : 'text-gray-700 hover:bg-gray-100'
                    } ${!isOpen && 'justify-center'}`}
                    title={!isOpen ? item.label : undefined}
                  >
                    <span className={isActive ? 'text-primary-600' : 'text-gray-500'}>
                      {item.icon}
                    </span>
                    {isOpen && <span className="font-medium">{item.label}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-800">
              Panel de Control
            </h1>
            <div className="flex items-center gap-4">
              <Bell className="w-6 h-6 text-gray-600 cursor-pointer hover:text-primary-600" />
              <Link to="/escritorio/profile">
                <User className="w-6 h-6 text-gray-600 cursor-pointer hover:text-primary-600" />
              </Link>
            </div>
          </div>
        </header>

        {/* Stats Sidebar (Right) */}
        <div className="flex flex-1">
          <main className="flex-1 p-6">
            <Card className="h-full shadow-sm">
              <CardContent className="h-full p-8">
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">
                      Bienvenido a tu dashboard
                    </h2>
                    <p className="text-gray-600">
                      Aquí podrás ver un resumen de tu actividad y gestionar tus solicitudes de financiamiento.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="border-2">
                      <CardContent className="p-4">
                        <div className="text-center">
                          <FileText className="w-8 h-8 text-primary-600 mx-auto mb-2" />
                          <p className="text-sm text-gray-600">Solicitudes</p>
                          <p className="text-3xl font-bold text-gray-800">{stats.solicitudes}</p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-2">
                      <CardContent className="p-4">
                        <div className="text-center">
                          <FileText className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                          <p className="text-sm text-gray-600">Docs. Pendientes</p>
                          <p className="text-3xl font-bold text-gray-800">{stats.documentosPendientes}</p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-2">
                      <CardContent className="p-4">
                        <div className="text-center">
                          <MapPin className="w-8 h-8 text-green-600 mx-auto mb-2" />
                          <p className="text-sm text-gray-600">Progreso</p>
                          <p className="text-3xl font-bold text-gray-800">{stats.progreso}%</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <Card className="border-2">
                    <CardContent className="p-6">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">
                        Progreso del Proceso
                      </h3>
                      <div className="space-y-2">
                        <Progress value={stats.progreso} className="h-3" />
                        <p className="text-sm text-gray-600">
                          Has completado el {stats.progreso}% del proceso
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Link to="/escritorio/profile">
                      <Card className="border-2 hover:border-primary-500 transition-colors cursor-pointer">
                        <CardContent className="p-6">
                          <div className="flex items-center gap-3">
                            <User className="w-8 h-8 text-primary-600" />
                            <div>
                              <p className="font-semibold text-gray-800">Mi Perfil</p>
                              <p className="text-sm text-gray-600">Actualiza tu información</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>

                    <Link to="/escritorio/perfilacion-bancaria">
                      <Card className="border-2 hover:border-primary-500 transition-colors cursor-pointer">
                        <CardContent className="p-6">
                          <div className="flex items-center gap-3">
                            <CreditCard className="w-8 h-8 text-primary-600" />
                            <div>
                              <p className="font-semibold text-gray-800">Perfilación Bancaria</p>
                              <p className="text-sm text-gray-600">Completa tu perfil</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    </div>
  );
};

export default DashboardSidebarPage;
