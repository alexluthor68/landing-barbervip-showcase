# REGIONAL HARNESS & ARCHITECTURE: BARBERVIP SHOWCASE

## Contexto del Proyecto
BarberVIP AI Showcase es una aplicación web comercial (Landing Page + Sistema de Reservas en tiempo real) diseñada para mostrar y consumir el motor de automatizaciones hospedado en un contenedor Docker con n8n.

## Reglas de Arquitectura y Código
1. **Frontend:** Generar código limpio en `/web-app` utilizando HTML5, Tailwind CSS (vía CDN) y JavaScript ES6+ nativo (sin frameworks pesados innecesarios).
2. **Conexión Backend (n8n):** 
   - Todas las peticiones de reserva deben enviarse mediante `fetch` (POST) al endpoint Webhook de n8n.
   - La URL se define en `/web-app/config.js` → `BUSINESS_CONFIG.n8n.webhook_url` (URL pública HTTPS en producción). Si se deja vacía se usa el fallback local `http://localhost:5678/webhook/reserva`. Nunca hardcodear IPs ni URLs dentro de `index.html`.
   - Formato JSON del payload: `{ "nombre": string, "telefono": string, "servicio": string, "fecha": string, "hora": string }`.
3. **Estilo de Diseño:** Interfaz oscura (dark mode), elegante, moderna, tipo barbería VIP/Luxury.
4. **Especificaciones:** Consultar siempre la carpeta `/ai-specs` antes de generar nuevos componentes o lógica.
5. **Reglas de Negocio:** Horario, días festivos (`business_hours.holidays`) y duración de los servicios (`duration_min` / `duration_max`) se administran únicamente en `/web-app/config.js`. La lista de festivos se actualiza anualmente.
6. **Verificación:** Tras cada cambio en `/web-app` ejecutar `node ai-specs/scripts/verify-barbervip.js` (reglas de negocio, sin dependencias) y `node ai-specs/scripts/e2e-barbervip.js` (navegador real, requiere Chrome/Edge en el PATH o `CHROME_PATH`).
7. **Idioma:** Código y comentarios en Inglés o Español técnico impecable.
