import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import useSEO from '../hooks/useSEO';
import {
  Car,
  ShieldCheck,
  Award,
  DollarSign,
  FileText,
  Wrench,
  TrendingUp,
  Check,
  X,
  Star,
  Calculator,
  Calendar,
  ChevronDown,
  ArrowRight,
  PlayCircle
} from 'lucide-react';

const benefitsData = [
  {
    icon: Award,
    title: '1. Compromiso de Calidad TREFA',
    description: 'Nuestro compromiso con la calidad es total. Si tu auto presenta una falla mecánica en los primeros 30 días o 500 km, te devolvemos el 100% de tu dinero o lo reparamos sin costo.',
    value: 'Tranquilidad Absoluta'
  },
  {
    icon: FileText,
    title: '2. Certificado de Procedencia Segura',
    description: 'Garantizamos el pasado de tu auto. Validación en REPUVE, SAT, Totalcheck y TransUnion, inspección física forense, auditoría documental.',
    value: '$3,500 MXN'
  },
  {
    icon: ShieldCheck,
    title: '3. Garantía Blindada de $100,000',
    description: 'Protección contra las reparaciones más catastróficas. Motor y transmisión cubiertos con hasta $100,000 pesos durante un año completo.',
    value: '$100,000 MXN'
  },
  {
    icon: TrendingUp,
    title: '4. Programa de Recompra Garantizada',
    description: 'Te garantizamos por escrito la recompra de tu auto por el 80% de su valor el primer año y el 70% el segundo.',
    value: 'Protección Invaluable'
  },
  {
    icon: Wrench,
    title: '5. Check-up de Confianza TREFA',
    description: 'A los 6 meses o 10,000 km, inspección multipunto gratuita: frenos, suspensión, niveles, neumáticos y componentes de seguridad.',
    value: '$4,000 MXN'
  },
  {
    icon: Car,
    title: '6. Bono de Movilidad Garantizada',
    description: 'Si tu auto ingresa a nuestro taller por garantía, te damos $250 pesos diarios para tus traslados.',
    value: '$7,500 MXN'
  },
  {
    icon: DollarSign,
    title: '7. Bono de Tranquilidad Financiera',
    description: 'Si tu auto está financiado y está en nuestro taller por garantía, cubrimos el equivalente a tu mensualidad promedio.',
    value: '$8,500 MXN'
  }
];

const comparisonData = [
  { feature: 'Compromiso de Calidad (30 días)', trefa: true, agencia: false, particular: false },
  { feature: 'Certificado de Procedencia Segura', trefa: true, agencia: 'parcial', particular: false },
  { feature: 'Garantía Blindada en Motor y Transmisión', trefa: true, agencia: 'limitada', particular: false },
  { feature: 'Recompra Garantizada por Contrato', trefa: true, agencia: false, particular: false },
  { feature: 'Check-up de Confianza a los 6 meses', trefa: true, agencia: false, particular: false },
  { feature: 'Apoyo para Movilidad durante Garantía', trefa: true, agencia: false, particular: false },
  { feature: 'Apoyo en Mensualidad durante Garantía', trefa: true, agencia: false, particular: false },
  { feature: 'Riesgo de Fraude o Vicios Ocultos', trefa: 'nulo', agencia: 'bajo', particular: 'alto' }
];

const Checkmark: React.FC<{ status: boolean | string }> = ({ status }) => {
  if (status === true) return <Check className="w-6 h-6 text-green-500 mx-auto" />;
  if (status === false) return <X className="w-6 h-6 text-red-500 mx-auto" />;
  if (status === 'parcial') return <span className="text-xs font-bold text-yellow-800 bg-yellow-100 px-2 py-1 rounded-full">Parcial</span>;
  if (status === 'limitada') return <span className="text-xs font-bold text-yellow-800 bg-yellow-100 px-2 py-1 rounded-full">Limitada</span>;
  if (status === 'nulo') return <span className="text-xs font-bold text-green-800 bg-green-100 px-2 py-1 rounded-full">NULO</span>;
  if (status === 'bajo') return <span className="text-xs font-bold text-yellow-800 bg-yellow-100 px-2 py-1 rounded-full">Bajo</span>;
  if (status === 'alto') return <span className="text-xs font-bold text-red-800 bg-red-100 px-2 py-1 rounded-full">ALTO</span>;
  return null;
};

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

const LandingPage: React.FC = () => {
  useSEO({
    title: 'TREFA Auto Inventory - Autos Seminuevos Certificados',
    description: 'Encuentra el auto perfecto en nuestra selección de vehículos seminuevos 2019 en adelante con Kit de Seguridad incluido: Garantía Blindada, Certificado de Procedencia y más.',
    keywords: 'autos seminuevos, vehículos certificados, garantía blindada, financiamiento automotriz, autos trefa'
  });

  const [openFaq, setOpenFaq] = React.useState<number | null>(null);

  return (
    <div className="min-h-screen bg-white text-gray-800">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 md:py-32 bg-gradient-to-br from-gray-50 to-white">
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-10">
          <div className="absolute -right-20 top-1/2 transform -translate-y-1/2">
            <div className="w-96 h-96 rounded-full bg-primary-500 blur-3xl"></div>
          </div>
          <div className="absolute -left-20 top-1/2 transform -translate-y-1/2">
            <div className="w-96 h-96 rounded-full bg-orange-500 blur-3xl"></div>
          </div>
        </div>

        <div className="container mx-auto px-4 lg:px-6 relative z-10">
          <div className="flex flex-col items-center text-center space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-100 to-orange-100 border border-primary-300 rounded-full text-sm font-medium text-gray-800"
            >
              <ShieldCheck className="w-4 h-4 text-primary-600" />
              Autos Seminuevos Certificados con Kit de Seguridad
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl md:text-6xl font-extrabold tracking-tight max-w-4xl"
            >
              Tu Próximo Auto Seminuevo{' '}
              <span className="bg-gradient-to-r from-yellow-400 via-primary-500 to-orange-600 bg-clip-text text-transparent">
                Te Está Esperando
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-xl text-gray-600 max-w-2xl leading-relaxed"
            >
              Encuentra el auto perfecto en nuestra selección de vehículos seminuevos 2019 en adelante. SUVs, Sedanes, Hatchbacks y Pick Ups con garantía blindada y financiamiento disponible.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4 pt-4"
            >
              <Link
                to="/autos"
                className="inline-flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-bold py-4 px-8 rounded-lg text-lg shadow-lg transition-all transform hover:scale-105"
              >
                Ver Inventario
                <Car className="w-5 h-5" />
              </Link>
              <a
                href="#kit-seguridad"
                className="inline-flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-gray-800 font-bold py-4 px-8 rounded-lg text-lg shadow-lg border-2 border-gray-200 transition-all"
              >
                Conoce el Kit de Seguridad
                <ArrowRight className="w-5 h-5" />
              </a>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="pt-10"
            >
              <p className="text-sm text-gray-600 mb-4">Más de 500 autos vendidos y clientes satisfechos</p>
              <div className="flex flex-wrap items-center justify-center gap-8 opacity-70">
                <img src="/images/Honda.png" alt="Honda" className="h-8 grayscale hover:grayscale-0 transition-all" />
                <img src="/images/Toyota.png" alt="Toyota" className="h-8 grayscale hover:grayscale-0 transition-all" />
                <img src="/images/Nissan.png" alt="Nissan" className="h-8 grayscale hover:grayscale-0 transition-all" />
                <img src="/images/Mazda.png" alt="Mazda" className="h-8 grayscale hover:grayscale-0 transition-all" />
                <img src="/images/Hyundai.png" alt="Hyundai" className="h-8 grayscale hover:grayscale-0 transition-all" />
                <img src="/images/Kia.png" alt="Kia" className="h-8 grayscale hover:grayscale-0 transition-all" />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Video Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 lg:px-6">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-3xl md:text-4xl font-bold">Conoce Autos TREFA</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Descubre por qué somos la mejor opción para tu próximo auto seminuevo
            </p>
          </div>
          <div className="max-w-4xl mx-auto">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-100 to-orange-100 shadow-xl">
              <div className="aspect-video bg-gray-800/50 flex flex-col items-center justify-center text-white p-8">
                <PlayCircle className="w-20 h-20 text-white mb-4" />
                <p className="text-lg font-semibold mb-2">Video Presentación</p>
                <p className="text-gray-200 text-center">
                  Conoce nuestras instalaciones, proceso de inspección de 150 puntos y testimonios de clientes
                </p>
                <p className="text-sm text-gray-300 mt-4">(Video próximamente disponible)</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Inventory Categories */}
      <section id="inventario" className="py-20 md:py-32 bg-white">
        <div className="container mx-auto px-4 lg:px-6">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl md:text-4xl font-bold">Nuestro Inventario</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Vehículos seminuevos 2019 en adelante, inspeccionados y con garantía blindada
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* SUVs */}
            <Link to="/autos?carroceria=SUV" className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all transform hover:scale-105">
              <div className="aspect-[4/3] bg-gradient-to-br from-primary-50 to-orange-50">
                <img
                  src="/images/suv-filter.png"
                  alt="SUVs Premium"
                  className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
              <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                <h3 className="text-2xl font-bold mb-2">SUVs Premium</h3>
                <p className="text-gray-200 mb-3">Espacios amplios y máxima seguridad para toda la familia</p>
                <span className="inline-block bg-white text-primary-600 font-bold py-2 px-4 rounded-lg">Ver SUVs</span>
              </div>
            </Link>

            {/* Sedanes */}
            <Link to="/autos?carroceria=Sedan" className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all transform hover:scale-105">
              <div className="aspect-[4/3] bg-gradient-to-br from-primary-50 to-orange-50">
                <img
                  src="/images/sedan-filter.png"
                  alt="Sedanes Ejecutivos"
                  className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
              <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                <h3 className="text-2xl font-bold mb-2">Sedanes Ejecutivos</h3>
                <p className="text-gray-200 mb-3">Elegancia y confort en cada viaje</p>
                <span className="inline-block bg-white text-primary-600 font-bold py-2 px-4 rounded-lg">Ver Sedanes</span>
              </div>
            </Link>

            {/* Hatchbacks */}
            <Link to="/autos?carroceria=Hatchback" className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all transform hover:scale-105">
              <div className="aspect-[4/3] bg-gradient-to-br from-primary-50 to-orange-50">
                <img
                  src="/images/hatchback-filter.png"
                  alt="Hatchbacks Urbanos"
                  className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
              <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                <h3 className="text-2xl font-bold mb-2">Hatchbacks Urbanos</h3>
                <p className="text-gray-200 mb-3">Perfectos para la ciudad con excelente rendimiento</p>
                <span className="inline-block bg-white text-primary-600 font-bold py-2 px-4 rounded-lg">Ver Hatchbacks</span>
              </div>
            </Link>

            {/* Pick Ups */}
            <Link to="/autos?carroceria=Pick Up" className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all transform hover:scale-105">
              <div className="aspect-[4/3] bg-gradient-to-br from-primary-50 to-orange-50">
                <img
                  src="/images/pickup-filter.png"
                  alt="Pick Ups de Trabajo"
                  className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
              <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                <h3 className="text-2xl font-bold mb-2">Pick Ups de Trabajo</h3>
                <p className="text-gray-200 mb-3">Resistencia y capacidad para proyectos exigentes</p>
                <span className="inline-block bg-white text-primary-600 font-bold py-2 px-4 rounded-lg">Ver Pick Ups</span>
              </div>
            </Link>

            {/* Garantía Card */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-8 border-2 border-green-200 flex flex-col justify-center">
              <ShieldCheck className="w-12 h-12 text-green-600 mb-4" />
              <h3 className="text-2xl font-bold mb-2 text-gray-800">Garantía Blindada</h3>
              <p className="text-gray-700">Todos nuestros vehículos incluyen Kit de Seguridad TREFA con garantía de motor y transmisión de hasta $100,000</p>
            </div>

            {/* Financiamiento Card */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-8 border-2 border-blue-200 flex flex-col justify-center">
              <Calculator className="w-12 h-12 text-blue-600 mb-4" />
              <h3 className="text-2xl font-bold mb-2 text-gray-800">Financiamiento desde 8.9%</h3>
              <p className="text-gray-700">Trabajamos con múltiples instituciones financieras. Precalificación en menos de 24 horas</p>
            </div>
          </div>
        </div>
      </section>

      {/* Kit de Seguridad Section */}
      <section id="kit-seguridad" className="py-20 md:py-32 bg-gray-50">
        <div className="container mx-auto px-4 lg:px-6">
          <div className="text-center space-y-4 mb-12">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-4xl md:text-5xl font-extrabold"
            >
              El Kit de{' '}
              <span className="bg-gradient-to-r from-yellow-400 via-primary-500 to-orange-600 bg-clip-text text-transparent">
                Seguridad
              </span>
              {' '}TREFA
            </motion.h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Incluido en <strong className="text-gray-900">CADA</strong> auto que vendemos, sin costo adicional. No es una promoción, es nuestra promesa estándar.
            </p>
          </div>

          {/* Comparison Table */}
          <div className="mb-16">
            <h3 className="text-3xl font-bold text-center mb-8">La Diferencia TREFA es Abismal</h3>
            <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-xl bg-white">
              <table className="w-full text-sm sm:text-base">
                <thead>
                  <tr className="bg-gray-800 text-white">
                    <th className="p-4 text-lg font-semibold text-left">Beneficio / Riesgo</th>
                    <th className="p-4 text-lg font-semibold text-center">TREFA</th>
                    <th className="p-4 text-lg font-semibold text-center">Otra Agencia</th>
                    <th className="p-4 text-lg font-semibold text-center">Vendedor Particular</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {comparisonData.map((item) => (
                    <tr key={item.feature} className="hover:bg-gray-50">
                      <td className="p-4 font-medium text-gray-800">{item.feature}</td>
                      <td className="p-4 text-center"><Checkmark status={item.trefa} /></td>
                      <td className="p-4 text-center"><Checkmark status={item.agencia} /></td>
                      <td className="p-4 text-center"><Checkmark status={item.particular} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Benefits Grid */}
          <div className="mb-16">
            <h3 className="text-3xl font-bold text-center mb-12">Cada Beneficio, Explicado</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {benefitsData.map((benefit, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 hover:border-primary-300 transition-all"
                >
                  <div className="w-12 h-12 bg-primary-100 text-primary-600 rounded-lg flex items-center justify-center mb-4">
                    <benefit.icon className="w-7 h-7" />
                  </div>
                  <h4 className="text-xl font-bold text-gray-900 mb-3">{benefit.title}</h4>
                  <p className="text-gray-700 leading-relaxed mb-4">{benefit.description}</p>
                  <p className="text-sm font-semibold text-gray-600">
                    Valor: <span className="text-primary-600">{benefit.value}</span>
                  </p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Value Summary */}
          <div className="bg-gradient-to-br from-primary-50 to-orange-50 border-2 border-primary-200 rounded-2xl p-8 text-center">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">Valor Total del Kit de Seguridad</h3>
            <p className="text-5xl font-extrabold text-primary-600 mb-4">$123,500 MXN</p>
            <p className="text-xl text-gray-700 mb-6">
              Un paquete de beneficios tangibles incluido sin costo en cada auto TREFA
            </p>
            <Link
              to="/kit-trefa"
              className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 px-6 rounded-lg transition-all"
            >
              Ver Detalles Completos del Kit
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 md:py-32 bg-white">
        <div className="container mx-auto px-4 lg:px-6">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl md:text-4xl font-bold">Lo Que Dicen Nuestros Clientes</h2>
            <p className="text-xl text-gray-600">Más de 500 familias han encontrado su auto ideal con nosotros</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                name: 'María González',
                vehicle: 'Honda CR-V 2021',
                text: 'Excelente servicio desde el primer contacto. Mi Honda CR-V 2021 llegó en perfectas condiciones y el financiamiento fue muy accesible. Totalmente recomendado.'
              },
              {
                name: 'Carlos Ramírez',
                vehicle: 'Nissan Frontier 2020',
                text: 'El proceso de intercambio fue muy transparente. Recibí un precio justo por mi auto anterior y encontré la pick-up perfecta para mi negocio.'
              },
              {
                name: 'Ana López',
                vehicle: 'Mazda CX-5 2022',
                text: 'Como madre soltera, necesitaba un auto confiable y económico. El equipo de TREFA me ayudó a encontrar el financiamiento perfecto.'
              },
              {
                name: 'Jorge Martínez',
                vehicle: 'Hyundai Tucson 2023',
                text: 'Compré mi Hyundai Tucson 2023 y quedé impresionado con la calidad del vehículo. Se nota que hacen una inspección muy detallada.'
              },
              {
                name: 'Lucía Fernández',
                vehicle: 'Toyota Corolla 2021',
                text: 'El servicio post-venta es excelente. Cuando tuve una pequeña duda sobre mi Toyota Corolla, me atendieron inmediatamente y resolvieron todo sin costo.'
              },
              {
                name: 'Roberto Sánchez',
                vehicle: 'Kia Sportage 2022',
                text: 'La garantía blindada me dio mucha tranquilidad. Es increíble todo lo que incluye el Kit de Seguridad TREFA sin costo adicional.'
              }
            ].map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-gradient-to-br from-gray-50 to-white p-6 rounded-xl shadow-lg border border-gray-100"
              >
                <div className="flex items-center gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-700 mb-6 leading-relaxed">"{testimonial.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-bold text-lg">
                    {testimonial.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{testimonial.name}</div>
                    <div className="text-sm text-gray-600">{testimonial.vehicle}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 md:py-32 bg-gray-50">
        <div className="container mx-auto px-4 lg:px-6">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl md:text-4xl font-bold">Preguntas Frecuentes</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Todo lo que necesitas saber sobre comprar tu auto seminuevo en TREFA
            </p>
          </div>

          <div className="max-w-3xl mx-auto space-y-4">
            {faqData.map((faq, index) => (
              <div key={index} className="border border-gray-200 rounded-lg bg-white overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full px-6 py-4 text-left font-semibold text-gray-900 hover:bg-gray-50 transition-colors flex items-center justify-between"
                >
                  <span>{faq.question}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-gray-600 transition-transform ${
                      openFaq === index ? 'transform rotate-180' : ''
                    }`}
                  />
                </button>
                {openFaq === index && (
                  <div className="px-6 pb-4 text-gray-700 leading-relaxed">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 md:py-32 bg-gradient-to-br from-primary-600 to-orange-600 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="container mx-auto px-4 lg:px-6 relative z-10">
          <div className="text-center space-y-8 max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-extrabold">
              ¿Listo Para Encontrar Tu Auto Ideal?
            </h2>
            <p className="text-xl opacity-95 leading-relaxed">
              Visita nuestro inventario o agenda una cita para conocer nuestros autos seminuevos certificados con Kit de Seguridad incluido. Te ayudamos a encontrar el vehículo perfecto para ti y tu familia.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link
                to="/autos"
                className="inline-flex items-center justify-center gap-2 bg-white hover:bg-gray-100 text-primary-600 font-bold py-4 px-8 rounded-lg text-lg shadow-xl transition-all transform hover:scale-105"
              >
                Ver Inventario Completo
                <Car className="w-5 h-5" />
              </Link>
              <Link
                to="/contacto"
                className="inline-flex items-center justify-center gap-2 bg-transparent hover:bg-white/10 text-white font-bold py-4 px-8 rounded-lg text-lg border-2 border-white transition-all"
              >
                Agendar Cita
                <Calendar className="w-5 h-5" />
              </Link>
            </div>
            <p className="text-sm opacity-90 pt-4">
              Financiamiento desde 8.9% • Garantía Blindada Incluida • Intercambios Aceptados
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
