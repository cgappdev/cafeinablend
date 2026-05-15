---
name: capacidades avanzadas e integración nativa
description: Dominio de Push Notifications, File System Access, integración de hardware y experiencia de instalación avanzada.
---
# Skill: Capacidades Avanzadas e Integración Nativa

Este documento explora las fronteras tecnológicas que permiten a una PWA integrarse profundamente con el sistema operativo y el hardware del dispositivo, ofreciendo una experiencia indistinguible de una aplicación nativa.

---

## 1. Reenganche e Interacción Nativa
Habilidades para mantener a los usuarios conectados con la aplicación incluso cuando no está abierta en el navegador.

* **Push & Notifications API:** Configuración de servicios de mensajería push y gestión de notificaciones visuales con acciones interactivas (botones en la notificación).
* **App Badging API:** Capacidad para mostrar y actualizar contadores de notificaciones (insignias) sobre el icono de la aplicación instalada.
* **Web Share API:** Implementación de la función de compartir nativa del sistema para enviar texto, enlaces o archivos a otras aplicaciones.

## 2. Acceso al Sistema y Archivos
Competencias para interactuar con los datos locales del usuario de forma segura y eficiente.

* **File System Access API:** Habilidad para leer, escribir y guardar cambios directamente en archivos y directorios del dispositivo del usuario.
* **File Handling:** Registro de la PWA como un manejador de archivos para permitir "Abrir con..." desde el explorador de archivos del sistema.
* **Contact Picker API:** Permitir que los usuarios seleccionen contactos de su agenda nativa para integrarlos en la aplicación.

## 3. Integración con Hardware y Sensores
Dominio de las APIs que permiten interactuar con los componentes físicos del dispositivo.

* **Sensores del Dispositivo:** Uso de acelerómetros, giroscopios, magnetómetros y sensores de luz ambiental.
* **Web Bluetooth & Web USB:** Capacidad avanzada para conectar la PWA con periféricos físicos de forma directa.
* **Idle Detection API:** Detectar cuando el usuario está inactivo o el dispositivo está bloqueado para optimizar procesos.

## 4. Experiencia de Instalación Avanzada
Perfeccionamiento de la presencia de la app en el ecosistema del usuario.

* **Protocol Handlers:** Registrar la PWA para manejar esquemas de URL personalizados (ej: `web+myapp://`).
* **Local Font Access:** Capacidad para utilizar las tipografías instaladas localmente en el sistema para diseños de alta precisión.

---

## Recursos Sugeridos
1. [Web Capabilities (Fugu) - web.dev](https://web.dev/fugu-status/)
2. [Push Notifications API - MDN](https://developer.mozilla.org/es/docs/Web/API/Push_API)
3. [File System Access API - web.dev](https://web.dev/file-system-access/)
