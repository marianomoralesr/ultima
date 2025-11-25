import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { UserIcon, LogOutIcon, ChevronDownIcon } from './icons';
import { useAuth } from '../context/AuthContext';
import MegaMenu from './MegaMenu';
import HeaderSearchBar from './HeaderSearchBar';
import { Button } from './ui/button';

const MenuIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
);


const Header: React.FC = () => {
    const [megaMenuOpen, setMegaMenuOpen] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const { session, profile, signOut } = useAuth();
    const menuButtonRef = useRef<HTMLButtonElement>(null);
    const location = useLocation();
    const navigate = useNavigate();
    const isListPage = location.pathname === '/autos';
    const isSalesUser = profile?.role === 'sales';

    const handleSignOut = async () => {
        await signOut();
        setMobileMenuOpen(false);
    };

    const handleMobileLinkClick = (path: string) => {
        setMobileMenuOpen(false);
        navigate(path);
    };

    return (
      <header className="fixed top-0 left-0 right-0 z-30 bg-white shadow-sm border-b border-gray-200/80">
        <div className="relative max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
          <div className="flex items-center h-20 sm:h-20 lg:h-28 gap-x-2 sm:gap-x-2 lg:gap-x-4">
            {/* Mobile Menu Button */}
            <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-1.5 text-gray-600 hover:text-primary-600 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
                aria-label="Toggle mobile menu"
            >
                <MenuIcon className="w-5 h-5" />
            </button>

            {/* Logo */}
            <div className="flex-shrink-0">
                <Link to="/" className="flex items-center">
                  <img
                    src={"/images/trefalogo.png"}
                    alt="TREFA"
                    className="w-auto object-contain transition-all h-6 sm:h-7 lg:h-9"
                  />
                </Link>
            </div>

            {/* Center Section (Search) - Show on all pages except /autos on desktop */}
            <div className={`flex-1 min-w-0 mx-1.5 sm:mx-3 lg:mx-4 ${isListPage ? 'lg:hidden' : ''}`}>
                <HeaderSearchBar />
            </div>

            {/* Right Section - Desktop Menu and Auth */}
            <div className={`hidden lg:flex items-center space-x-4 flex-shrink-0 ${isListPage ? 'ml-auto' : ''}`}>
                <Button
                    ref={menuButtonRef}
                    onClick={() => setMegaMenuOpen(o => !o)}
                    variant="ghost"
                    size="sm"
                    className="text-sm font-semibold text-primary-600 hover:text-primary-700 hover:bg-gray-100"
                >
                    <span>Menú</span>
                    <ChevronDownIcon className={`w-4 h-4 ml-1 transition-transform ${megaMenuOpen ? 'rotate-180' : ''}`} fill="currentColor"/>
                </Button>

                {session ? (
                   <>
                      {/* Dashboard Button */}
                      <Button asChild size="sm">
                          <Link to={isSalesUser ? "/escritorio/ventas/crm" : "/escritorio"}>
                              Dashboard
                          </Link>
                      </Button>

                      {/* Sign Out Button */}
                      <Button
                          onClick={handleSignOut}
                          variant="destructive"
                          size="sm"
                          className="items-center gap-1.5"
                      >
                          <LogOutIcon className="w-3.5 h-3.5" />
                          Cerrar Sesión
                      </Button>
                   </>
                ) : (
                  <Button asChild size="sm" className="bg-orange-600 hover:bg-orange-700">
                      <Link to="/acceder" data-gtm-id="header-login-button">
                          Iniciar Sesión
                      </Link>
                  </Button>
                )}
            </div>
          </div>
          <MegaMenu
            isOpen={megaMenuOpen}
            onClose={() => setMegaMenuOpen(false)}
            triggerRef={menuButtonRef as any}
          />
        </div>

        {/* Mobile Sidebar Menu */}
        {mobileMenuOpen && (
            <div className="fixed inset-0 z-50 lg:hidden" style={{ top: '80px' }}>
                <div
                    className="absolute inset-0 bg-black/60"
                    onClick={() => setMobileMenuOpen(false)}
                />
                <div className="absolute left-0 top-0 bottom-0 w-80 bg-white shadow-xl">
                    <div className="p-6 space-y-4">
                        {session ? (
                            <>
                                <div className="pb-4 border-b border-gray-200">
                                    <p className="text-sm text-gray-500">Conectado como</p>
                                    <p className="font-semibold text-gray-900">{profile?.first_name || profile?.email}</p>
                                </div>
                                {isSalesUser ? (
                                    <button
                                        onClick={() => handleMobileLinkClick('/escritorio/ventas/crm')}
                                        className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-100 font-medium text-gray-700"
                                    >
                                        Mis Leads
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => handleMobileLinkClick('/escritorio')}
                                        className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-100 font-medium text-gray-700"
                                    >
                                        Escritorio
                                    </button>
                                )}
                                <button
                                    onClick={() => handleMobileLinkClick('/autos')}
                                    className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-100 font-medium text-gray-700"
                                >
                                    Inventario
                                </button>
                                <button
                                    onClick={() => handleMobileLinkClick('/escritorio/profile')}
                                    className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-100 font-medium text-gray-700"
                                >
                                    Mi Perfil
                                </button>
                                <button
                                    onClick={() => handleMobileLinkClick('/escritorio/seguimiento')}
                                    className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-100 font-medium text-gray-700"
                                >
                                    Mis Solicitudes
                                </button>
                                <button
                                    onClick={() => handleMobileLinkClick('/promociones')}
                                    className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-100 font-medium text-gray-700"
                                >
                                    Promociones
                                </button>
                                <button
                                    onClick={() => handleMobileLinkClick('/escritorio/favoritos')}
                                    className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-100 font-medium text-gray-700"
                                >
                                    Mis Favoritos
                                </button>
                                <button
                                    onClick={() => handleMobileLinkClick('/vender')}
                                    className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-100 font-medium text-gray-700"
                                >
                                    Vender mi auto
                                </button>
                                <button
                                    onClick={() => handleMobileLinkClick('/ayuda')}
                                    className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-100 font-medium text-gray-700"
                                >
                                    Ayuda/FAQs
                                </button>
                                <button
                                    onClick={handleSignOut}
                                    className="w-full text-left flex items-center gap-2 px-4 py-3 rounded-lg hover:bg-red-50 font-semibold text-red-600 mt-4"
                                >
                                    <LogOutIcon className="w-5 h-5" /> Cerrar Sesión
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={() => handleMobileLinkClick('/acceder')}
                                className="w-full text-center px-6 py-3 rounded-lg bg-gradient-to-r from-orange-400 to-orange-600 text-white font-semibold shadow-md"
                            >
                                Iniciar Sesión
                            </button>
                        )}
                    </div>
                </div>
            </div>
        )}
      </header>
    );
};

export default Header;