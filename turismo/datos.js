// Capa de datos de la demo: todo se guarda en el navegador (localStorage).
// En la versión real esto se reemplaza por una base de datos online.

const CLAVE = "demo-turismo-v1";

function hoyISO() {
  const f = new Date();
  return `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, "0")}-${String(f.getDate()).padStart(2, "0")}`;
}

function sumarDias(iso, n) {
  const [a, m, d] = iso.split("-").map(Number);
  const f = new Date(a, m - 1, d + n);
  return `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, "0")}-${String(f.getDate()).padStart(2, "0")}`;
}

function fechaLinda(iso) {
  if (!iso) return "";
  const [a, m, d] = iso.split("-").map(Number);
  return new Date(a, m - 1, d).toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" });
}

function nuevoId() {
  return Math.random().toString(36).slice(2, 10);
}

function plata(n) {
  return `${AGENCIA.moneda} ${Math.round(n).toLocaleString("es-AR")}`;
}

function escapar(txt) {
  const d = document.createElement("div");
  d.textContent = txt == null ? "" : String(txt);
  return d.innerHTML;
}

function linkWhatsApp(telefono, mensaje) {
  return `https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`;
}

function servicioPorId(id) {
  return AGENCIA.servicios.find((s) => s.id === id);
}

function textoDe(lista, id) {
  return (lista.find((x) => x.id === id) || {}).texto || "";
}

function cargar() {
  try {
    const raw = localStorage.getItem(CLAVE);
    if (raw) return JSON.parse(raw);
  } catch (e) { /* sin almacenamiento: datos de ejemplo en memoria */ }
  const datos = datosDeEjemplo();
  guardar(datos);
  return datos;
}

function guardar(datos) {
  try { localStorage.setItem(CLAVE, JSON.stringify(datos)); } catch (e) { /* ignorar */ }
}

function reiniciarDemo() {
  try { localStorage.removeItem(CLAVE); } catch (e) { /* ignorar */ }
  return cargar();
}

// ---------- Calificación de consultas ----------
// Devuelve { puntaje, nivel: "caliente" | "tibio" | "frio", motivos: [...] }
function calificar(c) {
  let p = 0;
  const motivos = [];
  if (c.decision === "semana") { p += 3; motivos.push("quiere decidir esta semana"); }
  else if (c.decision === "mes") { p += 2; motivos.push("decide este mes"); }
  else motivos.push("está mirando opciones");
  if (c.fechaIda) { p += 2; motivos.push("tiene fechas"); }
  else if (c.mesAproximado) { p += 1; motivos.push("tiene mes aproximado"); }
  else motivos.push("sin fechas");
  if (c.presupuesto && c.presupuesto !== "nose") { p += 2; motivos.push("definió presupuesto"); }
  else motivos.push("sin presupuesto definido");
  if ((c.servicios || []).length >= 2) { p += 1; motivos.push("quiere paquete completo"); }
  if (c.email) p += 1;
  if (c.destino && c.destino.trim().length > 2) p += 1;
  const nivel = p >= 9 ? "caliente" : p >= 5 ? "tibio" : "frio";
  return { puntaje: p, nivel, motivos };
}

const NIVELES = {
  caliente: { texto: "🔥 Caliente", clase: "cancelado" },
  tibio: { texto: "🟡 Tibio", clase: "pendiente" },
  frio: { texto: "❄️ Frío", clase: "recuperado" },
};

// ---------- Presupuestos ----------
function precioItem(item, margen) {
  return item.costo * (1 + margen / 100);
}

function totalOpcion(opcion, margen) {
  return opcion.items.reduce((s, it) => s + precioItem(it, margen), 0);
}

// El link del presupuesto lleva todos los datos adentro, así funciona en cualquier celular
// sin base de datos. (En producción se reemplaza por un link corto con id.)
function codificarPresupuesto(obj) {
  const json = JSON.stringify(obj);
  return btoa(String.fromCharCode(...new TextEncoder().encode(json)))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function decodificarPresupuesto(txt) {
  const b64 = txt.replace(/-/g, "+").replace(/_/g, "/");
  const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes));
}

// Arma lo que ve el cliente: sin costos ni margen, solo precios finales
function versionCliente(pres, consulta, prefs) {
  return {
    agencia: { nombre: AGENCIA.nombre, agente: AGENCIA.agente, whatsapp: AGENCIA.whatsapp, email: AGENCIA.email },
    cliente: consulta ? consulta.nombre : pres.cliente,
    titulo: pres.titulo,
    destino: pres.destino,
    fechaIda: pres.fechaIda,
    fechaVuelta: pres.fechaVuelta,
    pasajeros: pres.pasajeros,
    nota: pres.nota,
    emitido: pres.emitido || hoyISO(),
    validoHasta: sumarDias(pres.emitido || hoyISO(), AGENCIA.validezDias),
    opciones: pres.opciones.map((o) => ({
      nombre: o.nombre,
      recomendada: o.recomendada,
      items: o.items.map((it) => ({ tipo: it.tipo, titulo: it.titulo, detalle: it.detalle, precio: Math.round(precioItem(it, prefs.margen)) })),
    })),
    incluye: pres.incluye,
    noIncluye: pres.noIncluye,
  };
}

// ---------- Datos de ejemplo ----------
function datosDeEjemplo() {
  const hoy = hoyISO();
  const consultas = [
    { id: "c1", creada: hoy, nombre: "Mariana Paz", whatsapp: "5493415551001", email: "mariana@mail.com",
      destino: "Florianópolis", tipo: "Playa", fechaIda: sumarDias(hoy, 70), fechaVuelta: sumarDias(hoy, 80),
      mesAproximado: "", flexible: true, adultos: 2, ninos: 2, edadesNinos: "6 y 9",
      servicios: ["vuelo", "alojamiento", "terrestre", "asistencia"], presupuesto: "800a1500", decision: "semana",
      comentario: "Queremos algo cerca de la playa, con pileta para los chicos.", estado: "presupuestada" },
    { id: "c2", creada: hoy, nombre: "Jorge Salinas", whatsapp: "5493415551002", email: "jsalinas@mail.com",
      destino: "Madrid y Roma", tipo: "Ciudad", fechaIda: "", fechaVuelta: "", mesAproximado: "Mayo",
      flexible: true, adultos: 2, ninos: 0, edadesNinos: "", servicios: ["vuelo", "alojamiento", "excursion", "asistencia"],
      presupuesto: "1500a3000", decision: "mes", comentario: "Aniversario de casados, 15 días.", estado: "nueva" },
    { id: "c3", creada: sumarDias(hoy, -1), nombre: "Lucía Benítez", whatsapp: "5493415551003", email: "",
      destino: "Bariloche", tipo: "Nieve", fechaIda: sumarDias(hoy, 20), fechaVuelta: sumarDias(hoy, 27),
      mesAproximado: "", flexible: false, adultos: 4, ninos: 0, edadesNinos: "", servicios: ["vuelo", "alojamiento", "auto"],
      presupuesto: "800a1500", decision: "semana", comentario: "Viaje con amigas.", estado: "nueva" },
    { id: "c4", creada: sumarDias(hoy, -2), nombre: "Pablo Ortiz", whatsapp: "5493415551004", email: "",
      destino: "", tipo: "Playa", fechaIda: "", fechaVuelta: "", mesAproximado: "", flexible: true,
      adultos: 1, ninos: 0, edadesNinos: "", servicios: ["vuelo"], presupuesto: "nose", decision: "mirando",
      comentario: "¿Qué hay barato para el Caribe?", estado: "nueva" },
  ];
  const presupuestos = [
    { id: "p1", consultaId: "c1", titulo: "Florianópolis en familia", destino: "Florianópolis, Brasil",
      fechaIda: consultas[0].fechaIda, fechaVuelta: consultas[0].fechaVuelta, pasajeros: "2 adultos + 2 menores (6 y 9)",
      emitido: hoy, estado: "borrador",
      nota: "Armé dos opciones: una más económica en Canasvieiras y otra en Jurerê, que es más tranquila y tiene hoteles con pileta para chicos.",
      incluye: "Vuelos ida y vuelta con equipaje en bodega, traslados aeropuerto–hotel–aeropuerto, alojamiento con desayuno, asistencia al viajero.",
      noIncluye: "Comidas no mencionadas, excursiones opcionales, gastos personales.",
      opciones: [
        { nombre: "Opción Canasvieiras", recomendada: false, items: [
          { tipo: "vuelo", titulo: "Rosario → Florianópolis (vía Buenos Aires)", detalle: "Aerolíneas Argentinas · valija 23 kg", proveedor: "Mayorista Andes", costo: 1720 },
          { tipo: "terrestre", titulo: "Traslados in / out", detalle: "Privado, aeropuerto ↔ hotel", proveedor: "Mayorista Sol", costo: 90 },
          { tipo: "alojamiento", titulo: "Pousada Mar Azul · 10 noches", detalle: "Habitación familiar · desayuno · a 1 cuadra del mar", proveedor: "Mayorista Sol", costo: 1150 },
          { tipo: "asistencia", titulo: "Asistencia al viajero 11 días", detalle: "Cobertura USD 60.000 por persona", proveedor: "Asistencia Global", costo: 160 },
        ] },
        { nombre: "Opción Jurerê", recomendada: true, items: [
          { tipo: "vuelo", titulo: "Rosario → Florianópolis (vía Buenos Aires)", detalle: "Aerolíneas Argentinas · valija 23 kg", proveedor: "Mayorista Andes", costo: 1720 },
          { tipo: "terrestre", titulo: "Traslados in / out", detalle: "Privado, aeropuerto ↔ hotel", proveedor: "Mayorista Sol", costo: 90 },
          { tipo: "alojamiento", titulo: "Hotel Jurerê Praia · 10 noches", detalle: "Suite familiar · desayuno · pileta y club de niños", proveedor: "Mayorista Sol", costo: 1980 },
          { tipo: "asistencia", titulo: "Asistencia al viajero 11 días", detalle: "Cobertura USD 60.000 por persona", proveedor: "Asistencia Global", costo: 160 },
          { tipo: "excursion", titulo: "Paseo en barco a Ilha do Campeche", detalle: "Día completo, 4 personas", proveedor: "Mayorista Sol", costo: 180 },
        ] },
      ] },
  ];
  const preferencias = {
    margen: 12,
    aerolineas: "Aerolíneas Argentinas, LATAM, Gol. Evitar escalas de más de 4 hs.",
    hoteles: "Siempre con desayuno. Para familias: pileta. Puntaje mínimo 8 en reseñas.",
    asistencia: "Asistencia Global (mínimo USD 60.000 de cobertura; USD 150.000 para Europa/EE.UU.).",
    autos: "Rentadora Sur. Siempre con seguro total.",
    mayoristas: "Mayorista Andes (aéreos), Mayorista Sol (Brasil y Caribe), Mayorista Europa (Europa).",
    notas: "Mandar siempre 2 o 3 opciones, marcar la recomendada. Aclarar que los precios pueden cambiar hasta reservar.",
  };
  return { consultas, presupuestos, preferencias };
}
