import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import QRCode from 'qrcode';
import { supabase } from '../../supabaseClient';
import { toast } from 'sonner';

// Comprehensive survey questions following scientific methodology
// Using Likert scales, NPS, behavioral analysis, and psychographic segmentation
const surveyQuestions = [
  // SECCIÓN 1: Percepción de Marca (5 preguntas)
  {
    id: 1,
    section: "Percepción de Marca",
    question: "¿Cómo describiría su percepción general sobre nuestra marca?",
    type: "likert-5",
    options: [
      { value: "1", label: "Muy negativa" },
      { value: "2", label: "Negativa" },
      { value: "3", label: "Neutral" },
      { value: "4", label: "Positiva" },
      { value: "5", label: "Muy positiva" }
    ]
  },
  {
    id: 2,
    section: "Percepción de Marca",
    question: "¿Qué probabilidad hay de que recomiende nuestra marca a un amigo o colega? (NPS)",
    type: "nps",
    options: Array.from({ length: 11 }, (_, i) => ({ value: String(i), label: String(i) }))
  },
  {
    id: 3,
    section: "Percepción de Marca",
    question: "¿Cuál de las siguientes palabras describe mejor a nuestra marca?",
    type: "multiple-choice",
    options: [
      { value: "confiable", label: "Confiable" },
      { value: "innovadora", label: "Innovadora" },
      { value: "accesible", label: "Accesible" },
      { value: "premium", label: "Premium" },
      { value: "tradicional", label: "Tradicional" },
      { value: "moderna", label: "Moderna" }
    ]
  },
  {
    id: 4,
    section: "Percepción de Marca",
    question: "¿Considera que nuestra marca se diferencia de la competencia?",
    type: "likert-5",
    options: [
      { value: "1", label: "Para nada" },
      { value: "2", label: "Poco" },
      { value: "3", label: "Moderadamente" },
      { value: "4", label: "Bastante" },
      { value: "5", label: "Totalmente" }
    ]
  },
  {
    id: 5,
    section: "Percepción de Marca",
    question: "¿Cuánta confianza le genera nuestra marca comparada con otras opciones?",
    type: "likert-5",
    options: [
      { value: "1", label: "Mucho menos" },
      { value: "2", label: "Menos" },
      { value: "3", label: "Similar" },
      { value: "4", label: "Más" },
      { value: "5", label: "Mucho más" }
    ]
  },

  // SECCIÓN 2: Experiencia con la Plataforma (5 preguntas)
  {
    id: 6,
    section: "Experiencia con la Plataforma",
    question: "¿Qué tan fácil le resultó navegar por nuestra plataforma?",
    type: "likert-5",
    options: [
      { value: "1", label: "Muy difícil" },
      { value: "2", label: "Difícil" },
      { value: "3", label: "Neutral" },
      { value: "4", label: "Fácil" },
      { value: "5", label: "Muy fácil" }
    ]
  },
  {
    id: 7,
    section: "Experiencia con la Plataforma",
    question: "¿Encontró la información que buscaba en nuestra plataforma?",
    type: "likert-5",
    options: [
      { value: "1", label: "Nunca" },
      { value: "2", label: "Raramente" },
      { value: "3", label: "A veces" },
      { value: "4", label: "Frecuentemente" },
      { value: "5", label: "Siempre" }
    ]
  },
  {
    id: 8,
    section: "Experiencia con la Plataforma",
    question: "¿Qué tan satisfecho está con la velocidad de carga de nuestra plataforma?",
    type: "csat",
    options: [
      { value: "1", label: "Muy insatisfecho" },
      { value: "2", label: "Insatisfecho" },
      { value: "3", label: "Neutral" },
      { value: "4", label: "Satisfecho" },
      { value: "5", label: "Muy satisfecho" }
    ]
  },
  {
    id: 9,
    section: "Experiencia con la Plataforma",
    question: "¿Cuál es su dispositivo preferido para acceder a nuestra plataforma?",
    type: "multiple-choice",
    options: [
      { value: "smartphone", label: "Smartphone" },
      { value: "tablet", label: "Tablet" },
      { value: "laptop", label: "Laptop" },
      { value: "desktop", label: "Computadora de escritorio" },
      { value: "no-aplica", label: "No he usado la plataforma" }
    ]
  },
  {
    id: 10,
    section: "Experiencia con la Plataforma",
    question: "¿Ha experimentado algún problema técnico en nuestra plataforma?",
    type: "multiple-choice",
    options: [
      { value: "nunca", label: "Nunca" },
      { value: "raras-veces", label: "Raras veces" },
      { value: "ocasionalmente", label: "Ocasionalmente" },
      { value: "frecuentemente", label: "Frecuentemente" },
      { value: "muy-frecuentemente", label: "Muy frecuentemente" }
    ]
  },

  // SECCIÓN 3: Preferencias y Motivaciones (5 preguntas)
  {
    id: 11,
    section: "Preferencias y Motivaciones",
    question: "¿Qué factor es más importante para usted al elegir un vehículo?",
    type: "multiple-choice",
    options: [
      { value: "precio", label: "Precio competitivo" },
      { value: "calidad", label: "Calidad y durabilidad" },
      { value: "financiamiento", label: "Opciones de financiamiento" },
      { value: "marca", label: "Marca reconocida" },
      { value: "tecnologia", label: "Tecnología y características" },
      { value: "eficiencia", label: "Eficiencia de combustible" }
    ]
  },
  {
    id: 12,
    section: "Preferencias y Motivaciones",
    question: "¿Qué lo motiva principalmente a comprar un vehículo?",
    type: "multiple-choice",
    options: [
      { value: "necesidad", label: "Necesidad (reemplazo, primer auto)" },
      { value: "upgrade", label: "Mejorar mi vehículo actual" },
      { value: "status", label: "Estatus o imagen personal" },
      { value: "inversion", label: "Inversión patrimonial" },
      { value: "familia", label: "Necesidades familiares" },
      { value: "trabajo", label: "Necesidades laborales" }
    ]
  },
  {
    id: 13,
    section: "Preferencias y Motivaciones",
    question: "¿Qué tan importante es para usted el servicio postventa?",
    type: "likert-5",
    options: [
      { value: "1", label: "Nada importante" },
      { value: "2", label: "Poco importante" },
      { value: "3", label: "Moderadamente importante" },
      { value: "4", label: "Muy importante" },
      { value: "5", label: "Extremadamente importante" }
    ]
  },
  {
    id: 14,
    section: "Preferencias y Motivaciones",
    question: "¿Prefiere explorar opciones en línea antes de visitar un concesionario?",
    type: "likert-5",
    options: [
      { value: "1", label: "Totalmente en desacuerdo" },
      { value: "2", label: "En desacuerdo" },
      { value: "3", label: "Neutral" },
      { value: "4", label: "De acuerdo" },
      { value: "5", label: "Totalmente de acuerdo" }
    ]
  },
  {
    id: 15,
    section: "Preferencias y Motivaciones",
    question: "¿Qué tipo de contenido le ayuda más en su decisión de compra?",
    type: "multiple-choice",
    options: [
      { value: "videos", label: "Videos demostrativos" },
      { value: "reviews", label: "Reseñas de clientes" },
      { value: "comparativas", label: "Comparativas de modelos" },
      { value: "specs", label: "Especificaciones técnicas" },
      { value: "fotos", label: "Galería de fotos" },
      { value: "testimonios", label: "Testimonios de propietarios" }
    ]
  },

  // SECCIÓN 4: Temores y Barreras (5 preguntas)
  {
    id: 16,
    section: "Temores y Barreras",
    question: "¿Cuál es su principal preocupación al comprar un vehículo?",
    type: "multiple-choice",
    options: [
      { value: "precio-justo", label: "No obtener un precio justo" },
      { value: "calidad", label: "Problemas de calidad o mecánicos" },
      { value: "estafa", label: "Ser víctima de fraude" },
      { value: "financiamiento", label: "No calificar para financiamiento" },
      { value: "decision-equivocada", label: "Tomar la decisión equivocada" },
      { value: "servicio", label: "Mal servicio al cliente" }
    ]
  },
  {
    id: 17,
    section: "Temores y Barreras",
    question: "¿Qué tan cómodo se siente realizando una compra importante en línea?",
    type: "likert-5",
    options: [
      { value: "1", label: "Muy incómodo" },
      { value: "2", label: "Incómodo" },
      { value: "3", label: "Neutral" },
      { value: "4", label: "Cómodo" },
      { value: "5", label: "Muy cómodo" }
    ]
  },
  {
    id: 18,
    section: "Temores y Barreras",
    question: "¿Qué le impediría comprar un vehículo con nosotros?",
    type: "multiple-choice",
    options: [
      { value: "precio", label: "Precio no competitivo" },
      { value: "inventario", label: "Falta del modelo que busco" },
      { value: "financiamiento", label: "Opciones de financiamiento limitadas" },
      { value: "confianza", label: "Falta de confianza en la marca" },
      { value: "ubicacion", label: "Ubicación inconveniente" },
      { value: "proceso", label: "Proceso de compra complicado" }
    ]
  },
  {
    id: 19,
    section: "Temores y Barreras",
    question: "¿Cuánta información necesita antes de sentirse seguro para comprar?",
    type: "multiple-choice",
    options: [
      { value: "minima", label: "Información mínima, decido rápido" },
      { value: "basica", label: "Información básica del vehículo" },
      { value: "moderada", label: "Información moderada y algunas reseñas" },
      { value: "extensa", label: "Investigación extensa" },
      { value: "exhaustiva", label: "Investigación exhaustiva y múltiples opiniones" }
    ]
  },
  {
    id: 20,
    section: "Temores y Barreras",
    question: "¿Qué tan importante es para usted poder inspeccionar físicamente el vehículo?",
    type: "likert-5",
    options: [
      { value: "1", label: "Nada importante" },
      { value: "2", label: "Poco importante" },
      { value: "3", label: "Moderadamente importante" },
      { value: "4", label: "Muy importante" },
      { value: "5", label: "Absolutamente esencial" }
    ]
  },

  // SECCIÓN 5: Comportamiento de Compra (5 preguntas)
  {
    id: 21,
    section: "Comportamiento de Compra",
    question: "¿Cuánto tiempo suele investigar antes de comprar un vehículo?",
    type: "multiple-choice",
    options: [
      { value: "menos-semana", label: "Menos de una semana" },
      { value: "1-2-semanas", label: "1-2 semanas" },
      { value: "3-4-semanas", label: "3-4 semanas" },
      { value: "1-3-meses", label: "1-3 meses" },
      { value: "mas-3-meses", label: "Más de 3 meses" }
    ]
  },
  {
    id: 22,
    section: "Comportamiento de Compra",
    question: "¿Cuántas opciones suele comparar antes de decidirse?",
    type: "multiple-choice",
    options: [
      { value: "1-2", label: "1-2 opciones" },
      { value: "3-5", label: "3-5 opciones" },
      { value: "6-10", label: "6-10 opciones" },
      { value: "mas-10", label: "Más de 10 opciones" }
    ]
  },
  {
    id: 23,
    section: "Comportamiento de Compra",
    question: "¿Prefiere comprar vehículos nuevos o usados?",
    type: "multiple-choice",
    options: [
      { value: "solo-nuevos", label: "Solo nuevos" },
      { value: "preferencia-nuevos", label: "Preferencia por nuevos" },
      { value: "indistinto", label: "Indistinto" },
      { value: "preferencia-seminuevos", label: "Preferencia por seminuevos" },
      { value: "solo-seminuevos", label: "Solo seminuevos" }
    ]
  },
  {
    id: 24,
    section: "Comportamiento de Compra",
    question: "¿Con qué frecuencia cambia de vehículo?",
    type: "multiple-choice",
    options: [
      { value: "1-2-anos", label: "Cada 1-2 años" },
      { value: "3-4-anos", label: "Cada 3-4 años" },
      { value: "5-7-anos", label: "Cada 5-7 años" },
      { value: "8-10-anos", label: "Cada 8-10 años" },
      { value: "mas-10-anos", label: "Más de 10 años" },
      { value: "primera-vez", label: "Es mi primera compra" }
    ]
  },
  {
    id: 25,
    section: "Comportamiento de Compra",
    question: "¿Qué influye más en su decisión final de compra?",
    type: "multiple-choice",
    options: [
      { value: "precio", label: "El mejor precio" },
      { value: "asesor", label: "La confianza con el asesor" },
      { value: "financiamiento", label: "Facilidades de pago" },
      { value: "vehiculo", label: "Características del vehículo" },
      { value: "urgencia", label: "Urgencia de necesidad" },
      { value: "emocion", label: "Conexión emocional con el vehículo" }
    ]
  },

  // SECCIÓN 6: Intención de Compra (5 preguntas)
  {
    id: 26,
    section: "Intención de Compra",
    question: "¿Qué tan probable es que compre un vehículo en los próximos 3 meses?",
    type: "likert-5",
    options: [
      { value: "1", label: "Muy improbable" },
      { value: "2", label: "Improbable" },
      { value: "3", label: "Posible" },
      { value: "4", label: "Probable" },
      { value: "5", label: "Muy probable" }
    ]
  },
  {
    id: 27,
    section: "Intención de Compra",
    question: "¿Qué tan probable es que compre con nuestra marca específicamente?",
    type: "likert-5",
    options: [
      { value: "1", label: "Muy improbable" },
      { value: "2", label: "Improbable" },
      { value: "3", label: "Posible" },
      { value: "4", label: "Probable" },
      { value: "5", label: "Muy probable" }
    ]
  },
  {
    id: 28,
    section: "Intención de Compra",
    question: "¿Cuál es su presupuesto aproximado para la compra de un vehículo?",
    type: "multiple-choice",
    options: [
      { value: "menos-150k", label: "Menos de $150,000" },
      { value: "150k-250k", label: "$150,000 - $250,000" },
      { value: "250k-350k", label: "$250,000 - $350,000" },
      { value: "350k-500k", label: "$350,000 - $500,000" },
      { value: "500k-700k", label: "$500,000 - $700,000" },
      { value: "mas-700k", label: "Más de $700,000" }
    ]
  },
  {
    id: 29,
    section: "Intención de Compra",
    question: "¿Ya tiene un vehículo específico en mente?",
    type: "multiple-choice",
    options: [
      { value: "modelo-especifico", label: "Sí, modelo y año específico" },
      { value: "marca-modelo", label: "Sí, marca y modelo general" },
      { value: "tipo", label: "Solo el tipo de vehículo" },
      { value: "explorando", label: "Estoy explorando opciones" },
      { value: "sin-idea", label: "Aún no tengo idea clara" }
    ]
  },
  {
    id: 30,
    section: "Intención de Compra",
    question: "¿Planea dar un auto a cuenta como parte del pago?",
    type: "multiple-choice",
    options: [
      { value: "si-definitivo", label: "Sí, definitivamente" },
      { value: "si-probable", label: "Probablemente sí" },
      { value: "no-seguro", label: "No estoy seguro" },
      { value: "probable-no", label: "Probablemente no" },
      { value: "no-definitivo", label: "No, definitivamente" }
    ]
  },

  // SECCIÓN 7: Demografía y Psicografía (5 preguntas)
  {
    id: 31,
    section: "Perfil del Consumidor",
    question: "¿Cuál es su rango de edad?",
    type: "multiple-choice",
    options: [
      { value: "18-24", label: "18-24 años" },
      { value: "25-34", label: "25-34 años" },
      { value: "35-44", label: "35-44 años" },
      { value: "45-54", label: "45-54 años" },
      { value: "55-64", label: "55-64 años" },
      { value: "65+", label: "65+ años" }
    ]
  },
  {
    id: 32,
    section: "Perfil del Consumidor",
    question: "¿Cuál es su ocupación principal?",
    type: "multiple-choice",
    options: [
      { value: "empleado", label: "Empleado" },
      { value: "emprendedor", label: "Emprendedor/Negocio propio" },
      { value: "profesional-independiente", label: "Profesional independiente" },
      { value: "ejecutivo", label: "Ejecutivo/Gerente" },
      { value: "estudiante", label: "Estudiante" },
      { value: "retirado", label: "Retirado" },
      { value: "otro", label: "Otro" }
    ]
  },
  {
    id: 33,
    section: "Perfil del Consumidor",
    question: "¿Cuántas personas dependen económicamente de usted?",
    type: "multiple-choice",
    options: [
      { value: "ninguna", label: "Ninguna" },
      { value: "1", label: "1 persona" },
      { value: "2-3", label: "2-3 personas" },
      { value: "4-5", label: "4-5 personas" },
      { value: "mas-5", label: "Más de 5 personas" }
    ]
  },
  {
    id: 34,
    section: "Perfil del Consumidor",
    question: "¿Qué tan importante es para usted la sostenibilidad ambiental en un vehículo?",
    type: "likert-5",
    options: [
      { value: "1", label: "Nada importante" },
      { value: "2", label: "Poco importante" },
      { value: "3", label: "Moderadamente importante" },
      { value: "4", label: "Muy importante" },
      { value: "5", label: "Extremadamente importante" }
    ]
  },
  {
    id: 35,
    section: "Perfil del Consumidor",
    question: "¿Cómo se considera a sí mismo en términos de adopción de tecnología?",
    type: "multiple-choice",
    options: [
      { value: "early-adopter", label: "Adoptador temprano (me gusta probar lo nuevo)" },
      { value: "mayoria-temprana", label: "Mayoría temprana (adopto después de validación)" },
      { value: "mayoria-tardia", label: "Mayoría tardía (espero que sea común)" },
      { value: "rezagado", label: "Rezagado (solo cuando es necesario)" },
      { value: "tradicional", label: "Tradicionalista (prefiero lo probado)" }
    ]
  },

  // SECCIÓN 8: Canales y Comunicación (5 preguntas)
  {
    id: 36,
    section: "Canales de Comunicación",
    question: "¿Cuál es su canal preferido para recibir información sobre ofertas?",
    type: "multiple-choice",
    options: [
      { value: "whatsapp", label: "WhatsApp" },
      { value: "email", label: "Correo electrónico" },
      { value: "sms", label: "SMS" },
      { value: "redes-sociales", label: "Redes sociales" },
      { value: "llamada", label: "Llamada telefónica" },
      { value: "ninguno", label: "Prefiero no recibir información" }
    ]
  },
  {
    id: 37,
    section: "Canales de Comunicación",
    question: "¿Con qué frecuencia le gustaría recibir actualizaciones?",
    type: "multiple-choice",
    options: [
      { value: "diario", label: "Diariamente" },
      { value: "semanal", label: "Semanalmente" },
      { value: "quincenal", label: "Quincenalmente" },
      { value: "mensual", label: "Mensualmente" },
      { value: "solo-importante", label: "Solo información importante" },
      { value: "nunca", label: "Nunca" }
    ]
  },
  {
    id: 38,
    section: "Canales de Comunicación",
    question: "¿Cómo prefiere iniciar el proceso de compra?",
    type: "multiple-choice",
    options: [
      { value: "online-completo", label: "Completamente en línea" },
      { value: "online-presencial", label: "Iniciar online, finalizar presencial" },
      { value: "presencial-completo", label: "Completamente presencial" },
      { value: "hibrido", label: "Híbrido (flexible)" },
      { value: "llamada-seguimiento", label: "Con llamada de seguimiento" }
    ]
  },
  {
    id: 39,
    section: "Canales de Comunicación",
    question: "¿Qué red social usa principalmente para investigar vehículos?",
    type: "multiple-choice",
    options: [
      { value: "facebook", label: "Facebook" },
      { value: "instagram", label: "Instagram" },
      { value: "youtube", label: "YouTube" },
      { value: "tiktok", label: "TikTok" },
      { value: "twitter", label: "X (Twitter)" },
      { value: "linkedin", label: "LinkedIn" },
      { value: "ninguna", label: "No uso redes sociales para esto" }
    ]
  },
  {
    id: 40,
    section: "Canales de Comunicación",
    question: "¿Qué tan importante es para usted poder chatear en tiempo real con un asesor?",
    type: "likert-5",
    options: [
      { value: "1", label: "Nada importante" },
      { value: "2", label: "Poco importante" },
      { value: "3", label: "Moderadamente importante" },
      { value: "4", label: "Muy importante" },
      { value: "5", label: "Extremadamente importante" }
    ]
  },

  // SECCIÓN 9: Servicios Valorados (5 preguntas)
  {
    id: 41,
    section: "Servicios Valorados",
    question: "¿Qué servicio adicional valora más en una agencia automotriz?",
    type: "multiple-choice",
    options: [
      { value: "garantia-extendida", label: "Garantía extendida" },
      { value: "mantenimiento", label: "Mantenimiento incluido" },
      { value: "seguro", label: "Seguro con descuento" },
      { value: "entrega-domicilio", label: "Entrega a domicilio" },
      { value: "prueba-extendida", label: "Período de prueba extendido" },
      { value: "asesoria-personalizada", label: "Asesoría personalizada" }
    ]
  },
  {
    id: 42,
    section: "Servicios Valorados",
    question: "¿Qué tan importante es la transparencia en el precio final (sin costos ocultos)?",
    type: "likert-5",
    options: [
      { value: "1", label: "Poco importante" },
      { value: "2", label: "Algo importante" },
      { value: "3", label: "Importante" },
      { value: "4", label: "Muy importante" },
      { value: "5", label: "Crítico y decisivo" }
    ]
  },
  {
    id: 43,
    section: "Servicios Valorados",
    question: "¿Estaría interesado en un programa de lealtad o recompensas?",
    type: "likert-5",
    options: [
      { value: "1", label: "Nada interesado" },
      { value: "2", label: "Poco interesado" },
      { value: "3", label: "Moderadamente interesado" },
      { value: "4", label: "Muy interesado" },
      { value: "5", label: "Extremadamente interesado" }
    ]
  },
  {
    id: 44,
    section: "Servicios Valorados",
    question: "¿Qué tan valioso sería para usted un asistente virtual 24/7?",
    type: "likert-5",
    options: [
      { value: "1", label: "Nada valioso" },
      { value: "2", label: "Poco valioso" },
      { value: "3", label: "Moderadamente valioso" },
      { value: "4", label: "Muy valioso" },
      { value: "5", label: "Extremadamente valioso" }
    ]
  },
  {
    id: 45,
    section: "Servicios Valorados",
    question: "¿Preferiría una experiencia de compra completamente digital o híbrida?",
    type: "multiple-choice",
    options: [
      { value: "100-digital", label: "100% digital" },
      { value: "mayormente-digital", label: "Mayormente digital" },
      { value: "hibrido-equilibrado", label: "Híbrido equilibrado" },
      { value: "mayormente-presencial", label: "Mayormente presencial" },
      { value: "100-presencial", label: "100% presencial" }
    ]
  },

  // SECCIÓN 10: Insights Adicionales (15 preguntas de alto valor)
  {
    id: 46,
    section: "Insights Adicionales",
    question: "¿Qué tan importante es para usted que el concesionario tenga certificaciones de calidad?",
    type: "likert-5",
    options: [
      { value: "1", label: "Nada importante" },
      { value: "2", label: "Poco importante" },
      { value: "3", label: "Moderadamente importante" },
      { value: "4", label: "Muy importante" },
      { value: "5", label: "Extremadamente importante" }
    ]
  },
  {
    id: 47,
    section: "Insights Adicionales",
    question: "¿Ha considerado opciones de movilidad alternativa (suscripción, leasing)?",
    type: "multiple-choice",
    options: [
      { value: "si-activamente", label: "Sí, lo estoy considerando activamente" },
      { value: "si-explorando", label: "Sí, lo estoy explorando" },
      { value: "interesado", label: "Me interesa, pero no lo he investigado" },
      { value: "no-interesado", label: "No me interesa" },
      { value: "no-conozco", label: "No conozco estas opciones" }
    ]
  },
  {
    id: 48,
    section: "Insights Adicionales",
    question: "¿Qué tan influyente es la opinión de su círculo cercano en su decisión?",
    type: "likert-5",
    options: [
      { value: "1", label: "Nada influyente" },
      { value: "2", label: "Poco influyente" },
      { value: "3", label: "Moderadamente influyente" },
      { value: "4", label: "Muy influyente" },
      { value: "5", label: "Extremadamente influyente" }
    ]
  },
  {
    id: 49,
    section: "Insights Adicionales",
    question: "¿Prefiere vehículos con tecnologías de asistencia al conductor?",
    type: "likert-5",
    options: [
      { value: "1", label: "No me interesan" },
      { value: "2", label: "Me dan igual" },
      { value: "3", label: "Son un plus" },
      { value: "4", label: "Son muy importantes" },
      { value: "5", label: "Son indispensables" }
    ]
  },
  {
    id: 50,
    section: "Insights Adicionales",
    question: "¿Qué tan dispuesto estaría a pagar más por un vehículo eléctrico o híbrido?",
    type: "multiple-choice",
    options: [
      { value: "nada-dispuesto", label: "Nada dispuesto" },
      { value: "5-10-porciento", label: "5-10% más" },
      { value: "10-20-porciento", label: "10-20% más" },
      { value: "20-30-porciento", label: "20-30% más" },
      { value: "mas-30-porciento", label: "Más de 30% más" }
    ]
  },
  {
    id: 51,
    section: "Insights Adicionales",
    question: "¿Considera importante que el concesionario tenga presencia local/regional?",
    type: "likert-5",
    options: [
      { value: "1", label: "Nada importante" },
      { value: "2", label: "Poco importante" },
      { value: "3", label: "Moderadamente importante" },
      { value: "4", label: "Muy importante" },
      { value: "5", label: "Extremadamente importante" }
    ]
  },
  {
    id: 52,
    section: "Insights Adicionales",
    question: "¿Qué tan probable es que compre accesorios o personalización al comprar el vehículo?",
    type: "likert-5",
    options: [
      { value: "1", label: "Muy improbable" },
      { value: "2", label: "Improbable" },
      { value: "3", label: "Posible" },
      { value: "4", label: "Probable" },
      { value: "5", label: "Muy probable" }
    ]
  },
  {
    id: 53,
    section: "Insights Adicionales",
    question: "¿Ha usado o usaría herramientas de realidad aumentada para ver el vehículo?",
    type: "multiple-choice",
    options: [
      { value: "si-he-usado", label: "Sí, ya he usado y me gusta" },
      { value: "no-pero-si", label: "No he usado, pero sí me gustaría" },
      { value: "indeciso", label: "No estoy seguro" },
      { value: "probablemente-no", label: "Probablemente no" },
      { value: "definitivamente-no", label: "Definitivamente no" }
    ]
  },
  {
    id: 54,
    section: "Insights Adicionales",
    question: "¿Qué factor lo haría cambiar de marca/concesionario inmediatamente?",
    type: "multiple-choice",
    options: [
      { value: "mala-atencion", label: "Mala atención al cliente" },
      { value: "falta-transparencia", label: "Falta de transparencia" },
      { value: "presion-venta", label: "Presión de venta agresiva" },
      { value: "mejor-oferta", label: "Mejor oferta en otro lado" },
      { value: "problemas-entrega", label: "Problemas en entrega/documentación" },
      { value: "reputacion", label: "Comentarios negativos/mala reputación" }
    ]
  },
  {
    id: 55,
    section: "Insights Adicionales",
    question: "¿Qué tan importante es para usted el valor de reventa del vehículo?",
    type: "likert-5",
    options: [
      { value: "1", label: "Nada importante" },
      { value: "2", label: "Poco importante" },
      { value: "3", label: "Moderadamente importante" },
      { value: "4", label: "Muy importante" },
      { value: "5", label: "Extremadamente importante" }
    ]
  },
  {
    id: 56,
    section: "Insights Adicionales",
    question: "¿Prefiere concesionarios que ofrezcan múltiples marcas o especializados?",
    type: "multiple-choice",
    options: [
      { value: "multimarca", label: "Múltiples marcas (más opciones)" },
      { value: "especializado", label: "Especializado (expertise en una marca)" },
      { value: "indistinto", label: "Me es indistinto" },
      { value: "depende", label: "Depende del vehículo que busque" }
    ]
  },
  {
    id: 57,
    section: "Insights Adicionales",
    question: "¿Qué tan dispuesto está a compartir su experiencia (testimonio/reseña)?",
    type: "likert-5",
    options: [
      { value: "1", label: "Nada dispuesto" },
      { value: "2", label: "Poco dispuesto" },
      { value: "3", label: "Moderadamente dispuesto" },
      { value: "4", label: "Muy dispuesto" },
      { value: "5", label: "Totalmente dispuesto" }
    ]
  },
  {
    id: 58,
    section: "Insights Adicionales",
    question: "¿Considera que las promociones y descuentos son auténticos en la industria?",
    type: "likert-5",
    options: [
      { value: "1", label: "Nunca son auténticos" },
      { value: "2", label: "Raramente son auténticos" },
      { value: "3", label: "A veces son auténticos" },
      { value: "4", label: "Frecuentemente son auténticos" },
      { value: "5", label: "Siempre son auténticos" }
    ]
  },
  {
    id: 59,
    section: "Insights Adicionales",
    question: "¿Qué tan importante es que el concesionario tenga opciones de trade-in justas?",
    type: "likert-5",
    options: [
      { value: "1", label: "Nada importante (no aplica)" },
      { value: "2", label: "Poco importante" },
      { value: "3", label: "Moderadamente importante" },
      { value: "4", label: "Muy importante" },
      { value: "5", label: "Extremadamente importante" }
    ]
  },
  {
    id: 60,
    section: "Insights Adicionales",
    question: "¿Qué lo motivaría a participar en futuros estudios o encuestas?",
    type: "multiple-choice",
    options: [
      { value: "descuentos", label: "Descuentos o cupones" },
      { value: "sorteos", label: "Participación en sorteos" },
      { value: "mejora-servicio", label: "Contribuir a mejorar el servicio" },
      { value: "reconocimiento", label: "Reconocimiento o beneficios VIP" },
      { value: "curiosidad", label: "Ver resultados del estudio" },
      { value: "nada", label: "No me interesa participar" }
    ]
  }
];

const AnonymousSurveyPage: React.FC = () => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [isCompleted, setIsCompleted] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const qrRef = useRef<HTMLCanvasElement>(null);

  const currentSection = surveyQuestions[currentQuestion]?.section;
  const progress = ((currentQuestion + 1) / surveyQuestions.length) * 100;

  // Generate unique coupon code
  const generateCouponCode = () => {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 7);
    return `ENCUESTA-${timestamp}-${random}`.toUpperCase();
  };

  // Save survey response to database
  const saveSurveyResponse = async (surveyData: any) => {
    try {
      const { data, error } = await supabase
        .from('anonymous_survey_responses')
        .insert([
          {
            responses: surveyData,
            coupon_code: surveyData.coupon_code,
            completed_at: new Date().toISOString()
          }
        ]);

      if (error) {
        console.error('Error saving survey:', error);
        // Continue even if save fails
      }
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const handleAnswer = (value: string) => {
    setAnswers(prev => ({
      ...prev,
      [surveyQuestions[currentQuestion].id]: value
    }));
  };

  const handleNext = () => {
    if (currentQuestion < surveyQuestions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  const handleComplete = async () => {
    setIsSubmitting(true);

    const code = generateCouponCode();
    setCouponCode(code);

    // Save to database
    const surveyData = {
      answers,
      coupon_code: code,
      timestamp: new Date().toISOString()
    };

    await saveSurveyResponse(surveyData);

    // Generate QR Code
    try {
      const qrUrl = await QRCode.toDataURL(code, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      setQrCodeUrl(qrUrl);
    } catch (err) {
      console.error('Error generating QR:', err);
    }

    setIsCompleted(true);
    setIsSubmitting(false);
    toast.success('¡Gracias por completar la encuesta!');
  };

  const currentQuestionData = surveyQuestions[currentQuestion];
  const isAnswered = answers[currentQuestionData?.id] !== undefined;

  if (isCompleted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <Card className="shadow-xl">
            <CardHeader className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <CardTitle className="text-3xl font-bold text-slate-900">
                ¡Gracias por su tiempo!
              </CardTitle>
              <CardDescription className="text-lg">
                Su opinión es muy valiosa para nosotros
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center space-y-4">
                <p className="text-slate-700">
                  Como agradecimiento, aquí está su cupón de descuento exclusivo:
                </p>

                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border-2 border-blue-200">
                  <p className="text-sm text-slate-600 mb-2">Código de cupón:</p>
                  <p className="text-2xl font-bold text-blue-900 mb-4 font-mono tracking-wider">
                    {couponCode}
                  </p>

                  {qrCodeUrl && (
                    <div className="mt-6">
                      <p className="text-sm text-slate-600 mb-3">Escanee este código QR:</p>
                      <div className="bg-white p-4 rounded-lg inline-block shadow-md">
                        <img src={qrCodeUrl} alt="QR Code" className="mx-auto" />
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-6">
                  <p className="text-sm text-amber-900">
                    <strong>Instrucciones:</strong> Presente este código o escanee el QR en su próxima visita
                    para recibir un descuento especial. Válido por 30 días.
                  </p>
                </div>

                <div className="mt-8 space-y-3">
                  <Button
                    onClick={() => window.print()}
                    variant="outline"
                    className="w-full"
                  >
                    Imprimir cupón
                  </Button>
                  <Button
                    onClick={() => window.location.href = '/'}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    Volver al inicio
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">
            Encuesta Anónima de Satisfacción
          </h1>
          <p className="text-slate-600 text-lg">
            Sus respuestas son completamente anónimas y nos ayudan a mejorar
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-slate-700">
              Pregunta {currentQuestion + 1} de {surveyQuestions.length}
            </span>
            <span className="text-sm font-medium text-slate-700">
              {Math.round(progress)}% completado
            </span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-blue-500 to-blue-600 h-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Question Card */}
        <Card className="shadow-xl">
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="text-xs">
                {currentSection}
              </Badge>
            </div>
            <CardTitle className="text-2xl text-slate-900">
              {currentQuestionData?.question}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <RadioGroup
              value={answers[currentQuestionData?.id] || ''}
              onValueChange={handleAnswer}
              className="space-y-3"
            >
              {currentQuestionData?.options.map((option) => (
                <div
                  key={option.value}
                  className={`flex items-center space-x-3 rounded-lg border-2 p-4 cursor-pointer transition-all ${
                    answers[currentQuestionData.id] === option.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <RadioGroupItem value={option.value} id={option.value} />
                  <Label
                    htmlFor={option.value}
                    className="flex-1 cursor-pointer text-base"
                  >
                    {option.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>

            <Separator className="my-6" />

            {/* Navigation Buttons */}
            <div className="flex justify-between items-center gap-4">
              <Button
                onClick={handlePrevious}
                disabled={currentQuestion === 0}
                variant="outline"
                className="px-6"
              >
                Anterior
              </Button>

              <div className="text-center text-sm text-slate-500">
                {!isAnswered && (
                  <span className="text-amber-600">
                    Por favor seleccione una respuesta
                  </span>
                )}
              </div>

              <Button
                onClick={handleNext}
                disabled={!isAnswered || isSubmitting}
                className="px-6 bg-blue-600 hover:bg-blue-700"
              >
                {currentQuestion === surveyQuestions.length - 1
                  ? isSubmitting
                    ? 'Enviando...'
                    : 'Finalizar'
                  : 'Siguiente'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-slate-500">
          <p>🔒 Esta encuesta es completamente anónima y segura</p>
        </div>
      </div>
    </div>
  );
};

export default AnonymousSurveyPage;
