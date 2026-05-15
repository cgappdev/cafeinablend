---
name: almacenamiento y sincronización en PWAs
description: Capacidades críticas para gestionar IndexedDB, Background Sync, Web Storage y resolución de conflictos.
---
# Skill: Almacenamiento y Sincronización en PWAs

Este documento detalla las capacidades críticas para gestionar la persistencia de datos y la comunicación asíncrona con el servidor, garantizando que la experiencia del usuario no se interrumpa por la falta de conectividad.

---

## 1. IndexedDB: Persistencia a Gran Escala
A diferencia del almacenamiento simple, IndexedDB permite manejar estructuras de datos complejas de forma eficiente en el cliente.

* **Bases de Datos Transaccionales:** Capacidad para crear y gestionar almacenes de objetos (Object Stores) y realizar operaciones CRUD (Crear, Leer, Actualizar, Borrar).
* **Gestión de Índices:** Creación de índices para realizar buscas rápidas y consultas avanzadas sobre grandes volúmenes de datos.
* **Promisificación (IDB):** Uso de librerías como `idb` para integrar la base de datos con flujos modernos de JavaScript (`async/await`).

## 2. Background Sync API (Sincronización en Segundo Plano)
Competencia técnica para asegurar que las acciones del usuario lleguen al servidor incluso si la conexión falla momentáneamente.

* **Registro de Sync:** Habilidad para delegar tareas de red al Service Worker mediante el registro de eventos `sync`.
* **Resiliencia de Formularios:** Implementación de lógica para guardar datos de formularios en IndexedDB cuando el usuario está offline y enviarlos automáticamente al recuperar la conexión.
* **Manejo de Reintentos:** Configuración de estrategias de reintento para asegurar la integridad de los datos en condiciones de red inestable.

## 3. Web Storage y Cache Storage
Diferenciación y uso estratégico de los distintos tipos de almacenamiento disponibles en el navegador.

* **LocalStorage / SessionStorage:** Uso apropiado para guardar preferencias de interfaz o tokens de sesión ligeros.
* **Cache API:** Gestión manual del almacenamiento de respuestas HTTP para recursos que no son necesariamente estáticos, complementando el trabajo del Service Worker.

## 4. Estrategias de Resolución de Conflictos
Habilidades para mantener la integridad de los datos cuando se sincronizan cambios realizados fuera de línea.

* **Detección de Conflictos:** Identificar cuando la versión local de un dato difiere de la versión del servidor.
* **Políticas de Sincronización:** Implementación de reglas como "el último cambio gana" o fusiones de datos basadas en marcas de tiempo (*timestamps*).

---

## Recursos Sugeridos
1. [IndexedDB API - MDN](https://developer.mozilla.org/es/docs/Web/API/IndexedDB_API)
2. [Sincronización en segundo plano - web.dev](https://web.dev/periodic-background-sync/)
3. [Librería IDB en GitHub](https://github.com/jakearchibald/idb)
