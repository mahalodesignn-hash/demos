// Control de stock para comercios: registro rápido, reposición por proveedor, productos y movimientos.
document.documentElement.style.setProperty("--marca", NEGOCIO.colorPrincipal);

let datos = cargar();
let productoElegido = null;
const $ = (id) => document.getElementById(id);

$("negocio-nombre").textContent = NEGOCIO.nombre;

function escapar(txt) {
  const d = document.createElement("div");
  d.textContent = txt;
  return d.innerHTML;
}

function boton(texto, clase, onclick) {
  const b = document.createElement("button");
  b.className = `boton chico ${clase}`;
  b.textContent = texto;
  b.onclick = onclick;
  return b;
}

function etiquetaEstado(p) {
  const e = estadoStock(p);
  const clase = e === "ok" ? "confirmado" : e === "bajo" ? "pendiente" : "cancelado";
  return `<span class="estado ${clase}">${e === "ok" ? "ok" : e}</span>`;
}

function guardarYRefrescar() {
  guardar(datos);
  refrescar();
}

function refrescar() {
  pintarMetricas();
  pintarReponer();
  pintarProductos();
  pintarMovimientos();
}

// ---------- Métricas ----------
function pintarMetricas() {
  const hoy = hoyISO();
  const ventasHoy = datos.movimientos.filter((m) => m.tipo === "venta" && m.fecha.startsWith(hoy));
  const facturadoHoy = ventasHoy.reduce((s, m) => {
    const p = datos.productos.find((x) => x.id === m.productoId);
    return s + (p ? p.precio * m.cantidad : 0);
  }, 0);
  const aReponer = datos.productos.filter((p) => estadoStock(p) !== "ok").length;
  const sinStock = datos.productos.filter((p) => p.stock <= 0).length;
  const valor = datos.productos.reduce((s, p) => s + Math.max(0, p.stock) * p.costo, 0);
  $("metricas").innerHTML = `
    <div class="metrica"><div class="numero">${plata(facturadoHoy)}</div><div class="etiqueta">vendido hoy (${ventasHoy.length} ventas)</div></div>
    <div class="metrica destacada"><div class="numero">${aReponer}</div><div class="etiqueta">productos para reponer</div></div>
    <div class="metrica"><div class="numero">${sinStock}</div><div class="etiqueta">sin stock</div></div>
    <div class="metrica"><div class="numero">${plata(valor)}</div><div class="etiqueta">mercadería en stock (a costo)</div></div>`;
}

// ---------- Registro rápido ----------
function buscar(txt) {
  const q = txt.trim().toLowerCase();
  if (!q) return [];
  const exacto = datos.productos.find((p) => p.codigo === q);
  if (exacto) return [exacto];
  return datos.productos.filter((p) => p.nombre.toLowerCase().includes(q)).slice(0, 6);
}

function elegir(p) {
  productoElegido = p;
  $("sugerencias").innerHTML = "";
  $("elegido-info").innerHTML = `<strong>${escapar(p.nombre)}</strong> ${etiquetaEstado(p)}<br>
    Stock actual: <strong>${p.stock}</strong> · Precio: ${plata(p.precio)}`;
  $("elegido").classList.remove("oculto");
  $("cantidad").value = 1;
  $("cantidad").focus();
  $("cantidad").select();
}

function limpiarRapido() {
  productoElegido = null;
  $("buscar-rapido").value = "";
  $("sugerencias").innerHTML = "";
  $("elegido").classList.add("oculto");
  $("buscar-rapido").focus();
}

$("buscar-rapido").oninput = () => {
  $("rapido-ok").classList.add("oculto");
  $("elegido").classList.add("oculto");
  const res = buscar($("buscar-rapido").value);
  $("sugerencias").innerHTML = "";
  res.forEach((p) => {
    const b = document.createElement("button");
    b.className = "opcion";
    b.type = "button";
    b.innerHTML = `${escapar(p.nombre)}<small>Stock: ${p.stock} · ${p.codigo}</small>`;
    b.onclick = () => elegir(p);
    $("sugerencias").appendChild(b);
  });
};

// El lector de código de barras escribe el código y manda Enter
$("form-rapido").onsubmit = (e) => {
  e.preventDefault();
  const res = buscar($("buscar-rapido").value);
  if (res.length === 1) elegir(res[0]);
  else if (!res.length) {
    $("sugerencias").innerHTML = `<p class="vacio">No encontramos ese producto. Podés cargarlo en la pestaña Productos.</p>`;
  }
};

function registrarRapido(tipo) {
  const cant = parseInt($("cantidad").value, 10);
  if (!productoElegido || !(cant > 0)) return;
  registrarMovimiento(datos, productoElegido, tipo, cant);
  const p = productoElegido;
  guardarYRefrescar();
  const aviso = estadoStock(p) !== "ok" ? ` ⚠️ Quedó ${p.stock <= 0 ? "sin stock" : "bajo el mínimo"}.` : "";
  $("rapido-ok").textContent = `${tipo === "venta" ? "Venta" : "Entrada"} registrada: ${cant} × ${p.nombre}. Stock: ${p.stock}.${aviso}`;
  $("rapido-ok").classList.remove("oculto");
  limpiarRapido();
}
$("btn-venta").onclick = () => registrarRapido("venta");
$("btn-entrada").onclick = () => registrarRapido("entrada");
$("btn-cancelar-rapido").onclick = limpiarRapido;
$("cantidad").onkeydown = (e) => { if (e.key === "Enter") registrarRapido("venta"); };

// ---------- Para reponer (agrupado por proveedor) ----------
function mensajePedido(prov, items) {
  const lineas = items.map((p) => `• ${cantidadAPedir(p)} × ${p.nombre}`).join("\n");
  return `Hola ${prov.nombre}! Les hago un pedido para ${NEGOCIO.nombre}:\n${lineas}\n¿Me confirman disponibilidad y precio? Gracias!`;
}

function pintarReponer() {
  const cont = $("lista-reponer");
  const faltan = datos.productos.filter((p) => estadoStock(p) !== "ok");
  if (!faltan.length) {
    cont.innerHTML = `<p class="vacio">Todo en orden: ningún producto está por debajo del mínimo.</p>`;
    return;
  }
  cont.innerHTML = "";
  NEGOCIO.proveedores.forEach((prov) => {
    const items = faltan.filter((p) => p.proveedor === prov.id);
    if (!items.length) return;
    const costo = items.reduce((s, p) => s + cantidadAPedir(p) * p.costo, 0);
    const bloque = document.createElement("div");
    bloque.style.marginBottom = "20px";
    bloque.innerHTML = `<div class="barra" style="margin-bottom:4px">
        <strong>${escapar(prov.nombre)}</strong>
        <span class="vacio">${items.length} ${items.length === 1 ? "producto" : "productos"} · aprox. ${plata(costo)}</span>
      </div>`;
    items.forEach((p) => {
      const fila = document.createElement("div");
      fila.className = "fila";
      fila.style.gridTemplateColumns = "1fr auto";
      fila.innerHTML = `<div class="quien">${escapar(p.nombre)} ${etiquetaEstado(p)}
        <small>Hay ${p.stock} · mínimo ${p.minimo} · pedir <strong>${cantidadAPedir(p)}</strong></small></div>`;
      bloque.appendChild(fila);
    });
    const w = document.createElement("a");
    w.className = "boton whatsapp";
    w.target = "_blank";
    w.rel = "noopener";
    w.style.marginTop = "8px";
    w.href = linkWhatsApp(prov.whatsapp, mensajePedido(prov, items));
    w.textContent = `Pedir a ${prov.nombre} por WhatsApp`;
    bloque.appendChild(w);
    cont.appendChild(bloque);
  });
}

// ---------- Productos ----------
$("filtro-categoria").innerHTML = `<option value="">Todas las categorías</option>` +
  NEGOCIO.categorias.map((c) => `<option>${escapar(c)}</option>`).join("");
$("filtro").oninput = pintarProductos;
$("filtro-categoria").onchange = pintarProductos;

function pintarProductos() {
  const q = $("filtro").value.trim().toLowerCase();
  const cat = $("filtro-categoria").value;
  const lista = datos.productos
    .filter((p) => (!cat || p.categoria === cat) && (!q || p.nombre.toLowerCase().includes(q) || p.codigo.includes(q)))
    .sort((a, b) => a.nombre.localeCompare(b.nombre));
  const cont = $("lista-productos");
  if (!lista.length) {
    cont.innerHTML = `<p class="vacio">No hay productos que coincidan.</p>`;
    return;
  }
  cont.innerHTML = "";
  lista.forEach((p) => {
    const fila = document.createElement("div");
    fila.className = "fila";
    fila.style.gridTemplateColumns = "56px 1fr auto";
    fila.innerHTML = `<div class="hora">${p.stock}</div>
      <div class="quien">${escapar(p.nombre)} ${etiquetaEstado(p)}
        <small>${escapar(p.categoria)} · mín. ${p.minimo} · ${plata(p.precio)} · ${escapar(proveedorPorId(p.proveedor)?.nombre || "")}</small></div>
      <div class="acciones"></div>`;
    const acc = fila.querySelector(".acciones");
    acc.appendChild(boton("Contar", "secundario", () => ajustar(p)));
    acc.appendChild(boton("Editar", "secundario", () => editar(p)));
    cont.appendChild(fila);
  });
}

function ajustar(p) {
  const txt = prompt(`Conteo real de "${p.nombre}" (hoy figura ${p.stock}):`, p.stock);
  if (txt === null) return;
  const n = parseInt(txt, 10);
  if (isNaN(n) || n < 0) return alert("Ingresá un número válido.");
  registrarMovimiento(datos, p, "ajuste", n, "conteo");
  guardarYRefrescar();
}

function editar(p) {
  const nuevo = !p;
  const x = p || { codigo: "", nombre: "", categoria: NEGOCIO.categorias[0], proveedor: NEGOCIO.proveedores[0].id,
    stock: 0, minimo: 5, costo: 0, precio: 0 };
  const opciones = (lista, actual) => lista.map((o) => {
    const [v, t] = typeof o === "string" ? [o, o] : [o.id, o.nombre];
    return `<option value="${escapar(v)}" ${v === actual ? "selected" : ""}>${escapar(t)}</option>`;
  }).join("");
  $("modal-contenido").innerHTML = `<h3>${nuevo ? "Nuevo producto" : "Editar producto"}</h3>
    <form id="form-producto">
      <label>Nombre</label><input name="nombre" required value="${escapar(x.nombre)}">
      <label>Código de barras</label><input name="codigo" value="${escapar(x.codigo)}" placeholder="Escanealo o dejalo vacío">
      <label>Categoría</label><select name="categoria">${opciones(NEGOCIO.categorias, x.categoria)}</select>
      <label>Proveedor</label><select name="proveedor">${opciones(NEGOCIO.proveedores, x.proveedor)}</select>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:0 12px">
        <div><label>Stock actual</label><input name="stock" type="number" min="0" value="${x.stock}" ${nuevo ? "" : "disabled title='Usá Contar o Registrar'"}></div>
        <div><label>Stock mínimo</label><input name="minimo" type="number" min="0" value="${x.minimo}"></div>
        <div><label>Costo</label><input name="costo" type="number" min="0" value="${x.costo}"></div>
        <div><label>Precio de venta</label><input name="precio" type="number" min="0" value="${x.precio}"></div>
      </div>
      <button class="boton ancho" type="submit">Guardar</button>
      <button class="boton ancho secundario" type="button" id="cerrar-modal">Cancelar</button>
    </form>`;
  $("modal").classList.remove("oculto");
  $("cerrar-modal").onclick = cerrarModal;
  $("form-producto").onsubmit = (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    const num = (k) => Math.max(0, parseFloat(f.get(k)) || 0);
    const campos = { nombre: f.get("nombre").trim(), codigo: f.get("codigo").trim() || nuevoId(),
      categoria: f.get("categoria"), proveedor: f.get("proveedor"),
      minimo: num("minimo"), costo: num("costo"), precio: num("precio") };
    if (nuevo) {
      const prod = { id: nuevoId(), ...campos, stock: 0 };
      datos.productos.push(prod);
      const inicial = num("stock");
      if (inicial > 0) registrarMovimiento(datos, prod, "entrada", inicial, "stock inicial");
    } else {
      Object.assign(p, campos);
    }
    guardarYRefrescar();
    cerrarModal();
  };
}
$("btn-nuevo").onclick = () => editar(null);

function cerrarModal() {
  $("modal").classList.add("oculto");
}
$("modal").onclick = (e) => { if (e.target.id === "modal") cerrarModal(); };

// ---------- Movimientos ----------
function pintarMovimientos() {
  const cont = $("lista-movimientos");
  const ultimos = datos.movimientos.slice(0, 40);
  if (!ultimos.length) {
    cont.innerHTML = `<p class="vacio">Todavía no hay movimientos.</p>`;
    return;
  }
  cont.innerHTML = ultimos.map((m) => {
    const p = datos.productos.find((x) => x.id === m.productoId);
    const signo = m.tipo === "venta" ? "−" : m.tipo === "entrada" ? "+" : m.cantidad >= 0 ? "+" : "−";
    const clase = m.tipo === "venta" ? "pendiente" : m.tipo === "entrada" ? "confirmado" : "recuperado";
    const [d, h] = m.fecha.split(" ");
    const dia = d === hoyISO() ? "Hoy" : d.split("-").reverse().slice(0, 2).join("/");
    return `<div class="fila" style="grid-template-columns:90px 1fr auto">
      <div class="vacio">${dia} ${h}</div>
      <div class="quien">${escapar(p ? p.nombre : "(producto borrado)")}<small>${m.tipo}${m.nota ? " · " + escapar(m.nota) : ""}</small></div>
      <div><span class="estado ${clase}">${signo}${Math.abs(m.cantidad)}</span></div></div>`;
  }).join("");
}

// ---------- Navegación ----------
document.querySelectorAll(".pestana").forEach((t) => {
  t.onclick = () => {
    document.querySelectorAll(".pestana").forEach((x) => x.classList.toggle("activa", x === t));
    ["reponer", "productos", "movimientos"].forEach((v) =>
      $("vista-" + v).classList.toggle("oculto", t.dataset.vista !== v));
  };
});

$("btn-reiniciar").onclick = () => {
  if (!confirm("¿Volver a los datos de ejemplo? Se borran los cambios de la demo.")) return;
  datos = reiniciarDemo();
  limpiarRapido();
  refrescar();
};

window.addEventListener("storage", (e) => {
  if (e.key === CLAVE) {
    datos = cargar();
    refrescar();
  }
});

refrescar();
