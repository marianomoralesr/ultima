# Resumen del Sistema de Perfilamiento Bancario

## Descripción General

El sistema de perfilamiento bancario es un algoritmo de scoring que evalúa el perfil financiero de un usuario y determina qué banco tiene la mayor probabilidad de aprobar su solicitud de crédito automotriz. El sistema considera múltiples factores y asigna puntuaciones a 6 bancos diferentes.

## Bancos Evaluados

El sistema evalúa las siguientes instituciones bancarias:

1. **Scotiabank**
2. **BBVA**
3. **Banorte**
4. **Banregio**
5. **Afirme**
6. **Hey Banco**

## Criterios de Evaluación

El sistema evalúa **8 criterios principales** que determinan la elegibilidad y puntuación del solicitante:

### 1. Antigüedad en el Empleo Actual (`trabajo_tiempo`)

**Peso:** Criterio eliminatorio si es menos de 6 meses

| Respuesta del Usuario | Scotiabank | BBVA | Banorte | Banregio | Afirme | Hey Banco |
|----------------------|------------|------|---------|----------|--------|-----------|
| Menos de 6 meses | ❌ Rechazo | ❌ Rechazo | ❌ Rechazo | ❌ Rechazo | ❌ Rechazo | ❌ Rechazo |
| De 6 meses a 1 año | 2 | 2 | 2 | 2 | 2 | 2 |
| De 1 a 2 años | 3 | 3 | 3 | 3 | 3 | 3 |
| Más de 2 años | 4 | 4 | 4 | 4 | 4 | 4 |

**Impacto:** Los bancos no aprueban solicitudes de personas con menos de 6 meses en su empleo actual. Mayor antigüedad laboral proporciona más puntos.

---

### 2. Banco de Nómina (`banco_nomina`)

**Peso:** Alta preferencia por nómina en el mismo banco (4 puntos bonus)

| Respuesta del Usuario | Scotiabank | BBVA | Banorte | Banregio | Afirme | Hey Banco |
|----------------------|------------|------|---------|----------|--------|-----------|
| Scotiabank | **4** | 1 | 1 | 1 | 1 | 1 |
| BBVA | 1 | **4** | 1 | 1 | 1 | 1 |
| Banorte | 1 | 1 | **4** | 1 | 1 | 1 |
| Banregio | 1 | 1 | 1 | **4** | 1 | 1 |
| Afirme | 1 | 1 | 1 | 1 | **4** | 1 |
| Hey Banco | 1 | 1 | 1 | 1 | 1 | **4** |
| Otro banco | 1 | 1 | 1 | 1 | 1 | 1 |

**Impacto:** Tener la nómina en el mismo banco que se evalúa proporciona una ventaja significativa de **+3 puntos adicionales** sobre otros bancos.

---

### 3. Historial Crediticio (`historial_crediticio`)

**Peso:** Criterio eliminatorio si no es "Excelente" o "Bueno"

| Respuesta del Usuario | Scotiabank | BBVA | Banorte | Banregio | Afirme | Hey Banco |
|----------------------|------------|------|---------|----------|--------|-----------|
| Excelente | 5 | 5 | 5 | 5 | 5 | 5 |
| Bueno | 3 | 4 | **5** | 3 | 3 | 3 |
| Regular | ❌ Rechazo | ❌ Rechazo | ❌ Rechazo | ❌ Rechazo | ❌ Rechazo | ❌ Rechazo |
| Malo | ❌ Rechazo | ❌ Rechazo | ❌ Rechazo | ❌ Rechazo | ❌ Rechazo | ❌ Rechazo |
| Sin historial crediticio | ❌ Rechazo | ❌ Rechazo | ❌ Rechazo | ❌ Rechazo | ❌ Rechazo | ❌ Rechazo |

**Impacto:** Es uno de los criterios más importantes. Solo se aprueban solicitudes con historial "Excelente" o "Bueno". Banorte es más flexible con historial "Bueno" (5 puntos vs 3-4 de otros bancos).

---

### 4. Créditos Vigentes (`creditos_vigentes`)

**Peso:** Medio - Se prefiere tener 1-2 créditos manejados responsablemente

| Respuesta del Usuario | Scotiabank | BBVA | Banorte | Banregio | Afirme | Hey Banco |
|----------------------|------------|------|---------|----------|--------|-----------|
| Ninguno | 3 | 3 | 3 | 3 | 3 | 3 |
| 1 o 2 | **5** | **5** | **5** | **5** | **5** | **5** |
| 3 o más (regularizados) | 2 | 2 | 2 | 2 | 2 | 2 |
| Varios pagos pendientes | ❌ Rechazo | ❌ Rechazo | ❌ Rechazo | ❌ Rechazo | ❌ Rechazo | ❌ Rechazo |

**Impacto:** Tener 1-2 créditos activos y al corriente es lo óptimo (demuestra responsabilidad crediticia). Varios pagos pendientes resulta en rechazo automático.

---

### 5. Atrasos en los Últimos 12 Meses (`atrasos_12_meses`)

**Peso:** Criterio eliminatorio si hay atrasos significativos

| Respuesta del Usuario | Scotiabank | BBVA | Banorte | Banregio | Afirme | Hey Banco |
|----------------------|------------|------|---------|----------|--------|-----------|
| Ninguno | **5** | **5** | **5** | **5** | **5** | **5** |
| Sí, pero lo regularicé | 2 | 2 | 2 | 2 | 2 | 2 |
| Más de 1 mes | ❌ Rechazo | ❌ Rechazo | ❌ Rechazo | ❌ Rechazo | ❌ Rechazo | ❌ Rechazo |
| Varios pagos sin regularizar | ❌ Rechazo | ❌ Rechazo | ❌ Rechazo | ❌ Rechazo | ❌ Rechazo | ❌ Rechazo |

**Impacto:** No tener atrasos es fundamental. Atrasos regularizados se toleran pero reducen significativamente el puntaje. Atrasos sin regularizar resultan en rechazo.

---

### 6. Porcentaje de Enganche (`enganche`)

**Peso:** Alto - Mayor enganche mejora considerablemente la evaluación

| Respuesta del Usuario | Scotiabank | BBVA | Banorte | Banregio | Afirme | Hey Banco |
|----------------------|------------|------|---------|----------|--------|-----------|
| Menos del 15% | 1 | 1 | 1 | 1 | 1 | 1 |
| Enganche mínimo (15%) | 1 | 1 | 1 | 1 | 1 | 1 |
| Más del mínimo (20% a 30%) | 3 | 3 | 3 | 3 | 3 | 3 |
| Enganche recomendado (35% o más) | **5** | **5** | **5** | **5** | **5** | **5** |

**Impacto:** Un enganche mayor reduce el riesgo para el banco. El enganche del 35% o más es altamente valorado (+5 puntos).

---

### 7. Prioridad en el Financiamiento (`prioridad_financiamiento`)

**Peso:** Bajo - Influencia mínima en la decisión

| Respuesta del Usuario | Scotiabank | BBVA | Banorte | Banregio | Afirme | Hey Banco |
|----------------------|------------|------|---------|----------|--------|-----------|
| Tasa de interés más baja | 0 | 0 | 0 | 0 | 0 | 0 |
| Pagos mensuales fijos | 3 | 3 | 3 | 3 | 3 | 3 |
| Rapidez en la aprobación | 3 | 3 | 3 | 3 | 3 | 3 |
| Proceso digital con pocos trámites | 0 | 0 | 0 | 0 | 0 | 0 |

**Impacto:** Este criterio tiene poco peso. Buscar pagos fijos o rapidez otorga 3 puntos, pero no afecta significativamente la decisión final.

---

### 8. Ingresos Mensuales Comprobables (`ingreso_mensual`)

**Peso:** Alto - Criterio eliminatorio para ingresos muy bajos

| Respuesta del Usuario | Scotiabank | BBVA | Banorte | Banregio | Afirme | Hey Banco |
|----------------------|------------|------|---------|----------|--------|-----------|
| Menos de $10,000 sin comprobación | ❌ Rechazo | 1 | ❌ Rechazo | ❌ Rechazo | ❌ Rechazo | ❌ Rechazo |
| Menos de $15,000 con comprobación | ❌ Rechazo | 2 | ❌ Rechazo | 2 | 2 | 2 |
| $15,000 - $20,000 con comprobación | 3 | 3 | 3 | 3 | 3 | 3 |
| $20,000 - $30,000 con comprobación | 4 | 4 | 4 | 4 | 4 | 4 |
| Más de $30,000 con comprobación | **5** | **5** | **5** | **5** | **5** | **5** |

**Impacto:**
- **BBVA** es el único banco que acepta ingresos menores a $15,000 (con puntaje bajo)
- La mayoría de bancos requieren mínimo $15,000 mensuales comprobables
- Ingresos superiores a $30,000 proporcionan el máximo puntaje

---

## Algoritmo de Asignación

### Proceso de Evaluación

1. **Inicialización:** Todos los bancos comienzan con puntaje 0 y sin rechazo
2. **Evaluación por criterio:** Para cada respuesta del usuario:
   - Si el banco tiene "Rechazo" para esa respuesta, se marca como no elegible
   - Si es un número, se suma al puntaje total del banco
3. **Filtrado:** Se eliminan bancos marcados con rechazo
4. **Ordenamiento:** Los bancos elegibles se ordenan por puntaje total (de mayor a menor)
5. **Selección:**
   - **Banco recomendado:** El banco con el puntaje más alto
   - **Segunda opción:** El banco con el segundo puntaje más alto

### Casos Especiales

#### Caso 1: Ningún Banco Elegible
Si todos los bancos resultan rechazados:
- Se selecciona el banco con **menos motivos de rechazo**
- Se marca el perfil con `lowScore: true`
- Se muestra advertencia al usuario recomendando contactar un asesor

#### Caso 2: Puntaje Bajo (< 5 puntos)
Si el mejor banco tiene menos de 5 puntos totales:
- Se marca el perfil con `lowScore: true`
- Se recomienda el banco pero con advertencia
- Se sugiere contactar asesor para alternativas

---

## Valores de Puntaje

### Escala de Puntaje Total

- **Puntaje Máximo Teórico:** 32 puntos
  - Trabajo tiempo: 4
  - Banco nómina: 4
  - Historial: 5
  - Créditos vigentes: 5
  - Sin atrasos: 5
  - Enganche: 5
  - Prioridad: 3
  - Ingresos: 5

- **Puntaje Mínimo para Aprobación Confiable:** 15-20 puntos
- **Puntaje Bajo (requiere asesoría):** < 5 puntos

### Interpretación de Resultados

| Rango de Puntaje | Evaluación | Acción Recomendada |
|------------------|------------|-------------------|
| 25-32 puntos | Excelente | Alta probabilidad de aprobación con buenas condiciones |
| 15-24 puntos | Bueno | Probabilidad moderada-alta de aprobación |
| 10-14 puntos | Regular | Probabilidad moderada, puede requerir documentación adicional |
| 5-9 puntos | Bajo | Probabilidad baja, se recomienda asesoría |
| < 5 puntos | Muy Bajo | Se requiere asesoría especializada |

---

## Ventajas Competitivas por Banco

### BBVA
- ✅ **Único banco** que acepta ingresos menores a $15,000
- ✅ Más flexible con ingresos bajos (puntaje bajo pero no rechaza)
- 📊 Ideal para: Perfiles con ingresos limitados pero buen historial

### Banorte
- ✅ Más generoso con historial crediticio "Bueno" (5 puntos vs 3-4 de otros)
- 📊 Ideal para: Perfiles con historial bueno pero no excelente

### Scotiabank, Banregio, Afirme, Hey Banco
- 📊 Criterios uniformes y estándares similares
- 📊 La **diferenciación principal** es el banco de nómina (+3 puntos de ventaja)

---

## Almacenamiento de Datos

Los resultados del perfilamiento se guardan en la tabla `bank_profiles`:

```typescript
{
  user_id: string;              // ID del usuario
  respuestas: object;           // Objeto JSON con todas las respuestas
  banco_recomendado: string;    // Nombre del banco principal
  banco_segunda_opcion: string | null;  // Nombre de la segunda opción
  is_complete: boolean;         // true al completar el formulario
}
```

---

## Flujo de Usuario

1. **Validación de Perfil:** El usuario debe completar su perfil personal antes de acceder al perfilamiento bancario
2. **Formulario:** Se presenta un formulario con 8 preguntas
3. **Cálculo:** Al enviar, se ejecuta el algoritmo `calculateBankScores()`
4. **Resultados:** Se muestran:
   - Banco recomendado con diseño destacado
   - Segunda opción (si existe)
   - Advertencia si el puntaje es bajo
5. **Siguiente Paso:** Redirección automática a la solicitud de financiamiento después de 7 segundos
6. **Evento de Seguimiento:** Se registra el evento `PerfilacionBancariaComplete` para analytics

---

## Notas Importantes

### Criterios Eliminatorios (Rechazo Automático)
Los siguientes criterios resultan en **rechazo automático** por todos los bancos:

1. ❌ Antigüedad laboral < 6 meses
2. ❌ Historial crediticio Regular, Malo o Sin historial
3. ❌ Varios pagos pendientes en créditos
4. ❌ Atrasos de más de 1 mes sin regularizar
5. ❌ Varios pagos sin regularizar
6. ❌ Ingresos < $15,000 sin comprobación (excepto BBVA con puntaje muy bajo)

### Factores de Mayor Peso

Los criterios con **mayor impacto** en el puntaje final son:

1. **Historial Crediticio** (eliminatorio + 5 puntos)
2. **Sin Atrasos** (eliminatorio + 5 puntos)
3. **Créditos Vigentes Manejados Responsablemente** (5 puntos)
4. **Ingresos Altos** (5 puntos)
5. **Enganche Alto** (5 puntos)
6. **Banco de Nómina Coincidente** (4 puntos)
7. **Antigüedad Laboral** (4 puntos)

### Transparencia

- El usuario **ve claramente** qué bancos se recomiendan
- Se explica que es una recomendación basada en probabilidades
- Se aclara que no es un compromiso vinculante
- En caso de puntaje bajo, se ofrece soporte adicional

---

## Conclusión

El sistema de perfilamiento bancario utiliza un algoritmo de scoring multi-criterio que:

- ✅ Evalúa 8 factores clave del perfil financiero
- ✅ Aplica criterios eliminatorios estrictos para garantizar calidad
- ✅ Asigna puntajes diferenciados según el banco
- ✅ Prioriza la afinidad banco-cliente (nómina)
- ✅ Identifica automáticamente el mejor banco y alternativa
- ✅ Alerta cuando el perfil requiere asesoría especializada

Este enfoque maximiza las probabilidades de aprobación al **dirigir cada solicitud al banco más adecuado** según el perfil específico del solicitante.
