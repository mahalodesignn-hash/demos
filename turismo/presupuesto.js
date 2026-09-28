// Vista del presupuesto para el viajero. Todos los datos vienen dentro del link (#d=...).
document.documentElement.style.setProperty("--marca", AGENCIA.colorPrincipal);
const $ = (id) => document.getElementById(id);

function mostrarError() {
  ["p-intro", "p-opciones", "p-condiciones"].forEach((id) => $(id).classList.add("oculto"));
  document.querySelector(".acciones").classList.add("oculto");
  $("p-error").classList.remove("oculto");
  $("p-titulo").textContent = AGENCIA.nombre;
}

let P = null;
try {
  const m = location.hash.match(/d=([^&]+)/);
  if (m) P = decodificarPresupuesto(m[1]);
} catch (e) { P = null; }

if (!P) {
  mostrarError();
} else {
  const primer = (P.cliente || "").split(" ")[0];
  document.title = `${P.titulo} · ${P.agencia.nombre}`;
  $("p-agencia").textContent = P.agencia.nombre;
  if (P.agencia.logo) { $("p-logo").src = P.agencia.logo; $("p-logo").alt = P.agencia.nombre; $("p-logo").classList.remove("oculto"); }
  $("p-titulo").textContent = P.titulo;
  const fechas = P.fechaIda ? `${fechaLinda(P.fechaIda)}${P.fechaVuelta ? " – " + fechaLinda(P.fechaVuelta) : ""}` : "";
  $("p-sub").textContent = [P.destino, fechas, P.pasajeros].filter(Boolean).join(" · ");

  $("p-intro").innerHTML = `<h2>Hola${primer ? " " + escapar(primer) : ""}! 👋</h2>
    <p style="margin:0">${escapar(P.nota || "Te comparto las opciones que armé para tu viaje.")}</p>
    <p class="vacio" style="margin-bottom:0">— ${escapar(P.agencia.agente)}, ${escapar(P.agencia.nombre)}</p>`;

  $("p-opciones").innerHTML = P.opciones.map((o, i) => {
    const total = o.items.reduce((s, it) => s + it.precio, 0);
    const lineas = o.items.map((it) => {
      const s = servicioPorId(it.tipo) || { icono: "•", nombre: "" };
      return `<div class="linea"><div class="ico" title="${escapar(s.nombre)}">${s.icono}</div>
        <div><strong>${escapar(it.titulo)}</strong>${it.detalle ? `<small>${escapar(it.detalle)}</small>` : ""}</div>
        <div class="vacio">${plata(it.precio)}</div></div>`;
    }).join("");
    const msg = `Hola ${P.agencia.agente}! Quiero avanzar con la ${o.nombre} del presupuesto "${P.titulo}" (${plata(total)}). ${P.cliente ? "Soy " + P.cliente + "." : ""}`;
    return `<article class="opcion-pres ${o.recomendada ? "recomendada" : ""}">
      <header><h2>${escapar(o.nombre || "Opción " + (i + 1))}</h2>${o.recomendada ? `<span class="cinta">RECOMENDADA</span>` : ""}</header>
      ${lineas}
      <div class="totales">
        <div><div class="vacio">Total</div><div class="grande">${plata(total)}</div></div>
        <a class="boton no-imprimir" target="_blank" rel="noopener" href="${linkWhatsApp(P.agencia.whatsapp, msg)}">Quiero esta opción</a>
      </div>
    </article>`;
  }).join("");

  $("p-condiciones").innerHTML = `
    ${P.incluye ? `<h2>Incluye</h2><p>${escapar(P.incluye)}</p>` : ""}
    ${P.noIncluye ? `<h2>No incluye</h2><p>${escapar(P.noIncluye)}</p>` : ""}
    <p class="aviso" style="margin-bottom:0">Presupuesto emitido el ${fechaLinda(P.emitido)}, válido hasta el <strong>${fechaLinda(P.validoHasta)}</strong>.
      Las tarifas aéreas y hoteleras pueden cambiar hasta el momento de la reserva.</p>`;

  $("p-consultar").href = linkWhatsApp(P.agencia.whatsapp, `Hola ${P.agencia.agente}! Tengo una consulta sobre el presupuesto "${P.titulo}".`);
  $("p-pie").innerHTML = [escapar(P.agencia.nombre), escapar(P.agencia.detalle || ""),
    P.agencia.instagram ? `<a href="https://www.instagram.com/${encodeURIComponent(P.agencia.instagram)}/" target="_blank" rel="noopener">@${escapar(P.agencia.instagram)}</a>` : "",
    escapar(P.agencia.email || ""), "Demo"].filter(Boolean).join(" · ");
}
