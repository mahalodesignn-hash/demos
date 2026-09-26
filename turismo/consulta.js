// Formulario del viajero: 3 pasos que sirven de filtro para la agencia.
document.documentElement.style.setProperty("--marca", AGENCIA.colorPrincipal);

const $ = (id) => document.getElementById(id);
const form = $("form-consulta");

$("agencia-nombre").textContent = AGENCIA.nombre;
$("agencia-lema").textContent = AGENCIA.lema;
document.title = `Contanos tu viaje · ${AGENCIA.nombre}`;

function chip(nombre, valor, texto, tipo) {
  return `<label class="chip"><input type="${tipo}" name="${nombre}" value="${escapar(valor)}"><span>${escapar(texto)}</span></label>`;
}
$("chips-tipo").innerHTML = AGENCIA.tiposDeViaje.map((t) => chip("tipo", t, t, "radio")).join("");
$("chips-servicios").innerHTML = AGENCIA.servicios.map((s) => chip("servicios", s.id, `${s.icono} ${s.nombre}`, "checkbox")).join("");
$("presupuesto").innerHTML = AGENCIA.presupuestos.map((p) => `<option value="${p.id}">${escapar(p.texto)}</option>`).join("");
$("decision").innerHTML = AGENCIA.decision.map((d) => `<option value="${d.id}">${escapar(d.texto)}</option>`).join("");
$("presupuesto").value = "nose";
$("decision").value = "mirando";

$("ninos").oninput = () => $("bloque-edades").classList.toggle("oculto", !(parseInt($("ninos").value, 10) > 0));
$("fechaIda").min = hoyISO();
$("fechaIda").onchange = () => { $("fechaVuelta").min = $("fechaIda").value; };

function irA(n) {
  document.querySelectorAll("[data-paso]").forEach((s) => s.classList.toggle("oculto", s.dataset.paso !== String(n)));
  window.scrollTo({ top: 0, behavior: "smooth" });
}

document.querySelectorAll("[data-ir]").forEach((b) => {
  b.onclick = () => {
    const destino = b.dataset.ir;
    if (destino === "3" && !form.querySelectorAll("input[name=servicios]:checked").length) {
      alert("Marcá al menos un servicio para cotizarte.");
      return;
    }
    irA(destino);
  };
});

function normalizarTelefono(txt) {
  let n = txt.replace(/\D/g, "");
  if (n.startsWith("549")) return n;
  if (n.startsWith("54")) return "549" + n.slice(2);
  if (n.startsWith("0")) n = n.slice(1);
  return "549" + n;
}

form.onsubmit = (e) => {
  e.preventDefault();
  const f = new FormData(form);
  const nombre = (f.get("nombre") || "").trim();
  const tel = (f.get("whatsapp") || "").trim();
  if (!nombre || tel.replace(/\D/g, "").length < 8) {
    alert("Completá tu nombre y un WhatsApp válido.");
    return;
  }
  const consulta = {
    id: nuevoId(), creada: hoyISO(), nombre, whatsapp: normalizarTelefono(tel), email: (f.get("email") || "").trim(),
    destino: (f.get("destino") || "").trim(), tipo: f.get("tipo") || "", fechaIda: f.get("fechaIda") || "",
    fechaVuelta: f.get("fechaVuelta") || "", mesAproximado: (f.get("mesAproximado") || "").trim(),
    flexible: !!f.get("flexible"), adultos: parseInt(f.get("adultos"), 10) || 1, ninos: parseInt(f.get("ninos"), 10) || 0,
    edadesNinos: (f.get("edadesNinos") || "").trim(), servicios: f.getAll("servicios"),
    presupuesto: f.get("presupuesto"), decision: f.get("decision"), comentario: (f.get("comentario") || "").trim(),
    estado: "nueva",
  };
  const datos = cargar();
  datos.consultas.unshift(consulta);
  guardar(datos);

  const { nivel } = calificar(consulta);
  const primer = nombre.split(" ")[0];
  $("gracias-titulo").textContent = `¡Gracias, ${primer}!`;
  $("gracias-texto").textContent = nivel === "frio"
    ? `Recibimos tu consulta. ${AGENCIA.agente} la va a revisar y te escribe por WhatsApp con ideas para tu viaje.`
    : `Recibimos tu consulta. ${AGENCIA.agente} ya está buscando opciones y te escribe por WhatsApp con tu presupuesto.`;
  form.classList.add("oculto");
  $("gracias").classList.remove("oculto");
  window.scrollTo({ top: 0, behavior: "smooth" });
};

$("btn-otra").onclick = () => {
  form.reset();
  $("presupuesto").value = "nose";
  $("decision").value = "mirando";
  $("bloque-edades").classList.add("oculto");
  form.classList.remove("oculto");
  $("gracias").classList.add("oculto");
  irA(1);
};
