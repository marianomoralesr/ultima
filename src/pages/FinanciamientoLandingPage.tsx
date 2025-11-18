import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import useSEO from '../hooks/useSEO';

const FinanciamientoLandingPage: React.FC = () => {
  useSEO({
    title: 'TREFA - Estrenar un auto nunca fue tan fácil y rápido',
    description: 'Nuevo portal de financiamiento digital 100%. Crea tu cuenta y recibe una respuesta en 24 horas o menos.',
    keywords: 'financiamiento auto, crédito automotriz, comprar auto, financiamiento digital'
  });

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="container mx-auto px-4 py-6 flex items-center justify-between">
        <div className="flex items-center">
          <h1 className="text-3xl font-bold tracking-wider text-[#292830]" style={{ fontFamily: 'Hind Siliguri, sans-serif' }}>
            T R E F A
          </h1>
        </div>
        <Link
          to="/acceder"
          className="px-6 py-3 border-2 border-[#ff7235] rounded-lg text-[#ff7235] font-medium hover:bg-[#ff7235] hover:text-white transition-all duration-300"
          style={{ fontFamily: 'Hind Siliguri, sans-serif' }}
        >
          Iniciar sesión
        </Link>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 pt-20 pb-32 lg:pt-32 lg:pb-48">
        <div className="max-w-3xl">
          {/* Main Title */}
          <h2
            className="text-5xl md:text-6xl lg:text-7xl xl:text-[82px] font-bold leading-none mb-8 text-[#292830]"
            style={{ fontFamily: 'Inter, sans-serif', lineHeight: '1' }}
          >
            Estrenar un auto nunca fue tan fácil y rápido.
          </h2>

          {/* Subtitle */}
          <p
            className="text-xl md:text-2xl text-[#292830] mb-10 leading-normal"
            style={{ fontFamily: 'Hind Siliguri, sans-serif' }}
          >
            Nuevo portal de financiamiento digital 100%. Crea tu cuenta y recibe una respuesta en 24 horas o menos.
          </p>

          {/* CTA Section */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            {/* Primary CTA Button */}
            <Link
              to="/autos"
              className="inline-flex items-center gap-3 bg-[#ff7235] hover:bg-[#e65d00] text-white px-6 py-4 rounded-lg font-normal text-2xl transition-all duration-300 shadow-lg hover:shadow-xl"
              style={{ fontFamily: 'Hind Siliguri, sans-serif' }}
            >
              <span>Elegir mi auto</span>
              <ChevronRight className="w-6 h-6 transform rotate-[-90deg]" />
            </Link>

            {/* Sign In Link */}
            <p
              className="text-2xl text-[#bdbdbd]"
              style={{ fontFamily: 'Hind Siliguri, sans-serif' }}
            >
              ¿Ya tienes cuenta?{' '}
              <Link
                to="/acceder"
                className="text-[#bdbdbd] hover:text-[#ff7235] transition-colors duration-300"
              >
                Inicia sesión
              </Link>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default FinanciamientoLandingPage;
