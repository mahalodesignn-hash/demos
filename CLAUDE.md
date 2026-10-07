# Contexto para Claude: demos de "Soluciones para vos"

Este repo (`mahalodesignn-hash/demos`, **público**) tiene las demos que usamos para vender. Somos **Tomás Meucci y Guido Fortuna** (Rosario): armamos agentes y apps de IA para pymes.

## Dónde está cada cosa
| Qué | Dónde |
|---|---|
| Código de las demos | Este repo. Una carpeta por demo (ver abajo). `comun/estilos.css` es compartido |
| Demos online | https://mahalodesignn-hash.github.io/demos/ (se actualiza sola con cada push a `main`, tarda 1–2 min) |
| **Negocio**: decisiones, tareas, clientes, precios, plan de ventas | Repo **privado** `mahalodesignn-hash/negocio`. En la compu de Tomás está clonado en `negocio/` (dentro de esta carpeta, ignorado por git) |
| Memoria compartida del equipo | `negocio/CONTEXTO.md`: leelo al empezar (después de `git pull` en `negocio/`) |
| Documentación de cada demo | `negocio/02 - Agentes/<demo>/README.md` |
| Plan de ventas y nichos | `negocio/00 - Negocio/plan-de-ventas.md` |
| Borradores sin publicar (propuestas, contratos) | `borradores/` (ignorado por git) |

Si `negocio/` no existe en esta compu, pedile al socio que lo clone (`gh repo clone mahalodesignn-hash/negocio negocio`).

## Las demos
| Demo | Carpeta | Link | Doc |
|---|---|---|---|
| Turnos con lista de espera (consultorios, estética) | `reservas/` | /demos/reservas/index.html · /demos/reservas/panel.html | `negocio/02 - Agentes/reservas-lista-espera/` |
| Control de stock (comercios) | `stock/` | /demos/stock/index.html | `negocio/02 - Agentes/control-stock/` |
| Turismo: Byway Turismo (prospecto real) | `turismo/` | /demos/turismo/index.html · consulta.html · panel.html · presupuesto.html?ejemplo | `negocio/02 - Agentes/turismo-presupuestos/` y `negocio/01 - Clientes/Agencias de viajes/Byway Turismo/ficha.md` |
| Gastronomía (cafés, cervecerías, bodegones) | `gastronomia/` | /demos/gastronomia/ | `negocio/02 - Agentes/gastronomia/` |
| Bot de WhatsApp por nicho (diseño, de Guido) | — | — | `negocio/02 - Agentes/whatsapp-bot/` |
| Propuesta de tipografías y colores | `estilos/` | /demos/estilos/ | — |

Todas son HTML + CSS + JS sin dependencias, con datos de ejemplo en `localStorage`. Cada una se adapta con su `config.js`.

## Reglas de trabajo
1. **Al empezar:** `git pull` en este repo y en `negocio/`, leé `negocio/CONTEXTO.md` y mirá "En curso". Si otro socio tiene tomada la misma demo, avisá antes de tocarla.
2. **Antes de trabajar:** anotá la tarea en "En curso" de `negocio/CONTEXTO.md` (commit + push).
3. **Al terminar:** commit + push en este repo; actualizá la doc de la demo en `negocio/02 - Agentes/` y sacá tu línea de "En curso" (commit + push en `negocio`).
4. **Probá antes de publicar:** levantá el servidor (`.claude/launch.json`, nombre `demos`, puerto 8765), probalo en tamaño celular y revisá la consola. Si cambiás JS o CSS, subí el `?v=` de los `<script>` y `<link>` para que los celulares no muestren la versión vieja.
5. **Este repo es público:** nunca pongas acá precios, datos de clientes, contactos ni notas internas. Eso va en `negocio/`.
6. **WhatsApp en las demos:** los botones van a un número de ejemplo. En turismo, `whatsappDeVendedoras: false` evita mandarle mensajes de prueba a las vendedoras reales de Byway.
7. **Plan de ventas vigente (30/09):** *no se construyen demos nuevas hasta tener 2 pilotos funcionando*. Mejorar lo existente para vender, sí. Si te piden algo grande nuevo, recordalo y preguntá.
8. Hablá en español rioplatense, sé crítico y sincero, y confirmá antes de decisiones de negocio (precios, clientes, nichos).
