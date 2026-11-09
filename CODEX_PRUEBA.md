# Prueba técnica de Oficina Virtual

## Arquitectura encontrada

La Oficina Virtual es una aplicación web 3D con frontend ES modules servido por Vite y un backend Express independiente. El proyecto usa Three.js `0.186.1` (incluido `three/webgpu` y TSL), Express 5 y Node.js en modo ESM (`"type": "module"`). Vite expone el frontend en el puerto `5173` y envía `/api` al servidor local `127.0.0.1:3001`.

## Puntos de entrada y ejecución

- `index.html` carga `/src/main.js` como módulo.
- `src/main.js` construye escena, cámara, habitación, cielo y paisaje; inicia `WebGPURenderer`, aplica bloom y configura cámara orbital y animación.
- `server/index.js` inicia Express en `127.0.0.1:3001`, expone salud, chat, generación de imágenes y operaciones del catálogo de dibujos.
- `vite.config.js` configura host/puerto de Vite, preview y proxy de API.
- `npm run dev` inicia Express y Vite en paralelo. El hook `predev` genera los catálogos antes del arranque; `npm run build` también genera catálogos antes de compilar.

## Funciones principales

### Escena 3D

- `src/world/room.js` compone la sala y delega geometría/materiales en módulos bajo `src/world/room/` (suelo, columnas, ventanas, molduras, cortinas y geometría de piedra).
- `src/world/sky.js`, `landscape.js` y `lighting.js` crean cielo, paisaje e iluminación.
- `src/objects/buttons.js` crea los botones 3D DIBUJOS, MÚSICA y COPILOT, detecta selección con raycasting y delega la apertura del panel.

### Interfaz y paneles

- `src/ui/interface.js` crea la etiqueta de backend gráfico y los mensajes breves de estado.
- `src/ui/panels.js`, mediante `createContentPanel()`, gestiona la ventana de trabajo y sus vistas: galería con visor y navegación, reproductor/lista musical persistente y chat con Codex.
- La galería consume `public/dibujos/manifest.json`; ofrece renombrado y borrado mediante los endpoints Express. El borrado solicita confirmación en la interfaz.

### Backend y catálogos

- `server/codex.js` conecta el backend con `codex app-server`, mantiene el identificador de conversación en `server/thread.json` y gestiona turnos.
- `server/cloudflare-image.js` genera imágenes mediante Cloudflare y las guarda en `public/dibujos/`.
- `server/index.js` valida las peticiones de chat/generación y los nombres de imagen. Sus endpoints `POST /api/drawings/rename` y `POST /api/drawings/delete` operan sobre los nombres incluidos en el manifest y comprueban los archivos antes de modificarlos.
- `scripts/generate-drawings-manifest.mjs` y `scripts/generate-music-manifest.mjs` reconstruyen los catálogos desde los archivos existentes.
- Los recursos web públicos están bajo `public/`: dibujos, música y materiales PBR.

## Utilidad de comprobación

`scripts/codex-test.js` comprueba desde la raíz del proyecto que existen `public/dibujos`, `src/ui` y `server`. Devuelve el resultado de cada ruta y termina con código distinto de cero si alguna falta.

## Alcance de las comprobaciones

La utilidad verifica estructura, `node --check` verifica sintaxis del backend y un build Vite dirigido a `/tmp` permite comprobar la compilación sin reemplazar `dist/` ni regenerar los manifests existentes. Estas comprobaciones no sustituyen una prueba visual en navegador ni validan credenciales externas de Codex o Cloudflare.
