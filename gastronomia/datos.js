// Datos de la demo: se guardan en el navegador (localStorage), uno por local.
// En la versión real: base de datos en tiempo real, así el pedido del celular del cliente aparece en la tablet del mozo.

const CLAVE = `demo-gastro-v1-${ID_LOCAL}`;

function ahora() {
  const f = new Date();
  return `${String(f.getHours()).padStart(2, "0")}:${String(f.getMinutes()).padStart(2, "0")}`;
}

function haceMin(n) {
  const f = new Date(Date.now() - n * 60000);
  return `${String(f.getHours()).padStart(2, "0")}:${String(f.getMinutes()).padStart(2, "0")}`;
}

function nuevoId() {
  return Math.random().toString(36).slice(2, 10);
}

function plata(n) {
  return `${LOCAL.moneda} ${Math.round(n).toLocaleString("es-AR")}`;
}

function escapar(txt) {
  const d = document.createElement("div");
  d.textContent = txt == null ? "" : String(txt);
  return d.innerHTML;
}

function todosLosItems() {
  return LOCAL.categorias.flatMap((c) => c.items);
}

function itemPorId(id) {
  return todosLosItems().find((i) => i.id === id);
}

function cargar() {
  try {
    const raw = localStorage.getItem(CLAVE);
    if (raw) return normalizar(JSON.parse(raw));
  } catch (e) { /* sin almacenamiento */ }
  const d = datosDeEjemplo();
  guardar(d);
  return d;
}

// Datos guardados antes de la tarjeta de sellos: se les suman clientes de ejemplo
function normalizar(d) {
  if (!d.clientes) d.clientes = LOCAL.fidelidad ? clientesDeEjemplo() : [];
  if (!d.solicitudes) d.solicitudes = [];
  return d;
}

function guardar(d) {
  try { localStorage.setItem(CLAVE, JSON.stringify(d)); } catch (e) { /* ignorar */ }
}

function reiniciarDemo() {
  try { localStorage.removeItem(CLAVE); } catch (e) { /* ignorar */ }
  return cargar();
}

function totalPedido(p) {
  return p.items.reduce((s, it) => s + it.precio * it.cant, 0);
}

const ESTADOS = [
  { id: "nuevo", texto: "Recibido", icono: "🆕" },
  { id: "preparando", texto: "En preparación", icono: "👨‍🍳" },
  { id: "listo", texto: "Listo para servir", icono: "✅" },
  { id: "entregado", texto: "Entregado", icono: "🍽️" },
];

// Unos pedidos y una llamada de ejemplo para que el panel no arranque vacío
function datosDeEjemplo() {
  const items = todosLosItems();
  const linea = (it, cant) => ({ id: it.id, nombre: it.nombre, precio: it.precio, cant, nota: "" });
  return {
    pedidos: [
      { id: nuevoId(), mesa: 3, hora: haceMin(18), estado: "entregado", items: [linea(items[0], 2), linea(items[4], 1)] },
      { id: nuevoId(), mesa: 7, hora: haceMin(9), estado: "preparando", items: [linea(items[5], 1), linea(items[1], 1)] },
      { id: nuevoId(), mesa: 2, hora: haceMin(3), estado: "nuevo", items: [linea(items[2], 2)] },
    ],
    llamadas: [{ id: nuevoId(), mesa: 4, tipo: "mozo", hora: haceMin(1), atendida: false }],
    clientes: LOCAL.fidelidad ? clientesDeEjemplo() : [],
    solicitudes: [],
    resenas: { visitas: 23, google: 17, privados: [{ texto: "Muy rico todo, pero tardaron un poco con el pedido.", hora: haceMin(60 * 26) }] },
  };
}

// ---------- Tarjeta de sellos ----------
const DIA = 86400000;

function soloNumeros(t) {
  return String(t || "").replace(/\D/g, "");
}

// Número argentino para wa.me: si no trae el 54, se lo agrega (con el 9 de celular)
function numeroWhatsapp(t) {
  let n = soloNumeros(t).replace(/^0+/, "");
  if (!n.startsWith("54")) n = "549" + n.replace(/^15/, "");
  return n;
}

// Días que faltan para el próximo cumpleaños (cumple = "MM-DD")
function diasParaCumple(cumple) {
  if (!cumple) return null;
  const [m, d] = cumple.split("-").map(Number);
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  let prox = new Date(hoy.getFullYear(), m - 1, d);
  if (prox < hoy) prox = new Date(hoy.getFullYear() + 1, m - 1, d);
  return Math.round((prox - hoy) / DIA);
}

function clientesDeEjemplo() {
  const mmdd = (dias) => {
    const f = new Date(Date.now() + dias * DIA);
    return `${String(f.getMonth() + 1).padStart(2, "0")}-${String(f.getDate()).padStart(2, "0")}`;
  };
  const meta = LOCAL.fidelidad.meta;
  const c = (nombre, tel, sellos, cumple, acepta, diasUlt, canjes = 0) =>
    ({ id: nuevoId(), nombre, whatsapp: "549341" + tel, sellos, canjes, cumple, acepta, alta: Date.now() - 90 * DIA, ultima: Date.now() - diasUlt * DIA });
  return [
    c("Lucía Fernández", "5550101", meta - 1, mmdd(0), true, 2),
    c("Martín Gómez", "5550102", 4, mmdd(3), true, 6),
    c("Sofía Ruiz", "5550103", meta, mmdd(120), true, 1),
    c("Nicolás Pérez", "5550104", 2, "", true, 45),
    c("Valentina Díaz", "5550105", 6, mmdd(200), false, 9),
    c("Joaquín Rossi", "5550106", meta - 2, mmdd(40), true, 38, 1),
  ];
}
