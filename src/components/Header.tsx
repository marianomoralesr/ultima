import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { UserIcon, LogOutIcon, ChevronDownIcon } from './icons';
import { useAuth } from '../context/AuthContext';
import MegaMenu from './MegaMenu';
import HeaderSearchBar from './HeaderSearchBar';
import MobileHeader from './MobileHeader';
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
      <>
        {/* Mobile Header - Only visible on mobile */}
        <MobileHeader />

        {/* Desktop Header - Hidden on mobile */}
        <header className="hidden lg:block fixed top-0 left-0 right-0 z-30 bg-white shadow-sm border-b border-gray-200/80">
          <div className="relative max-w-7xl mx-auto px-4 lg:px-8">
            <div className="flex items-center h-28 gap-x-4">
              {/* Logo */}
              <div className="flex-shrink-0">
                  <Link to="/" className="flex items-center">
                    <img
                      src={"/images/trefalogo.png"}
                      alt="TREFA"
                      className="h-9 w-auto object-contain"
                    />
                  </Link>
              </div>

              {/* Center Section (Search) */}
              <div className={`flex-1 min-w-0 mx-4 ${isListPage ? 'lg:hidden' : ''}`}>
                  <HeaderSearchBar />
              </div>

              {/* Right Section - Desktop Menu and Auth */}
              <div className={`flex items-center space-x-4 flex-shrink-0 ${isListPage ? 'ml-auto' : ''}`}>
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
                      <Button asChild size="sm" className="!text-white">
                          <Link to={isSalesUser ? "/escritorio/ventas/crm" : "/escritorio"} className="!text-white">
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
                  <Button asChild size="sm" className="bg-[#FF6801] hover:bg-[#E55E01] text-white">
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
        </header>
      </>
    );
};

export default Header;