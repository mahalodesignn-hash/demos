// Capa de datos de la demo: todo se guarda en el navegador (localStorage).
// En la versión real esto se reemplaza por una base de datos online.

const CLAVE = "demo-stock-v1";

function hoyISO() {
  const f = new Date();
  return `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, "0")}-${String(f.getDate()).padStart(2, "0")}`;
}

function ahoraISO() {
  const f = new Date();
  return `${hoyISO()} ${String(f.getHours()).padStart(2, "0")}:${String(f.getMinutes()).padStart(2, "0")}`;
}

function haceDias(n, hora) {
  const f = new Date();
  f.setDate(f.getDate() - n);
  const d = `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, "0")}-${String(f.getDate()).padStart(2, "0")}`;
  return `${d} ${hora}`;
}

function nuevoId() {
  return Math.random().toString(36).slice(2, 10);
}

function plata(n) {
  return NEGOCIO.moneda + " " + Math.round(n).toLocaleString("es-AR");
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

function proveedorPorId(id) {
  return NEGOCIO.proveedores.find((p) => p.id === id);
}

function estadoStock(p) {
  if (p.stock <= 0) return "sin stock";
  if (p.stock <= p.minimo) return "bajo";
  return "ok";
}

function cantidadAPedir(p) {
  return Math.max(0, p.minimo * NEGOCIO.factorReposicion - p.stock);
}

// Registra un movimiento y actualiza el stock. tipo: "venta" | "entrada" | "ajuste"
function registrarMovimiento(datos, producto, tipo, cantidad, nota = "") {
  const antes = producto.stock;
  if (tipo === "venta") producto.stock -= cantidad;
  else if (tipo === "entrada") producto.stock += cantidad;
  else producto.stock = cantidad; // ajuste: la cantidad es el conteo real
  datos.movimientos.unshift({
    id: nuevoId(), fecha: ahoraISO(), productoId: producto.id, tipo,
    cantidad: tipo === "ajuste" ? producto.stock - antes : cantidad, nota,
  });
}

function linkWhatsApp(telefono, mensaje) {
  return `https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`;
}

// ---------- Datos de ejemplo ----------
function datosDeEjemplo() {
  const P = (codigo, nombre, categoria, proveedor, stock, minimo, costo, precio) =>
    ({ id: nuevoId(), codigo, nombre, categoria, proveedor, stock, minimo, costo, precio });
  const productos = [
    P("7790001000011", "Cuaderno Rivadavia ABC 50 hojas rayado", "Cuadernos", "papelera-sur", 34, 20, 2100, 3400),
    P("7790001000028", "Cuaderno universitario A4 80 hojas cuadriculado", "Cuadernos", "papelera-sur", 8, 15, 3900, 6200),
    P("7790001000035", "Repuesto Rivadavia 96 hojas", "Cuadernos", "papelera-sur", 0, 10, 2700, 4300),
    P("7790001000042", "Birome Bic azul (unidad)", "Escritura", "distri-norte", 120, 50, 280, 550),
    P("7790001000059", "Lápiz negro HB Faber-Castell", "Escritura", "distri-norte", 45, 40, 190, 400),
    P("7790001000066", "Resaltador Stabilo amarillo", "Escritura", "distri-norte", 6, 12, 900, 1600),
    P("7790001000073", "Goma de borrar Staedtler", "Escritura", "distri-norte", 30, 15, 350, 700),
    P("7790001000080", "Caja de lápices de colores x12", "Arte", "distri-norte", 11, 10, 2800, 4800),
    P("7790001000097", "Témperas x6 colores", "Arte", "papelera-sur", 3, 8, 3100, 5200),
    P("7790001000103", "Block de hojas canson N°5", "Arte", "papelera-sur", 18, 10, 1900, 3300),
    P("7790001000110", "Resma A4 500 hojas", "Oficina", "papelera-sur", 9, 10, 6800, 9900),
    P("7790001000127", "Abrochadora + broches", "Oficina", "distri-norte", 7, 4, 5200, 8500),
    P("7790001000134", "Carpeta N°3 con anillos", "Oficina", "papelera-sur", 22, 12, 2400, 4200),
    P("9789870000014", "Diccionario escolar de español", "Libros", "editorial-rio", 5, 3, 7900, 12900),
    P("9789870000021", "Manual Santillana 5° grado", "Libros", "editorial-rio", 2, 5, 18500, 29900),
  ];
  const movimientos = [];
  const hist = [
    [0, "12:40", 3, "venta", 2], [0, "11:15", 0, "venta", 5], [0, "10:02", 5, "venta", 1],
    [1, "18:30", 1, "venta", 3], [1, "17:05", 8, "venta", 2], [1, "09:10", 3, "entrada", 60],
    [2, "16:45", 10, "venta", 1], [2, "11:20", 14, "venta", 1], [3, "10:00", 0, "entrada", 40],
  ];
  hist.forEach(([dias, hora, idx, tipo, cant]) => {
    movimientos.push({ id: nuevoId(), fecha: haceDias(dias, hora), productoId: productos[idx].id, tipo, cantidad: cant, nota: "" });
  });
  return { productos, movimientos };
}
