// Automatizaciones para la agencia: (1) agente que busca en todos los sitios y (2) ficha única
// de pasajeros que completa las planillas. Usa datos, $, boton, mostrarVista y abrirEditor de panel.js.

if (!datos.pasajeros) { datos.pasajeros = pasajerosDeEjemplo(); guardar(datos); }

// Las secciones del buscador están fuera de "vista-buscar": se esconden al cambiar de vista
const mostrarVistaBase = mostrarVista;
mostrarVista = function (v) {
  mostrarVistaBase(v);
  if (v !== "buscar") ["bus-progreso", "bus-resultados"].forEach((id) => $(id).classList.add("oculto"));
};

function alMostrarVista(v) {
  if (v === "buscar") prepararBuscador();
  if (v === "pasajeros") pintarPasajeros();
}

function opcionesDeViajes(select, conVacio) {
  const actual = select.value;
  select.innerHTML = (conVacio ? `<option value="">Búsqueda libre</option>` : "") +
    datos.consultas.map((c) => `<option value="${c.id}">${escapar(c.nombre)} · ${escapar(c.destino || c.tipo || "a definir")}</option>`).join("");
  if (actual && [...select.options].some((o) => o.value === actual)) select.value = actual;
}

function diasEntre(a, b) {
  if (!a || !b) return 7;
  return Math.max(1, Math.round((new Date(b) - new Date(a)) / 86400000));
}

// =====================================================================
// 1. AGENTE QUE BUSCA EN TODOS LOS SITIOS (simulado)
// =====================================================================

$("bus-servicios").innerHTML = AGENCIA.servicios.map((s) =>
  `<label class="chip"><input type="checkbox" name="bus-serv" value="${s.id}"><span>${s.icono} ${escapar(s.nombre)}</span></label>`).join("");

function prepararBuscador() {
  opcionesDeViajes($("bus-consulta"), true);
  if (!$("bus-consulta").value && datos.consultas.length) {
    const caliente = [...datos.consultas].sort((a, b) => calificar(b).puntaje - calificar(a).puntaje)[0];
    $("bus-consulta").value = caliente.id;
  }
  cargarConsultaEnBuscador();
}

function cargarConsultaEnBuscador() {
  const c = datos.consultas.find((x) => x.id === $("bus-consulta").value);
  if (!c) return;
  $("bus-destino").value = c.destino || "";
  const ida = c.fechaIda || sumarDias(hoyISO(), 45);
  $("bus-ida").value = ida;
  $("bus-vuelta").value = c.fechaVuelta || sumarDias(ida, 7);
  $("bus-adultos").value = c.adultos;
  $("bus-ninos").value = c.ninos;
  document.querySelectorAll("input[name=bus-serv]").forEach((i) => { i.checked = c.servicios.includes(i.value); });
}
$("bus-consulta").onchange = cargarConsultaEnBuscador;

// Números "aleatorios" pero siempre iguales para el mismo destino (así la demo es consistente)
function semilla(txt) {
  let h = 2166136261;
  for (const ch of txt) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return () => ((h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0) % 1000) / 1000;
}

function sitiosPara(q) {
  return AGENCIA.sitios.filter((s) => s.tipos.some((t) => q.servicios.includes(t)) && (!s.soloDestinos || s.soloDestinos.test(q.destino)));
}

function generarResultados(q) {
  const r = semilla(q.destino.toLowerCase() + q.ida);
  const pax = q.adultos + q.ninos;
  const noches = diasEntre(q.ida, q.vuelta);
  const dest = q.destino.split(/[,(]/)[0].trim();
  const pick = (arr) => arr[Math.floor(r() * arr.length)];
  const res = [];
  const sitiosDe = (tipo) => sitiosPara(q).filter((s) => s.tipos.includes(tipo));
  q.servicios.forEach((tipo) => {
    sitiosDe(tipo).forEach((sitio) => {
      const n = tipo === "alojamiento" || tipo === "vuelo" ? 3 : 2;
      for (let i = 0; i < n; i++) {
        let it;
        if (tipo === "vuelo") {
          const aero = pick(["Aerolíneas Argentinas", "LATAM", "Gol", "Flybondi", "Copa Airlines"]);
          const escalaHs = pick([0, 2, 3, 5, 7]);
          it = { titulo: `${q.origen} → ${dest} (${escalaHs ? "1 escala" : "directo"})`,
            detalle: `${aero} · ${escalaHs ? `escala de ${escalaHs} hs · ` : ""}valija 23 kg`, aero, escalaHs,
            costo: Math.round((380 + r() * 520) * pax) };
        } else if (tipo === "alojamiento") {
          const esAirbnb = sitio.nombre === "Airbnb";
          const nombre = esAirbnb ? pick(["Depto 2 amb. con balcón", "Casa con pileta", "Loft céntrico", "Depto frente al mar"])
            : `${pick(["Hotel", "Pousada", "Apart", "Resort"])} ${pick(["Costa", "Mirador", "Plaza", "Brisas", "Del Sol", "Real"])} ${dest}`;
          const desayuno = !esAirbnb && r() > 0.25;
          const puntaje = (7 + r() * 2.6).toFixed(1);
          it = { titulo: `${nombre} · ${noches} noches`,
            detalle: `${desayuno ? "desayuno · " : ""}${r() > 0.5 ? "pileta · " : ""}puntaje ${puntaje}`, desayuno, puntaje: +puntaje,
            costo: Math.round((55 + r() * 170) * noches * Math.max(1, Math.ceil(pax / 2))) };
        } else if (tipo === "terrestre") {
          const privado = i === 0;
          it = { titulo: `Traslados in / out ${privado ? "privados" : "regulares"}`, detalle: "Aeropuerto ↔ alojamiento",
            costo: Math.round((privado ? 70 : 18 * pax) + r() * 40) };
        } else if (tipo === "excursion") {
          it = { titulo: pick(["City tour", "Día de playa en catamarán", "Excursión de día completo", "Tour gastronómico"]) + ` en ${dest}`,
            detalle: `${pax} personas · con guía`, costo: Math.round((35 + r() * 60) * pax) };
        } else if (tipo === "asistencia") {
          const plan = i === 0 ? 60000 : 150000;
          it = { titulo: `Asistencia al viajero ${noches + 1} días`, detalle: `Cobertura USD ${plan.toLocaleString("es-AR")} por persona`, plan,
            costo: Math.round((plan === 60000 ? 3.2 : 5.1) * (noches + 1) * pax) };
        } else if (tipo === "auto") {
          const cat = i === 0 ? "Económico" : "SUV";
          it = { titulo: `Auto ${cat} · ${noches} días`, detalle: "Seguro total · km libre",
            costo: Math.round((cat === "SUV" ? 62 : 38) * noches + r() * 60) };
        }
        res.push({ id: nuevoId(), tipo, sitio: sitio.nombre, ...it });
      }
    });
  });
  marcarPreferidos(res);
  return res;
}

// Aplica las preferencias cargadas por la agente para destacar las mejores opciones
function marcarPreferidos(res) {
  const pr = datos.preferencias;
  const txt = (s) => (s || "").toLowerCase();
  const minPuntaje = parseFloat((pr.hoteles.match(/m[ií]nimo\s*(\d+(?:[.,]\d+)?)/i) || [])[1]) || 8;
  const maxEscala = parseFloat((pr.aerolineas.match(/(\d+)\s*hs/i) || [])[1]) || 4;
  res.forEach((it) => {
    const motivos = [];
    if (it.tipo === "vuelo") {
      if (txt(pr.aerolineas).includes(txt(it.aero))) motivos.push("aerolínea preferida");
      if (it.escalaHs <= maxEscala) motivos.push(it.escalaHs ? `escala ≤ ${maxEscala} hs` : "directo");
      it.preferido = motivos.length === 2;
    } else if (it.tipo === "alojamiento") {
      if (it.desayuno) motivos.push("con desayuno");
      if (it.puntaje >= minPuntaje) motivos.push(`puntaje ≥ ${minPuntaje}`);
      it.preferido = motivos.length === 2;
    } else if (it.tipo === "asistencia") {
      if (txt(pr.asistencia).includes(txt(it.sitio))) motivos.push("tu proveedor");
      it.preferido = motivos.length > 0;
    } else if (it.tipo === "auto") {
      if (txt(pr.autos).includes(txt(it.sitio))) motivos.push("tu rentadora");
      it.preferido = motivos.length > 0;
    } else {
      it.preferido = false;
    }
    it.motivos = motivos;
  });
}

let busqueda = null; // { q, resultados, elegidos:Set }

$("form-buscar").onsubmit = (e) => {
  e.preventDefault();
  const q = {
    consultaId: $("bus-consulta").value, origen: $("bus-origen").value.trim() || "Rosario",
    destino: $("bus-destino").value.trim(), ida: $("bus-ida").value, vuelta: $("bus-vuelta").value,
    adultos: Math.max(1, parseInt($("bus-adultos").value, 10) || 1), ninos: Math.max(0, parseInt($("bus-ninos").value, 10) || 0),
    servicios: [...document.querySelectorAll("input[name=bus-serv]:checked")].map((i) => i.value),
  };
  if (!q.destino || !q.ida || !q.vuelta) return alert("Completá destino y fechas.");
  if (!q.servicios.length) return alert("Marcá al menos qué buscar.");
  correrAgente(q);
};

// Muestra al agente "recorriendo" cada sitio, uno tras otro
function correrAgente(q) {
  const sitios = sitiosPara(q);
  const resultados = generarResultados(q);
  $("bus-resultados").classList.add("oculto");
  $("bus-progreso").classList.remove("oculto");
  $("bus-progreso").innerHTML = `<h2>🤖 El agente está buscando…</h2>` + sitios.map((s, i) =>
    `<div class="fila" style="grid-template-columns:1fr auto" id="sitio-${i}">
      <div class="quien">${escapar(s.nombre)}<small class="estado-sitio">en espera</small></div><div class="vacio">⏳</div></div>`).join("");
  $("bus-progreso").scrollIntoView({ behavior: "smooth" });
  const pasos = ["iniciando sesión…", "cargando la búsqueda…", "leyendo resultados…"];
  let t = 0;
  sitios.forEach((s, i) => {
    const fila = () => $("sitio-" + i);
    pasos.forEach((paso) => {
      setTimeout(() => { fila().querySelector(".estado-sitio").textContent = paso; fila().lastElementChild.textContent = "🔄"; }, t);
      t += 280 + Math.random() * 220;
    });
    setTimeout(() => {
      const n = resultados.filter((r) => r.sitio === s.nombre).length;
      fila().querySelector(".estado-sitio").textContent = `${n} opciones encontradas`;
      fila().lastElementChild.textContent = "✅";
    }, t);
  });
  setTimeout(() => {
    $("bus-progreso").querySelector("h2").textContent = `✅ Listo: ${resultados.length} opciones en ${sitios.length} sitios`;
    busqueda = { q, resultados, elegidos: new Set() };
    // Preselecciona la mejor opción de cada rubro (preferida y más barata)
    q.servicios.forEach((tipo) => {
      const mejor = ordenar(resultados.filter((r) => r.tipo === tipo))[0];
      if (mejor) busqueda.elegidos.add(mejor.id);
    });
    pintarResultados();
  }, t + 300);
}

function ordenar(lista) {
  return [...lista].sort((a, b) => (b.preferido - a.preferido) || (a.costo - b.costo));
}

function pintarResultados() {
  const { q, resultados, elegidos } = busqueda;
  const m = datos.preferencias.margen;
  const cont = $("bus-resultados");
  cont.classList.remove("oculto");
  cont.innerHTML = q.servicios.map((tipo) => {
    const s = servicioPorId(tipo);
    const lista = ordenar(resultados.filter((r) => r.tipo === tipo));
    const baratoId = [...lista].sort((a, b) => a.costo - b.costo)[0]?.id;
    return `<div class="tarjeta"><h2>${s.icono} ${escapar(s.nombre)} <span class="vacio" style="font-weight:400">(${lista.length})</span></h2>` +
      lista.map((it) => `<label class="fila" style="grid-template-columns:28px 1fr auto;cursor:pointer">
        <input type="checkbox" data-res="${it.id}" ${elegidos.has(it.id) ? "checked" : ""} style="width:20px;height:20px">
        <div class="quien"><strong>${escapar(it.titulo)}</strong>
          ${it.preferido ? `<span class="estado confirmado">⭐ tus preferencias</span>` : ""}${it.id === baratoId ? `<span class="estado pendiente">más barato</span>` : ""}
          <small>${escapar(it.detalle)}</small><small>${escapar(it.sitio)}${it.motivos.length ? " · " + escapar(it.motivos.join(", ")) : ""}</small></div>
        <div style="text-align:right"><strong>${plata(it.costo)}</strong><small class="vacio" style="display:block">al cliente ${plata(it.costo * (1 + m / 100))}</small></div>
      </label>`).join("") + `</div>`;
  }).join("") + `<div class="tarjeta" style="position:sticky;bottom:8px;z-index:2">
      <div class="barra" style="margin:0"><span id="bus-total"></span>
      <button class="boton" id="btn-bus-presupuesto">Armar presupuesto con lo elegido</button></div></div>`;
  cont.querySelectorAll("input[data-res]").forEach((i) => {
    i.onchange = () => { i.checked ? elegidos.add(i.dataset.res) : elegidos.delete(i.dataset.res); totalBusqueda(); };
  });
  $("btn-bus-presupuesto").onclick = pasarAPresupuesto;
  totalBusqueda();
}

function totalBusqueda() {
  const sel = busqueda.resultados.filter((r) => busqueda.elegidos.has(r.id));
  const costo = sel.reduce((s, r) => s + r.costo, 0);
  $("bus-total").innerHTML = `${sel.length} elegidos · costo <strong>${plata(costo)}</strong> · al cliente <strong>${plata(costo * (1 + datos.preferencias.margen / 100))}</strong>`;
}

function pasarAPresupuesto() {
  const sel = busqueda.resultados.filter((r) => busqueda.elegidos.has(r.id));
  if (!sel.length) return alert("Elegí al menos una opción.");
  const items = sel.map((r) => ({ tipo: r.tipo, titulo: r.titulo, detalle: r.detalle, proveedor: r.sitio, costo: r.costo }));
  const c = datos.consultas.find((x) => x.id === busqueda.q.consultaId) || null;
  const existente = c && datos.presupuestos.find((p) => p.consultaId === c.id);
  abrirEditor(existente ? existente.id : null, c);
  const vacia = editando.opciones.length === 1 && editando.opciones[0].items.every((it) => !it.titulo && !it.costo);
  if (vacia) {
    editando.opciones[0].items = items;
    editando.opciones[0].nombre = "Opción recomendada";
  } else if (editando.opciones.length < 3) {
    editando.opciones.push({ nombre: "Opción del buscador", recomendada: false, items });
    opActual = editando.opciones.length - 1;
  } else {
    editando.opciones[opActual].items = items;
  }
  if (!c) {
    editando.destino = busqueda.q.destino;
    editando.titulo = busqueda.q.destino;
    editando.fechaIda = busqueda.q.ida;
    editando.fechaVuelta = busqueda.q.vuelta;
    $("ed-titulo").value = editando.titulo; $("ed-destino").value = editando.destino;
    $("ed-ida").value = editando.fechaIda; $("ed-vuelta").value = editando.fechaVuelta;
  }
  pintarOpciones();
  actualizarEnviar();
}

// =====================================================================
// 2. PASAJEROS: FICHA ÚNICA + PLANILLAS AUTOMÁTICAS
// =====================================================================

$("pas-viaje").onchange = pintarPasajeros;

function pasajerosDelViaje() {
  return datos.pasajeros.filter((p) => p.viajeId === $("pas-viaje").value);
}

function pintarPasajeros() {
  opcionesDeViajes($("pas-viaje"), false);
  if (!$("pas-viaje").value && datos.consultas[0]) $("pas-viaje").value = datos.consultas[0].id;
  const lista = pasajerosDelViaje();
  const cont = $("lista-pasajeros");
  if (!lista.length) {
    cont.innerHTML = `<p class="vacio">Todavía no hay pasajeros cargados para este viaje.</p>`;
    return;
  }
  cont.innerHTML = "";
  lista.forEach((p) => {
    const falta = faltantes(p);
    const fila = document.createElement("div");
    fila.className = "fila";
    fila.style.gridTemplateColumns = "1fr auto";
    fila.innerHTML = `<div class="quien">${escapar(p.apellido)}, ${escapar(p.nombre)}
        ${falta.length ? `<span class="estado pendiente">falta: ${falta.join(", ")}</span>` : `<span class="estado confirmado">completo</span>`}
        <small>DNI ${escapar(p.dni || "—")} · ${p.nacimiento ? `${fechaCortaAR(p.nacimiento)} (${edad(p.nacimiento)} años)` : "sin fecha de nac."}${p.pasaporte ? ` · Pasaporte ${escapar(p.pasaporte)}` : ""}</small></div>
      <div class="acciones"></div>`;
    const acc = fila.querySelector(".acciones");
    acc.appendChild(boton("Copiar datos", "secundario", () => copiarPasajero(p)));
    acc.appendChild(boton("Editar", "secundario", () => editarPasajero(p)));
    cont.appendChild(fila);
  });
}

// Copia los datos en el orden típico de los formularios de los portales, para pegarlos de un toque
async function copiarPasajero(p) {
  const txt = [p.apellido, p.nombre, p.sexo, fechaCortaAR(p.nacimiento), p.nacionalidad, p.dni, p.pasaporte, fechaCortaAR(p.vencePasaporte), p.email, p.telefono].join("\t");
  try { await navigator.clipboard.writeText(txt); alert("Datos copiados. Pegalos en el formulario del portal."); }
  catch (e) { prompt("Copiá los datos:", txt); }
}

function editarPasajero(p, leidoPorIA = false) {
  const nuevo = !p || !p.id;
  const x = p || { habitacion: 1, apellido: "", nombre: "", sexo: "F", nacimiento: "", nacionalidad: "Argentina", dni: "", pasaporte: "", vencePasaporte: "", email: "", telefono: "", observaciones: "" };
  const campo = (k, label, tipo = "text") => `<div><label>${label}</label><input name="${k}" type="${tipo}" value="${escapar(x[k] || "")}"></div>`;
  $("modal-contenido").innerHTML = `<h3>${nuevo ? "Nuevo pasajero" : "Editar pasajero"}</h3>
    ${leidoPorIA ? `<p class="aviso" style="margin-top:0">🤖 Datos leídos del documento. <strong>Revisalos antes de guardar.</strong><br><em>Demo: la lectura está simulada; en la versión real la IA lee la foto.</em></p>` : ""}
    <form id="form-pasajero"><div class="grilla-2">
      ${campo("apellido", "Apellido")}${campo("nombre", "Nombre")}
      <div><label>Sexo</label><select name="sexo"><option ${x.sexo === "F" ? "selected" : ""}>F</option><option ${x.sexo === "M" ? "selected" : ""}>M</option><option ${x.sexo === "X" ? "selected" : ""}>X</option></select></div>
      ${campo("nacimiento", "Fecha de nacimiento", "date")}${campo("nacionalidad", "Nacionalidad")}${campo("dni", "DNI")}
      ${campo("pasaporte", "Pasaporte")}${campo("vencePasaporte", "Vencimiento pasaporte", "date")}
      ${campo("email", "Email", "email")}${campo("telefono", "Teléfono")}
      ${campo("habitacion", "Habitación (para el hotel)", "number")}
    </div>${campo("observaciones", "Observaciones (menores, dieta, movilidad...)")}
      <button class="boton ancho" type="submit">Guardar</button>
      ${nuevo ? "" : `<button class="boton ancho peligro" type="button" id="pas-borrar">Quitar del viaje</button>`}
      <button class="boton ancho secundario" type="button" id="pas-cerrar">Cancelar</button></form>`;
  $("modal").classList.remove("oculto");
  $("pas-cerrar").onclick = cerrarModal;
  if (!nuevo) $("pas-borrar").onclick = () => {
    if (!confirm("¿Quitar este pasajero del viaje?")) return;
    datos.pasajeros = datos.pasajeros.filter((y) => y.id !== p.id);
    guardar(datos); cerrarModal(); pintarPasajeros();
  };
  $("form-pasajero").onsubmit = (e) => {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.target));
    if (!f.apellido.trim() || !f.nombre.trim()) return alert("Completá nombre y apellido.");
    if (nuevo) datos.pasajeros.push({ id: nuevoId(), viajeId: $("pas-viaje").value, ...f });
    else Object.assign(p, f);
    guardar(datos); cerrarModal(); pintarPasajeros();
  };
}
$("btn-pas-nuevo").onclick = () => editarPasajero(null);

// "Foto del DNI": en la demo simula la lectura con datos de ejemplo
const LEIDOS = [
  { apellido: "González", nombre: "Carolina", sexo: "F", nacimiento: "1991-08-17", dni: "36.258.147", pasaporte: "AAG741852", vencePasaporte: "2031-03-02" },
  { apellido: "Fernández", nombre: "Diego", sexo: "M", nacimiento: "1984-02-25", dni: "30.963.852", pasaporte: "AAD369258", vencePasaporte: "2028-12-14" },
  { apellido: "Suárez", nombre: "Valentina", sexo: "F", nacimiento: "1999-10-05", dni: "41.852.963", pasaporte: "", vencePasaporte: "" },
];
$("pas-foto").onchange = () => {
  if (!$("pas-foto").files.length) return;
  $("modal-contenido").innerHTML = `<h3>🤖 Leyendo el documento…</h3><p class="vacio">Detectando nombre, número y fechas.</p>`;
  $("modal").classList.remove("oculto");
  setTimeout(() => {
    const leido = LEIDOS[datos.pasajeros.length % LEIDOS.length];
    editarPasajero({ nacionalidad: "Argentina", email: "", telefono: "", observaciones: "", ...leido }, true);
    $("pas-foto").value = "";
  }, 1600);
};

// ---------- Planillas ----------
function planilla(tipo) {
  const c = datos.consultas.find((x) => x.id === $("pas-viaje").value);
  const pas = pasajerosDelViaje();
  const destino = c ? c.destino || "" : "";
  const ida = c ? c.fechaIda : "", vuelta = c ? c.fechaVuelta : "";
  const base = `${(c ? c.nombre.split(" ").slice(-1)[0] : "viaje")}-${destino}`.replace(/[^\wáéíóúñ-]+/gi, "-");
  if (tipo === "mayorista") return { archivo: `Planilla pasajeros ${base}.xlsx`, hoja: "Pasajeros", filas: [
    ["Apellido", "Nombre", "Sexo", "Fecha de nacimiento", "Edad", "Nacionalidad", "Tipo doc.", "N° documento", "Vencimiento", "Email", "Teléfono"],
    ...pas.map((p) => [p.apellido, p.nombre, p.sexo, fechaCortaAR(p.nacimiento), edad(p.nacimiento, ida || hoyISO()), p.nacionalidad,
      p.pasaporte ? "Pasaporte" : "DNI", p.pasaporte || p.dni, fechaCortaAR(p.vencePasaporte), p.email, p.telefono])] };
  if (tipo === "asistencia") {
    const dias = diasEntre(ida, vuelta) + 1;
    const plan = /europa|ee\.?\s?uu|estados unidos|usa|madrid|roma|par[ií]s/i.test(destino) ? "USD 150.000" : "USD 60.000";
    return { archivo: `Solicitud asistencia ${base}.xlsx`, hoja: "Asistencia", filas: [
      ["Pasajero", "DNI", "Fecha de nacimiento", "Edad", "Destino", "Desde", "Hasta", "Días", "Cobertura"],
      ...pas.map((p) => [`${p.apellido}, ${p.nombre}`, p.dni, fechaCortaAR(p.nacimiento), edad(p.nacimiento, ida || hoyISO()), destino,
        fechaCortaAR(ida), fechaCortaAR(vuelta), dias, plan])] };
  }
  // Rooming list: cada pasajero tiene su número de habitación (por defecto todos en la 1)
  const filas = [["Habitación", "Pasajero", "Tipo", "Edad", "Check-in", "Check-out", "Observaciones"]];
  [...pas].sort((a, b) => (parseInt(a.habitacion, 10) || 1) - (parseInt(b.habitacion, 10) || 1)).forEach((p) => {
    const e = edad(p.nacimiento, ida || hoyISO());
    filas.push([parseInt(p.habitacion, 10) || 1, `${p.apellido}, ${p.nombre}`, e < 12 ? "Menor (CHD)" : "Adulto (ADL)", e, fechaCortaAR(ida), fechaCortaAR(vuelta), p.observaciones]);
  });
  return { archivo: `Rooming list ${base}.xlsx`, hoja: "Rooming", filas };
}

function descargar({ archivo, hoja, filas }) {
  if (window.XLSX) {
    const ws = XLSX.utils.aoa_to_sheet(filas);
    ws["!cols"] = filas[0].map((_, i) => ({ wch: Math.max(...filas.map((f) => String(f[i] ?? "").length), 8) + 2 }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, hoja);
    XLSX.writeFile(wb, archivo);
  } else {
    // Sin conexión a la librería: CSV que abre igual en Excel
    const csv = filas.map((f) => f.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(";")).join("\r\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv" }));
    a.download = archivo.replace(/\.xlsx$/, ".csv");
    a.click();
  }
}

document.querySelectorAll("[data-planilla]").forEach((b) => {
  b.onclick = () => {
    if (!pasajerosDelViaje().length) return alert("Cargá al menos un pasajero.");
    const incompletos = pasajerosDelViaje().filter((p) => faltantes(p).length);
    if (incompletos.length && !confirm(`${incompletos.length} pasajero(s) tienen datos incompletos. ¿Generar igual?`)) return;
    const tipos = b.dataset.planilla === "todas" ? ["mayorista", "asistencia", "rooming"] : [b.dataset.planilla];
    tipos.forEach((t, i) => setTimeout(() => descargar(planilla(t)), i * 400));
  };
});
