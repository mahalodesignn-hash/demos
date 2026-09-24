// Vista del paciente: elegir servicio → día y horario → datos → confirmación.
document.documentElement.style.setProperty("--marca", NEGOCIO.colorPrincipal);

let datos = cargar();
const eleccion = { servicio: null, fecha: null, hora: null };
const $ = (id) => document.getElementById(id);

$("negocio-nombre").textContent = NEGOCIO.nombre;
$("negocio-detalle").textContent = `${NEGOCIO.profesional} · ${NEGOCIO.direccion}`;
document.title = `Sacar ${NEGOCIO.textos.turno} · ${NEGOCIO.nombre}`;

function mostrar(...ids) {
  ["paso-servicio", "paso-horario", "paso-datos", "paso-espera", "paso-listo"]
    .forEach((id) => $(id).classList.toggle("oculto", !ids.includes(id)));
}

// Normaliza un teléfono argentino al formato de WhatsApp (549 + área + número)
function normalizarTelefono(txt) {
  let n = txt.replace(/\D/g, "");
  if (n.startsWith("549")) return n;
  if (n.startsWith("54")) return "549" + n.slice(2);
  if (n.startsWith("0")) n = n.slice(1);
  return "549" + n;
}

function telefonoValido(txt) {
  return txt.replace(/\D/g, "").length >= 8;
}

// ---------- Paso 1 ----------
function pintarServicios() {
  $("lista-servicios").innerHTML = "";
  NEGOCIO.servicios.forEach((s) => {
    const b = document.createElement("button");
    b.className = "opcion" + (eleccion.servicio === s.id ? " elegida" : "");
    b.innerHTML = `${s.nombre}<small>${s.duracion} min</small>`;
    b.onclick = () => {
      eleccion.servicio = s.id;
      eleccion.fecha = null;
      eleccion.hora = null;
      pintarServicios();
      pintarDias();
      mostrar("paso-servicio", "paso-horario");
      $("paso-horario").scrollIntoView({ behavior: "smooth" });
    };
    $("lista-servicios").appendChild(b);
  });
}

// ---------- Paso 2 ----------
function pintarDias() {
  $("lista-dias").innerHTML = "";
  diasHabiles(hoyISO(), NEGOCIO.diasParaReservar).forEach((dia) => {
    const libres = horariosLibres(datos, dia, eleccion.servicio).length;
    const b = document.createElement("button");
    b.className = "opcion" + (eleccion.fecha === dia ? " elegida" : "");
    const sinLugar = dia === hoyISO() ? "sin horarios" : "completo";
    b.innerHTML = `${fechaCorta(dia)}<small>${libres ? libres + " libres" : sinLugar}</small>`;
    b.onclick = () => {
      eleccion.fecha = dia;
      eleccion.hora = null;
      pintarDias();
      pintarHoras();
    };
    $("lista-dias").appendChild(b);
  });
  $("bloque-horas").classList.add("oculto");
  $("sin-lugar").classList.add("oculto");
}

function pintarHoras() {
  const libres = horariosLibres(datos, eleccion.fecha, eleccion.servicio);
  $("sin-lugar").classList.toggle("oculto", libres.length > 0);
  $("bloque-horas").classList.toggle("oculto", libres.length === 0);
  $("titulo-horas").textContent = `Horarios del ${fechaLarga(eleccion.fecha).toLowerCase()}`;
  $("lista-horas").innerHTML = "";
  libres.forEach((h) => {
    const b = document.createElement("button");
    b.className = "opcion";
    b.textContent = h;
    b.onclick = () => {
      eleccion.hora = h;
      const s = servicioPorId(eleccion.servicio);
      $("resumen").innerHTML = `<strong>${s.nombre}</strong><br>${fechaLarga(eleccion.fecha)} a las ${h} hs`;
      mostrar("paso-datos");
      $("nombre").focus();
    };
    $("lista-horas").appendChild(b);
  });
}

// ---------- Paso 3 ----------
$("form-datos").onsubmit = (e) => {
  e.preventDefault();
  const nombre = $("nombre").value.trim();
  const tel = $("telefono").value.trim();
  if (!nombre || !telefonoValido(tel)) {
    alert("Revisá el nombre y el número de WhatsApp.");
    return;
  }
  datos = cargar(); // por si cambió en otra pestaña
  if (!horariosLibres(datos, eleccion.fecha, eleccion.servicio).includes(eleccion.hora)) {
    alert("Ese horario se acaba de ocupar. Elegí otro, por favor.");
    pintarDias();
    mostrar("paso-servicio", "paso-horario");
    return;
  }
  datos.turnos.push({
    id: nuevoId(), fecha: eleccion.fecha, hora: eleccion.hora, servicio: eleccion.servicio,
    paciente: nombre, telefono: normalizarTelefono(tel), estado: "confirmado", origen: "web", creado: hoyISO(),
  });
  guardar(datos);
  const s = servicioPorId(eleccion.servicio);
  const detalle = `${s.nombre} · ${fechaLarga(eleccion.fecha)} a las ${eleccion.hora} hs`;
  $("listo-titulo").textContent = `¡Listo, ${nombre.split(" ")[0]}! Tu ${NEGOCIO.textos.turno} está reservado`;
  $("listo-detalle").textContent = `${detalle}. Te vamos a mandar un recordatorio por WhatsApp el día anterior.`;
  $("listo-whatsapp").href = linkWhatsApp(NEGOCIO.whatsapp, `Hola! Reservé un turno por la web: ${detalle}. Soy ${nombre}.`);
  mostrar("paso-listo");
  $("form-datos").reset();
};

// ---------- Lista de espera ----------
NEGOCIO.servicios.forEach((s) => {
  const o = document.createElement("option");
  o.value = s.id;
  o.textContent = s.nombre;
  $("espera-servicio").appendChild(o);
});

function abrirEspera(e) {
  if (e) e.preventDefault();
  if (eleccion.servicio) $("espera-servicio").value = eleccion.servicio;
  mostrar("paso-espera");
  $("paso-espera").scrollIntoView({ behavior: "smooth" });
}
$("link-espera").onclick = abrirEspera;
$("btn-ir-espera").onclick = abrirEspera;
$("btn-volver-espera").onclick = () => mostrar("paso-servicio", "paso-horario");

$("form-espera").onsubmit = (e) => {
  e.preventDefault();
  const nombre = $("espera-nombre").value.trim();
  const tel = $("espera-telefono").value.trim();
  if (!nombre || !telefonoValido(tel)) {
    alert("Revisá el nombre y el número de WhatsApp.");
    return;
  }
  datos = cargar();
  datos.espera.push({
    id: nuevoId(), paciente: nombre, telefono: normalizarTelefono(tel),
    servicio: $("espera-servicio").value, preferencia: $("espera-preferencia").value, desde: hoyISO(),
  });
  guardar(datos);
  $("listo-titulo").textContent = `¡Te anotamos, ${nombre.split(" ")[0]}!`;
  $("listo-detalle").textContent = "Si se libera un lugar te escribimos por WhatsApp.";
  $("listo-whatsapp").href = linkWhatsApp(NEGOCIO.whatsapp, `Hola! Me anoté en la lista de espera. Soy ${nombre}.`);
  mostrar("paso-listo");
  $("form-espera").reset();
};

$("btn-otro").onclick = () => {
  eleccion.servicio = eleccion.fecha = eleccion.hora = null;
  datos = cargar();
  pintarServicios();
  mostrar("paso-servicio");
  window.scrollTo({ top: 0, behavior: "smooth" });
};

pintarServicios();
mostrar("paso-servicio");
