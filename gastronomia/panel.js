// Panel del local: llamadas de las mesas, pedidos por estado, mesas y reseñas.
document.documentElement.style.setProperty("--marca", LOCAL.colorPrincipal);
const $ = (id) => document.getElementById(id);
let datos = cargar();

document.title = `Panel · ${LOCAL.nombre}`;
$("local-nombre").textContent = `${LOCAL.emoji} ${LOCAL.nombre}`;
$("link-carta").href = `carta.html?local=${ID_LOCAL}&mesa=5`;
$("link-resena").href = `${LOCAL.fidelidad ? "tarjeta" : "resena"}.html?local=${ID_LOCAL}`;
$("link-tarjeta").href = `tarjeta.html?local=${ID_LOCAL}`;
const FID = LOCAL.fidelidad || {};
const TIENE_FID = !!LOCAL.fidelidad;

function guardarYPintar() {
  guardar(datos);
  pintar();
}

function pintar() {
  pintarMetricas();
  pintarLlamadas();
  pintarTablero();
  pintarMesas();
  pintarResenas();
  pintarClientes();
}

// ---------- Métricas ----------
function pintarMetricas() {
  const activos = datos.pedidos.filter((p) => !p.pagado);
  const vendido = datos.pedidos.reduce((s, p) => s + totalPedido(p), 0);
  const enCocina = activos.filter((p) => p.estado === "nuevo" || p.estado === "preparando").length;
  const mesasOcupadas = new Set(activos.map((p) => p.mesa)).size;
  const pendientes = new Set(datos.llamadas.filter((l) => !l.atendida).map((l) => l.mesa)).size;
  $("metricas").innerHTML = `
    <div class="metrica ${pendientes ? "destacada" : ""}"><div class="numero">${pendientes}</div><div class="etiqueta">mesas llamando</div></div>
    <div class="metrica"><div class="numero">${enCocina}</div><div class="etiqueta">pedidos en cocina</div></div>
    <div class="metrica"><div class="numero">${mesasOcupadas}/${LOCAL.mesas}</div><div class="etiqueta">mesas ocupadas</div></div>
    <div class="metrica"><div class="numero">${plata(vendido)}</div><div class="etiqueta">vendido hoy</div></div>`;
}

// ---------- Llamadas ----------
function pintarLlamadas() {
  const pend = datos.llamadas.filter((l) => !l.atendida);
  $("llamadas").innerHTML = pend.map((l) => `
    <div class="alerta-llamada">
      <div><strong>${l.tipo === "cuenta" ? "🧾 Mesa " + l.mesa + " pide la cuenta" : "🛎️ Mesa " + l.mesa + " llama al mozo"}</strong>
        <div class="vacio" style="font-size:.85rem">${l.hora} hs${l.pago ? ` · paga con ${escapar(l.pago)} · ${plata(l.total || 0)}` : ""}</div></div>
      <button class="boton chico" data-atender="${l.id}">Atendida</button>
    </div>`).join("");
  $("llamadas").querySelectorAll("[data-atender]").forEach((b) => b.onclick = () => {
    const l = datos.llamadas.find((x) => x.id === b.dataset.atender);
    l.atendida = true;
    if (l.tipo === "cuenta") datos.pedidos.filter((p) => p.mesa === l.mesa).forEach((p) => { p.pagado = true; p.estado = "entregado"; });
    guardarYPintar();
  });
}

// ---------- Tablero de pedidos ----------
const COLUMNAS = [
  { id: "nuevo", titulo: "🆕 Nuevos", siguiente: "preparando", accion: "Empezar" },
  { id: "preparando", titulo: "👨‍🍳 En preparación", siguiente: "listo", accion: "Listo" },
  { id: "listo", titulo: "✅ Para servir", siguiente: "entregado", accion: "Entregado" },
];

function pintarTablero() {
  $("tablero").innerHTML = COLUMNAS.map((col) => {
    const lista = datos.pedidos.filter((p) => p.estado === col.id && !p.pagado);
    return `<div class="columna"><h3>${col.titulo} (${lista.length})</h3>` + (lista.length ? lista.map((p) => `
      <div class="ticket">
        <div class="cab-ticket"><span>Mesa ${p.mesa}</span><span class="vacio">${p.hora}</span></div>
        <ul>${p.items.map((i) => `<li>${i.cant}× ${escapar(i.nombre)}${i.nota ? ` <em class="vacio">(${escapar(i.nota)})</em>` : ""}</li>`).join("")}</ul>
        <button class="boton chico ancho" style="margin-top:0" data-avanzar="${p.id}" data-a="${col.siguiente}">${col.accion} →</button>
      </div>`).join("") : `<p class="vacio" style="margin:4px">Nada por ahora</p>`) + `</div>`;
  }).join("");
  $("tablero").querySelectorAll("[data-avanzar]").forEach((b) => b.onclick = () => {
    datos.pedidos.find((p) => p.id === b.dataset.avanzar).estado = b.dataset.a;
    guardarYPintar();
  });
}

// ---------- Mesas ----------
function pintarMesas() {
  const activos = datos.pedidos.filter((p) => !p.pagado);
  const llamando = new Set(datos.llamadas.filter((l) => !l.atendida).map((l) => l.mesa));
  $("mesas").innerHTML = Array.from({ length: LOCAL.mesas }, (_, i) => {
    const n = i + 1;
    const suyos = activos.filter((p) => p.mesa === n);
    const total = suyos.reduce((s, p) => s + totalPedido(p), 0);
    const clase = llamando.has(n) ? "llama" : suyos.length ? "ocupada" : "";
    return `<div class="mesa ${clase}">${n}<small>${llamando.has(n) ? "llamando" : suyos.length ? plata(total) : "libre"}</small></div>`;
  }).join("");
}

// ---------- Reseñas ----------
function pintarResenas() {
  const r = datos.resenas;
  const tasa = r.visitas ? Math.round((r.google / r.visitas) * 100) : 0;
  $("metricas-resenas").innerHTML = `
    <div class="metrica"><div class="numero">${r.visitas}</div><div class="etiqueta">tocaron la plaquita o el QR</div></div>
    <div class="metrica destacada"><div class="numero">${r.google}</div><div class="etiqueta">fueron a dejar reseña en Google (${tasa}%)</div></div>
    <div class="metrica"><div class="numero">${r.privados.length}</div><div class="etiqueta">comentarios privados</div></div>`;
  $("privados").innerHTML = r.privados.length ? [...r.privados].reverse().map((p) => `
    <div class="fila" style="grid-template-columns:1fr"><div class="quien">${escapar(p.texto)}
      <small>${escapar(p.hora)}${p.contacto ? " · contacto: " + escapar(p.contacto) : ""}</small></div></div>`).join("")
    : `<p class="vacio">Sin comentarios todavía.</p>`;
}

// ---------- Clientes y tarjeta de sellos ----------
function clientePorId(id) {
  return datos.clientes.find((c) => c.id === id);
}

function sumarSello(c) {
  if (!c) return;
  c.sellos = Math.min(FID.meta, c.sellos + 1);
  c.ultima = Date.now();
}

function pintarClientes() {
  if (!TIENE_FID) return;
  const cl = datos.clientes;
  const premios = cl.filter((c) => c.sellos >= FID.meta).length;
  const aceptan = cl.filter((c) => c.acepta).length;
  $("tab-clientes").textContent = `🎁 Clientes${datos.solicitudes.length ? ` (${datos.solicitudes.length})` : ""}`;
  $("metricas-clientes").innerHTML = `
    <div class="metrica"><div class="numero">${cl.length}</div><div class="etiqueta">clientes con tarjeta</div></div>
    <div class="metrica ${datos.solicitudes.length ? "destacada" : ""}"><div class="numero">${datos.solicitudes.length}</div><div class="etiqueta">sellos por confirmar</div></div>
    <div class="metrica"><div class="numero">${premios}</div><div class="etiqueta">premios para canjear</div></div>
    <div class="metrica"><div class="numero">${aceptan}</div><div class="etiqueta">aceptaron mensajes</div></div>`;

  $("solicitudes").innerHTML = datos.solicitudes.length ? datos.solicitudes.map((s) => {
    const c = clientePorId(s.clienteId);
    return c ? `<div class="fila-cliente"><div><strong>${escapar(c.nombre)}</strong> pide un sello<small>${s.hora} hs · lleva ${c.sellos} de ${FID.meta}</small></div>
      <div class="acciones"><button class="boton chico" data-sello="${s.id}">Confirmar</button><button class="boton secundario chico" data-rechazar="${s.id}">No</button></div></div>` : "";
  }).join("") : `<p class="vacio">Nadie pidió un sello todavía.</p>`;
  $("solicitudes").querySelectorAll("[data-sello]").forEach((b) => b.onclick = () => {
    const s = datos.solicitudes.find((x) => x.id === b.dataset.sello);
    sumarSello(clientePorId(s.clienteId));
    datos.solicitudes = datos.solicitudes.filter((x) => x !== s);
    guardarYPintar();
  });
  $("solicitudes").querySelectorAll("[data-rechazar]").forEach((b) => b.onclick = () => {
    datos.solicitudes = datos.solicitudes.filter((x) => x.id !== b.dataset.rechazar);
    guardarYPintar();
  });

  const orden = [...cl].sort((a, b) => b.sellos - a.sellos);
  $("clientes").innerHTML = orden.length ? orden.map((c) => {
    const dc = diasParaCumple(c.cumple);
    const dias = Math.round((Date.now() - c.ultima) / DIA);
    return `<div class="fila-cliente"><div>
        <strong>${escapar(c.nombre)}</strong>${c.sellos >= FID.meta ? '<span class="insignia">🎁 premio listo</span>' : ""}${dc === 0 ? '<span class="insignia">🎂 hoy</span>' : ""}
        <small>${c.sellos}/${FID.meta} sellos · última visita ${dias === 0 ? "hoy" : `hace ${dias} d`} · ${c.acepta ? "acepta mensajes" : "no acepta mensajes"}</small></div>
      <div class="acciones"><button class="boton secundario chico" data-mas="${c.id}">+ sello</button>${c.sellos >= FID.meta ? `<button class="boton chico" data-canje="${c.id}">Canjear</button>` : ""}</div></div>`;
  }).join("") : `<p class="vacio">Todavía no hay clientes.</p>`;
  $("clientes").querySelectorAll("[data-mas]").forEach((b) => b.onclick = () => { sumarSello(clientePorId(b.dataset.mas)); guardarYPintar(); });
  $("clientes").querySelectorAll("[data-canje]").forEach((b) => b.onclick = () => {
    const c = clientePorId(b.dataset.canje);
    if (!confirm(`¿Entregar ${FID.premio} a ${c.nombre}? La tarjeta vuelve a cero.`)) return;
    c.sellos = 0; c.canjes = (c.canjes || 0) + 1;
    guardarYPintar();
  });
  pintarDestinatarios();
}

// Mensajes: cada campaña elige a quiénes avisar y trae un texto para editar
const CAMPANAS = {
  promo: { titulo: "📢 Promoción del día", texto: `¡Hola {nombre}! Hoy en ${LOCAL.nombre}: ${FID.promo}. Te esperamos 🙌`, filtro: () => true },
  cumple: { titulo: "🎂 Cumpleaños de la semana", texto: `¡Feliz cumple {nombre}! 🎂 En ${LOCAL.nombre} te invitamos ${FID.regaloCumple}. Pasá esta semana a buscarlo.`, filtro: (c) => { const d = diasParaCumple(c.cumple); return d !== null && d <= 7; } },
  vuelve: { titulo: "💌 Hace rato que no vienen (30+ días)", texto: `Hola {nombre}, hace rato que no te vemos por ${LOCAL.nombre}. ¡Tu tarjeta de sellos te espera!`, filtro: (c) => Date.now() - c.ultima > 30 * DIA },
  casi: { titulo: "🎯 Les falta poco para el premio", texto: `¡{nombre}, estás a un paso de ${FID.premio} en ${LOCAL.nombre}! Pasá y sumá tu sello 🎁`, filtro: (c) => c.sellos < FID.meta && FID.meta - c.sellos <= 2 },
};

$("campana").innerHTML = Object.entries(CAMPANAS).map(([id, c]) => `<option value="${id}">${c.titulo}</option>`).join("");
$("campana").onchange = () => { $("mensaje").value = CAMPANAS[$("campana").value].texto; pintarDestinatarios(); };
$("mensaje").oninput = pintarDestinatarios;
$("mensaje").value = CAMPANAS.promo.texto;

function pintarDestinatarios() {
  const camp = CAMPANAS[$("campana").value];
  const alcanzados = datos.clientes.filter(camp.filtro);
  const lista = alcanzados.filter((c) => c.acepta);
  const sinPermiso = alcanzados.length - lista.length;
  $("destinatarios").innerHTML = (lista.length ? lista.map((c) => {
    const texto = $("mensaje").value.replaceAll("{nombre}", c.nombre.split(" ")[0]);
    return `<div class="fila-cliente"><div><strong>${escapar(c.nombre)}</strong></div>
      <a class="boton chico" target="_blank" rel="noopener" href="https://wa.me/${c.whatsapp}?text=${encodeURIComponent(texto)}">Enviar por WhatsApp</a></div>`;
  }).join("") : `<p class="vacio">Nadie para avisar con este criterio.</p>`)
    + (sinPermiso ? `<p class="vacio" style="font-size:.85rem">${sinPermiso} cliente${sinPermiso > 1 ? "s" : ""} no aceptó recibir mensajes: no se les escribe.</p>` : "");
}

// ---------- Pestañas, sonido y sincronización ----------
document.querySelectorAll(".pestana").forEach((t) => t.onclick = () => {
  document.querySelectorAll(".pestana").forEach((x) => x.classList.toggle("activa", x === t));
  ["pedidos", "mesas", "resenas", "clientes"].forEach((v) => $("vista-" + v).classList.toggle("oculto", t.dataset.vista !== v));
});

let audio = null;
$("btn-sonido").onclick = () => {
  audio = audio || new (window.AudioContext || window.webkitAudioContext)();
  $("btn-sonido").textContent = "🔔 Sonido activado";
  bip();
};
function bip() {
  if (!audio) return;
  const o = audio.createOscillator(), g = audio.createGain();
  o.frequency.value = 880; g.gain.value = 0.15;
  o.connect(g); g.connect(audio.destination);
  o.start(); o.stop(audio.currentTime + 0.25);
}

// Cuando llega algo desde la carta (otra pestaña), se actualiza solo y suena
window.addEventListener("storage", (e) => {
  if (e.key !== CLAVE) return;
  const contar = () => datos.pedidos.length + datos.llamadas.length + datos.solicitudes.length;
  const antes = contar();
  datos = cargar();
  if (contar() > antes) bip();
  pintar();
});

$("btn-reiniciar").onclick = () => {
  if (!confirm("¿Volver a los datos de ejemplo?")) return;
  datos = reiniciarDemo();
  pintar();
};

if (!TIENE_FID) { $("tab-clientes").remove(); $("vista-clientes").remove(); }
pintar();
