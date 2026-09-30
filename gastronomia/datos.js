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
    if (raw) return JSON.parse(raw);
  } catch (e) { /* sin almacenamiento */ }
  const d = datosDeEjemplo();
  guardar(d);
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
    resenas: { visitas: 23, google: 17, privados: [{ texto: "Muy rico todo, pero tardaron un poco con el pedido.", hora: haceMin(60 * 26) }] },
  };
}
