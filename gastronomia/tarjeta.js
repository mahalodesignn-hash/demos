// Tarjeta de sellos virtual del cliente: alta con WhatsApp, sellos y premio.
// El sello lo confirma el mozo desde el panel (así nadie suma escaneando sin consumir).
document.documentElement.style.setProperty("--marca", LOCAL.colorPrincipal);
const $ = (id) => document.getElementById(id);
// La tarjeta de sellos es solo para locales con "fidelidad" en config.js (por ahora, cafeterías)
if (!LOCAL.fidelidad) location.replace(`resena.html?local=${ID_LOCAL}`);
const FID = LOCAL.fidelidad || {};
const TIENE_FID = !!LOCAL.fidelidad;
const CLAVE_CLIENTE = `demo-gastro-cliente-${ID_LOCAL}`;
let datos = cargar();

document.title = `Mi tarjeta · ${LOCAL.nombre}`;
$("t-emoji").textContent = LOCAL.emoji;
$("t-nombre").textContent = LOCAL.nombre;
$("t-nombre2").textContent = LOCAL.nombre;
$("t-link-panel").href = `panel.html?local=${ID_LOCAL}`;
$("t-link-resena").href = `resena.html?local=${ID_LOCAL}&desde=tarjeta`;
$("t-alta-texto").textContent = `Juntá ${FID.meta} sellos y llevate ${FID.premio}. Sin cartoncito: lo tenés siempre en el celular.`;

// Cuenta cada vez que alguien toca la plaquita o el QR (una por sesión)
try {
  if (!sessionStorage.getItem("visita-" + CLAVE)) {
    datos.resenas.visitas++; guardar(datos); sessionStorage.setItem("visita-" + CLAVE, "1");
  }
} catch (e) { /* ignorar */ }

// Cumpleaños: días 1 a 31 y meses
for (let d = 1; d <= 31; d++) $("t-dia").add(new Option(d, d));
["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"]
  .forEach((m, i) => $("t-mes").add(new Option(m, i + 1)));

function idGuardado() {
  try { return localStorage.getItem(CLAVE_CLIENTE); } catch (e) { return null; }
}
function guardarId(id) {
  try { localStorage.setItem(CLAVE_CLIENTE, id); } catch (e) { /* ignorar */ }
}

let ultimosSellos = null;

function pintar() {
  datos = cargar();
  const c = datos.clientes.find((x) => x.id === idGuardado());
  $("t-sub").textContent = c ? "Tu tarjeta de sellos" : "¡Qué bueno verte por acá!";
  $("t-alta").classList.toggle("oculto", !!c);
  $("t-tarjeta").classList.toggle("oculto", !c);
  $("t-resena").classList.remove("oculto");
  if (!c) return;

  const pendiente = datos.solicitudes.some((s) => s.clienteId === c.id);
  const completa = c.sellos >= FID.meta;
  $("t-hola").textContent = `Hola, ${c.nombre.split(" ")[0]} 👋`;
  $("t-cuenta").textContent = c.canjes ? `${c.canjes} premio${c.canjes > 1 ? "s" : ""} canjeado${c.canjes > 1 ? "s" : ""}` : "";
  $("t-sellos").style.setProperty("--cols", Math.min(5, FID.meta));
  // Nina: huellas de sello con ícono de taza (SVG) y la última recién sumada "se estampa"
  const nina = document.documentElement.classList.contains("tema-nina");
  const taza = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 2v2M14 2v2M6 2v2"/><path d="M18 8h1a3 3 0 0 1 0 6h-1"/><path d="M3 8h15v7a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5Z"/></svg>`;
  const regalo = `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13M19 12v8a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-8"/><path d="M7.5 8a2.5 2.5 0 0 1 0-5C11 3 12 8 12 8s1-5 4.5-5a2.5 2.5 0 0 1 0 5"/></svg>`;
  const nuevo = nina && ultimosSellos !== null && c.sellos > ultimosSellos ? c.sellos - 1 : -1;
  ultimosSellos = c.sellos;
  $("t-sellos").innerHTML = Array.from({ length: FID.meta }, (_, i) =>
    i < c.sellos ? `<div class="sello lleno${i === nuevo ? " nuevo" : ""}">${nina ? taza : LOCAL.emoji}</div>`
      : i === FID.meta - 1 ? `<div class="sello premio" data-emoji>${nina ? regalo : "🎁"}</div>` : `<div class="sello">${i + 1}</div>`).join("");

  const faltan = FID.meta - c.sellos;
  $("t-texto").innerHTML = completa
    ? `<strong>¡Completaste la tarjeta!</strong> Mostrale esta pantalla al mozo y canjeá <strong>${escapar(FID.premio)}</strong>.`
    : `<strong>${c.sellos} de ${FID.meta}</strong> · te ${faltan === 1 ? "falta 1 sello" : `faltan ${faltan} sellos`} para ${escapar(FID.premio)}.`;

  const btn = $("t-pedir");
  btn.textContent = completa ? "🎁 Mostrar al mozo para canjear" : pendiente ? "⏳ Esperando que el mozo lo confirme…" : "🎫 Sumar mi sello de hoy";
  btn.disabled = completa || pendiente;
  $("t-aviso").textContent = completa ? "" : pendiente ? "El mozo lo confirma desde su panel (en la demo: abrilo en otra pestaña)."
    : "Cuando consumís, tocá el botón y el mozo te lo confirma.";
}

$("t-form").onsubmit = (e) => {
  e.preventDefault();
  datos = cargar();
  const tel = numeroWhatsapp($("t-wsp").value);
  let c = datos.clientes.find((x) => x.whatsapp === tel);
  if (!c) {
    const cumple = $("t-dia").value && $("t-mes").value ? `${String($("t-mes").value).padStart(2, "0")}-${String($("t-dia").value).padStart(2, "0")}` : "";
    c = { id: nuevoId(), nombre: $("t-nom").value.trim(), whatsapp: tel, sellos: 0, canjes: 0, cumple, acepta: $("t-acepta").checked, alta: Date.now(), ultima: Date.now() };
    datos.clientes.push(c);
    guardar(datos);
  }
  guardarId(c.id);
  pintar();
};

// "Ya tengo tarjeta": entra con el WhatsApp. (En la versión real se verifica con un código por WhatsApp.)
$("t-ya").onclick = (e) => {
  e.preventDefault();
  const tel = prompt("Tu número de WhatsApp");
  if (!tel) return;
  datos = cargar();
  const c = datos.clientes.find((x) => x.whatsapp === numeroWhatsapp(tel));
  if (!c) { alert("No encontramos una tarjeta con ese número."); return; }
  guardarId(c.id);
  pintar();
};

$("t-pedir").onclick = () => {
  datos = cargar();
  const c = datos.clientes.find((x) => x.id === idGuardado());
  if (!c || c.sellos >= FID.meta || datos.solicitudes.some((s) => s.clienteId === c.id)) return;
  datos.solicitudes.push({ id: nuevoId(), clienteId: c.id, hora: ahora() });
  guardar(datos);
  pintar();
};

// Si el mozo confirma desde otra pestaña, la tarjeta se actualiza sola
window.addEventListener("storage", (e) => { if (e.key === CLAVE) pintar(); });

pintar();
