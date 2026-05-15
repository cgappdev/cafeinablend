---
name: desarrollo frontend
description: Fundamentos de HTML5, CSS3, JavaScript ES6+ y Core Web Vitals para PWAs.
---
# Skill: Fundamentos de Desarrollo Frontend para PWAs

Este documento detalla las competencias esenciales para construir interfaces web modernas, resilientes y de alto rendimiento, optimizadas específicamente para Progressive Web Apps (PWAs).

---

## 1. HTML5: Estructura y Semántica Avanzada
El dominio de HTML es la base para la accesibilidad y el SEO de una aplicación.

* **Semántica Crítica:** Uso de etiquetas estructurales (`<main>`, `<section>`, `<nav>`, `<article>`) para facilitar la interpretación del árbol de accesibilidad.
* **Contenido Multimedia Adaptativo:** Implementación de imágenes responsivas mediante el uso de `<picture>` y los atributos `srcset` y `sizes`.
* **Formularios Optimizados:** Uso de atributos como `inputmode`, `autocomplete` y validaciones nativas para mejorar la experiencia de usuario en dispositivos móviles.

## 2. CSS3: Layouts Flexibles y Rendimiento Visual
Para una PWA, el diseño debe ser fluido y la carga visual instantánea.

* **Metodología Mobile-First:** Desarrollo de estilos partiendo de pantallas pequeñas y escalando mediante Media Queries (`min-width`).
* **Modelos de Layout:**
    - **Flexbox:** Alineación y distribución en una sola dimensión.
    - **CSS Grid:** Estructuras complejas y grillas bidimensionales.
* **Custom Properties (Variables):** Gestión de temas (Dark/Light mode) y consistencia de diseño a escala.
* **Optimización de Animaciones:** Uso de propiedades que no disparan el *layout* o *paint* del navegador, enfocándose en `transform` y `opacity`.

## 3. JavaScript Moderno (ES6+): Lógica y Reactividad
La interactividad es lo que diferencia a una PWA de un sitio estático.

* **Manipulación Eficiente del DOM:** Gestión de eventos táctiles (`touchstart`, `touchend`) y delegación de eventos.
* **Asincronía y Red:**
    - Dominio de **Fetch API** para comunicaciones cliente-servidor.
    - Uso de **Promises** y sintaxis **Async/Await** para flujos de datos no bloqueantes.
* **Módulos (ESM):** Organización de código mediante `import` y `export` para fomentar el mantenimiento y la reutilización.

## 4. Web Performance & Core Web Vitals
Habilidades técnicas para asegurar que la app se sienta rápida.

* **Critical Rendering Path:** Entender cómo el navegador procesa el HTML, CSS y JS para minimizar el tiempo hasta el primer pintado (FCP).
* **Lighthouse & DevTools:** Capacidad de diagnosticar cuellos de botella en el rendimiento y la accesibilidad desde el inspector del navegador.

---

## Recursos Sugeridos
1. MDN Web Docs (Estructura y API)
2. CSS-Tricks (Guías de Flexbox y Grid)
3. JavaScript.info (Lógica avanzada)