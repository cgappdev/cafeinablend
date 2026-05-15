---
name: optimización, seguridad y auditoría
description: Dominio de Web Performance (Core Web Vitals), seguridad HTTPS/CSP y herramientas de auditoría como Lighthouse.
---
# Skill: Optimización, Seguridad y Auditoría

Este documento se centra en los pilares que garantizan que una PWA no solo sea funcional, sino también rápida, segura y confiable para el usuario final.

---

## 1. Optimización del Rendimiento (Web Performance)
Una PWA debe cargar instantáneamente y responder sin retrasos (*jank*).

* **Core Web Vitals:** Dominio de las métricas clave de Google:
    - **LCP (Largest Contentful Paint):** Optimización del tiempo de carga del contenido principal.
    - **FID (First Input Delay):** Mejora de la interactividad inicial.
    - **CLS (Cumulative Layout Shift):** Prevención de movimientos inesperados de elementos.
* **Critical Rendering Path:** Optimización del orden de carga de HTML, CSS y JS para mostrar la interfaz básica (App Shell) lo antes posible.
* **Lazy Loading & Code Splitting:** Implementación de carga perezosa para imágenes y división de código JavaScript para enviar solo lo necesario.

## 2. Seguridad en el Entorno PWA
La seguridad es un requisito técnico indispensable para que los Service Workers y las APIs de hardware funcionen.

* **Protocolo HTTPS:** Configuración y gestión de certificados SSL/TLS. Las PWAs requieren un origen seguro por diseño.
* **Content Security Policy (CSP):** Implementación de políticas para prevenir ataques de Cross-Site Scripting (XSS) e inyección de datos.
* **Persistencia Segura:** Manejo seguro de tokens de autenticación y datos sensibles en IndexedDB o Cookies (atributos `HttpOnly` y `Secure`).

## 3. Auditoría y Diagnóstico
Habilidades para medir y corregir problemas antes del despliegue.

* **Lighthouse:** Uso profesional de la herramienta de auditoría para obtener puntuaciones óptimas en PWA, Performance, Accesibilidad y SEO.
* **Chrome DevTools (Panel de Performance):** Capacidad para grabar perfiles de rendimiento, identificar cuellos de botella y fugas de memoria.
* **Network Throttling:** Pruebas de la aplicación bajo condiciones de red simuladas (3G lento u offline) para validar la resiliencia.

## 4. Estrategias de Carga Avanzadas
Técnicas para exprimir cada milisegundo de rendimiento.

* **Preloading & Prefetching:** Uso de directivas `<link rel="preload">` para recursos críticos.
* **Compresión:** Implementación de formatos modernos como **Brotli** o **WebP** para reducir el peso de la transferencia de datos.

---

## Recursos Sugeridos
1. [Web Vitals - web.dev](https://web.dev/vitals/)
2. [Guía de Seguridad en PWAs - web.dev](https://web.dev/security/)
3. [Lighthouse Documentation](https://developer.chrome.com/docs/lighthouse/overview/)
