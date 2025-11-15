import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { BankService } from '../services/BankService';
import { BANKS } from '../types/bank';
import {
  LayoutDashboard,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  LogOut,
  Menu,
  X
} from 'lucide-react';

const BankDashboardLayout: React.FC = () => {
  const [bankRepProfile, setBankRepProfile] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    loadBankRepProfile();
  }, []);

  const loadBankRepProfile = async () => {
    try {
      const profile = await BankService.getBankRepProfile();
      setBankRepProfile(profile);
    } catch (error) {
      console.error('Error loading bank rep profile:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/bancos');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const menuItems = [
    {
      name: 'Dashboard',
      path: '/bancos/dashboard',
      icon: LayoutDashboard
    },
    {
      name: 'Inventario',
      path: '/bancos/inventario',
      icon: FileText,
      badge: 'Todos'
    },
    {
      name: 'Solicitudes Pendientes',
      path: '/bancos/pendientes',
      icon: Clock,
      badge: 'pending'
    },
    {
      name: 'Solicitudes Aprobadas',
      path: '/bancos/aprobadas',
      icon: CheckCircle,
      badge: 'approved'
    },
    {
      name: 'Solicitudes Activas',
      path: '/bancos/activas',
      icon: FileText,
      badge: 'feedback'
    },
    {
      name: 'Solicitudes Rechazadas',
      path: '/bancos/rechazadas',
      icon: XCircle,
      badge: 'rejected'
    }
  ];

  const isActiveRoute = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-75 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              {bankRepProfile && (
                <>
                  <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center">
                    <span className="text-lg font-bold text-white">
                      {BANKS[bankRepProfile.bank_affiliation]?.name.charAt(0) || 'B'}
                    </span>
                  </div>
                  <div>
                    <h2 className="font-bold text-gray-900 text-sm">
                      {BANKS[bankRepProfile.bank_affiliation]?.name}
                    </h2>
                    <p className="text-xs text-gray-500">Portal Bancario</p>
                  </div>
                </>
              )}
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-gray-500 hover:text-gray-700"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = isActiveRoute(item.path);

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 font-semibold'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span className="flex-1 text-sm">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* User info and logout */}
          <div className="p-4 border-t border-gray-200">
            {bankRepProfile && (
              <div className="mb-3 px-4 py-2 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">Representante</p>
                <p className="text-sm font-medium text-gray-900 truncate">
                  {bankRepProfile.first_name} {bankRepProfile.last_name}
                </p>
                <p className="text-xs text-gray-500 truncate">{bankRepProfile.email}</p>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span className="text-sm font-medium">Cerrar sesión</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar for mobile */}
        <div className="lg:hidden sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-gray-500 hover:text-gray-700"
            >
              <Menu className="w-6 h-6" />
            </button>
            {bankRepProfile && (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                  <span className="text-sm font-bold text-white">
                    {BANKS[bankRepProfile.bank_affiliation]?.name.charAt(0) || 'B'}
                  </span>
                </div>
                <span className="text-sm font-semibold text-gray-900">
                  {BANKS[bankRepProfile.bank_affiliation]?.name}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Page content */}
        <main className="min-h-screen">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default BankDashboardLayout;
