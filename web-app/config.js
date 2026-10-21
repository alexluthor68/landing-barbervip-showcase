// ============================================================
// BarberVIP - Configuración del negocio
// Fuente única de verdad: moneda, horario y catálogo de servicios
// ============================================================

const BUSINESS_CONFIG = {
  currency: 'COP',
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
        open: '09:00',
        close: '14:00',
        is_open: false,
        note: 'Cerrado o únicamente atención con reserva previa'
      }
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
          description: 'Asesoría de imagen, corte a máquina/tijera y acabado con cera/polvo voluminizador.'
        },
        {
          name: 'Visagismo + Corte Exclusivo',
          price_range: '180.000',
          duration: '60 - 90 min',
          description: 'Análisis morfológico de rostro para la elección exacta del estilo según facciones.'
        },
        {
          name: 'Corte Infantil',
          price_range: '25.000 - 35.000',
          duration: '30 - 45 min',
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
          description: 'Diseño de líneas según rostro y perfilado a navaja.'
        },
        {
          name: 'Ritual de Barba Térmico / Ozono',
          price_range: '35.000 - 48.000',
          duration: '40 min',
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
          description: 'Corte personalizado + perfilado o ritual de barba completo.'
        },
        {
          name: 'Combo Full Grooming (Corte + Barba + Cejas)',
          price_range: '60.000 - 90.000',
          duration: '85 min',
          description: 'Experiencia completa para el cuidado de rostro y cabello.'
        },
        {
          name: 'Corte + Limpieza Facial Expres',
          price_range: '50.000',
          duration: '40 min',
          description: 'Renovación capilar acompañada de exfoliación facial.'
        }
      ]
    }
  ]
};
