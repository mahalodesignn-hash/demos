# Demos — Soluciones para vos

Demos para mostrarle a prospectos. Son páginas web estáticas (HTML + CSS + JavaScript, sin instalar nada) y los datos se guardan en el navegador de quien las usa (`localStorage`). No tienen base de datos ni login: son para vender y para pilotos, no para producción.

La documentación del negocio (clientes, precios, decisiones) vive en el Drive compartido `Claude/soluciones para vos`. Este repo es solo el código.

## Demos

| Carpeta | Qué es | Para quién |
|---|---|---|
| `reservas/` | Página para sacar turno (`index.html`) + panel del consultorio (`panel.html`) con agenda, recordatorios por WhatsApp, cancelaciones y **lista de espera que recupera turnos** | Consultorios, estética, peluquerías |
| `stock/` | Control de stock: ventas y entradas con lector de código de barras, stock bajo, **pedido automático al proveedor por WhatsApp**, conteos y movimientos | Librerías, ferreterías, dietéticas, comercios |
| `turismo/` | Formulario del viajero con **calificación caliente / tibio / frío** (`consulta.html`), panel de la agencia con preferencias y editor de presupuestos con hasta 3 opciones (`panel.html`), y **presupuesto para el cliente** como link con los datos adentro + PDF (`presupuesto.html`) | Agencias de viaje |
| `comun/` | Estilos compartidos | — |

`index.html` en la raíz es una portada con links a las dos demos.

## Adaptar a un cliente
Cada demo tiene un `config.js`: nombre del negocio, color, servicios u horarios (reservas), categorías y proveedores (stock). Cambiando solo ese archivo se arma la versión para otro cliente o rubro.

## Probar en la compu
```bash
python -m http.server 8765
```
y abrir http://localhost:8765. En el panel hay un botón **Reiniciar demo** que vuelve a los datos de ejemplo.

## WhatsApp
Las demos **no usan la API de WhatsApp Business**: los botones abren un chat de WhatsApp con el mensaje ya escrito (`wa.me`), y la persona lo manda. No hace falta verificar nada con Meta ni pagar por mensaje. El envío automático (bot) es el siguiente nivel.

## Para pasar a producción (pendiente)
- Base de datos online (ej. Supabase) para que los datos se compartan entre la página del paciente y el panel.
- Login para el panel.
- Recordatorios automáticos (API de WhatsApp o mail).
