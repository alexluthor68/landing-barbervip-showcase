# REGIONAL HARNESS & ARCHITECTURE: BARBERVIP SHOWCASE

## Contexto del Proyecto
BarberVIP AI Showcase es una aplicación web comercial (Landing Page + Sistema de Reservas en tiempo real) diseñada para mostrar y consumir el motor de automatizaciones hospedado en un contenedor Docker con n8n.

## Reglas de Arquitectura y Código
1. **Frontend:** Generar código limpio en `/web-app` utilizando HTML5, Tailwind CSS (vía CDN) y JavaScript ES6+ nativo (sin frameworks pesados innecesarios).
2. **Conexión Backend (n8n):** 
   - Todas las peticiones de reserva deben enviarse mediante `fetch` (POST) al endpoint Webhook de n8n: `http://localhost:5678/webhook/reserva`.
   - Formato JSON del payload: `{ "nombre": string, "telefono": string, "servicio": string, "fecha": string, "hora": string }`.
3. **Estilo de Diseño:** Interfaz oscura (dark mode), elegante, moderna, tipo barbería VIP/Luxury.
4. **Especificaciones:** Consultar siempre la carpeta `/ai-specs` antes de generar nuevos componentes o lógica.
5. **Idioma:** Código y comentarios en Inglés o Español técnico impecable.