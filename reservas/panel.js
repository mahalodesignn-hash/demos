// Panel del consultorio: agenda del día, recordatorios, cancelaciones y lista de espera.
document.documentElement.style.setProperty("--marca", NEGOCIO.colorPrincipal);

let datos = cargar();
let diaVisto = hoyISO();
const $ = (id) => document.getElementById(id);
const T = NEGOCIO.textos;

$("negocio-nombre").textContent = NEGOCIO.nombre;

function escapar(txt) {
  const d = document.createElement("div");
  d.textContent = txt;
  return d.innerHTML;
}

function primerNombre(nombre) {
  return nombre.split(" ")[0];
}

function refrescar() {
  pintarMetricas();
  pintarAgenda();
  pintarEspera();
}

// ---------- Métricas ----------
function pintarMetricas() {
  const hoy = hoyISO();
  const finSemana = sumarDias(hoy, 6);
  const activos = datos.turnos.filter((t) => t.estado !== "cancelado");
  const deHoy = activos.filter((t) => t.fecha === hoy).length;
  const semana = activos.filter((t) => t.fecha >= hoy && t.fecha <= finSemana).length;
  const pendientes = activos.filter((t) => t.estado === "pendiente" && t.fecha >= hoy).length;
  const cancelados = datos.turnos.filter((t) => t.estado === "cancelado").length;
  $("metricas").innerHTML = `
    <div class="metrica"><div class="numero">${deHoy}</div><div class="etiqueta">${T.turno}s hoy</div></div>
    <div class="metrica"><div class="numero">${semana}</div><div class="etiqueta">${T.turno}s próximos 7 días</div></div>
    <div class="metrica"><div class="numero">${pendientes}</div><div class="etiqueta">sin confirmar</div></div>
    <div class="metrica"><div class="numero">${cancelados}</div><div class="etiqueta">cancelados</div></div>
    <div class="metrica destacada"><div class="numero">${datos.recuperados || 0}</div><div class="etiqueta">${T.turno}s recuperados con la lista de espera</div></div>`;
  $("cuenta-espera").textContent = datos.espera.length ? `(${datos.espera.length})` : "";
}

// ---------- Agenda ----------
function mensajeRecordatorio(t) {
  const s = servicioPorId(t.servicio);
  return `Hola ${primerNombre(t.paciente)}! Te recordamos tu ${T.turno} de ${s.nombre.toLowerCase()} el ${fechaLarga(t.fecha).toLowerCase()} a las ${t.hora} hs en ${NEGOCIO.nombre}. ¿Nos confirmás si venís? Respondé SÍ o NO 🙌`;
}

function pintarAgenda() {
  $("dia-actual").textContent = fechaLarga(diaVisto);
  const delDia = datos.turnos.filter((t) => t.fecha === diaVisto).sort((a, b) => a.hora.localeCompare(b.hora));
  const cont = $("lista-turnos");
  if (!NEGOCIO.horarios[desdeISO(diaVisto).getDay()]) {
    cont.innerHTML = `<p class="vacio">Este día no se atiende.</p>`;
    return;
  }
  if (!delDia.length) {
    cont.innerHTML = `<p class="vacio">No hay ${T.turno}s para este día.</p>`;
    return;
  }
  cont.innerHTML = "";
  delDia.forEach((t) => {
    const s = servicioPorId(t.servicio);
    const fila = document.createElement("div");
    fila.className = "fila" + (t.estado === "cancelado" ? " cancelado" : "");
    const etiqueta = t.origen === "lista de espera" && t.estado !== "cancelado"
      ? `<span class="estado recuperado">recuperado</span>` : "";
    fila.innerHTML = `
      <div class="hora">${t.hora}</div>
      <div class="quien">${escapar(t.paciente)} <span class="estado ${t.estado}">${t.estado}</span>${etiqueta}
        <small>${s.nombre} · ${s.duracion} min</small></div>
      <div class="acciones"></div>`;
    const acc = fila.querySelector(".acciones");
    if (t.estado !== "cancelado") {
      const rec = document.createElement("a");
      rec.className = "boton whatsapp chico";
      rec.target = "_blank";
      rec.rel = "noopener";
      rec.href = linkWhatsApp(t.telefono, mensajeRecordatorio(t));
      rec.textContent = "Recordatorio";
      acc.appendChild(rec);
      if (t.estado === "pendiente") {
        acc.appendChild(boton("Confirmar", "secundario", () => { t.estado = "confirmado"; guardarYRefrescar(); }));
      }
      acc.appendChild(boton("Cancelar", "peligro", () => cancelar(t)));
    }
    cont.appendChild(fila);
  });
}

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

// ---------- Cancelar y ofrecer el lugar a la lista de espera ----------
function cancelar(t) {
  if (!confirm(`¿Cancelar el ${T.turno} de ${t.paciente} (${t.hora} hs)?`)) return;
  t.estado = "cancelado";
  guardarYRefrescar();
  ofrecerLugar(t);
}

function candidatos(turnoLibre) {
  const esManana = minutos(turnoLibre.hora) < 13 * 60;
  const libres = (servicio) => horariosLibres(datos, turnoLibre.fecha, servicio);
  return datos.espera
    .map((p) => {
      const entra = libres(p.servicio).includes(turnoLibre.hora);
      const horarioOk = p.preferencia === "cualquiera" || (p.preferencia === "mañana") === esManana;
      const puntaje = (p.servicio === turnoLibre.servicio ? 4 : 0) + (horarioOk ? 2 : 0) + (entra ? 8 : 0);
      return { p, entra, horarioOk, puntaje };
    })
    .sort((a, b) => b.puntaje - a.puntaje || a.p.desde.localeCompare(b.p.desde));
}

function ofrecerLugar(turnoLibre) {
  const lista = candidatos(turnoLibre);
  const cuando = `${fechaLarga(turnoLibre.fecha)} a las ${turnoLibre.hora} hs`;
  let html = `<h3>Se liberó un lugar</h3>
    <p class="aviso">${cuando}</p>`;
  if (!lista.length) {
    html += `<p class="vacio">No hay nadie en la lista de espera.</p>`;
  } else {
    html += `<p class="vacio">Ofrecéselo a alguien de la lista de espera. Los mejores candidatos aparecen primero.</p><div id="candidatos"></div>`;
  }
  html += `<button class="boton ancho secundario" id="cerrar-modal">Cerrar</button>`;
  $("modal-contenido").innerHTML = html;
  $("modal").classList.remove("oculto");
  $("cerrar-modal").onclick = cerrarModal;

  lista.forEach(({ p, entra, horarioOk }) => {
    const s = servicioPorId(p.servicio);
    const fila = document.createElement("div");
    fila.className = "fila";
    fila.style.gridTemplateColumns = "1fr auto";
    const notas = [s.nombre, `prefiere ${p.preferencia}`, `espera desde ${fechaCorta(p.desde)}`];
    if (!entra) notas.push(`⚠️ no entra (${s.duracion} min)`);
    else if (!horarioOk) notas.push("⚠️ fuera de su horario preferido");
    fila.innerHTML = `<div class="quien">${escapar(p.paciente)}<small>${notas.join(" · ")}</small></div><div class="acciones"></div>`;
    const acc = fila.querySelector(".acciones");
    const ofrecer = document.createElement("a");
    ofrecer.className = "boton whatsapp chico";
    ofrecer.target = "_blank";
    ofrecer.rel = "noopener";
    ofrecer.href = linkWhatsApp(p.telefono,
      `Hola ${primerNombre(p.paciente)}! Se liberó un ${T.turno} en ${NEGOCIO.nombre} el ${cuando.toLowerCase()}. ¿Lo querés? Respondé SÍ y es tuyo 🙌`);
    ofrecer.textContent = "Ofrecer";
    acc.appendChild(ofrecer);
    const asignar = boton("Asignar", "", () => {
      datos.turnos.push({ id: nuevoId(), fecha: turnoLibre.fecha, hora: turnoLibre.hora, servicio: p.servicio,
        paciente: p.paciente, telefono: p.telefono, estado: "confirmado", origen: "lista de espera", creado: hoyISO() });
      datos.espera = datos.espera.filter((x) => x.id !== p.id);
      datos.recuperados = (datos.recuperados || 0) + 1;
      guardarYRefrescar();
      cerrarModal();
    });
    asignar.disabled = !entra;
    acc.appendChild(asignar);
    $("candidatos").appendChild(fila);
  });
}

function cerrarModal() {
  $("modal").classList.add("oculto");
}
$("modal").onclick = (e) => { if (e.target.id === "modal") cerrarModal(); };

// ---------- Lista de espera ----------
function pintarEspera() {
  const cont = $("lista-espera");
  if (!datos.espera.length) {
    cont.innerHTML = `<p class="vacio">Nadie en espera.</p>`;
    return;
  }
  cont.innerHTML = "";
  [...datos.espera].sort((a, b) => a.desde.localeCompare(b.desde)).forEach((p) => {
    const s = servicioPorId(p.servicio);
    const fila = document.createElement("div");
    fila.className = "fila";
    fila.style.gridTemplateColumns = "1fr auto";
    fila.innerHTML = `<div class="quien">${escapar(p.paciente)}<small>${s.nombre} · prefiere ${p.preferencia} · desde ${fechaCorta(p.desde)}</small></div><div class="acciones"></div>`;
    const acc = fila.querySelector(".acciones");
    const w = document.createElement("a");
    w.className = "boton whatsapp chico";
    w.target = "_blank";
    w.rel = "noopener";
    w.href = linkWhatsApp(p.telefono, `Hola ${primerNombre(p.paciente)}! Te escribimos de ${NEGOCIO.nombre} por tu lugar en la lista de espera.`);
    w.textContent = "WhatsApp";
    acc.appendChild(w);
    acc.appendChild(boton("Quitar", "peligro", () => {
      datos.espera = datos.espera.filter((x) => x.id !== p.id);
      guardarYRefrescar();
    }));
    cont.appendChild(fila);
  });
}

// ---------- Navegación ----------
$("dia-anterior").onclick = () => { diaVisto = sumarDias(diaVisto, -1); pintarAgenda(); };
$("dia-siguiente").onclick = () => { diaVisto = sumarDias(diaVisto, 1); pintarAgenda(); };
$("dia-hoy").onclick = () => { diaVisto = hoyISO(); pintarAgenda(); };

document.querySelectorAll(".pestana").forEach((p) => {
  p.onclick = () => {
    document.querySelectorAll(".pestana").forEach((x) => x.classList.toggle("activa", x === p));
    $("vista-agenda").classList.toggle("oculto", p.dataset.vista !== "agenda");
    $("vista-espera").classList.toggle("oculto", p.dataset.vista !== "espera");
  };
});

$("btn-reiniciar").onclick = () => {
  if (!confirm("¿Volver a los datos de ejemplo? Se borran los cambios de la demo.")) return;
  datos = reiniciarDemo();
  diaVisto = hoyISO();
  refrescar();
};

// Si el paciente reserva en otra pestaña, el panel se actualiza solo
window.addEventListener("storage", (e) => {
  if (e.key === CLAVE) {
    datos = cargar();
    refrescar();
  }
});

refrescar();
