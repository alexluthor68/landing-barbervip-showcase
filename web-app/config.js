// ============================================================
// BarberVIP - Configuración del negocio
// Fuente única de verdad: moneda, horario, catálogo y endpoint de n8n
// ============================================================

const BUSINESS_CONFIG = {
  currency: 'COP',

  // Endpoint de n8n que recibe las reservas.
  // webhook_url: URL pública HTTPS en producción (tunnel ngrok: cambia al
  // reiniciar el túnel). Si se deja vacía se usa el fallback local
  // (n8n en Docker dentro del mismo host).
  n8n: {
    webhook_url: 'https://tilt-banking-rimless.ngrok-free.dev/webhook/reserva',
    webhook_fallback: 'http://localhost:5678/webhook/reserva'
  },

  business_hours: {
    timezone: 'America/Bogota',
    schedule: [
      {
        days: ['Lunes', 'Martes', 'Miércoles', 'Jueves'],
        label: 'Lunes a Jueves',
        open: '08:00',
        close: '19:30',
        is_open: true
      },
      {
        days: ['Viernes', 'Sábado'],
        label: 'Viernes y Sábado',
        open: '08:00',
        close: '20:30',
        is_open: true
      },
      {
        days: ['Domingo'],
        label: 'Domingos',
        open: '09:00',
        close: '16:00',
        is_open: true
      },
      {
        days: ['Festivos'],
        label: 'Festivos',
        is_open: false,
        note: 'Cerrado o únicamente atención con reserva previa'
      }
    ],

    // Festivos de Colombia (Ley 51 de 1983 - Ley Emiliani).
    // Fechas ya trasladadas al lunes cuando corresponde.
    // Actualizar anualmente: sin esta lista, un festivo se atendería como día normal.
    holidays: [
      { date: '2026-01-01', name: 'Año Nuevo' },
      { date: '2026-01-12', name: 'Día de los Reyes Magos' },
      { date: '2026-03-23', name: 'Día de San José' },
      { date: '2026-04-02', name: 'Jueves Santo' },
      { date: '2026-04-03', name: 'Viernes Santo' },
      { date: '2026-05-01', name: 'Día del Trabajo' },
      { date: '2026-05-18', name: 'Ascensión del Señor' },
      { date: '2026-06-08', name: 'Corpus Christi' },
      { date: '2026-06-15', name: 'Sagrado Corazón de Jesús' },
      { date: '2026-06-29', name: 'San Pedro y San Pablo' },
      { date: '2026-07-13', name: 'Virgen de Chiquinquirá' },
      { date: '2026-07-20', name: 'Día de la Independencia' },
      { date: '2026-08-07', name: 'Batalla de Boyacá' },
      { date: '2026-08-17', name: 'Asunción de la Virgen' },
      { date: '2026-10-12', name: 'Día de la Diversidad Étnica y Cultural' },
      { date: '2026-11-02', name: 'Día de Todos los Santos' },
      { date: '2026-11-16', name: 'Independencia de Cartagena' },
      { date: '2026-12-08', name: 'Inmaculada Concepción' },
      { date: '2026-12-25', name: 'Navidad' },

      { date: '2027-01-01', name: 'Año Nuevo' },
      { date: '2027-01-11', name: 'Día de los Reyes Magos' },
      { date: '2027-03-22', name: 'Día de San José' },
      { date: '2027-03-25', name: 'Jueves Santo' },
      { date: '2027-03-26', name: 'Viernes Santo' },
      { date: '2027-05-01', name: 'Día del Trabajo' },
      { date: '2027-05-10', name: 'Ascensión del Señor' },
      { date: '2027-05-31', name: 'Corpus Christi' },
      { date: '2027-06-07', name: 'Sagrado Corazón de Jesús' },
      { date: '2027-07-05', name: 'San Pedro y San Pablo' },
      { date: '2027-07-12', name: 'Virgen de Chiquinquirá' },
      { date: '2027-07-20', name: 'Día de la Independencia' },
      { date: '2027-08-07', name: 'Batalla de Boyacá' },
      { date: '2027-08-16', name: 'Asunción de la Virgen' },
      { date: '2027-10-18', name: 'Día de la Diversidad Étnica y Cultural' },
      { date: '2027-11-01', name: 'Día de Todos los Santos' },
      { date: '2027-11-15', name: 'Independencia de Cartagena' },
      { date: '2027-12-08', name: 'Inmaculada Concepción' },
      { date: '2027-12-25', name: 'Navidad' }
    ],

    peak_hours_note: 'Horas pico: Viernes y Sábados de 3:00 PM a 7:00 PM'
  },
  categories: [
    {
      id: 'cortes',
      name: 'Cortes & Estilo',
      icon: '&#9986;', // tijeras
      services: [
        {
          name: 'Corte Caballero Clásico / Fade',
          price_range: '25.000 - 42.000',
          duration: '30 - 60 min',
          duration_min: 30,
          duration_max: 60,
          description: 'Asesoría de imagen, corte a máquina/tijera y acabado con cera/polvo voluminizador.'
        },
        {
          name: 'Visagismo + Corte Exclusivo',
          price_range: '180.000',
          duration: '60 - 90 min',
          duration_min: 60,
          duration_max: 90,
          description: 'Análisis morfológico de rostro para la elección exacta del estilo según facciones.'
        },
        {
          name: 'Corte Infantil',
          price_range: '25.000 - 35.000',
          duration: '30 - 45 min',
          duration_min: 30,
          duration_max: 45,
          description: 'Atención paciente y adaptada para niños.'
        }
      ]
    },
    {
      id: 'barba',
      name: 'Barbería & Barba',
      icon: '&#129498;', // hombre con barba
      services: [
        {
          name: 'Arreglo y Perfilado de Barba',
          price_range: '20.000 - 30.000',
          duration: '20 - 35 min',
          duration_min: 20,
          duration_max: 35,
          description: 'Diseño de líneas según rostro y perfilado a navaja.'
        },
        {
          name: 'Ritual de Barba Térmico / Ozono',
          price_range: '35.000 - 48.000',
          duration: '40 min',
          duration_min: 40,
          duration_max: 40,
          description: 'Vapor de ozono / toalla caliente para abrir poros, exfoliación y bálsamo hidratante.'
        }
      ]
    },
    {
      id: 'combos',
      name: 'Combos VIP',
      icon: '&#128142;', // diamante
      services: [
        {
          name: 'Combo Corte + Barba',
          price_range: '55.000 - 80.000',
          duration: '60 - 80 min',
          duration_min: 60,
          duration_max: 80,
          description: 'Corte personalizado + perfilado o ritual de barba completo.'
        },
        {
          name: 'Combo Full Grooming (Corte + Barba + Cejas)',
          price_range: '60.000 - 90.000',
          duration: '85 min',
          duration_min: 85,
          duration_max: 85,
          description: 'Experiencia completa para el cuidado de rostro y cabello.'
        },
        {
          name: 'Corte + Limpieza Facial Expres',
          price_range: '50.000',
          duration: '40 min',
          duration_min: 40,
          duration_max: 40,
          description: 'Renovación capilar acompañada de exfoliación facial.'
        }
      ]
    }
  ]
};
