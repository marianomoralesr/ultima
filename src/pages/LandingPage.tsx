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
    title: 'Compromiso de Calidad TREFA',
    description: 'Nuestro compromiso con la calidad es total. Si tu auto presenta una falla mecánica en los primeros 30 días o 500 km, te devolvemos el 100% de tu dinero o lo reparamos sin costo.',
    value: 'Tranquilidad Absoluta'
  },
  {
    icon: FileText,
    title: 'Certificado de Procedencia Segura',
    description: 'Garantizamos el pasado de tu auto. Validación en REPUVE, SAT, Totalcheck y TransUnion, inspección física forense, auditoría documental.',
    value: '$3,500 MXN'
  },
  {
    icon: ShieldCheck,
    title: 'Garantía Blindada de $100,000',
    description: 'Protección contra las reparaciones más catastróficas. Motor y transmisión cubiertos con hasta $100,000 pesos durante un año completo.',
    value: '$100,000 MXN'
  },
  {
    icon: TrendingUp,
    title: 'Programa de Recompra Garantizada',
    description: 'Te garantizamos por escrito la recompra de tu auto por el 80% de su valor el primer año y el 70% el segundo.',
    value: 'Protección Invaluable'
  },
  {
    icon: Wrench,
    title: 'Check-up de Confianza TREFA',
    description: 'A los 6 meses o 10,000 km, inspección multipunto gratuita: frenos, suspensión, niveles, neumáticos y componentes de seguridad.',
    value: '$4,000 MXN'
  },
  {
    icon: Car,
    title: 'Bono de Movilidad Garantizada',
    description: 'Si tu auto ingresa a nuestro taller por garantía, te damos $250 pesos diarios para tus traslados.',
    value: '$7,500 MXN'
  },
  {
    icon: DollarSign,
    title: 'Bono de Tranquilidad Financiera',
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
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 md:py-32">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -right-32 top-1/2 transform -translate-y-1/2 opacity-20 scale-150">
            <img
              src="https://wqnmyfkavrotpmupbtou.supabase.co/storage/v1/object/public/generation-assets/placeholder/square.png"
              alt="Modern SUV"
              className="w-96 h-64 object-contain"
            />
          </div>
          <div className="absolute -left-32 top-1/2 transform -translate-y-1/2 opacity-20 scale-150">
            <img
              src="https://wqnmyfkavrotpmupbtou.supabase.co/storage/v1/object/public/generation-assets/placeholder/square.png"
              alt="Modern SUV"
              className="w-96 h-64 object-contain scale-x-[-1]"
            />
          </div>
        </div>
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 bg-gradient-to-t to-transparent blur-3xl rounded-t-full from-primary/20 translate-y-1/2 w-[80%] h-96" />

        <div className="container mx-auto px-4 lg:px-6 relative z-10">
          <div className="flex flex-col items-center text-center space-y-8">
            <span className="px-4 py-1 bg-gradient-to-r from-primary/10 to-secondary/5 border border-primary/30 hover:from-primary/20 hover:to-secondary/10 hover:border-primary/40 transition-all duration-300 shadow-sm hover:shadow-md rounded-full inline-flex items-center gap-2">
              <ShieldCheck className="w-3 h-3 text-primary" />
              <span className="text-sm font-medium">Autos Seminuevos Certificados</span>
            </span>

            <motion.h1 className="font-heading text-4xl md:text-6xl font-bold tracking-tight max-w-4xl">
              Tu Próximo Auto Seminuevo Te Está Esperando
            </motion.h1>

            <p className="text-xl text-muted-foreground max-w-2xl leading-relaxed">
              Encuentra el auto perfecto en nuestra selección de vehículos seminuevos 2019 en
              adelante. SUVs, Sedanes, Hatchbacks y Pick Ups con garantía y financiamiento
              disponible.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link to="/autos" className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-3 rounded-lg font-semibold shadow-lg transition-all">
                Ver Inventario
                <Car className="w-4 h-4" />
              </Link>
              <a href="#kit-seguridad" className="inline-flex items-center justify-center gap-2 bg-background border-2 border-input hover:bg-accent hover:text-accent-foreground px-8 py-3 rounded-lg font-semibold transition-all">
                Conoce el Kit de Seguridad
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>

            <div className="flex flex-col items-center space-y-4 mt-10">
              <p className="text-sm text-muted-foreground">
                Más de 500 autos vendidos y clientes satisfechos
              </p>
              <div className="flex items-center space-x-8 opacity-60 flex-wrap justify-center gap-y-4 gap-x-[10px] mt-4">
                <div className="flex items-center space-x-2">
                  <img src="/images/Honda.png" alt="Honda" className="h-8 w-auto opacity-70" />
                  <span className="text-lg font-semibold">Honda</span>
                </div>
                <div className="flex items-center space-x-2">
                  <img src="/images/Toyota.png" alt="Toyota" className="h-8 w-auto opacity-70" />
                  <span className="text-lg font-semibold">Toyota</span>
                </div>
                <div className="flex items-center space-x-2">
                  <img src="/images/Nissan.png" alt="Nissan" className="h-8 w-auto opacity-70" />
                  <span className="text-lg font-semibold">Nissan</span>
                </div>
                <div className="flex items-center space-x-2">
                  <img src="/images/Mazda.png" alt="Mazda" className="h-8 w-auto opacity-70" />
                  <span className="text-lg font-semibold">Mazda</span>
                </div>
                <div className="flex items-center space-x-2">
                  <img src="/images/Hyundai.png" alt="Hyundai" className="h-8 w-auto opacity-70" />
                  <span className="text-lg font-semibold">Hyundai</span>
                </div>
              </div>
            </div>
          </div>
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
                  <button className="mt-4 bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-2 rounded-lg font-semibold">
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
            <h2 className="font-heading text-3xl md:text-4xl font-bold">Nuestro Inventario</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Vehículos seminuevos 2019 en adelante, inspeccionados y con garantía
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {/* SUVs Premium */}
            <Link to="/autos?carroceria=SUV" className="shadow-lg bg-gradient-to-br from-primary/5 to-secondary/5 md:col-span-2 lg:col-span-3 md:row-span-2 rounded-xl overflow-hidden hover:shadow-2xl transition-shadow">
              <img
                src="https://wqnmyfkavrotpmupbtou.supabase.co/storage/v1/object/public/generation-assets/photos/commercial-listings/landscape/4.webp"
                alt="SUVs Premium"
                className="w-full h-96 object-cover"
              />
              <div className="p-6">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                  <Car className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-heading font-semibold text-xl mb-3">SUVs Premium</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Amplia selección de SUVs seminuevos con tecnología avanzada, espacios amplios y
                  máxima seguridad para toda la familia. Modelos 2019-2024 disponibles.
                </p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-lg font-bold text-primary">Desde $350,000</span>
                  <button className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-lg text-sm font-semibold">
                    Ver Modelos
                  </button>
                </div>
              </div>
            </Link>

            {/* Sedanes */}
            <div className="shadow-lg bg-gradient-to-br from-primary/5 to-secondary/5 md:col-span-2 lg:col-span-3 rounded-xl overflow-hidden">
              <img
                src="https://wqnmyfkavrotpmupbtou.supabase.co/storage/v1/object/public/generation-assets/photos/commercial-listings/landscape/2.webp"
                alt="Sedanes Ejecutivos"
                className="w-full h-32 object-cover"
              />
              <div className="p-6">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Star className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-heading font-semibold text-xl mb-2">Sedanes Ejecutivos</h3>
                <p className="text-muted-foreground">
                  Elegancia y confort en cada viaje con nuestros sedanes premium.
                </p>
              </div>
            </div>

            {/* Hatchbacks */}
            <div className="shadow-lg bg-gradient-to-br from-primary/5 to-secondary/5 md:col-span-2 lg:col-span-3 rounded-xl overflow-hidden">
              <img
                src="https://wqnmyfkavrotpmupbtou.supabase.co/storage/v1/object/public/generation-assets/photos/commercial-listings/landscape/5.webp"
                alt="Hatchbacks Urbanos"
                className="w-full h-32 object-cover"
              />
              <div className="p-6">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Car className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-heading font-semibold text-lg mb-2">Hatchbacks Urbanos</h3>
                <p className="text-muted-foreground text-sm">
                  Perfectos para la ciudad con excelente rendimiento de combustible y fácil
                  estacionamiento.
                </p>
              </div>
            </div>

            {/* Pick Ups */}
            <div className="shadow-lg bg-gradient-to-br from-primary/5 to-secondary/5 md:col-span-2 lg:col-span-2 rounded-xl p-6">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Car className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-heading font-semibold text-xl mb-2">Pick Ups de Trabajo</h3>
              <p className="text-muted-foreground">
                Resistencia y capacidad para tus proyectos más exigentes.
              </p>
            </div>

            {/* Garantía */}
            <div className="shadow-lg bg-gradient-to-br from-primary/5 to-secondary/5 md:col-span-2 rounded-xl p-6">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <ShieldCheck className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-heading font-semibold text-xl mb-2">Garantía Extendida</h3>
              <p className="text-muted-foreground">
                Todos nuestros vehículos incluyen garantía de 6 meses o 10,000 km.
              </p>
            </div>

            {/* Historial */}
            <div className="shadow-lg bg-gradient-to-br from-primary/5 to-secondary/5 md:col-span-2 rounded-xl p-6">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-heading font-semibold text-xl mb-2">Historial Verificado</h3>
              <p className="text-muted-foreground">
                Cada auto cuenta con historial vehicular completo y verificado.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Kit de Seguridad Section */}
      <section id="kit-seguridad" className="py-20 md:py-32">
        <div className="container mx-auto px-4 lg:px-6">
          <div className="text-center space-y-4 mb-16">
            <h2 className="font-heading text-3xl md:text-4xl font-bold">
              El Kit de Seguridad TREFA
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Incluido en cada auto sin costo adicional. Protección y tranquilidad garantizadas.
            </p>
          </div>

          {/* Comparison Table */}
          <div className="mb-16 overflow-x-auto">
            <div className="bg-card shadow-xl rounded-xl border overflow-hidden">
              <table className="w-full text-sm sm:text-base">
                <thead>
                  <tr className="bg-muted">
                    <th className="p-4 text-lg font-semibold text-left">Beneficio / Riesgo</th>
                    <th className="p-4 text-lg font-semibold text-center">TREFA</th>
                    <th className="p-4 text-lg font-semibold text-center">Otra Agencia</th>
                    <th className="p-4 text-lg font-semibold text-center">Vendedor Particular</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {comparisonData.map((item) => (
                    <tr key={item.feature} className="hover:bg-muted/50">
                      <td className="p-4 font-medium">{item.feature}</td>
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
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {benefitsData.map((benefit, index) => (
              <div key={index} className="bg-gradient-to-br from-primary/5 to-secondary/5 shadow-lg rounded-xl p-6 border">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <benefit.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="font-heading font-semibold text-xl mb-3">{benefit.title}</h3>
                <p className="text-muted-foreground leading-relaxed mb-4">{benefit.description}</p>
                <p className="text-sm font-semibold">
                  Valor: <span className="text-primary">{benefit.value}</span>
                </p>
              </div>
            ))}
          </div>

          {/* Value Summary */}
          <div className="bg-gradient-to-br from-primary/5 to-secondary/5 border shadow-lg rounded-xl p-8 text-center">
            <h3 className="font-heading text-2xl font-bold text-primary mb-4">
              Valor Total: $123,500 MXN
            </h3>
            <p className="text-lg text-muted-foreground mb-6">
              Un paquete de beneficios tangibles incluido sin costo en cada auto TREFA
            </p>
            <Link to="/kit-trefa" className="inline-flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-3 rounded-lg font-semibold">
              Ver Detalles Completos
              <ArrowRight className="w-5 h-5" />
            </Link>
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
