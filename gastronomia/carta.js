// Carta de la mesa: el cliente escanea el QR (o acerca el celular al NFC) de su mesa.
document.documentElement.style.setProperty("--marca", LOCAL.colorPrincipal);
const $ = (id) => document.getElementById(id);
const MESA = parseInt(new URLSearchParams(location.search).get("mesa"), 10) || 5;
let datos = cargar();
const carrito = []; // [{id, cant, nota}]

document.title = `Carta · ${LOCAL.nombre}`;
$("local-nombre").textContent = `${LOCAL.emoji} ${LOCAL.nombre}`;
$("local-lema").textContent = LOCAL.lema;
$("mesa-badge").textContent = `Mesa ${MESA}`;
$("link-panel").href = `panel.html?local=${ID_LOCAL}`;

// ---------- Carta ----------
const slug = (t) => t.toLowerCase().normalize("NFD").replace(/[^\w]+/g, "-");
$("cats").innerHTML = LOCAL.categorias.map((c, i) => `<a class="cat ${i ? "" : "activa"}" href="#cat-${slug(c.nombre)}">${escapar(c.nombre)}</a>`).join("");
$("cats").querySelectorAll(".cat").forEach((a) => a.onclick = () => {
  $("cats").querySelectorAll(".cat").forEach((x) => x.classList.toggle("activa", x === a));
});

$("carta").innerHTML = LOCAL.categorias.map((c) => `
  <h2 class="cat-titulo" id="cat-${slug(c.nombre)}">${escapar(c.nombre)}</h2>
  ${c.items.map((it) => `
    <article class="plato">
      <div class="foto${it.foto ? " con-foto" : ""}"${it.foto ? ` style="background-image:url('${it.foto}')"` : ""}>${it.foto ? "" : it.emoji}</div>
      <div>
        <h3>${escapar(it.nombre)}</h3>
        <p>${escapar(it.desc)}</p>
        ${(it.etiquetas || []).map((e) => `<span class="etiqueta">${escapar(e)}</span>`).join("")}
        <div class="pie-plato">
          <span class="precio">${plata(it.precio)}</span>
          <span class="acciones">
            ${it.modelo ? `<button class="btn-ar" data-ar="${it.id}">🧊 Ver en 3D${it.escaneado ? " · real" : ""}</button>` : ""}
            <button class="boton chico" data-agregar="${it.id}">+ Agregar</button>
          </span>
        </div>
      </div>
    </article>`).join("")}`).join("");

$("carta").onclick = (e) => {
  const ag = e.target.closest("[data-agregar]");
  const ar = e.target.closest("[data-ar]");
  if (ag) agregar(ag.dataset.agregar);
  if (ar) verEn3D(itemPorId(ar.dataset.ar));
};

// ---------- Carrito ----------
function agregar(id) {
  const ya = carrito.find((c) => c.id === id);
  if (ya) ya.cant++; else carrito.push({ id, cant: 1, nota: "" });
  pintarBoton();
  aviso(`Agregado: ${itemPorId(id).nombre}`);
}

function totalCarrito() {
  return carrito.reduce((s, c) => s + itemPorId(c.id).precio * c.cant, 0);
}

function pintarBoton() {
  const n = carrito.reduce((s, c) => s + c.cant, 0);
  $("btn-pedido").textContent = n ? `🛒 Pedido (${n}) · ${plata(totalCarrito())}` : "🛒 Ver pedido";
}

function abrirHoja(html) {
  $("hoja").innerHTML = html;
  $("hoja-fondo").classList.remove("oculto");
}
function cerrarHoja() {
  $("hoja-fondo").classList.add("oculto");
  $("hoja").innerHTML = ""; // también descarga el visor 3D
}
$("hoja-fondo").onclick = (e) => { if (e.target.id === "hoja-fondo") cerrarHoja(); };

function verPedido() {
  if (!carrito.length) {
    abrirHoja(`<h3>Tu pedido</h3><p class="vacio">Todavía no agregaste nada. Tocá <strong>+ Agregar</strong> en los platos.</p>
      <button class="boton ancho secundario" id="cerrar">Volver a la carta</button>`);
    $("cerrar").onclick = cerrarHoja;
    return;
  }
  abrirHoja(`<h3>Tu pedido · Mesa ${MESA}</h3>
    ${carrito.map((c, i) => { const it = itemPorId(c.id); return `
      <div class="linea-pedido">
        <div><strong>${escapar(it.nombre)}</strong><br>
          <input data-nota="${i}" placeholder="Aclaración (sin cebolla, bien cocido...)" value="${escapar(c.nota)}" style="margin-top:6px;padding:7px 10px;font-size:.85rem"></div>
        <div style="text-align:right"><div class="cant"><button data-menos="${i}">−</button><strong>${c.cant}</strong><button data-mas="${i}">+</button></div>
          <div class="vacio" style="margin-top:6px">${plata(it.precio * c.cant)}</div></div>
      </div>`; }).join("")}
    <div class="barra" style="margin:14px 0 0"><strong>Total</strong><strong>${plata(totalCarrito())}</strong></div>
    <button class="boton ancho" id="enviar">Enviar a la cocina</button>
    <button class="boton ancho secundario" id="cerrar">Seguir mirando la carta</button>`);
  $("hoja").querySelectorAll("[data-mas]").forEach((b) => b.onclick = () => { carrito[b.dataset.mas].cant++; verPedido(); pintarBoton(); });
  $("hoja").querySelectorAll("[data-menos]").forEach((b) => b.onclick = () => {
    const c = carrito[b.dataset.menos];
    if (--c.cant <= 0) carrito.splice(b.dataset.menos, 1);
    verPedido(); pintarBoton();
  });
  $("hoja").querySelectorAll("[data-nota]").forEach((inp) => inp.oninput = () => { carrito[inp.dataset.nota].nota = inp.value; });
  $("cerrar").onclick = cerrarHoja;
  $("enviar").onclick = enviarPedido;
}
$("btn-pedido").onclick = verPedido;

function enviarPedido() {
  datos = cargar();
  datos.pedidos.push({
    id: nuevoId(), mesa: MESA, hora: ahora(), estado: "nuevo",
    items: carrito.map((c) => { const it = itemPorId(c.id); return { id: it.id, nombre: it.nombre, precio: it.precio, cant: c.cant, nota: c.nota }; }),
  });
  guardar(datos);
  carrito.length = 0;
  pintarBoton();
  cerrarHoja();
  pintarMisPedidos();
  aviso("✅ Pedido enviado. Te avisamos acá cuando esté listo.");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// ---------- Mis pedidos (se actualiza cuando la cocina cambia el estado) ----------
function pintarMisPedidos() {
  const mios = datos.pedidos.filter((p) => p.mesa === MESA && !p.pagado);
  const cont = $("mis-pedidos");
  cont.classList.toggle("oculto", !mios.length);
  cont.innerHTML = `<div class="tarjeta" style="margin-top:12px"><h2>Tus pedidos</h2>` + mios.map((p) => {
    const idx = ESTADOS.findIndex((e) => e.id === p.estado);
    return `<div style="padding:8px 0;border-bottom:1px solid var(--borde)">
      <div class="barra" style="margin:0"><strong>${ESTADOS[idx].icono} ${ESTADOS[idx].texto}</strong><span class="vacio">${p.hora} hs</span></div>
      <small class="vacio">${p.items.map((i) => `${i.cant}× ${escapar(i.nombre)}`).join(", ")}</small>
      <div class="paso-estado">${ESTADOS.map((e, i) => `<span class="${i <= idx ? "hecho" : ""}"></span>`).join("")}</div></div>`;
  }).join("") + `</div>`;
}

// ---------- Mozo y cuenta ----------
function llamar(tipo, extra = {}) {
  datos = cargar();
  datos.llamadas.push({ id: nuevoId(), mesa: MESA, tipo, hora: ahora(), atendida: false, ...extra });
  guardar(datos);
}

$("btn-mozo").onclick = () => { llamar("mozo"); aviso("🛎️ Listo, el mozo ya viene a tu mesa."); };

$("btn-cuenta").onclick = () => {
  datos = cargar();
  const consumido = datos.pedidos.filter((p) => p.mesa === MESA && !p.pagado).reduce((s, p) => s + totalPedido(p), 0);
  abrirHoja(`<h3>🧾 Pedir la cuenta · Mesa ${MESA}</h3>
    <p style="margin-top:0">Consumido: <strong>${plata(consumido)}</strong></p>
    <label>¿Cómo vas a pagar?</label>
    <div class="acciones" style="margin-top:6px">
      <button class="boton secundario" data-pago="Efectivo">💵 Efectivo</button>
      <button class="boton secundario" data-pago="Tarjeta">💳 Tarjeta</button>
      <button class="boton secundario" data-pago="Mercado Pago">📱 Mercado Pago</button>
    </div>
    <p class="vacio" style="font-size:.85rem">En la versión real se puede pagar desde acá con Mercado Pago.</p>
    <button class="boton ancho secundario" id="cerrar">Cancelar</button>`);
  $("cerrar").onclick = cerrarHoja;
  $("hoja").querySelectorAll("[data-pago]").forEach((b) => b.onclick = () => {
    llamar("cuenta", { pago: b.dataset.pago, total: consumido });
    cerrarHoja();
    aviso(`🧾 Te llevamos la cuenta (${b.dataset.pago}).`);
  });
};

// ---------- Realidad aumentada ----------
function verEn3D(it) {
  const escala = it.escala ? `scale="${it.escala} ${it.escala} ${it.escala}"` : "";
  abrirHoja(`<h3>${it.emoji} ${escapar(it.nombre)}</h3>
    <div style="position:relative">
      <model-viewer id="visor" src="${it.modelo}" ${escala} alt="${escapar(it.nombre)} en 3D"
        ar ar-modes="webxr scene-viewer quick-look" ar-scale="fixed" ar-placement="floor"
        camera-controls auto-rotate shadow-intensity="1" exposure="1.05" camera-orbit="30deg 65deg auto" touch-action="pan-y">
        <button slot="ar-button" class="boton-ar-grande">📱 Ver en mi mesa</button>
      </model-viewer>
    </div>
    ${it.escaneado ? `<p class="aviso" style="font-size:.82rem;margin:10px 0 0">📸 Este plato es un <strong>escaneo real</strong> (fotogrametría): así se ve un plato fotografiado desde todos los ángulos.</p>` : ""}
    <p class="vacio" id="ar-ayuda" style="font-size:.88rem;margin:10px 0">Girá el plato con el dedo. Tocá <strong>Ver en mi mesa</strong>, apuntá la cámara a la mesa y aparece en <strong>tamaño real</strong>.</p>
    <div class="barra" style="margin:0"><strong>${plata(it.precio)}</strong>
      <button class="boton" id="ar-agregar">+ Agregar al pedido</button></div>
    <button class="boton ancho secundario" id="cerrar">Volver a la carta</button>`);
  $("cerrar").onclick = cerrarHoja;
  $("ar-agregar").onclick = () => { agregar(it.id); cerrarHoja(); };
  const visor = $("visor");
  visor.addEventListener("load", () => {
    if (!visor.canActivateAR) {
      $("ar-ayuda").innerHTML = "Girá el plato con el dedo o el mouse. <strong>Para verlo en tu mesa, abrí esta carta desde el celular</strong> (Android con ARCore o iPhone).";
    }
  });
}

// ---------- Avisos y sincronización ----------
let timerAviso;
function aviso(txt) {
  let el = $("toast");
  if (!el) {
    el = document.createElement("div");
    el.id = "toast";
    el.style.cssText = "position:fixed;left:50%;bottom:96px;transform:translateX(-50%);background:#111827;color:#fff;padding:10px 16px;border-radius:999px;z-index:30;font-size:.9rem;max-width:90%;text-align:center";
    document.body.appendChild(el);
  }
  el.textContent = txt;
  el.style.display = "block";
  clearTimeout(timerAviso);
  timerAviso = setTimeout(() => { el.style.display = "none"; }, 2600);
}

window.addEventListener("storage", (e) => {
  if (e.key !== CLAVE) return;
  const antes = JSON.stringify(datos.pedidos.filter((p) => p.mesa === MESA).map((p) => p.estado));
  datos = cargar();
  const despues = JSON.stringify(datos.pedidos.filter((p) => p.mesa === MESA).map((p) => p.estado));
  pintarMisPedidos();
  if (antes !== despues && datos.pedidos.some((p) => p.mesa === MESA && p.estado === "listo")) aviso("✅ ¡Tu pedido está listo!");
});

pintarBoton();
pintarMisPedidos();
