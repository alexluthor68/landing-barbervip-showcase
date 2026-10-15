# PRD: BarberVIP Web Showcase

## Objetivo
Crear una Landing Page atractiva para la barbería BarberVIP que incluya un formulario de reserva interactivo conectado a n8n.

## Componentes Necesarios
1. **Header:** Logo de BarberVIP, menú de navegación y botón CTA "Reservar Cita".
2. **Hero Section:** Título impactante, descripción del servicio VIP e imagen de fondo luxury.
3. **Sección de Servicios:** Tarjetas interactivas con servicios (Corte Premium, Barba VIP, Combo Completo).
4. **Formulario de Citas:** 
   - Campos: Nombre Completo, Teléfono WhatsApp, Servicio, Fecha y Hora.
   - Botón de envío que ejecute la llamada Fetch al Webhook de n8n.
   - Modal o mensaje flotante de confirmación cuando el Webhook responda 200 OK.