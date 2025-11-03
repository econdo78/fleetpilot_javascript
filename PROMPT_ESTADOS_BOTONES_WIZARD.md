# PROMPT: Implementación de Estados de Botones del Wizard Basados en Publicación

## 🎯 OBJETIVO

Implementar un sistema visual de estados para los botones del wizard de 4 páginas en `pgconductor.html` que indique el estado de publicación de cada página mediante tres estados visuales distintos.

---

## 📋 CONTEXTO DEL SISTEMA ACTUAL

### Archivo a modificar
- **Ruta**: `/Users/econdo/proyectos/FleetPilot/pgconductor.html`
- **Tamaño**: ~295KB (archivo grande, usar offsets para leer)

### Estado actual FUNCIONAL (NO ROMPER)

El sistema actualmente tiene implementada y **funcionando correctamente** la siguiente funcionalidad:

1. **Wizard de 4 páginas** con navegación por botones
2. **Publicación parcial por página**: El botón "Publicar" solo envía al backend los campos de la página actual del wizard
3. **Progreso simple**: Los botones muestran progreso azul y se ponen verdes con ✓ al llegar al 100%

### Variables globales clave (líneas ~3157-3160)

```javascript
let currentConductorId = null;        // UUID del conductor actual
let currentConductorRecordId = null;  // recordId de FileMaker
let currentProcesoId = null;          // ID del proceso actual (desde URL)
let originalConductorData = null;     // Datos originales del conductor (desde backend)
```

**CRÍTICO**: `originalConductorData` contiene los datos del conductor tal como están guardados en el backend. Se usa para comparar si hay cambios pendientes de publicar.

### Mapeo de páginas y campos (líneas 2649-2656)

```javascript
let currentWizardPage = 1; // Se actualiza en showWizardPage() línea 2683

const WIZARD_PAGE_FIELDS = {
  1: ['nombre', 'apellido1', 'apellido2', 'tipoDocumentoIdentidad', 'nDocumentoIdentidad',
      'fechaNacimiento', 'edad', 'nAfiliacionSS', 'nacionalidad', 'nivelFormativoTrabajador'],
  2: ['telefono1', 'telefono2', 'correoPersonal', 'correoPlataforma', 'telefonoBoltCompleto'],
  3: ['tipoVia', 'nombreVia', 'numero', 'pisoYLetra', 'cp', 'localidad', 'provincia'],
  4: ['fechaFirma']
};
```

### Función de publicación parcial (líneas ~4399-4426)

```javascript
// En el event listener del botón "Publicar":
const currentPageFields = WIZARD_PAGE_FIELDS[currentWizardPage] || [];
console.log('📋 Campos página actual:', currentPageFields);

const pageFormData = {};
currentPageFields.forEach(fieldName => {
  if (Object.prototype.hasOwnProperty.call(formData, fieldName)) {
    pageFormData[fieldName] = formData[fieldName];
  }
});

// Limpiar campos vacíos
const cleanedFormData = {};
Object.entries(pageFormData).forEach(([key, value]) => {
  if (value !== null && value !== undefined && value !== '') {
    cleanedFormData[key] = value;
  }
});

// Solo se envía cleanedFormData al backend (datos de la página actual)
```

**ESTA FUNCIONALIDAD DEBE MANTENERSE INTACTA.**

---

## 🎨 FUNCIONALIDAD DESEADA: TRES ESTADOS VISUALES

Los botones del wizard deben mostrar **3 estados visuales distintos** según el estado de publicación y completitud de cada página:

### Estado 1: Verde con ✓ (Completado 100% y Publicado)
- **Condición**: La página tiene el 100% de campos completados Y los datos coinciden con el backend
- **Visual**:
  - Borde y texto verde (#05a34a en claro, #10b981 en oscuro)
  - Fondo verde semitransparente (rgba(5, 163, 74, 0.2) en claro)
  - **Icono de check (✓)** visible en la esquina derecha
  - Padding derecho aumentado para el check (3rem)
- **CSS existente**: `.wizard-step-button.completed` (líneas 1593-1619)
- **Animación**: Ya existe animación de celebración al completar

### Estado 2: Verde sin ✓ (Campos requeridos completos y Publicado)
- **Condición**: La página tiene todos los campos **requeridos** completados (pero no el 100%) Y los datos coinciden con el backend
- **Visual**:
  - Borde y texto verde (mismos colores que Estado 1)
  - Fondo verde semitransparente
  - **SIN icono de check**
  - Padding normal
- **CSS necesario**: `.wizard-step-button.published` (DEBE AÑADIRSE)

```css
/* Estado publicado (sin 100%) - Modo claro */
.wizard-step-button.published {
  border-color: #05a34a;
  color: #05a34a;
}

.wizard-step-button.published::before {
  background: rgba(5, 163, 74, 0.2);
}

.wizard-step-button.published:hover::before {
  background: rgba(5, 163, 74, 0.25);
}

/* Estado publicado (sin 100%) - Modo oscuro */
[data-bs-theme='dark'] .wizard-step-button.published {
  border-color: #10b981;
  color: #10b981;
}

[data-bs-theme='dark'] .wizard-step-button.published::before {
  background: rgba(16, 185, 129, 0.25);
}

[data-bs-theme='dark'] .wizard-step-button.published:hover::before {
  background: rgba(16, 185, 129, 0.3);
}
```

### Estado 3: Azul con progreso (No publicado / Cambios pendientes)
- **Condición**: Hay cambios en el formulario que NO han sido publicados (datos actuales ≠ originalConductorData)
- **Visual**:
  - Borde y texto azul (#6571ff)
  - Barra de progreso azul semitransparente que indica el % completado
  - Sin clases especiales
- **CSS existente**: `.wizard-step-button` por defecto (líneas 1545-1568)

---

## 🔧 LÓGICA DE DETECCIÓN DE ESTADOS

La función `updateWizardProgress()` (actualmente en líneas 3262-3327) debe ser modificada para detectar los 3 estados:

### Pseudocódigo de la lógica necesaria:

```javascript
for cada página del wizard:
  1. Contar campos totales y campos requeridos
  2. Contar campos completados y campos requeridos completados
  3. Calcular percentage = (completedFields / totalFields) * 100

  4. COMPARAR con backend:
     - Obtener campos de esta página: WIZARD_PAGE_FIELDS[pageNumber]
     - Para cada campo de la página:
       * valor_formulario = FormData actual del campo
       * valor_backend = originalConductorData[campo]
       * Si valor_formulario !== valor_backend → isPublished = false
     - Si TODOS los campos coinciden → isPublished = true

  5. APLICAR ESTADO:
     a) Si percentage === 100 Y isPublished === true:
        → Estado 1: .completed (verde con ✓)

     b) Si (todos los campos requeridos completos) Y isPublished === true Y percentage < 100:
        → Estado 2: .published (verde sin ✓)

     c) En cualquier otro caso:
        → Estado 3: Sin clases especiales (azul con progreso)
```

### Código de implementación intentado (ROMPIÓ EL SISTEMA):

```javascript
const updateWizardProgress = () => {
  const wizardPages = document.querySelectorAll('[data-wizard-page]');

  wizardPages.forEach(page => {
    const pageNumber = parseInt(page.getAttribute('data-wizard-page'));
    const button = document.querySelector(`[data-wizard-step="${pageNumber}"]`);

    if (!button) return;

    const fields = page.querySelectorAll('.form-control, .form-select');

    let totalFields = 0;
    let completedFields = 0;
    let requiredFields = 0;
    let completedRequiredFields = 0;

    fields.forEach(field => {
      // Ignorar campos sin id y sin nombre
      if (!field.id && !field.name) return;

      // Ignorar campos readonly
      if (field.hasAttribute('readonly')) return;

      // Ignorar campos ocultos
      const fieldContainer = field.closest('.col-12, .col-lg-6');
      if (fieldContainer && fieldContainer.classList.contains('d-none')) return;

      const isRequired = field.hasAttribute('required');

      totalFields++;
      if (isRequired) requiredFields++;

      const hasValue = field.value && field.value.trim() !== '';
      const isValid = field.checkValidity ? field.checkValidity() : true;

      if (hasValue && isValid) {
        completedFields++;
        if (isRequired) completedRequiredFields++;
      }
    });

    // Calcular porcentaje
    const percentage = totalFields > 0 ? Math.round((completedFields / totalFields) * 100) : 0;

    // COMPARACIÓN CON BACKEND
    const pageFieldNames = WIZARD_PAGE_FIELDS[pageNumber] || [];
    let isPublished = true;

    if (originalConductorData) {
      const formData = Object.fromEntries(new FormData(procesoForm).entries());

      for (const fieldName of pageFieldNames) {
        const currentValue = formData[fieldName] || '';
        const originalValue = originalConductorData[fieldName] || '';

        if (currentValue !== originalValue) {
          isPublished = false;
          break;
        }
      }
    } else {
      isPublished = false;
    }

    // Determinar el estado del botón
    const allRequiredComplete = requiredFields === 0 || completedRequiredFields === requiredFields;
    const allFieldsComplete = percentage === 100;

    // Actualizar la variable CSS --progress
    button.style.setProperty('--progress', `${percentage}%`);

    // Limpiar clases anteriores
    const wasCompleted = button.classList.contains('completed');
    button.classList.remove('completed', 'published', 'just-completed');

    if (isPublished && allFieldsComplete) {
      // Estado 1: Verde con tick
      button.classList.add('completed');

      if (!wasCompleted) {
        button.classList.add('just-completed');
        setTimeout(() => {
          button.classList.remove('just-completed');
        }, 600);
      }
    } else if (isPublished && allRequiredComplete) {
      // Estado 2: Verde sin tick
      button.classList.add('published');
    }
    // Estado 3: Sin clases (azul con progreso por defecto)
  });
};
```

---

## ⚠️ PROBLEMAS ENCONTRADOS (CRÍTICO)

### 🔴 PRIMER INTENTO: Falló completamente
**Resultado**: "se ha roto todo, esta todo mal fíjate como se ve la pantalla y no funciona nada"

**Síntomas**:
- Panel del wizard no visible
- Botones no clickeables
- Barra de progreso (::before) mostrándose permanentemente en todos los botones
- Página completamente rota, wizard no funcional

**Causa probable**:
- El CSS `.wizard-step-button::before` (línea 1557-1568) se estaba aplicando incorrectamente
- Posible conflicto entre las clases `.completed` y `.published` con el pseudo-elemento `::before`
- Posible problema de inicialización: `originalConductorData` podría ser null durante la carga inicial

### 🔴 SEGUNDO INTENTO: Falló exactamente igual
**Contexto**: Se implementó DESPUÉS de que la publicación parcial estuviera funcionando correctamente

**Resultado**: "revierte los cambios, se ha roto todo"

**Síntomas**: Los mismos que el primer intento

**Cambios realizados**:
1. Modificación de `updateWizardProgress()` con la lógica completa de los 3 estados
2. Añadido de estilos CSS `.published` para modo claro y oscuro

**Acción tomada**: Revert completo exitoso (estado actual del archivo)

---

## 🔍 HIPÓTESIS SOBRE LA CAUSA DEL PROBLEMA

### Hipótesis 1: Timing de inicialización
- `updateWizardProgress()` se llama antes de que `originalConductorData` tenga datos
- Al comparar con `null`, todos los botones entran en un estado indefinido
- **Solución potencial**: Añadir guards más robustos para verificar que `originalConductorData` esté cargado

### Hipótesis 2: Conflicto CSS con pseudo-elementos
- La clase `.published` podría estar interfiriendo con `::before` que muestra el progreso
- El pseudo-elemento `::after` de `.completed` (que muestra el ✓) podría estar causando layout shift
- **Solución potencial**: Revisar la especificidad CSS y el z-index de los pseudo-elementos

### Hipótesis 3: FormData vs valores reales
- La comparación con `Object.fromEntries(new FormData(procesoForm).entries())` podría no capturar correctamente los valores actuales
- Campos con Select2 o Flatpickr podrían tener valores diferentes en el FormData vs el DOM
- **Solución potencial**: Obtener valores directamente de los campos DOM en lugar de FormData

### Hipótesis 4: Llamadas excesivas a updateWizardProgress()
- Si la función se llama demasiadas veces o en momentos inapropiados, podría causar re-renders constantes
- **Solución potencial**: Debouncing o verificar cuándo y por qué se llama la función

---

## 🛠️ INFORMACIÓN TÉCNICA ADICIONAL

### Estructura HTML de los botones (para referencia)

```html
<button class="wizard-step-button" data-wizard-step="1">
  1. Datos personales
</button>
```

### CSS relevante del pseudo-elemento ::before (líneas 1557-1568)

```css
.wizard-step-button::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: var(--progress, 0%);  /* ← Variable CSS actualizada desde JS */
  background: rgba(101, 113, 255, 0.15);
  border-radius: 20px;
  transition: width 0.3s ease;
  z-index: -1;
}
```

**IMPORTANTE**: El `z-index: -1` hace que el progreso esté detrás del texto. Si algo rompe el stacking context, esto podría causar problemas visuales.

### Cuándo se llama updateWizardProgress()

Buscar en el código todas las referencias a esta función:
```bash
grep -n "updateWizardProgress()" pgconductor.html
```

Debe llamarse en:
- Al cargar datos del conductor desde backend
- Al cambiar valores en los campos (event listeners de 'input' o 'change')
- Después de publicar datos exitosamente
- Al navegar entre páginas del wizard

### Dónde se carga originalConductorData

Buscar en el código:
```bash
grep -n "originalConductorData =" pgconductor.html
```

Debe cargarse:
- Al obtener los datos del conductor desde FileMaker
- ANTES de llamar a `updateWizardProgress()` por primera vez

---

## ✅ CRITERIOS DE ÉXITO

La implementación será exitosa cuando:

1. ✅ El wizard se muestra correctamente al cargar la página
2. ✅ Los botones son clickeables y la navegación funciona
3. ✅ Los botones muestran correctamente el progreso azul por defecto
4. ✅ Al completar una página al 100% y publicar, el botón se pone verde con ✓
5. ✅ Al completar solo los campos requeridos y publicar, el botón se pone verde sin ✓
6. ✅ Al editar un campo de una página ya publicada, el botón vuelve a azul con progreso
7. ✅ La funcionalidad de publicación parcial sigue funcionando correctamente
8. ✅ No hay console.errors ni warnings en el navegador
9. ✅ Las animaciones funcionan correctamente (no se muestran permanentemente)

---

## 🧪 PLAN DE TESTING SUGERIDO

### Fase 1: Implementación incremental
1. **NO implementar todo a la vez**
2. Implementar SOLO la detección de estado `isPublished` sin cambiar CSS
3. Añadir console.logs para verificar que la detección funciona
4. Verificar que la página NO se rompe con solo la detección

### Fase 2: CSS gradual
1. Añadir SOLO los estilos `.published` sin modificar la lógica de aplicación
2. Verificar que el CSS no rompe los botones existentes

### Fase 3: Aplicación de clases
1. Aplicar las clases `.published` según la lógica
2. Verificar cada estado individualmente

### Fase 4: Testing de transiciones
1. Probar editar una página publicada → debe volver a azul
2. Probar publicar una página incompleta → debe ponerse verde sin ✓
3. Probar completar al 100% y publicar → debe ponerse verde con ✓

---

## 📝 NOTAS FINALES

- **CRÍTICO**: Hacer commit a GitHub ANTES de implementar esta funcionalidad
- **CRÍTICO**: Si algo se rompe, revertir INMEDIATAMENTE
- **RECOMENDACIÓN**: Implementar en una branch separada para poder hacer A/B testing
- **DEBUGGING**: Añadir console.logs extensivos para entender qué está pasando durante la inicialización

---

## 🔗 REFERENCIAS DE CÓDIGO

- Función `updateWizardProgress()` actual: líneas 3262-3327
- Mapeo `WIZARD_PAGE_FIELDS`: líneas 2651-2656
- Variable `currentWizardPage`: línea 2649
- Variable `originalConductorData`: línea 3160
- CSS `.wizard-step-button`: líneas 1545-1568
- CSS `.completed`: líneas 1593-1619
- Lógica de publicación parcial: líneas 4399-4443
- Función `showWizardPage()`: líneas 2681-2723

---

**Última actualización**: 2025-10-31
**Estado del archivo**: Revertido a funcionalidad parcial (sin estados de publicación)
**Commit actual**: 7f93ca1f (publicación parcial funcionando)
