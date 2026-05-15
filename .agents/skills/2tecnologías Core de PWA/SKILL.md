---
name: tecnologías Core de PWA
description: Dominio de Service Workers, Estrategias de Caching, Manifest y Arquitectura App Shell.
---
# Skill: Tecnologías Core de PWA

Este documento profundiza en los componentes fundamentales que transforman una aplicación web convencional en una Progressive Web App (PWA) de alto rendimiento, capaz de ofrecer una experiencia nativa y resiliente.

---

## 1. Service Workers: El Motor de la PWA
El Service Worker es el componente central que actúa como un proxy entre la aplicación, el navegador y la red. Las competencias clave incluyen:

* **Ciclo de Vida:** Comprender y gestionar las etapas críticas de instalación, activación y el evento `fetch`.
* **Proxy de Red:** Interceptar solicitudes para decidir estratégicamente si se sirven desde la caché o desde internet.
* **Actualizaciones:** Implementar lógica para detectar nuevas versiones del Service Worker y asegurar que el usuario reciba el contenido más reciente.

## 2. Estrategias de Caching (Funcionamiento Offline)
Dominar patrones de almacenamiento es vital para asegurar que la app funcione con conectividad limitada o nula. Se deben conocer las siguientes estrategias:

* **Cache-First:** Ideal para activos estáticos como imágenes, fuentes y estilos que no cambian frecuentemente.
* **Network-First:** Preferible para datos dinámicos donde la prioridad es la frescura de la información, recurriendo a la caché solo si falla la red.
* **Stale-While-Revalidate:** Ofrece contenido rápido desde la caché mientras se actualiza silenciosamente en segundo plano para futuras visitas.

## 3. Web App Manifest
Configuración de la identidad visual y el comportamiento de instalación de la aplicación en el dispositivo.

* **Archivo JSON:** Creación del manifiesto para definir el nombre de la app, iconos, colores de tema y de fondo.
* **Modos de Visualización:** Configuración del parámetro `display` (como `standalone` o `fullscreen`) para emular la experiencia de una app nativa sin la interfaz del navegador.
* **Prompts de Instalación:** Gestión de la experiencia de "Añadir a la pantalla de inicio" mediante eventos nativos del navegador.

## 4. Arquitectura de Application Shell
Diseño estructural enfocado en la carga instantánea de la interfaz.

* **Separación de Conceptos:** Diseñar una "concha" básica (HTML, CSS y JS) que se almacene en caché para mostrarse de inmediato al abrir la app.
* **Carga Dinámica:** Poblar la interfaz con contenido real mediante JavaScript una vez que la estructura básica está presente.

---

## Recursos Sugeridos
1. [Vitals de PWA - web.dev](https://web.dev/learn/pwa/)
2. [Service Worker API - MDN](https://developer.mozilla.org/es/docs/Web/API/Service_Worker_API)
3. [Workbox (Google Chrome)](https://developer.chrome.com/docs/workbox/)
