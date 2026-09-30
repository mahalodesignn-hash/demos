// Panel del local: llamadas de las mesas, pedidos por estado, mesas y reseñas.
document.documentElement.style.setProperty("--marca", LOCAL.colorPrincipal);
const $ = (id) => document.getElementById(id);
let datos = cargar();

document.title = `Panel · ${LOCAL.nombre}`;
$("local-nombre").textContent = `${LOCAL.emoji} ${LOCAL.nombre}`;
$("link-carta").href = `carta.html?local=${ID_LOCAL}&mesa=5`;
$("link-resena").href = `resena.html?local=${ID_LOCAL}`;

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

// ---------- Pestañas, sonido y sincronización ----------
document.querySelectorAll(".pestana").forEach((t) => t.onclick = () => {
  document.querySelectorAll(".pestana").forEach((x) => x.classList.toggle("activa", x === t));
  ["pedidos", "mesas", "resenas"].forEach((v) => $("vista-" + v).classList.toggle("oculto", t.dataset.vista !== v));
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
  const antes = datos.pedidos.length + datos.llamadas.length;
  datos = cargar();
  if (datos.pedidos.length + datos.llamadas.length > antes) bip();
  pintar();
});

$("btn-reiniciar").onclick = () => {
  if (!confirm("¿Volver a los datos de ejemplo?")) return;
  datos = reiniciarDemo();
  pintar();
};

pintar();
