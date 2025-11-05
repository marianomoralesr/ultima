import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import useSEO from '../hooks/useSEO';
import { useVehicles } from '../context/VehicleContext';
import type { Vehicle } from '../types/types';
import { getVehicleImage } from '../utils/getVehicleImage';
import { DEFAULT_PLACEHOLDER_IMAGE } from '../utils/constants';
import LazyImage from '../components/LazyImage';
import {
  Car,
  ShieldCheck,
  Award,
  FileText,
  TrendingUp,
  Check,
  X,
  Star,
  Calendar,
  ChevronDown,
  ArrowRight,
  PlayCircle
} from 'lucide-react';
import { formatPrice } from '../utils/formatters';

const faqData = [
  {
    question: '¿Qué años de vehículos manejan?',
    answer: 'Nos especializamos en vehículos seminuevos del 2019 en adelante. Todos nuestros autos pasan por una inspección rigurosa de 150 puntos para garantizar su calidad y confiabilidad.'
  },
  {
    question: '¿Qué incluye la garantía?',
    answer: 'Todos nuestros vehículos incluyen garantía de 6 meses o 10,000 kilómetros (lo que ocurra primero) que cubre motor, transmisión y componentes principales. También ofrecemos garantías extendidas opcionales.'
  },
  {
    question: '¿Puedo financiar mi auto?',
    answer: 'Sí, trabajamos con múltiples instituciones financieras para ofrecerte las mejores tasas desde 8.9% anual. Manejamos plazos de hasta 60 meses y enganches desde 20%. La precalificación toma menos de 24 horas.'
  },
  {
    question: '¿Reciben autos en intercambio?',
    answer: '¡Por supuesto! Recibimos cualquier marca y modelo como parte de pago. Realizamos una evaluación gratuita y transparente de tu vehículo actual para ofrecerte el mejor precio del mercado.'
  },
  {
    question: '¿Qué documentos necesito para comprar?',
    answer: 'Necesitas identificación oficial, comprobante de ingresos, comprobante de domicilio y referencias personales. Si vas a financiar, también requerimos estados de cuenta bancarios. Nosotros nos encargamos de todos los trámites legales.'
  },
  {
    question: '¿Ofrecen servicio post-venta?',
    answer: 'Sí, contamos con servicio post-venta completo incluyendo mantenimiento preventivo, reparaciones menores y asesoría técnica. También te ayudamos con seguros de auto y trámites adicionales que puedas necesitar.'
  }
];

/* ---------- Hero Vehicle Card ---------- */
const HeroVehicleCard: React.FC<{ vehicle: Vehicle }> = React.memo(({ vehicle }) => {
  const imageSrc = getVehicleImage(vehicle);

  return (
    <div className="relative h-full group">
      <div className="h-full rounded-2xl shadow-md overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
        <div className="relative aspect-[4/3] bg-gray-100">
          <LazyImage
            src={imageSrc}
            alt={vehicle.titulo}
            className="w-full h-full"
            objectFit="cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex flex-col justify-end p-3">
            <h3
              className="text-white font-bold text-sm truncate drop-shadow-md"
              title={vehicle.titulo}
            >
              {vehicle.titulo}
            </h3>
            <p className="text-primary-400 font-semibold text-base drop-shadow-md">
              {formatPrice(vehicle.precio)}
            </p>
          </div>
        </div>
      </div>
      <Link to={`/autos/${vehicle.slug}`} className="absolute inset-0 z-10">
        <span className="sr-only">Ver detalles de {vehicle.titulo}</span>
      </Link>
    </div>
  );
});

/* ---------- Scroller Row ---------- */
const ScrollerRow: React.FC<{ vehicles: Vehicle[]; reverse?: boolean; speed?: number }> = ({
  vehicles,
  reverse = false,
  speed = 40,
}) => {
  const extendedVehicles = [...vehicles];

  const ScrollerContent = () => (
    <>
      {extendedVehicles.map((v, i) => (
        <div key={`${v.id}-${i}`} className="flex-shrink-0 w-44 sm:w-60 h-auto">
          <HeroVehicleCard vehicle={v} />
        </div>
      ))}
    </>
  );

  return (
    <div
      className={`flex gap-4 ${reverse ? 'animate-scroll-right' : 'animate-scroll-left'}`}
      style={{ animationDuration: `${speed}s` }}
    >
      <div className="flex flex-shrink-0 gap-4 min-w-full">
        <ScrollerContent />
      </div>
      <div className="flex flex-shrink-0 gap-4 min-w-full">
        <ScrollerContent />
      </div>
    </div>
  );
};

/* ---------- Masonry Grid for SUVs ---------- */
const MasonryVehicleCard: React.FC<{ vehicle: Vehicle }> = ({ vehicle }) => {
  const imageSrc = getVehicleImage(vehicle);
  const isPopular = vehicle.view_count >= 1000;
  return (
    <Link to={`/autos/${vehicle.slug}`} className="group block relative z-10">
      <div className={`relative ${!isPopular ? 'overflow-hidden' : ''} rounded-lg shadow-md hover:shadow-xl transition-shadow ${isPopular ? 'popular-card' : ''}`}>
        <div className={`aspect-[4/3] bg-gray-100 ${isPopular ? 'overflow-hidden rounded-t-lg' : ''}`}>
          <LazyImage
            src={imageSrc}
            alt={vehicle.titulo}
            className="w-full h-full"
            objectFit="cover"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex flex-col justify-end p-3">
          <h4 className="text-white font-semibold text-sm truncate drop-shadow-md" title={vehicle.titulo}>
            {vehicle.titulo}
          </h4>
          <p className="text-white font-bold text-base drop-shadow-md">
            {formatPrice(vehicle.precio)}
          </p>
        </div>
      </div>
    </Link>
  );
};

/* ---------- Horizontal Slider ---------- */
const HorizontalSlider: React.FC<{ vehicles: Vehicle[] }> = ({ vehicles }) => {
  const [scrollPosition, setScrollPosition] = React.useState(0);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (containerRef.current) {
      const scrollAmount = 300;
      const newPosition = direction === 'left'
        ? scrollPosition - scrollAmount
        : scrollPosition + scrollAmount;
      containerRef.current.scrollTo({ left: newPosition, behavior: 'smooth' });
      setScrollPosition(newPosition);
    }
  };

  if (vehicles.length === 0) return null;

  return (
    <div className="relative">
      {vehicles.length > 2 && (
        <>
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg"
            aria-label="Scroll left"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg"
            aria-label="Scroll right"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}
      <div
        ref={containerRef}
        className="flex gap-3 overflow-x-auto scrollbar-hide snap-x snap-mandatory"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {vehicles.map((vehicle) => (
          <div key={vehicle.id} className="flex-shrink-0 w-48 snap-start">
            <MasonryVehicleCard vehicle={vehicle} />
          </div>
        ))}
      </div>
    </div>
  );
};

/* ---------- Single Card Slider ---------- */
const SingleCardSlider: React.FC<{ vehicles: Vehicle[] }> = ({ vehicles }) => {
  const [currentIndex, setCurrentIndex] = React.useState(0);

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? vehicles.length - 1 : prevIndex - 1
    );
  };

  const goToNext = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === vehicles.length - 1 ? 0 : prevIndex + 1
    );
  };

  if (vehicles.length === 0) return null;

  const currentVehicle = vehicles[currentIndex];

  return (
    <div className="relative">
      <div className="relative">
        <MasonryVehicleCard vehicle={currentVehicle} />
      </div>

      {vehicles.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg transition-all"
            aria-label="Previous vehicle"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={goToNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg transition-all"
            aria-label="Next vehicle"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Dots indicator */}
          <div className="flex justify-center gap-2 mt-4">
            {vehicles.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentIndex
                    ? 'bg-primary w-4'
                    : 'bg-gray-300 hover:bg-gray-400'
                }`}
                aria-label={`Go to vehicle ${index + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

const LandingPage: React.FC = () => {
  useSEO({
    title: 'TREFA Auto Inventory - Autos Seminuevos Certificados',
    description: 'Encuentra el auto perfecto en nuestra selección de vehículos seminuevos 2019 en adelante con Kit de Seguridad incluido: Garantía Blindada, Certificado de Procedencia y más.',
    keywords: 'autos seminuevos, vehículos certificados, garantía blindada, financiamiento automotriz, autos trefa'
  });

  const { vehicles: allVehicles, isLoading } = useVehicles();
  const [displayVehicles, setDisplayVehicles] = useState<Vehicle[]>([]);
  const [openFaq, setOpenFaq] = React.useState<number | null>(null);

  useEffect(() => {
    if (allVehicles && allVehicles.length > 0) {
      const available = allVehicles.filter(v =>
        !v.separado &&
        !v.vendido &&
        getVehicleImage(v) !== DEFAULT_PLACEHOLDER_IMAGE
      );
      const shuffled = [...available].sort(() => 0.5 - Math.random());
      setDisplayVehicles(shuffled);
    }
  }, [allVehicles]);

  const rows = useMemo(() => {
    if (displayVehicles.length === 0) {
      return { row1: [], row2: [] };
    }
    let vehiclesForHero = [...displayVehicles];
    while (vehiclesForHero.length < 14) {
      vehiclesForHero.push(...displayVehicles);
    }
    vehiclesForHero = vehiclesForHero.slice(0, 14);

    const midPoint = Math.ceil(vehiclesForHero.length / 2);
    return {
      row1: vehiclesForHero.slice(0, midPoint),
      row2: vehiclesForHero.slice(midPoint),
    };
  }, [displayVehicles]);

  // Filter vehicles by body type for inventory section
  const suvVehicles = useMemo(() =>
    displayVehicles.filter(v => {
      const type = v.carroceria?.toLowerCase() || '';
      return type.includes('suv');
    }).slice(0, 10),
    [displayVehicles]
  );

  const sedanVehicles = useMemo(() =>
    displayVehicles.filter(v => {
      const type = v.carroceria?.toLowerCase() || '';
      return type.includes('sedan') || type.includes('sedán');
    }),
    [displayVehicles]
  );

  const hatchbackVehicles = useMemo(() =>
    displayVehicles.filter(v => {
      const type = v.carroceria?.toLowerCase() || '';
      return type.includes('hatch') || type.includes('compacto') || type.includes('compact');
    }),
    [displayVehicles]
  );

  const pickupVehicles = useMemo(() =>
    displayVehicles.filter(v => {
      const type = v.carroceria?.toLowerCase() || '';
      return type.includes('pick') || type.includes('pickup') || type.includes('camioneta');
    }).slice(0, 6),
    [displayVehicles]
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Original Hero Section */}
      <section className="relative overflow-hidden flex items-center" style={{ minHeight: '88dvh' }}>
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Right vehicle - visible on desktop */}
          <div className="hidden lg:block absolute right-0 xl:right-16 bottom-0">
            <img
              src="https://r2.trefa.mx/Frame%2040%20(1).png"
              alt="TREFA Vehicle"
              className="w-[425px] xl:w-[510px] h-auto object-contain opacity-40"
            />
          </div>
          {/* Left vehicle - visible on desktop */}
          <div className="hidden lg:block absolute left-0 xl:left-16 bottom-0">
            <img
              src="https://r2.trefa.mx/r9GDYibmXVaw8Zv93n4Bfi9TIs.png.webp"
              alt="TREFA Vehicle"
              className="w-[425px] xl:w-[510px] h-auto object-contain scale-x-[-1] opacity-40"
            />
          </div>
          {/* Mobile: Single vehicle as subtle background */}
          <div className="lg:hidden absolute right-0 bottom-0">
            <img
              src="https://r2.trefa.mx/Frame%2040%20(1).png"
              alt="TREFA Vehicle"
              className="w-[218px] h-auto object-contain opacity-20"
            />
          </div>
        </div>
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 bg-gradient-to-t to-transparent blur-3xl rounded-t-full from-primary/20 translate-y-1/2 w-[80%] h-96" />

        <div className="container mx-auto px-4 lg:px-6 relative z-10 pb-20 pt-0 -mt-8">
          <div className="flex flex-col items-center text-center space-y-6">
            <span className="px-4 py-1 bg-gradient-to-r from-primary/10 to-secondary/5 border border-primary/30 hover:from-primary/20 hover:to-secondary/10 hover:border-primary/40 transition-all duration-300 shadow-sm hover:shadow-md rounded-full inline-flex items-center gap-2">
              <ShieldCheck className="w-3 h-3 text-primary" />
              <span className="text-sm font-medium">Autos Seminuevos Certificados</span>
            </span>

            <motion.h1 className="font-heading text-4xl md:text-6xl font-bold tracking-tight max-w-4xl">
              Tu próximo auto seminuevo te está esperando
            </motion.h1>

            <p className="text-xl text-muted-foreground max-w-2xl leading-relaxed">
              Encuentra el auto perfecto en nuestra selección de vehículos seminuevos 2019 en
              adelante. SUVs, Sedanes, Hatchbacks y Pick Ups con garantía y financiamiento
              disponible.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link to="/autos" className="inline-flex items-center justify-center gap-2 bg-background text-foreground border-2 border-input hover:bg-accent hover:text-accent-foreground px-8 py-3 rounded-lg font-semibold transition-all">
                Ver Inventario
                <Car className="w-4 h-4" />
              </Link>
              <a href="#comparacion" className="inline-flex items-center justify-center gap-2 bg-primary text-white hover:bg-primary/90 px-8 py-3 rounded-lg font-semibold shadow-lg transition-all">
                Conoce el Kit de Seguridad
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>

            <div className="flex flex-col items-center space-y-4 mt-10">
              <p className="text-sm text-muted-foreground">
                Más de 500 autos vendidos y clientes satisfechos
              </p>
              <div className="flex items-center space-x-6 opacity-60 flex-wrap justify-center gap-y-4 gap-x-4 mt-4">
                <div className="flex items-center space-x-2">
                  <img src="/images/Honda.png" alt="Honda" className="h-7 w-auto opacity-70" />
                  <span className="text-base font-semibold hidden sm:inline">Honda</span>
                </div>
                <div className="flex items-center space-x-2">
                  <img src="/images/Toyota.png" alt="Toyota" className="h-7 w-auto opacity-70" />
                  <span className="text-base font-semibold hidden sm:inline">Toyota</span>
                </div>
                <div className="flex items-center space-x-2">
                  <img src="/images/Nissan.png" alt="Nissan" className="h-7 w-auto opacity-70" />
                  <span className="text-base font-semibold hidden sm:inline">Nissan</span>
                </div>
                <div className="flex items-center space-x-2">
                  <img src="/images/Mazda.png" alt="Mazda" className="h-7 w-auto opacity-70" />
                  <span className="text-base font-semibold hidden sm:inline">Mazda</span>
                </div>
                <div className="flex items-center space-x-2">
                  <img src="/images/Hyundai.png" alt="Hyundai" className="h-7 w-auto opacity-70" />
                  <span className="text-base font-semibold hidden sm:inline">Hyundai</span>
                </div>
                <div className="flex items-center space-x-2">
                  <img src="/images/Kia.png" alt="Kia" className="h-7 w-auto opacity-70" />
                  <span className="text-base font-semibold hidden sm:inline">Kia</span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                y 15 de las mejores marcas más...
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Scrolling Vehicles Section */}
      <section className="relative overflow-hidden py-12 md:py-16 bg-muted/30">
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-1/4 -left-24 w-72 h-72 bg-blue-500/10 rounded-full mix-blend-multiply filter blur-2xl opacity-20 animate-blob"></div>
          <div className="absolute top-1/2 -right-24 w-72 h-72 bg-orange-500/10 rounded-full mix-blend-multiply filter blur-2xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-primary/10 rounded-full mix-blend-multiply filter blur-2xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>

        <div className="container mx-auto px-4 lg:px-6 relative z-10 text-center my-16">
          <motion.h2 className="font-heading text-4xl md:text-6xl font-bold tracking-tight">
            Encuentra tu próximo auto
          </motion.h2>
        </div>

        {/* Scrolling Vehicle Display */}
        {displayVehicles.length >= 1 ? (
          <div className="h-[280px] md:h-[380px] relative flex justify-start items-start mask-gradient mb-8">
            <div className="absolute top-0 left-0 w-full flex flex-col justify-center gap-2 h-full">
              <ScrollerRow vehicles={rows.row1} speed={25} />
              <ScrollerRow vehicles={rows.row2} reverse speed={35} />
            </div>
          </div>
        ) : (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center mt-6">
            <p className="text-gray-400">
              {isLoading ? 'Cargando inventario...' : 'Actualizando lo más nuevo de nuestro inventario...'}
            </p>
          </div>
        )}

        <div className="container mx-auto px-4 lg:px-6 relative z-10 text-center">
          <Link to="/autos" className="inline-flex items-center justify-center gap-2 bg-primary text-white hover:bg-primary/90 px-8 py-3 rounded-lg font-semibold shadow-lg transition-all text-lg">
            Ver el inventario completo
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Video Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4 lg:px-6">
          <div className="text-center space-y-4 mb-12">
            <h2 className="font-heading text-3xl md:text-4xl font-bold">Conoce Autos TREFA</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Descubre por qué somos la mejor opción para tu próximo auto seminuevo
            </p>
          </div>
          <div className="max-w-4xl mx-auto">
            <div className="overflow-hidden bg-gradient-to-br from-primary/5 to-secondary/5 shadow-xl rounded-xl">
              <div className="aspect-video bg-muted/50 flex items-center justify-center">
                <div className="text-center space-y-4">
                  <PlayCircle className="w-16 h-16 text-primary mx-auto" />
                  <p className="text-lg font-semibold">Video Presentación</p>
                  <p className="text-muted-foreground">
                    Conoce nuestras instalaciones y proceso de venta
                  </p>
                  <button className="mt-4 bg-primary text-white hover:bg-primary/90 px-6 py-2 rounded-lg font-semibold">
                    Reproducir Video
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Inventory Section */}
      <section id="inventario" className="border-t bg-muted/50 py-20 md:py-32">
        <div className="container mx-auto px-4 lg:px-6">
          <div className="text-center space-y-4 mb-16">
            <h2 className="font-heading text-3xl md:text-4xl font-bold">Nuestro Inventario TREFA</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Vehículos seminuevos 2019 en adelante con inspección de 150 puntos, garantía blindada y el Kit de Seguridad TREFA incluido
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* SUVs Premium - Single Card Slider */}
            <div className="bg-gradient-to-br from-primary/5 to-secondary/5 rounded-xl p-6 shadow-lg md:col-span-3">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                    <Car className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-heading font-semibold text-2xl">SUVs Premium Certificados</h3>
                    <p className="text-muted-foreground">Amplia selección con inspección de 150 puntos</p>
                  </div>
                </div>
                <Link to="/autos?carroceria=SUV" className="bg-primary text-white hover:bg-primary/90 px-4 py-2 rounded-lg text-sm font-semibold">
                  Ver todos →
                </Link>
              </div>
              {suvVehicles.length > 0 ? (
                <SingleCardSlider vehicles={suvVehicles} />
              ) : (
                <p className="text-muted-foreground text-center py-8">Actualizando selección de SUVs...</p>
              )}
            </div>

            {/* Merged Hatchbacks and Sedanes - Horizontal Sliders */}
            <div className="bg-gradient-to-br from-primary/5 to-secondary/5 rounded-xl p-6 shadow-lg md:col-span-2 space-y-8">
              {/* Hatchbacks Section */}
              <div>
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                    <Car className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-heading font-semibold text-xl">Hatchbacks</h3>
                    <p className="text-muted-foreground text-sm">Perfectos para la ciudad</p>
                  </div>
                </div>
                {hatchbackVehicles.length > 0 ? (
                  <HorizontalSlider vehicles={hatchbackVehicles} />
                ) : (
                  <p className="text-muted-foreground text-center py-8">Actualizando selección de Hatchbacks...</p>
                )}
                <Link to="/autos?carroceria=Hatchback" className="mt-4 inline-block text-white bg-primary hover:bg-primary/90 px-4 py-2 rounded-lg font-semibold text-sm">
                  Ver todos →
                </Link>
              </div>

              {/* Sedanes Section */}
              <div>
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                    <Star className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-heading font-semibold text-xl">Sedanes</h3>
                    <p className="text-muted-foreground text-sm">Elegancia y confort certificados</p>
                  </div>
                </div>
                {sedanVehicles.length > 0 ? (
                  <HorizontalSlider vehicles={sedanVehicles} />
                ) : (
                  <p className="text-muted-foreground text-center py-8">Actualizando selección de Sedanes...</p>
                )}
                <Link to="/autos?carroceria=Sedan" className="mt-4 inline-block text-white bg-primary hover:bg-primary/90 px-4 py-2 rounded-lg font-semibold text-sm">
                  Ver todos →
                </Link>
              </div>
            </div>

            {/* Pick Ups - Single Card Slider */}
            <div className="bg-gradient-to-br from-primary/5 to-secondary/5 rounded-xl p-6 shadow-lg md:row-span-1">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                  <Car className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-heading font-semibold text-xl">Pick Ups</h3>
                  <p className="text-muted-foreground text-sm">Potencia y capacidad</p>
                </div>
              </div>
              {pickupVehicles.length > 0 ? (
                <SingleCardSlider vehicles={pickupVehicles} />
              ) : (
                <p className="text-muted-foreground text-center py-8">Actualizando selección de Pick Ups...</p>
              )}
              <Link to="/autos?carroceria=Pick Up" className="mt-4 inline-block text-white bg-primary hover:bg-primary/90 px-4 py-2 rounded-lg font-semibold text-sm w-full text-center">
                Ver todos →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Garantía TREFA Section */}
      <section className="py-20 md:py-32 bg-background">
        <div className="container mx-auto px-4 lg:px-6">
          <div className="text-center space-y-4 mb-16">
            <h2 className="font-heading text-3xl md:text-4xl font-bold">Kit de Seguridad TREFA</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Cada auto incluye sin costo adicional nuestro Kit de Seguridad valorado en $123,500 MXN
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-12">
            {/* Garantía Blindada */}
            <div className="shadow-lg bg-gradient-to-br from-primary/5 to-secondary/5 rounded-xl p-6">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <ShieldCheck className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-heading font-semibold text-xl mb-2">Garantía Blindada $100K</h3>
              <p className="text-muted-foreground">
                Motor y transmisión cubiertos con hasta $100,000 pesos durante un año completo. Incluido sin costo.
              </p>
            </div>

            {/* Certificado de Procedencia */}
            <div className="shadow-lg bg-gradient-to-br from-primary/5 to-secondary/5 rounded-xl p-6">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-heading font-semibold text-xl mb-2">Procedencia Segura</h3>
              <p className="text-muted-foreground">
                Validación en REPUVE, SAT, Totalcheck y TransUnion. Historial 100% verificado.
              </p>
            </div>

            {/* Check-up de Confianza */}
            <div className="shadow-lg bg-gradient-to-br from-primary/5 to-secondary/5 rounded-xl p-6">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Award className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-heading font-semibold text-xl mb-2">Check-up a los 6 Meses</h3>
              <p className="text-muted-foreground">
                Inspección multipunto gratuita: frenos, suspensión, niveles y componentes de seguridad.
              </p>
            </div>
          </div>

          {/* Kit TREFA Summary */}
          <div className="bg-gradient-to-br from-primary/5 to-secondary/5 border border-primary/20 rounded-2xl p-8 text-center">
            <h3 className="font-heading text-2xl font-bold text-primary mb-4">
              Todo Esto Incluido en Cada Auto
            </h3>
            <p className="text-lg text-muted-foreground mb-6 max-w-3xl mx-auto">
              Garantía Blindada, Certificado de Procedencia, Programa de Recompra, Check-up de Confianza, Bono de Movilidad, Bono de Tranquilidad Financiera y más beneficios exclusivos
            </p>
            <Link to="/kit-trefa" className="inline-flex items-center gap-2 bg-primary text-white hover:bg-primary/90 px-6 py-3 rounded-lg font-semibold">
              Conocer el Kit de Seguridad Completo
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section id="comparacion" className="py-20 md:py-32">
        <div className="container mx-auto px-4 lg:px-6">
          <div className="text-center space-y-4 mb-16">
            <h2 className="font-heading text-3xl md:text-4xl font-bold">
              ¿Por Qué Elegir Autos TREFA?
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Comparamos las opciones para que tomes la mejor decisión al comprar tu auto seminuevo
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto mb-16">
            {/* Loteros Tradicionales Card */}
            <div className="relative border-2 bg-gradient-to-br from-red-50 to-red-100 border-red-300 rounded-xl p-6">
              <div className="space-y-1">
                <h3 className="font-semibold text-xl text-left text-red-700">
                  Loteros Tradicionales
                </h3>
                <p className="text-red-600 text-left">Riesgos y limitaciones</p>
              </div>
              <div className="flex items-baseline gap-2 mt-6">
                <div className="text-4xl font-bold text-left text-red-700">❌</div>
                <div className="text-red-600 text-left">Múltiples riesgos</div>
              </div>
              <div className="mt-8 mb-6">
                <button
                  className="w-full border-red-400 text-red-700 hover:bg-red-50 px-4 py-2 rounded-lg font-semibold border-2"
                  disabled
                >
                  No Recomendado
                </button>
              </div>
              <div className="border-t border-red-300 my-6"></div>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <X className="w-5 h-5 text-red-500 flex-shrink-0" />
                  <span className="text-red-700">Sin garantía real</span>
                </div>
                <div className="flex items-center space-x-3">
                  <X className="w-5 h-5 text-red-500 flex-shrink-0" />
                  <span className="text-red-700">Historial dudoso</span>
                </div>
                <div className="flex items-center space-x-3">
                  <X className="w-5 h-5 text-red-500 flex-shrink-0" />
                  <span className="text-red-700">Precios inflados</span>
                </div>
                <div className="flex items-center space-x-3">
                  <X className="w-5 h-5 text-red-500 flex-shrink-0" />
                  <span className="text-red-700">Comisiones ocultas</span>
                </div>
                <div className="flex items-center space-x-3">
                  <X className="w-5 h-5 text-red-500 flex-shrink-0" />
                  <span className="text-red-700">Financiamiento limitado</span>
                </div>
                <div className="flex items-center space-x-3">
                  <X className="w-5 h-5 text-red-500 flex-shrink-0" />
                  <span className="text-red-700">Autos en mal estado</span>
                </div>
                <div className="flex items-center space-x-3">
                  <X className="w-5 h-5 text-red-500 flex-shrink-0" />
                  <span className="text-red-700">Documentación irregular</span>
                </div>
                <div className="flex items-center space-x-3">
                  <X className="w-5 h-5 text-red-500 flex-shrink-0" />
                  <span className="text-red-700">Sin servicio post-venta</span>
                </div>
                <div className="flex items-center space-x-3">
                  <X className="w-5 h-5 text-red-500 flex-shrink-0" />
                  <span className="text-red-700">Presión de venta</span>
                </div>
              </div>
            </div>

            {/* Autos TREFA Card */}
            <div className="relative border-4 border-primary shadow-2xl scale-105 bg-white z-10 rounded-xl p-6">
              <span className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground px-4 py-2 text-sm font-bold rounded-full inline-flex items-center gap-1">
                <Award className="w-4 h-4" />
                LA MEJOR OPCIÓN
              </span>
              <div className="space-y-1 mt-4">
                <h3 className="font-semibold text-xl text-left text-primary">Autos TREFA</h3>
                <p className="text-muted-foreground text-left">Confianza y profesionalismo</p>
              </div>
              <div className="flex items-baseline gap-2 mt-6">
                <div className="text-4xl font-bold text-left text-primary">✅</div>
                <div className="text-muted-foreground text-left">Máxima seguridad</div>
              </div>
              <div className="mt-8 mb-6">
                <Link to="/autos" className="w-full bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg font-semibold block text-center">
                  ¡Elige TREFA!
                </Link>
              </div>
              <div className="border-t border-border my-6"></div>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Check className="w-5 h-5 text-primary flex-shrink-0" />
                  <span className="text-foreground font-medium">Garantía de 6 meses</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Check className="w-5 h-5 text-primary flex-shrink-0" />
                  <span className="text-foreground font-medium">Historial 100% verificado</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Check className="w-5 h-5 text-primary flex-shrink-0" />
                  <span className="text-foreground font-medium">Precios justos y transparentes</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Check className="w-5 h-5 text-primary flex-shrink-0" />
                  <span className="text-foreground font-medium">0% comisiones ocultas</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Check className="w-5 h-5 text-primary flex-shrink-0" />
                  <span className="text-foreground font-medium">Financiamiento desde 8.9%</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Check className="w-5 h-5 text-primary flex-shrink-0" />
                  <span className="text-foreground font-medium">Inspección de 150 puntos</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Check className="w-5 h-5 text-primary flex-shrink-0" />
                  <span className="text-foreground font-medium">Servicio post-venta</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Check className="w-5 h-5 text-primary flex-shrink-0" />
                  <span className="text-foreground font-medium">Intercambios aceptados</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Check className="w-5 h-5 text-primary flex-shrink-0" />
                  <span className="text-foreground font-medium">Documentación legal</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Check className="w-5 h-5 text-primary flex-shrink-0" />
                  <span className="text-foreground font-medium">Asesoría personalizada</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Check className="w-5 h-5 text-primary flex-shrink-0" />
                  <span className="text-foreground font-medium">Seguros incluidos</span>
                </div>
              </div>
            </div>

            {/* Particulares Card */}
            <div className="relative border-2 bg-gradient-to-br from-red-50 to-red-100 border-red-300 rounded-xl p-6">
              <div className="space-y-1">
                <h3 className="font-semibold text-xl text-left text-red-700">
                  Particulares/Desconocidos
                </h3>
                <p className="text-red-600 text-left">Riesgos considerables</p>
              </div>
              <div className="flex items-baseline gap-2 mt-6">
                <div className="text-4xl font-bold text-left text-red-700">⚠️</div>
                <div className="text-red-600 text-left">Alto riesgo</div>
              </div>
              <div className="mt-8 mb-6">
                <button
                  className="w-full border-red-400 text-red-700 hover:bg-red-50 px-4 py-2 rounded-lg font-semibold border-2"
                  disabled
                >
                  Riesgoso
                </button>
              </div>
              <div className="border-t border-red-300 my-6"></div>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <X className="w-5 h-5 text-red-500 flex-shrink-0" />
                  <span className="text-red-700">Sin garantía alguna</span>
                </div>
                <div className="flex items-center space-x-3">
                  <X className="w-5 h-5 text-red-500 flex-shrink-0" />
                  <span className="text-red-700">Historial desconocido</span>
                </div>
                <div className="flex items-center space-x-3">
                  <X className="w-5 h-5 text-red-500 flex-shrink-0" />
                  <span className="text-red-700">Posibles fraudes</span>
                </div>
                <div className="flex items-center space-x-3">
                  <X className="w-5 h-5 text-red-500 flex-shrink-0" />
                  <span className="text-red-700">Sin financiamiento</span>
                </div>
                <div className="flex items-center space-x-3">
                  <X className="w-5 h-5 text-red-500 flex-shrink-0" />
                  <span className="text-red-700">Trámites complicados</span>
                </div>
                <div className="flex items-center space-x-3">
                  <X className="w-5 h-5 text-red-500 flex-shrink-0" />
                  <span className="text-red-700">Autos robados/chocados</span>
                </div>
                <div className="flex items-center space-x-3">
                  <X className="w-5 h-5 text-red-500 flex-shrink-0" />
                  <span className="text-red-700">Problemas legales</span>
                </div>
                <div className="flex items-center space-x-3">
                  <X className="w-5 h-5 text-red-500 flex-shrink-0" />
                  <span className="text-red-700">Sin respaldo</span>
                </div>
                <div className="flex items-center space-x-3">
                  <X className="w-5 h-5 text-red-500 flex-shrink-0" />
                  <span className="text-red-700">Pérdida de dinero</span>
                </div>
              </div>
            </div>
          </div>

          {/* Summary Box */}
          <div className="bg-gradient-to-r from-primary/10 to-secondary/5 border border-primary/30 rounded-2xl p-8 text-center">
            <h3 className="font-heading text-2xl font-bold text-primary mb-4">
              La Diferencia TREFA es Clara
            </h3>
            <p className="text-lg text-muted-foreground mb-6">
              Mientras otros te exponen a riesgos, nosotros te brindamos seguridad, garantía y el
              mejor servicio del mercado
            </p>
            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <div className="bg-white border border-primary/20 rounded-lg p-6 shadow-md">
                <ShieldCheck className="w-12 h-12 text-primary mx-auto mb-3" />
                <h4 className="font-semibold text-lg mb-2 text-primary">Protección Total</h4>
                <p className="text-muted-foreground text-sm">
                  Garantía, seguro y respaldo legal en cada compra
                </p>
              </div>
              <div className="bg-white border border-primary/20 rounded-lg p-6 shadow-md">
                <TrendingUp className="w-12 h-12 text-primary mx-auto mb-3" />
                <h4 className="font-semibold text-lg mb-2 text-primary">Servicio Personalizado</h4>
                <p className="text-muted-foreground text-sm">
                  Te acompañamos desde la elección hasta después de la compra
                </p>
              </div>
              <div className="bg-white border border-primary/20 rounded-lg p-6 shadow-md">
                <Award className="w-12 h-12 text-primary mx-auto mb-3" />
                <h4 className="font-semibold text-lg mb-2 text-primary">Calidad Garantizada</h4>
                <p className="text-muted-foreground text-sm">
                  Solo vehículos 2019+ con inspección de 150 puntos
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-muted/50 md:py-32">
        <div className="container mx-auto px-4 lg:px-6">
          <div className="text-center space-y-4 mb-16">
            <h2 className="font-heading text-3xl md:text-4xl font-bold">
              Lo Que Dicen Nuestros Clientes
            </h2>
            <p className="text-xl text-muted-foreground mx-auto">
              Más de 500 familias han encontrado su auto ideal con nosotros
            </p>
          </div>
          <div className="grid gap-8">
            <div className="grid lg:grid-cols-3 gap-8">
              {[
                {
                  name: 'María González',
                  vehicle: 'Honda CR-V 2021',
                  text: 'Excelente servicio desde el primer contacto. Mi Honda CR-V 2021 llegó en perfectas condiciones y el financiamiento fue muy accesible. Totalmente recomendado.'
                },
                {
                  name: 'Carlos Ramírez',
                  vehicle: 'Nissan Frontier 2020',
                  text: 'El proceso de intercambio fue muy transparente. Recibí un precio justo por mi auto anterior y encontré la pick-up perfecta para mi negocio. Muy profesionales.'
                },
                {
                  name: 'Ana López',
                  vehicle: 'Mazda CX-5 2022',
                  text: 'Como madre soltera, necesitaba un auto confiable y económico. El equipo de TREFA me ayudó a encontrar el financiamiento perfecto para mi Mazda CX-5.'
                }
              ].map((testimonial, index) => (
                <div key={index} className="bg-gradient-to-br from-primary/5 to-secondary/5 shadow-lg rounded-xl p-6">
                  <div className="flex items-center space-x-1 mb-4">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} className="w-5 h-5 text-primary fill-current" />
                    ))}
                  </div>
                  <p className="text-muted-foreground mb-6">
                    "{testimonial.text}"
                  </p>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-primary font-bold">{testimonial.name.charAt(0)}</span>
                    </div>
                    <div>
                      <div className="font-semibold">{testimonial.name}</div>
                      <div className="text-sm text-muted-foreground">{testimonial.vehicle}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4 lg:px-6">
          <div className="text-center space-y-4 mb-16">
            <h2 className="font-heading text-3xl md:text-4xl font-bold">Preguntas Frecuentes</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Todo lo que necesitas saber sobre comprar tu auto seminuevo en TREFA
            </p>
          </div>
          <div className="max-w-3xl mx-auto space-y-4">
            {faqData.map((faq, index) => (
              <div key={index} className="border rounded-lg overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full px-6 py-4 text-left font-semibold hover:bg-muted/50 transition-colors flex items-center justify-between"
                >
                  <span>{faq.question}</span>
                  <ChevronDown
                    className={`w-5 h-5 transition-transform ${
                      openFaq === index ? 'transform rotate-180' : ''
                    }`}
                  />
                </button>
                {openFaq === index && (
                  <div className="px-6 pb-4 text-muted-foreground leading-relaxed">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-primary text-primary-foreground md:py-32 relative overflow-hidden">
        <div className="container mx-auto px-4 lg:px-6">
          <div className="text-center space-y-8 max-w-3xl mx-auto">
            <h2 className="font-heading text-3xl md:text-4xl font-bold">
              ¿Listo Para Encontrar Tu Auto Ideal?
            </h2>
            <p className="text-xl opacity-90 leading-relaxed">
              Visita nuestro showroom o agenda una cita para conocer nuestro inventario de autos
              seminuevos. Te ayudamos a encontrar el vehículo perfecto para ti y tu familia.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link to="/autos" className="inline-flex items-center justify-center gap-2 bg-background text-foreground hover:bg-background/90 px-8 py-3 rounded-lg font-semibold shadow-xl">
                Ver Inventario
                <Car className="w-4 h-4" />
              </Link>
              <Link to="/contacto" className="inline-flex items-center justify-center gap-2 bg-primary-foreground/10 hover:bg-primary-foreground/20 border-2 border-primary-foreground px-8 py-3 rounded-lg font-semibold">
                Agendar Cita
                <Calendar className="w-4 h-4" />
              </Link>
            </div>
            <p className="text-sm opacity-75">
              Financiamiento disponible • Garantía incluida • Intercambios aceptados
            </p>
          </div>
        </div>
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 bg-gradient-to-t to-transparent blur-3xl rounded-t-full from-primary-foreground/20 w-210 translate-y-1/2 h-64" />
      </section>
    </div>
  );
};

export default LandingPage;
