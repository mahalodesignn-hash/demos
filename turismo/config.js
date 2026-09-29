// Configuración de la agencia. Para adaptar la demo a la clienta real, se cambia este archivo.
const AGENCIA = {
  nombre: "Byway Turismo",
  agente: "Byway",
  lema: "Transformamos tu forma de viajar",
  detalle: "Más de 10 años de trayectoria · Legajo 19727",
  instagram: "bywayturismo",
  logo: "img/logo-circulo.png", // sacado de su Linktree
  whatsapp: "5493410000000", // número de la demo (no es de Byway)
  email: "", // completar con el mail real de la agencia
  colorPrincipal: "#d6304a", // coral de su logo (#FA485C), un poco más oscuro para que el texto blanco se lea bien
  // Vendedoras (de su Linktree). Cada consulta y presupuesto queda a nombre de una.
  vendedoras: [
    { nombre: "Ana Costa", whatsapp: "5493416906069" },
    { nombre: "Micaela Senn", whatsapp: "5493462638457" },
    { nombre: "Victoria Marcili", whatsapp: "5493400657248" },
    { nombre: "Rocío Quinteros", whatsapp: "5493412178605" },
  ],
  // false: en la demo los botones de WhatsApp del cliente van al número de la demo, NO a las vendedoras
  // (para no mandarles mensajes de prueba). Poner true cuando Byway lo use de verdad.
  whatsappDeVendedoras: false,
  moneda: "USD",
  validezDias: 3, // cuántos días vale un presupuesto (los precios de los mayoristas cambian)
  prefijoCotizacion: "BYW", // número de cotización: BYW-2026-0001
  formaPago: "Hasta 6 cuotas sin interés con tarjeta de crédito, o transferencia con descuento.",
  condiciones: "Tarifas sujetas a disponibilidad y modificación sin previo aviso hasta el momento de la reserva y emisión.",
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
  // Sitios donde busca la agente (mayoristas, plataformas, proveedores) y qué servicios tiene cada uno.
  // En la demo los resultados son simulados; en la versión real el agente entra a cada sitio con su usuario.
  // soloDestinos (opcional): el sitio solo se consulta para destinos que coinciden.
  sitios: [
    // Mayoristas (portales con usuario de la agencia)
    { nombre: "Mayorista Andes", tipos: ["vuelo", "terrestre"] },
    { nombre: "Mayorista Sol", tipos: ["vuelo", "alojamiento", "terrestre", "excursion"] },
    { nombre: "Mayorista Europa", tipos: ["vuelo", "alojamiento", "excursion"],
      soloDestinos: /europa|espa[ñn]a|madrid|barcelona|roma|italia|francia|par[ií]s|londres|portugal|lisboa|grecia|alemania/i },
    // Buscadores públicos: además de los resultados, tienen botón para abrir la búsqueda real con los datos cargados
    { nombre: "Google Vuelos", tipos: ["vuelo"], web: "googleVuelos" },
    { nombre: "Skyscanner", tipos: ["vuelo"], web: "skyscanner" },
    { nombre: "Booking", tipos: ["alojamiento"], web: "booking" },
    { nombre: "Airbnb", tipos: ["alojamiento"], web: "airbnb" },
    { nombre: "TripAdvisor", tipos: ["excursion"], web: "tripadvisor" },
    { nombre: "GetYourGuide", tipos: ["excursion", "terrestre"], web: "getyourguide" },
    { nombre: "Rentalcars", tipos: ["auto"], web: "rentalcars" },
    // Proveedores directos
    { nombre: "Asistencia Global", tipos: ["asistencia"] },
    { nombre: "Rentadora Sur", tipos: ["auto"] },
  ],

  decision: [
    { id: "semana", texto: "Esta semana" },
    { id: "mes", texto: "Este mes" },
    { id: "mirando", texto: "Estoy mirando opciones" },
  ],
};
