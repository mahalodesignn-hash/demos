// Capa de datos de la demo: todo se guarda en el navegador (localStorage).
// En la versión real esto se reemplaza por una base de datos online.

const CLAVE = "demo-reservas-v1";

// ---------- Fechas ----------
function aISO(fecha) {
  const a = fecha.getFullYear();
  const m = String(fecha.getMonth() + 1).padStart(2, "0");
  const d = String(fecha.getDate()).padStart(2, "0");
  return `${a}-${m}-${d}`;
}

function desdeISO(iso) {
  const [a, m, d] = iso.split("-").map(Number);
  return new Date(a, m - 1, d);
}

function hoyISO() {
  return aISO(new Date());
}

function sumarDias(iso, n) {
  const f = desdeISO(iso);
  f.setDate(f.getDate() + n);
  return aISO(f);
}

function minutos(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function aHora(min) {
  return `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;
}

function fechaLarga(iso) {
  const txt = desdeISO(iso).toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" });
  return txt.charAt(0).toUpperCase() + txt.slice(1);
}

function fechaCorta(iso) {
  return desdeISO(iso).toLocaleDateString("es-AR", { weekday: "short", day: "numeric", month: "numeric" });
}

// ---------- Estado ----------
function nuevoId() {
  return Math.random().toString(36).slice(2, 10);
}

function cargar() {
  try {
    const raw = localStorage.getItem(CLAVE);
    if (raw) return JSON.parse(raw);
  } catch (e) { /* sin almacenamiento: se usan datos de ejemplo en memoria */ }
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

// ---------- Horarios ----------
function servicioPorId(id) {
  return NEGOCIO.servicios.find((s) => s.id === id);
}

function ocupa(turno) {
  const ini = minutos(turno.hora);
  return [ini, ini + servicioPorId(turno.servicio).duracion];
}

// Horarios libres de un día para un servicio dado (sin los que ya pasaron, salvo incluirPasados)
function horariosLibres(datos, fechaISO, servicioId, incluirPasados = false) {
  const dia = desdeISO(fechaISO).getDay();
  const franjas = NEGOCIO.horarios[dia] || [];
  const dur = servicioPorId(servicioId).duracion;
  const tomados = datos.turnos
    .filter((t) => t.fecha === fechaISO && t.estado !== "cancelado")
    .map(ocupa);
  const ahora = new Date();
  const esHoy = fechaISO === hoyISO() && !incluirPasados;
  const libres = [];
  for (const [desde, hasta] of franjas) {
    for (let m = minutos(desde); m + dur <= minutos(hasta); m += NEGOCIO.intervaloMinutos) {
      if (esHoy && m <= ahora.getHours() * 60 + ahora.getMinutes()) continue;
      const choca = tomados.some(([a, b]) => m < b && m + dur > a);
      if (!choca) libres.push(aHora(m));
    }
  }
  return libres;
}

function diasHabiles(desdeISOFecha, cantidad) {
  const dias = [];
  for (let i = 0; i < cantidad; i++) {
    const iso = sumarDias(desdeISOFecha, i);
    if (NEGOCIO.horarios[desdeISO(iso).getDay()]) dias.push(iso);
  }
  return dias;
}

// ---------- WhatsApp (sin API: abre un chat con el mensaje escrito) ----------
function linkWhatsApp(telefono, mensaje) {
  return `https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`;
}

// ---------- Datos de ejemplo (relativos a hoy, así la demo siempre se ve actual) ----------
function datosDeEjemplo() {
  const nombres = ["Martina López", "Juan Pérez", "Sofía Fernández", "Lucas Romero", "Valentina Díaz",
    "Mateo Gutiérrez", "Camila Sosa", "Tomás Álvarez", "Julieta Torres", "Nicolás Ruiz",
    "Agustina Benítez", "Franco Medina", "Lucía Herrera", "Bruno Castro", "Florencia Ríos"];
  const tel = (i) => `549341555${String(1000 + i).slice(-4)}`;
  const turnos = [];
  const dias = diasHabiles(hoyISO(), 10);
  let n = 0;
  dias.forEach((dia, di) => {
    const cuantos = di < 3 ? 7 : 4;
    for (let k = 0; k < cuantos; k++) {
      const servicio = NEGOCIO.servicios[(n + k) % NEGOCIO.servicios.length].id;
      const libres = horariosLibres({ turnos }, dia, servicio, true);
      if (!libres.length) break;
      const hora = libres[(k * 3 + di) % libres.length];
      const estado = di === 0 ? "confirmado" : k % 3 === 0 ? "pendiente" : "confirmado";
      turnos.push({ id: nuevoId(), fecha: dia, hora, servicio, paciente: nombres[n % nombres.length],
        telefono: tel(n), estado, origen: "web", creado: hoyISO() });
      n++;
    }
  });
  const espera = [
    { id: nuevoId(), paciente: "Paula Giménez", telefono: tel(40), servicio: "limpieza", preferencia: "mañana", desde: sumarDias(hoyISO(), -2) },
    { id: nuevoId(), paciente: "Diego Morales", telefono: tel(41), servicio: "consulta", preferencia: "cualquiera", desde: sumarDias(hoyISO(), -1) },
    { id: nuevoId(), paciente: "Carla Acosta", telefono: tel(42), servicio: "arreglo", preferencia: "tarde", desde: hoyISO() },
  ];
  return { turnos, espera, recuperados: 0 };
}
