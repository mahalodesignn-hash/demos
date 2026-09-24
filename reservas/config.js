// Configuración del negocio. Para adaptar la demo a otro cliente o rubro,
// se cambia solo este archivo (nombre, colores, servicios, horarios).
const NEGOCIO = {
  nombre: "Consultorio Odontológico Sonrisa",
  profesional: "Dra. Laura Gómez",
  rubro: "Odontología",
  direccion: "Córdoba 1234, Rosario",
  whatsapp: "5493410000000", // formato internacional sin + ni espacios
  colorPrincipal: "#0f766e",
  // Palabras que cambian según el rubro (paciente / cliente, turno / reserva)
  textos: {
    cliente: "paciente",
    clientes: "pacientes",
    turno: "turno",
  },
  servicios: [
    { id: "consulta", nombre: "Consulta / control", duracion: 30 },
    { id: "limpieza", nombre: "Limpieza dental", duracion: 30 },
    { id: "arreglo", nombre: "Arreglo de caries", duracion: 60 },
    { id: "blanqueamiento", nombre: "Blanqueamiento", duracion: 60 },
  ],
  // Días: 0 = domingo ... 6 = sábado
  horarios: {
    1: [["09:00", "13:00"], ["15:00", "19:00"]],
    2: [["09:00", "13:00"], ["15:00", "19:00"]],
    3: [["09:00", "13:00"]],
    4: [["09:00", "13:00"], ["15:00", "19:00"]],
    5: [["09:00", "13:00"], ["15:00", "18:00"]],
  },
  intervaloMinutos: 30,
  diasParaReservar: 14,
};
