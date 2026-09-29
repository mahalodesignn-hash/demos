// Vista del presupuesto para el viajero. Todos los datos vienen dentro del link (#d=...).
document.documentElement.style.setProperty("--marca", AGENCIA.colorPrincipal);
const $ = (id) => document.getElementById(id);

function mostrarError() {
  ["p-intro", "p-datos", "p-incluye", "p-opciones", "p-pago", "p-condiciones", "p-acciones"].forEach((id) => $(id).classList.add("oculto"));
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
  const mon = P.moneda || AGENCIA.moneda;
  const $$ = (n) => plata(n, mon);
  const primer = (P.cliente || "").split(" ")[0];
  document.title = `${P.titulo} · ${P.agencia.nombre}`;

  // ---------- Portada ----------
  $("p-agencia").textContent = P.agencia.nombre;
  if (P.agencia.logo) { $("p-logo").src = P.agencia.logo; $("p-logo").alt = P.agencia.nombre; $("p-logo").classList.remove("oculto"); }
  $("p-titulo").textContent = P.titulo;
  const fechas = P.fechaIda ? `${fechaLinda(P.fechaIda)}${P.fechaVuelta ? " – " + fechaLinda(P.fechaVuelta) : ""}` : "";
  $("p-sub").textContent = [P.destino, fechas].filter(Boolean).join(" · ");

  $("p-intro").innerHTML = `<h2>Hola${primer ? " " + escapar(primer) : ""}! 👋</h2>
    <p style="margin:0">${escapar(P.nota || "Te comparto las opciones que armé para tu viaje.")}</p>
    <p class="vacio" style="margin-bottom:0">— ${escapar(P.agencia.agente)}, ${escapar(P.agencia.nombre)}</p>`;

  // ---------- Datos de la cotización ----------
  const dato = (ico, t, v) => v ? `<div class="dato"><span class="dato-ico">${ico}</span><div><small>${t}</small><strong>${escapar(v)}</strong></div></div>` : "";
  $("p-datos").innerHTML = `<h2>Datos de la cotización</h2><div class="datos-grid">
    ${dato("👥", "Pasajeros", P.pasajeros)}
    ${dato("📅", "Fecha de cotización", fechaCortaAR(P.emitido))}
    ${dato("🧾", "Cotización", P.numero)}
    ${dato("👤", "Tu vendedora", P.agencia.agente)}</div>`;

  // ---------- Tu viaje incluye ----------
  const incluye = (P.incluye || "").split(/[,\n]|\s·\s/).map((x) => x.trim()).filter(Boolean);
  if (incluye.length) {
    $("p-incluye").innerHTML = `<h2>Tu viaje incluye</h2><ul class="checklist">${incluye.map((x) => `<li>${escapar(x.charAt(0).toUpperCase() + x.slice(1))}</li>`).join("")}</ul>`;
  } else $("p-incluye").classList.add("oculto");

  // ---------- Opciones ----------
  const pax = P.cantidadPax || 0;
  $("p-opciones").innerHTML = `<h2 class="titulo-seccion">${P.opciones.length > 1 ? "Elegí tu opción" : "Tu viaje"}</h2>` + P.opciones.map((o, i) => {
    const total = o.items.reduce((s, it) => s + it.precio, 0);
    const lineas = o.items.map((it) => {
      const s = servicioPorId(it.tipo) || { icono: "•", nombre: "" };
      const estrellas = it.estrellas ? `<span class="estrellas">${"★".repeat(it.estrellas)}</span>` : "";
      return `<div class="linea"><div class="ico" title="${escapar(s.nombre)}">${s.icono}</div>
        <div><strong>${escapar(it.titulo)}</strong> ${estrellas}${it.detalle ? `<small>${escapar(it.detalle)}</small>` : ""}
          ${it.link ? `<a class="abrir-web no-imprimir" href="${it.link}" target="_blank" rel="noopener">Ver hotel en Google ↗</a>` : ""}</div>
        <div class="vacio">${$$(it.precio)}</div></div>`;
    }).join("");
    const nombre = o.nombre || "Opción " + (i + 1);
    const msg = `Hola ${P.agencia.agente.split(" ")[0]}! Quiero avanzar con la ${nombre} de la cotización ${P.numero || `"${P.titulo}"`} (${$$(total)}). ${P.cliente ? "Soy " + P.cliente + "." : ""}`;
    return `<article class="opcion-pres ${o.recomendada ? "recomendada" : ""}">
      <header><h2>${escapar(nombre)}</h2>${o.recomendada ? `<span class="cinta">RECOMENDADA</span>` : ""}</header>
      ${lineas}
      <div class="totales">
        <div>${pax > 1 ? `<div class="grande">${$$(total / pax)}</div><div class="vacio">por persona · total ${$$(total)} (${pax} pasajeros)</div>`
          : `<div class="vacio">Total</div><div class="grande">${$$(total)}</div>`}</div>
        <a class="boton no-imprimir" target="_blank" rel="noopener" href="${linkWhatsApp(P.agencia.whatsapp, msg)}">Quiero esta opción</a>
      </div>
    </article>`;
  }).join("");

  // ---------- Forma de pago ----------
  if (P.formaPago) $("p-pago").innerHTML = `<h2>💳 Forma de pago</h2><p style="margin:0">${escapar(P.formaPago)}</p>`;
  else $("p-pago").classList.add("oculto");

  // ---------- Condiciones ----------
  $("p-condiciones").innerHTML = `
    ${P.noIncluye ? `<h2>No incluye</h2><p>${escapar(P.noIncluye)}</p>` : ""}
    <p class="aviso" style="margin-bottom:0">⏳ Cotización válida hasta el <strong>${fechaLinda(P.validoHasta)}</strong>.
      ${escapar(P.condiciones || "Las tarifas pueden cambiar hasta el momento de la reserva.")}</p>`;

  $("p-consultar").href = linkWhatsApp(P.agencia.whatsapp, `Hola ${P.agencia.agente.split(" ")[0]}! Tengo una consulta sobre la cotización ${P.numero || `"${P.titulo}"`}.`);
  $("p-pie").innerHTML = [escapar(P.agencia.nombre), escapar(P.agencia.detalle || ""),
    P.agencia.instagram ? `<a href="https://www.instagram.com/${encodeURIComponent(P.agencia.instagram)}/" target="_blank" rel="noopener">@${escapar(P.agencia.instagram)}</a>` : "",
    escapar(P.agencia.email || ""), "Demo"].filter(Boolean).join(" · ");
}
