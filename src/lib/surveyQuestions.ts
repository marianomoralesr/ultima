// Survey questions reference for analytics
// This matches the questions in AnonymousSurveyPage.tsx (42 questions total)

export interface SurveyQuestion {
  id: string; // String ID matching AnonymousSurveyPage
  questionNumber: number; // Numeric ID for ordering
  section: string;
  question: string;
  type: 'likert-4' | 'rating-horizontal' | 'multiple-choice' | 'nps';
  options?: Array<{ value: string; label: string }>;
  min?: number;
  max?: number;
}

export const SURVEY_QUESTIONS: SurveyQuestion[] = [
  // SECCIÓN 1: Datos Demográficos (5 preguntas)
  {
    id: 'age',
    questionNumber: 1,
    section: 'Datos Demográficos',
    question: '¿Cuál es tu rango de edad?',
    type: 'multiple-choice',
    options: [
      { value: '18-24', label: '18-24 años' },
      { value: '25-34', label: '25-34 años' },
      { value: '35-44', label: '35-44 años' },
      { value: '45-54', label: '45-54 años' },
      { value: '55+', label: '55+ años' }
    ]
  },
  {
    id: 'gender',
    questionNumber: 2,
    section: 'Datos Demográficos',
    question: '¿Cómo te identificas?',
    type: 'multiple-choice',
    options: [
      { value: 'masculino', label: 'Masculino' },
      { value: 'femenino', label: 'Femenino' },
      { value: 'otro', label: 'Otro' },
      { value: 'prefiero-no-decir', label: 'Prefiero no decir' }
    ]
  },
  {
    id: 'municipality',
    questionNumber: 3,
    section: 'Datos Demográficos',
    question: '¿En qué municipio vives?',
    type: 'multiple-choice',
    options: [
      { value: 'monterrey', label: 'Monterrey' },
      { value: 'san-nicolas', label: 'San Nicolás' },
      { value: 'san-pedro', label: 'San Pedro' },
      { value: 'santa-catarina', label: 'Santa Catarina' },
      { value: 'juarez', label: 'Juárez' },
      { value: 'guadalupe', label: 'Guadalupe' },
      { value: 'garcia', label: 'García' },
      { value: 'escobedo', label: 'Escobedo' },
      { value: 'apodaca', label: 'Apodaca' },
      { value: 'reynosa', label: 'Reynosa' },
      { value: 'saltillo', label: 'Saltillo' },
      { value: 'torreon', label: 'Torreón' },
      { value: 'matamoros', label: 'Matamoros' },
      { value: 'otro', label: 'Otro' }
    ]
  },
  {
    id: 'income',
    questionNumber: 4,
    section: 'Datos Demográficos',
    question: '¿Cuál es tu rango de ingreso mensual?',
    type: 'multiple-choice',
    options: [
      { value: 'menos-15k', label: 'Menos de $15,000' },
      { value: '15k-30k', label: '$15,000 - $30,000' },
      { value: '30k-50k', label: '$30,000 - $50,000' },
      { value: '50k-80k', label: '$50,000 - $80,000' },
      { value: '80k-120k', label: '$80,000 - $120,000' },
      { value: 'mas-120k', label: 'Más de $120,000' }
    ]
  },
  {
    id: 'employment-status',
    questionNumber: 5,
    section: 'Datos Demográficos',
    question: '¿Cuál es tu situación laboral actual?',
    type: 'multiple-choice',
    options: [
      { value: 'empleado', label: 'Empleado' },
      { value: 'autonomo', label: 'Autónomo/Emprendedor' },
      { value: 'profesionista', label: 'Profesionista independiente' },
      { value: 'estudiante', label: 'Estudiante' }
    ]
  },

  // SECCIÓN 2: Descubrimiento de Marca (3 preguntas)
  {
    id: 'source',
    questionNumber: 6,
    section: 'Descubrimiento de Marca',
    question: '¿Cómo nos conociste?',
    type: 'multiple-choice',
    options: [
      { value: 'google', label: 'Google/Búsqueda en internet' },
      { value: 'facebook', label: 'Facebook' },
      { value: 'instagram', label: 'Instagram' },
      { value: 'tiktok', label: 'TikTok' },
      { value: 'youtube', label: 'YouTube' },
      { value: 'recomendacion', label: 'Recomendación de conocido' },
      { value: 'publicidad', label: 'Publicidad (anuncios)' },
      { value: 'otro', label: 'Otro' }
    ]
  },
  {
    id: 'first-impression',
    questionNumber: 7,
    section: 'Descubrimiento de Marca',
    question: '¿Cuál fue tu primera impresión de TREFA?',
    type: 'likert-4',
    options: [
      { value: '1', label: 'Poco profesional' },
      { value: '2', label: 'Aceptable' },
      { value: '3', label: 'Profesional' },
      { value: '4', label: 'Muy profesional' }
    ]
  },
  {
    id: 'social-media-content',
    questionNumber: 8,
    section: 'Descubrimiento de Marca',
    question: '¿El contenido que compartimos en redes sociales y blog te parece relevante para tu proceso de compra?',
    type: 'likert-4',
    options: [
      { value: '4', label: 'Sí, es útil e informativo' },
      { value: '3', label: 'A veces, algunas cosas sí, otras no' },
      { value: '2', label: 'No realmente, no me ayuda mucho' },
      { value: '1', label: 'No he visto su contenido' }
    ]
  },

  // SECCIÓN 3: Confianza y Percepción de Marca (5 preguntas)
  {
    id: 'trust',
    questionNumber: 9,
    section: 'Confianza y Percepción',
    question: '¿Qué fue lo que más te generó confianza en TREFA?',
    type: 'multiple-choice',
    options: [
      { value: 'transparencia-precios', label: 'Transparencia en precios' },
      { value: 'variedad-inventario', label: 'Variedad de inventario' },
      { value: 'plataforma-profesional', label: 'Plataforma profesional' },
      { value: 'opiniones-clientes', label: 'Opiniones de otros clientes' },
      { value: 'facilidad-proceso', label: 'Facilidad del proceso' },
      { value: 'atencion-personalizada', label: 'Atención personalizada' }
    ]
  },
  {
    id: 'brand-differentiation',
    questionNumber: 10,
    section: 'Confianza y Percepción',
    question: '¿Qué hace a TREFA diferente de otras opciones?',
    type: 'multiple-choice',
    options: [
      { value: 'proceso-digital', label: 'Proceso digital y moderno' },
      { value: 'transparencia', label: 'Transparencia total' },
      { value: 'variedad', label: 'Amplia variedad de vehículos' },
      { value: 'financiamiento', label: 'Opciones de financiamiento' },
      { value: 'confianza', label: 'Mayor confianza y seguridad' },
      { value: 'nada', label: 'No veo diferencias significativas' }
    ]
  },
  {
    id: 'trust-level',
    questionNumber: 11,
    section: 'Confianza y Percepción',
    question: '¿Qué tan confiable consideras comprar un auto con TREFA?',
    type: 'rating-horizontal',
    min: 1,
    max: 10
  },
  {
    id: 'transparency-importance',
    questionNumber: 12,
    section: 'Confianza y Percepción',
    question: '¿Qué tan importante es la transparencia en precios y proceso?',
    type: 'rating-horizontal',
    min: 1,
    max: 10
  },
  {
    id: 'dealer-trust',
    questionNumber: 13,
    section: 'Confianza y Percepción',
    question: '¿Confías más en TREFA que en agencias tradicionales?',
    type: 'likert-4',
    options: [
      { value: '1', label: 'Confío más en agencias' },
      { value: '2', label: 'Similar confianza' },
      { value: '3', label: 'Confío un poco más en TREFA' },
      { value: '4', label: 'Confío mucho más en TREFA' }
    ]
  },

  // SECCIÓN 4: Experiencia con Plataforma (4 preguntas)
  {
    id: 'website-ease',
    questionNumber: 14,
    section: 'Experiencia con Plataforma',
    question: '¿Qué tan fácil fue navegar nuestra plataforma?',
    type: 'likert-4',
    options: [
      { value: '1', label: 'Muy difícil' },
      { value: '2', label: 'Algo complicado' },
      { value: '3', label: 'Fácil' },
      { value: '4', label: 'Muy fácil' }
    ]
  },
  {
    id: 'information-clarity',
    questionNumber: 15,
    section: 'Experiencia con Plataforma',
    question: '¿La información de los vehículos es clara y completa?',
    type: 'likert-4',
    options: [
      { value: '1', label: 'Falta mucha información' },
      { value: '2', label: 'Falta información importante' },
      { value: '3', label: 'Suficiente información' },
      { value: '4', label: 'Información muy completa' }
    ]
  },
  {
    id: 'search-functionality',
    questionNumber: 16,
    section: 'Experiencia con Plataforma',
    question: '¿Qué tan útiles son los filtros de búsqueda?',
    type: 'likert-4',
    options: [
      { value: '1', label: 'Poco útiles' },
      { value: '2', label: 'Algo útiles' },
      { value: '3', label: 'Útiles' },
      { value: '4', label: 'Muy útiles' }
    ]
  },
  {
    id: 'mobile-experience',
    questionNumber: 17,
    section: 'Experiencia con Plataforma',
    question: '¿Has usado nuestra plataforma desde tu celular?',
    type: 'multiple-choice',
    options: [
      { value: 'si-excelente', label: 'Sí, funciona excelente' },
      { value: 'si-buena', label: 'Sí, funciona bien' },
      { value: 'si-problemas', label: 'Sí, pero con algunos problemas' },
      { value: 'no', label: 'No, solo desde computadora' }
    ]
  },

  // SECCIÓN 5: Journey de Compra (6 preguntas)
  {
    id: 'purchase-stage',
    questionNumber: 18,
    section: 'Journey de Compra',
    question: '¿En qué etapa de compra te encuentras?',
    type: 'multiple-choice',
    options: [
      { value: 'solo-viendo', label: 'Solo viendo opciones' },
      { value: 'investigando', label: 'Investigando activamente' },
      { value: 'comparando', label: 'Comparando opciones específicas' },
      { value: 'listo-comprar', label: 'Listo para comprar pronto' }
    ]
  },
  {
    id: 'purchase-timeline',
    questionNumber: 19,
    section: 'Journey de Compra',
    question: '¿Cuándo planeas comprar tu próximo auto?',
    type: 'multiple-choice',
    options: [
      { value: 'este-mes', label: 'Este mes' },
      { value: '1-3-meses', label: '1-3 meses' },
      { value: '3-6-meses', label: '3-6 meses' },
      { value: 'mas-6-meses', label: 'Más de 6 meses' }
    ]
  },
  {
    id: 'budget-range',
    questionNumber: 20,
    section: 'Journey de Compra',
    question: '¿Cuál es tu presupuesto aproximado?',
    type: 'multiple-choice',
    options: [
      { value: 'menos-150k', label: 'Menos de $150,000' },
      { value: '150k-250k', label: '$150,000 - $250,000' },
      { value: '250k-350k', label: '$250,000 - $350,000' },
      { value: '350k-500k', label: '$350,000 - $500,000' },
      { value: 'mas-500k', label: 'Más de $500,000' }
    ]
  },
  {
    id: 'previous-purchase',
    questionNumber: 21,
    section: 'Journey de Compra',
    question: '¿Has comprado un auto seminuevo antes?',
    type: 'multiple-choice',
    options: [
      { value: 'si-agencia', label: 'Sí, en agencia' },
      { value: 'si-particular', label: 'Sí, a particular' },
      { value: 'si-plataforma', label: 'Sí, en plataforma digital' },
      { value: 'no', label: 'No, sería mi primera vez' }
    ]
  },
  {
    id: 'trade-in-interest',
    questionNumber: 22,
    section: 'Journey de Compra',
    question: '¿Te interesa dar tu auto actual a cuenta?',
    type: 'likert-4',
    options: [
      { value: '1', label: 'No tengo auto actual' },
      { value: '2', label: 'No me interesa' },
      { value: '3', label: 'Tal vez' },
      { value: '4', label: 'Sí, definitivamente' }
    ]
  },
  {
    id: 'dealer-visit-intention',
    questionNumber: 23,
    section: 'Journey de Compra',
    question: '¿Planeas visitar físicamente el auto antes de comprar?',
    type: 'likert-4',
    options: [
      { value: '4', label: 'Sí, es indispensable' },
      { value: '3', label: 'Probablemente sí' },
      { value: '2', label: 'No es necesario' },
      { value: '1', label: 'Prefiero proceso 100% digital' }
    ]
  },

  // SECCIÓN 6: Preferencias y Prioridades (5 preguntas)
  {
    id: 'vehicle-priority',
    questionNumber: 24,
    section: 'Preferencias y Prioridades',
    question: '¿Qué es lo más importante para ti en un auto?',
    type: 'multiple-choice',
    options: [
      { value: 'precio', label: 'Mejor precio posible' },
      { value: 'seguridad', label: 'Seguridad y confiabilidad' },
      { value: 'economia', label: 'Economía de combustible' },
      { value: 'tecnologia', label: 'Tecnología y comodidades' },
      { value: 'espacio', label: 'Espacio y capacidad' },
      { value: 'marca', label: 'Marca y prestigio' }
    ]
  },
  {
    id: 'new-vs-used',
    questionNumber: 25,
    section: 'Preferencias y Prioridades',
    question: '¿Por qué prefieres autos seminuevos sobre nuevos?',
    type: 'multiple-choice',
    options: [
      { value: 'precio', label: 'Mejor precio' },
      { value: 'depreciacion', label: 'Menos depreciación' },
      { value: 'mas-auto', label: 'Más auto por el dinero' },
      { value: 'no-prefiero', label: 'No necesariamente los prefiero' }
    ]
  },
  {
    id: 'warranty-importance',
    questionNumber: 26,
    section: 'Preferencias y Prioridades',
    question: '¿Qué tan importante es la garantía para ti?',
    type: 'rating-horizontal',
    min: 1,
    max: 10
  },
  {
    id: 'payment-preference',
    questionNumber: 27,
    section: 'Preferencias y Prioridades',
    question: '¿Cómo preferirías pagar tu auto?',
    type: 'multiple-choice',
    options: [
      { value: 'contado', label: 'De contado' },
      { value: 'financiamiento-banco', label: 'Financiamiento bancario' },
      { value: 'financiamiento-trefa', label: 'Financiamiento con TREFA' },
      { value: 'combinacion', label: 'Combinación de opciones' }
    ]
  },
  {
    id: 'delivery-preference',
    questionNumber: 28,
    section: 'Preferencias y Prioridades',
    question: '¿Te interesaría entrega a domicilio?',
    type: 'likert-4',
    options: [
      { value: '1', label: 'No, prefiero recogerlo' },
      { value: '2', label: 'No es importante' },
      { value: '3', label: 'Sería conveniente' },
      { value: '4', label: 'Sí, es muy importante' }
    ]
  },

  // SECCIÓN 7: Financiamiento (3 preguntas)
  {
    id: 'financing-importance',
    questionNumber: 29,
    section: 'Financiamiento',
    question: '¿Qué tan importante es el financiamiento para tu compra?',
    type: 'rating-horizontal',
    min: 1,
    max: 10
  },
  {
    id: 'financing-dependency',
    questionNumber: 30,
    section: 'Financiamiento',
    question: 'Mi compra depende de la aprobación del financiamiento.',
    type: 'likert-4',
    options: [
      { value: '4', label: 'Verdadero' },
      { value: '1', label: 'Falso' }
    ]
  },
  {
    id: 'down-payment-capacity',
    questionNumber: 31,
    section: 'Financiamiento',
    question: '¿Con cuánto podrías dar de enganche?',
    type: 'multiple-choice',
    options: [
      { value: 'sin-enganche', label: 'Sin enganche / 0%' },
      { value: '10-20', label: '10-20% del precio' },
      { value: '20-30', label: '20-30% del precio' },
      { value: '30-50', label: '30-50% del precio' },
      { value: 'mas-50', label: 'Más del 50%' }
    ]
  },

  // SECCIÓN 8: Servicio y Experiencia (3 preguntas)
  {
    id: 'response-time-satisfaction',
    questionNumber: 32,
    section: 'Servicio y Experiencia',
    question: '¿Qué tan satisfecho estás con nuestros tiempos de respuesta?',
    type: 'likert-4',
    options: [
      { value: '1', label: 'Muy lento' },
      { value: '2', label: 'Algo lento' },
      { value: '3', label: 'Adecuado' },
      { value: '4', label: 'Muy rápido' }
    ]
  },
  {
    id: 'advisor-satisfaction',
    questionNumber: 33,
    section: 'Servicio y Experiencia',
    question: '¿Cómo calificarías la atención de nuestros asesores?',
    type: 'likert-4',
    options: [
      { value: '1', label: 'Necesita mejorar' },
      { value: '2', label: 'Aceptable' },
      { value: '3', label: 'Buena' },
      { value: '4', label: 'Excelente' }
    ]
  },
  {
    id: 'additional-services',
    questionNumber: 34,
    section: 'Servicio y Experiencia',
    question: '¿Qué servicios adicionales te interesarían?',
    type: 'multiple-choice',
    options: [
      { value: 'seguro', label: 'Seguro de auto' },
      { value: 'mantenimiento', label: 'Paquetes de mantenimiento' },
      { value: 'accesorios', label: 'Accesorios y personalización' },
      { value: 'ninguno', label: 'Ninguno por ahora' }
    ]
  },

  // SECCIÓN 9: Mejoras y Feedback (3 preguntas)
  {
    id: 'improvement',
    questionNumber: 35,
    section: 'Mejoras y Feedback',
    question: '¿En qué podríamos mejorar?',
    type: 'multiple-choice',
    options: [
      { value: 'mas-inventario', label: 'Más variedad de inventario' },
      { value: 'mejores-precios', label: 'Mejores precios' },
      { value: 'mas-informacion', label: 'Más información de vehículos' },
      { value: 'proceso-mas-rapido', label: 'Proceso más rápido' },
      { value: 'mejor-comunicacion', label: 'Mejor comunicación' },
      { value: 'todo-bien', label: 'Todo está bien' }
    ]
  },
  {
    id: 'dislike',
    questionNumber: 36,
    section: 'Mejoras y Feedback',
    question: '¿Qué es lo que menos te gusta actualmente?',
    type: 'multiple-choice',
    options: [
      { value: 'tiempo-respuesta', label: 'Tiempo de respuesta' },
      { value: 'falta-opciones', label: 'Falta de opciones de pago' },
      { value: 'proceso-complicado', label: 'Proceso complicado' },
      { value: 'poca-transparencia', label: 'Poca transparencia' },
      { value: 'nada', label: 'No tengo quejas' }
    ]
  },
  {
    id: 'missing-feature',
    questionNumber: 37,
    section: 'Mejoras y Feedback',
    question: '¿Qué te gustaría que tuviéramos que no tenemos?',
    type: 'multiple-choice',
    options: [
      { value: 'mas-fotos', label: 'Más fotos y videos' },
      { value: 'video-llamada', label: 'Videollamada con asesor' },
      { value: 'chat-vivo', label: 'Chat en vivo' },
      { value: 'app-movil', label: 'App móvil' },
      { value: 'comparador', label: 'Comparador de autos' },
      { value: 'nada', label: 'Está completo' }
    ]
  },

  // SECCIÓN 10: Satisfacción General y NPS (3 preguntas)
  {
    id: 'satisfaction',
    questionNumber: 38,
    section: 'Satisfacción General',
    question: '¿Qué tan satisfecho estás con tu experiencia en TREFA?',
    type: 'likert-4',
    options: [
      { value: '1', label: 'Insatisfecho' },
      { value: '2', label: 'Poco satisfecho' },
      { value: '3', label: 'Satisfecho' },
      { value: '4', label: 'Muy satisfecho' }
    ]
  },
  {
    id: 'would-recommend',
    questionNumber: 39,
    section: 'Satisfacción General',
    question: '¿Recomendarías TREFA a un familiar o amigo?',
    type: 'likert-4',
    options: [
      { value: '1', label: 'Definitivamente no' },
      { value: '2', label: 'Probablemente no' },
      { value: '3', label: 'Probablemente sí' },
      { value: '4', label: 'Definitivamente sí' }
    ]
  },
  {
    id: 'nps',
    questionNumber: 40,
    section: 'Satisfacción General',
    question: '¿Qué tan probable es que recomiendes TREFA a un amigo?',
    type: 'nps',
    min: 0,
    max: 10
  }
];

export const SURVEY_SECTIONS = [
  'Datos Demográficos',
  'Descubrimiento de Marca',
  'Confianza y Percepción',
  'Experiencia con Plataforma',
  'Journey de Compra',
  'Preferencias y Prioridades',
  'Financiamiento',
  'Servicio y Experiencia',
  'Mejoras y Feedback',
  'Satisfacción General'
];

export function getQuestionById(id: string): SurveyQuestion | undefined {
  return SURVEY_QUESTIONS.find(q => q.id === id);
}

export function getQuestionByNumber(num: number): SurveyQuestion | undefined {
  return SURVEY_QUESTIONS.find(q => q.questionNumber === num);
}

export function getQuestionsBySection(section: string): SurveyQuestion[] {
  return SURVEY_QUESTIONS.filter(q => q.section === section);
}

export function getLabelForValue(questionId: string, value: string): string {
  const question = getQuestionById(questionId);
  const option = question?.options?.find(opt => opt.value === value);
  return option?.label || value;
}
