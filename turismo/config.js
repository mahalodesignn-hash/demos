// Configuración de la agencia. Para adaptar la demo a la clienta real, se cambia este archivo.
const AGENCIA = {
  nombre: "Byway Turismo",
  agente: "Byway",
  lema: "Viajes armados a tu medida",
  whatsapp: "5493410000000",
  email: "", // completar con el mail real de la agencia
  colorPrincipal: "#0e6ba8",
  moneda: "USD",
  validezDias: 3, // cuántos días vale un presupuesto (los precios de los mayoristas cambian)
  tiposDeViaje: ["Playa", "Nieve", "Ciudad", "Naturaleza / aventura", "Crucero", "Luna de miel", "Otro"],
  servicios: [
    { id: "vuelo", nombre: "Vuelos", icono: "✈️" },
    { id: "terrestre", nombre: "Traslados y terrestres", icono: "🚌" },
    { id: "alojamiento", nombre: "Alojamiento", icono: "🏨" },
    { id: "excursion", nombre: "Excursiones", icono: "🧭" },
    { id: "asistencia", nombre: "Asistencia al viajero", icono: "🩺" },
    { id: "auto", nombre: "Alquiler de auto", icono: "🚗" },
  ],
  presupuestos: [
    { id: "hasta800", texto: "Hasta USD 800 por persona" },
    { id: "800a1500", texto: "USD 800 a 1.500 por persona" },
    { id: "1500a3000", texto: "USD 1.500 a 3.000 por persona" },
    { id: "mas3000", texto: "Más de USD 3.000 por persona" },
    { id: "nose", texto: "Todavía no lo sé" },
  ],
  decision: [
    { id: "semana", texto: "Esta semana" },
    { id: "mes", texto: "Este mes" },
    { id: "mirando", texto: "Estoy mirando opciones" },
  ],
};
