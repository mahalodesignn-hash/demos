// Panel de la agencia: consultas calificadas, editor de presupuestos y preferencias.
document.documentElement.style.setProperty("--marca", AGENCIA.colorPrincipal);

let datos = cargar();
let editando = null; // copia del presupuesto que se está editando
let opActual = 0;
const $ = (id) => document.getElementById(id);

$("agencia-nombre").textContent = AGENCIA.nombre;

function boton(texto, clase, onclick) {
  const b = document.createElement("button");
  b.className = `boton chico ${clase}`;
  b.textContent = texto;
  b.onclick = onclick;
  return b;
}

function guardarYRefrescar() {
  guardar(datos);
  refrescar();
}

function refrescar() {
  pintarMetricas();
  pintarConsultas();
  pintarPresupuestos();
}

function mostrarVista(v) {
  ["consultas", "buscar", "pasajeros", "presupuestos", "preferencias", "editor"].forEach((x) =>
    $("vista-" + x).classList.toggle("oculto", x !== v));
  document.querySelectorAll(".pestana[data-vista]").forEach((p) => p.classList.toggle("activa", p.dataset.vista === v));
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// ---------- Métricas ----------
function pintarMetricas() {
  const niveles = datos.consultas.map((c) => calificar(c).nivel);
  const calientes = niveles.filter((n) => n === "caliente").length;
  const sinResponder = datos.consultas.filter((c) => c.estado === "nueva").length;
  const enviados = datos.presupuestos.filter((p) => p.estado !== "borrador").length;
  const aceptados = datos.presupuestos.filter((p) => p.estado === "aceptado").length;
  $("metricas").innerHTML = `
    <div class="metrica destacada"><div class="numero">${calientes}</div><div class="etiqueta">consultas calientes 🔥</div></div>
    <div class="metrica"><div class="numero">${sinResponder}</div><div class="etiqueta">sin presupuestar</div></div>
    <div class="metrica"><div class="numero">${enviados}</div><div class="etiqueta">presupuestos enviados</div></div>
    <div class="metrica"><div class="numero">${aceptados}</div><div class="etiqueta">viajes vendidos</div></div>`;
}

// ---------- Consultas ----------
function resumenFechas(c) {
  if (c.fechaIda) return `${fechaLinda(c.fechaIda)}${c.fechaVuelta ? " al " + fechaLinda(c.fechaVuelta) : ""}${c.flexible ? " (flexible)" : ""}`;
  return c.mesAproximado ? `Mes aprox.: ${c.mesAproximado}` : "Sin fechas";
}

function pasajerosTexto(c) {
  let t = `${c.adultos} adulto${c.adultos === 1 ? "" : "s"}`;
  if (c.ninos) t += ` + ${c.ninos} menor${c.ninos === 1 ? "" : "es"}${c.edadesNinos ? ` (${c.edadesNinos})` : ""}`;
  return t;
}

$("filtro-nivel").onchange = pintarConsultas;

function pintarConsultas() {
  const filtro = $("filtro-nivel").value;
  const lista = datos.consultas
    .map((c) => ({ c, cal: calificar(c) }))
    .filter(({ cal }) => !filtro || cal.nivel === filtro)
    .sort((a, b) => b.cal.puntaje - a.cal.puntaje);
  const cont = $("lista-consultas");
  if (!lista.length) {
    cont.innerHTML = `<p class="vacio">No hay consultas.</p>`;
    return;
  }
  cont.innerHTML = "";
  lista.forEach(({ c, cal }) => {
    const fila = document.createElement("div");
    fila.className = "fila";
    fila.style.gridTemplateColumns = "1fr auto";
    const pres = datos.presupuestos.find((p) => p.consultaId === c.id);
    const estado = pres ? `<span class="estado confirmado">presupuesto ${pres.estado}</span>` : "";
    fila.innerHTML = `<div class="quien">${escapar(c.nombre)} <span class="estado ${NIVELES[cal.nivel].clase}">${NIVELES[cal.nivel].texto}</span> ${estado}
        <small>${escapar(c.destino || c.tipo || "Destino a definir")} · ${escapar(resumenFechas(c))} · ${escapar(pasajerosTexto(c))} · ${escapar(textoDe(AGENCIA.presupuestos, c.presupuesto))}</small>
        <small class="motivos">${cal.motivos.join(" · ")}</small></div>
      <div class="acciones"></div>`;
    const acc = fila.querySelector(".acciones");
    acc.appendChild(boton("Ver", "secundario", () => verConsulta(c)));
    acc.appendChild(boton(pres ? "Editar presupuesto" : "Armar presupuesto", "", () => abrirEditor(pres ? pres.id : null, c)));
    cont.appendChild(fila);
  });
}

function verConsulta(c) {
  const cal = calificar(c);
  const servicios = c.servicios.map((s) => `${servicioPorId(s).icono} ${servicioPorId(s).nombre}`).join(", ");
  $("modal-contenido").innerHTML = `
    <h3>${escapar(c.nombre)} <span class="estado ${NIVELES[cal.nivel].clase}">${NIVELES[cal.nivel].texto}</span></h3>
    <p class="motivos">${cal.motivos.join(" · ")}</p>
    <dl class="detalle">
      <dt>Destino / tipo</dt><dd>${escapar(c.destino || "A definir")} · ${escapar(c.tipo || "—")}</dd>
      <dt>Fechas</dt><dd>${escapar(resumenFechas(c))}</dd>
      <dt>Pasajeros</dt><dd>${escapar(pasajerosTexto(c))}</dd>
      <dt>Quiere cotizar</dt><dd>${escapar(servicios)}</dd>
      <dt>Presupuesto</dt><dd>${escapar(textoDe(AGENCIA.presupuestos, c.presupuesto))}</dd>
      <dt>Decide</dt><dd>${escapar(textoDe(AGENCIA.decision, c.decision))}</dd>
      <dt>Comentario</dt><dd>${escapar(c.comentario || "—")}</dd>
      <dt>Contacto</dt><dd>${escapar(c.whatsapp)}${c.email ? " · " + escapar(c.email) : ""}</dd>
    </dl>
    <div class="acciones" style="margin-top:16px">
      <a class="boton whatsapp chico" target="_blank" rel="noopener"
        href="${linkWhatsApp(c.whatsapp, `Hola ${c.nombre.split(" ")[0]}! Soy ${AGENCIA.agente} de ${AGENCIA.nombre}. Recibí tu consulta por ${c.destino || "tu viaje"} y ya estoy buscando opciones 🙌`)}">Escribirle</a>
      <button class="boton chico" id="modal-armar">Armar presupuesto</button>
      <button class="boton secundario chico" id="modal-cerrar">Cerrar</button>
    </div>`;
  $("modal").classList.remove("oculto");
  $("modal-cerrar").onclick = cerrarModal;
  $("modal-armar").onclick = () => {
    cerrarModal();
    const pres = datos.presupuestos.find((p) => p.consultaId === c.id);
    abrirEditor(pres ? pres.id : null, c);
  };
}

function cerrarModal() {
  $("modal").classList.add("oculto");
}
$("modal").onclick = (e) => { if (e.target.id === "modal") cerrarModal(); };

// ---------- Presupuestos ----------
function pintarPresupuestos() {
  const cont = $("lista-presupuestos");
  if (!datos.presupuestos.length) {
    cont.innerHTML = `<p class="vacio">Todavía no hay presupuestos. Armá uno desde una consulta.</p>`;
    return;
  }
  cont.innerHTML = "";
  datos.presupuestos.forEach((p) => {
    const c = datos.consultas.find((x) => x.id === p.consultaId);
    const rec = p.opciones.find((o) => o.recomendada) || p.opciones[0];
    const total = rec ? totalOpcion(rec, datos.preferencias.margen) : 0;
    const clase = p.estado === "aceptado" ? "confirmado" : p.estado === "enviado" ? "pendiente" : "recuperado";
    const fila = document.createElement("div");
    fila.className = "fila";
    fila.style.gridTemplateColumns = "1fr auto";
    fila.innerHTML = `<div class="quien">${escapar(p.titulo)} <span class="estado ${clase}">${p.estado}</span>
      <small>${escapar(c ? c.nombre : "")} · ${p.opciones.length} opciones · desde ${plata(total)}</small></div><div class="acciones"></div>`;
    const acc = fila.querySelector(".acciones");
    acc.appendChild(boton("Editar", "secundario", () => abrirEditor(p.id, c)));
    acc.appendChild(boton("Ver", "secundario", () => window.open(linkPresupuesto(p), "_blank")));
    if (p.estado !== "aceptado") {
      acc.appendChild(boton("Vendido ✓", "", () => {
        p.estado = "aceptado";
        if (c) c.estado = "vendida";
        guardarYRefrescar();
      }));
    }
    cont.appendChild(fila);
  });
}

function linkPresupuesto(p) {
  const c = datos.consultas.find((x) => x.id === p.consultaId);
  const url = new URL("presupuesto.html", location.href);
  url.hash = "d=" + codificarPresupuesto(versionCliente(p, c, datos.preferencias));
  return url.toString();
}

// ---------- Editor ----------
function itemVacio(tipo = "vuelo") {
  return { tipo, titulo: "", detalle: "", proveedor: "", costo: 0 };
}

function abrirEditor(presId, consulta) {
  const existente = presId && datos.presupuestos.find((p) => p.id === presId);
  if (existente) {
    editando = JSON.parse(JSON.stringify(existente));
  } else {
    const c = consulta;
    editando = {
      id: nuevoId(), consultaId: c ? c.id : null, estado: "borrador", emitido: hoyISO(),
      titulo: c ? `${c.destino || c.tipo || "Tu viaje"}` : "Nuevo presupuesto",
      destino: c ? c.destino : "", fechaIda: c ? c.fechaIda : "", fechaVuelta: c ? c.fechaVuelta : "",
      pasajeros: c ? pasajerosTexto(c) : "", nota: "",
      incluye: "", noIncluye: "Gastos personales y todo lo no mencionado.",
      opciones: [{ nombre: "Opción 1", recomendada: true,
        items: (c ? c.servicios : ["vuelo"]).map((s) => itemVacio(s)) }],
    };
  }
  opActual = 0;
  const c = datos.consultas.find((x) => x.id === editando.consultaId);
  $("editor-titulo").textContent = c ? `Presupuesto para ${c.nombre}` : "Presupuesto";
  $("ed-titulo").value = editando.titulo;
  $("ed-destino").value = editando.destino;
  $("ed-ida").value = editando.fechaIda;
  $("ed-vuelta").value = editando.fechaVuelta;
  $("ed-pasajeros").value = editando.pasajeros;
  $("ed-nota").value = editando.nota;
  $("ed-incluye").value = editando.incluye;
  $("ed-noincluye").value = editando.noIncluye;
  const pr = datos.preferencias;
  $("ed-prefs").innerHTML = `<strong>Margen:</strong> ${pr.margen}%<br><strong>Aéreos:</strong> ${escapar(pr.aerolineas)}<br>
    <strong>Hoteles:</strong> ${escapar(pr.hoteles)}<br><strong>Asistencia:</strong> ${escapar(pr.asistencia)}<br>
    <strong>Autos:</strong> ${escapar(pr.autos)}<br><strong>Reglas:</strong> ${escapar(pr.notas)}`;
  $("ed-ok").classList.add("oculto");
  pintarOpciones();
  actualizarEnviar();
  mostrarVista("editor");
}

// Campos generales → objeto
[["ed-titulo", "titulo"], ["ed-destino", "destino"], ["ed-ida", "fechaIda"], ["ed-vuelta", "fechaVuelta"],
  ["ed-pasajeros", "pasajeros"], ["ed-nota", "nota"], ["ed-incluye", "incluye"], ["ed-noincluye", "noIncluye"]]
  .forEach(([id, campo]) => { $(id).oninput = () => { editando[campo] = $(id).value; actualizarEnviar(); }; });

function pintarOpciones() {
  const pest = $("ed-pestanas-opciones");
  pest.innerHTML = "";
  editando.opciones.forEach((o, i) => {
    const b = document.createElement("button");
    b.className = "pestana" + (i === opActual ? " activa" : "");
    b.textContent = (o.recomendada ? "★ " : "") + (o.nombre || `Opción ${i + 1}`);
    b.onclick = () => { opActual = i; pintarOpciones(); };
    pest.appendChild(b);
  });
  const op = editando.opciones[opActual];
  $("op-nombre").value = op.nombre;
  $("op-recomendada").checked = !!op.recomendada;
  $("btn-borrar-opcion").disabled = editando.opciones.length === 1;
  $("btn-add-opcion").disabled = editando.opciones.length >= 3;
  pintarItems();
}

$("op-nombre").oninput = () => {
  editando.opciones[opActual].nombre = $("op-nombre").value;
  const b = $("ed-pestanas-opciones").children[opActual];
  if (b) b.textContent = (editando.opciones[opActual].recomendada ? "★ " : "") + $("op-nombre").value;
};
$("op-recomendada").onchange = () => {
  editando.opciones.forEach((o, i) => { o.recomendada = i === opActual && $("op-recomendada").checked; });
  pintarOpciones();
};
$("btn-add-opcion").onclick = () => {
  const base = editando.opciones[opActual];
  editando.opciones.push({ nombre: `Opción ${editando.opciones.length + 1}`, recomendada: false,
    items: base.items.map((it) => ({ ...it })) }); // copia la opción actual para no cargar todo de nuevo
  opActual = editando.opciones.length - 1;
  pintarOpciones();
};
$("btn-borrar-opcion").onclick = () => {
  if (!confirm("¿Borrar esta opción?")) return;
  editando.opciones.splice(opActual, 1);
  if (!editando.opciones.some((o) => o.recomendada)) editando.opciones[0].recomendada = true;
  opActual = 0;
  pintarOpciones();
};

function pintarItems() {
  const op = editando.opciones[opActual];
  const cont = $("op-items");
  cont.innerHTML = "";
  op.items.forEach((it, idx) => {
    const fila = document.createElement("div");
    fila.className = "editor-item";
    fila.innerHTML = `
      <select>${AGENCIA.servicios.map((s) => `<option value="${s.id}" ${s.id === it.tipo ? "selected" : ""}>${s.icono} ${s.nombre}</option>`).join("")}</select>
      <input placeholder="Ej: Hotel Jurerê · 10 noches" value="${escapar(it.titulo)}">
      <input placeholder="Detalle (régimen, equipaje...)" value="${escapar(it.detalle)}">
      <input placeholder="Mayorista" value="${escapar(it.proveedor)}">
      <div><input type="number" min="0" step="1" value="${it.costo}" placeholder="Costo USD" title="Costo del mayorista (USD)" style="text-align:right"><div class="precio"></div></div>
      <button class="x" title="Quitar">×</button>`;
    const [sel, titulo, detalle, prov] = fila.querySelectorAll("select, input");
    const costo = fila.querySelector("input[type=number]");
    const precio = fila.querySelector(".precio");
    const pintarPrecio = () => { precio.textContent = `→ ${plata(precioItem(it, datos.preferencias.margen))}`; };
    sel.onchange = () => { it.tipo = sel.value; };
    titulo.oninput = () => { it.titulo = titulo.value; };
    detalle.oninput = () => { it.detalle = detalle.value; };
    prov.oninput = () => { it.proveedor = prov.value; };
    costo.oninput = () => { it.costo = Math.max(0, parseFloat(costo.value) || 0); pintarPrecio(); pintarResumen(); };
    fila.querySelector(".x").onclick = () => { op.items.splice(idx, 1); pintarItems(); };
    pintarPrecio();
    cont.appendChild(fila);
  });
  if (!op.items.length) cont.innerHTML = `<p class="vacio">Sin servicios. Agregá uno o pegá lo que te mandó el mayorista.</p>`;
  pintarResumen();
}

function pintarResumen() {
  const op = editando.opciones[opActual];
  const m = datos.preferencias.margen;
  const costo = op.items.reduce((s, it) => s + it.costo, 0);
  const total = totalOpcion(op, m);
  $("op-resumen").innerHTML = `<span>Costo mayoristas: <strong>${plata(costo)}</strong></span>
    <span>Precio al cliente: <strong>${plata(total)}</strong></span>
    <span>Tu ganancia (${m}%): <strong>${plata(total - costo)}</strong></span>`;
}

$("btn-add-item").onclick = () => {
  editando.opciones[opActual].items.push(itemVacio());
  pintarItems();
};

// ---------- "Pegar lo que mandó el mayorista" (simulación de la fase 2) ----------
const PALABRAS = [
  ["vuelo", /vuelo|a[eé]reo|aerol|→|->|\bida\b|escala|equipaje|latam|gol\b|aerol[ií]neas/i],
  ["alojamiento", /hotel|pousada|noche|airbnb|apart|hab\.|habitaci|resort|hostel|caba[ñn]a/i],
  ["terrestre", /traslado|transfer|bus|micro|terrestre|in\s*\/\s*out/i],
  ["auto", /\bauto|rent[a ]|alquiler de|veh[ií]culo|4x4/i], // antes que asistencia: "auto con seguro"
  ["asistencia", /asistencia|seguro|cobertura|assist/i],
  ["excursion", /excursi|paseo|tour|city|visita/i],
];

function interpretar(texto, proveedor) {
  return texto.split(/\n+/).map((l) => l.trim()).filter(Boolean).map((linea) => {
    // El precio es el último monto de la línea (antes puede haber otros, ej. "cobertura USD 60.000")
    const montos = [...linea.matchAll(/(?:USD|U\$S|US\$|\$)\s*([\d.,]+)/gi)];
    const m = montos[montos.length - 1] || linea.match(/([\d.,]+)\s*(?:USD|U\$S|d[oó]lares)/i);
    const costo = m ? parseFloat(m[1].replace(/\.(?=\d{3}\b)/g, "").replace(",", ".")) : 0;
    const tipo = (PALABRAS.find(([, re]) => re.test(linea)) || ["excursion"])[0];
    const sinPrecio = m ? linea.replace(m[0], "").replace(/[-–:·|]\s*$/, "").trim() : linea;
    const [titulo, ...resto] = sinPrecio.split(/\s[-–|·]\s/);
    return { tipo, titulo: titulo.trim(), detalle: resto.join(" · ").trim(), proveedor, costo };
  }).filter((it) => it.titulo);
}

$("btn-ia").onclick = () => {
  $("modal-contenido").innerHTML = `
    <h3>✨ Pegar lo que mandó el mayorista</h3>
    <p class="vacio" style="margin-top:0">Pegá el texto del mail, WhatsApp o portal del mayorista: una línea por servicio, con su precio.
      <br><em>Demo: acá se simula con reglas simples. En la versión real (fase 2) lo lee la IA, entiende cualquier formato y aplica tus preferencias.</em></p>
    <label>Mayorista</label><input id="ia-prov" placeholder="Ej: Mayorista Sol">
    <label>Texto</label>
    <textarea id="ia-texto" rows="7" style="width:100%;padding:10px;border:1px solid var(--borde);border-radius:10px;font:inherit"
      placeholder="Aéreo Rosario-Florianópolis - Aerolíneas Argentinas con valija USD 1720&#10;Hotel Jurerê Praia 10 noches - desayuno USD 1980&#10;Traslado in/out privado USD 90"></textarea>
    <div class="acciones" style="margin-top:12px">
      <button class="boton" id="ia-ok">Cargar en la opción</button>
      <button class="boton secundario" id="ia-ejemplo">Usar un ejemplo</button>
      <button class="boton secundario" id="ia-cerrar">Cancelar</button>
    </div>`;
  $("modal").classList.remove("oculto");
  $("ia-cerrar").onclick = cerrarModal;
  $("ia-ejemplo").onclick = () => {
    $("ia-prov").value = "Mayorista Sol";
    $("ia-texto").value = "Aéreo Rosario → Salvador de Bahía - LATAM con valija USD 1540\nHotel Pestana Bahia 7 noches - desayuno - vista al mar USD 1260\nTraslado in/out regular USD 60\nExcursión Praia do Forte día completo USD 140\nAsistencia al viajero 8 días - cobertura USD 60.000 USD 95";
  };
  $("ia-ok").onclick = () => {
    const items = interpretar($("ia-texto").value, $("ia-prov").value.trim());
    if (!items.length) return alert("No encontré servicios en el texto.");
    const op = editando.opciones[opActual];
    op.items = op.items.filter((it) => it.titulo || it.costo).concat(items);
    cerrarModal();
    pintarItems();
    actualizarEnviar();
  };
};

// ---------- Guardar, ver y enviar ----------
function guardarPresupuesto() {
  const i = datos.presupuestos.findIndex((p) => p.id === editando.id);
  if (i >= 0) datos.presupuestos[i] = JSON.parse(JSON.stringify(editando));
  else datos.presupuestos.unshift(JSON.parse(JSON.stringify(editando)));
  const c = datos.consultas.find((x) => x.id === editando.consultaId);
  if (c && c.estado === "nueva") c.estado = "presupuestada";
  guardarYRefrescar();
}

function actualizarEnviar() {
  const c = datos.consultas.find((x) => x.id === editando.consultaId);
  const tel = c ? c.whatsapp : "";
  const msg = `Hola${c ? " " + c.nombre.split(" ")[0] : ""}! Te paso el presupuesto de tu viaje a ${editando.destino || "tu destino"} 🧳\n${linkPresupuesto(editando)}\nCualquier duda me escribís. ${AGENCIA.agente}`;
  $("btn-enviar").href = tel ? linkWhatsApp(tel, msg) : `https://wa.me/?text=${encodeURIComponent(msg)}`;
}

// El link de "Enviar" se rearma con cualquier cambio del editor (items, opciones, textos)
["input", "change", "click"].forEach((ev) => $("vista-editor").addEventListener(ev, (e) => {
  if (editando && e.target.id !== "btn-enviar") actualizarEnviar();
}));

function aviso(txt) {
  $("ed-ok").textContent = txt;
  $("ed-ok").classList.remove("oculto");
}

$("btn-guardar").onclick = () => { guardarPresupuesto(); aviso("Presupuesto guardado."); };
$("btn-ver").onclick = () => { guardarPresupuesto(); window.open(linkPresupuesto(editando), "_blank"); };
$("btn-enviar").onclick = () => {
  actualizarEnviar();
  if (editando.estado === "borrador") editando.estado = "enviado";
  guardarPresupuesto();
};
$("btn-copiar").onclick = async () => {
  guardarPresupuesto();
  try {
    await navigator.clipboard.writeText(linkPresupuesto(editando));
    aviso("Link copiado. Pegalo en WhatsApp, Instagram o mail.");
  } catch (e) {
    prompt("Copiá el link:", linkPresupuesto(editando));
  }
};
$("btn-volver").onclick = () => mostrarVista("presupuestos");

// ---------- Preferencias ----------
function pintarPreferencias() {
  const pr = datos.preferencias;
  ["margen", "mayoristas", "aerolineas", "hoteles", "asistencia", "autos", "notas"].forEach((k) => { $("pref-" + k).value = pr[k]; });
}
$("form-prefs").onsubmit = (e) => {
  e.preventDefault();
  const f = new FormData(e.target);
  datos.preferencias = {
    margen: Math.max(0, parseFloat(f.get("margen")) || 0),
    mayoristas: f.get("mayoristas"), aerolineas: f.get("aerolineas"), hoteles: f.get("hoteles"),
    asistencia: f.get("asistencia"), autos: f.get("autos"), notas: f.get("notas"),
  };
  guardarYRefrescar();
  $("prefs-ok").classList.remove("oculto");
};

// ---------- Navegación ----------
document.querySelectorAll(".pestana[data-vista]").forEach((p) => {
  p.onclick = () => {
    if (p.dataset.vista === "preferencias") { pintarPreferencias(); $("prefs-ok").classList.add("oculto"); }
    mostrarVista(p.dataset.vista);
    if (typeof alMostrarVista === "function") alMostrarVista(p.dataset.vista);
  };
});

$("btn-reiniciar").onclick = () => {
  if (!confirm("¿Volver a los datos de ejemplo? Se borran los cambios de la demo.")) return;
  datos = reiniciarDemo();
  refrescar();
  mostrarVista("consultas");
};

window.addEventListener("storage", (e) => {
  if (e.key === CLAVE) {
    datos = cargar();
    refrescar();
  }
});

refrescar();
