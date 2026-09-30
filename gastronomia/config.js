// Configuración de cada local. La demo cambia de local con ?local=cafe | cerveceria | bodegon.
// Para un cliente real se deja uno solo con su carta, colores y datos.
const LOCALES = {
  cafe: {
    nombre: "Café Aroma",
    tipo: "Cafetería",
    lema: "Café de especialidad y pastelería de la casa",
    emoji: "☕",
    colorPrincipal: "#7c4a2d",
    direccion: "Pellegrini 1450, Rosario",
    whatsapp: "5493410000000",
    mesas: 10,
    moneda: "$",
    categorias: [
      { nombre: "Cafés", items: [
        { id: "cortado", foto: "fotos/cortado.jpg", nombre: "Cortado", desc: "Espresso doble con un toque de leche", precio: 3200, emoji: "☕", modelo: "modelos/cafe.glb" },
        { id: "flat", foto: "fotos/flat.jpg", nombre: "Flat white", desc: "Doble ristretto con leche texturizada", precio: 3800, emoji: "☕" },
        { id: "conleche", foto: "fotos/conleche.jpg", nombre: "Café con leche", desc: "En taza grande", precio: 3500, emoji: "🥛" },
        { id: "latte-vainilla", foto: "fotos/latte-vainilla.jpg", nombre: "Latte de vainilla", desc: "Con almíbar de vainilla casero", precio: 4200, emoji: "🍦" },
      ] },
      { nombre: "Para comer", items: [
        { id: "medialunas", foto: "fotos/medialunas.jpg", nombre: "Medialunas x2", desc: "De manteca, recién horneadas", precio: 2400, emoji: "🥐", modelo: "modelos/medialuna.glb?v=2", escaneado: true },
        { id: "palta", foto: "fotos/palta.jpg", nombre: "Tostada con palta", desc: "Pan de masa madre, palta, huevo poché y semillas", precio: 7900, emoji: "🥑", etiquetas: ["veggie"], modelo: "modelos/palta.glb?v=2" },
        { id: "tostado", foto: "fotos/tostado.jpg", nombre: "Tostado de jamón y queso", desc: "En pan de miga", precio: 5600, emoji: "🥪" },
        { id: "budin", foto: "fotos/budin.jpg", nombre: "Budín de limón", desc: "Porción, con glaseado", precio: 3000, emoji: "🍋", etiquetas: ["sin TACC"] },
      ] },
      { nombre: "Tortas", items: [
        { id: "torta-zanahoria", nombre: "Torta de zanahoria", desc: "Con frosting de queso crema y nueces · entera o por porción", precio: 5200, emoji: "🥕", modelo: "modelos/torta-zanahoria.glb?v=2", escaneado: true },
        { id: "torta-frutilla", nombre: "Torta de frutilla y chocolate", desc: "Bizcochuelo de chocolate, crema y frutillas frescas", precio: 5800, emoji: "🍓", modelo: "modelos/torta-frutilla-chocolate.glb?v=2", escaneado: true },
      ] },
      { nombre: "Frescos", items: [
        { id: "limonada", foto: "fotos/limonada.jpg", nombre: "Limonada con menta y jengibre", desc: "Jarra 500 ml", precio: 4500, emoji: "🍹" },
        { id: "licuado", foto: "fotos/licuado.jpg", nombre: "Licuado de frutilla", desc: "Con leche o agua", precio: 4200, emoji: "🍓" },
      ] },
    ],
  },
  cerveceria: {
    nombre: "Lúpulo Norte",
    tipo: "Cervecería",
    lema: "Cerveza artesanal tirada y cocina de bar",
    emoji: "🍺",
    colorPrincipal: "#b45309",
    direccion: "Oroño 850, Rosario",
    whatsapp: "5493410000000",
    mesas: 14,
    moneda: "$",
    categorias: [
      { nombre: "Cervezas (pinta)", items: [
        { id: "ipa", foto: "fotos/ipa.jpg", nombre: "IPA", desc: "Amarga y cítrica · 6,5% · 60 IBU", precio: 5200, emoji: "🍺", modelo: "modelos/cerveza.glb" },
        { id: "honey", foto: "fotos/honey.jpg", nombre: "Honey", desc: "Suave, con miel · 5,5%", precio: 4800, emoji: "🍯" },
        { id: "scottish", foto: "fotos/scottish.jpg", nombre: "Scottish", desc: "Roja, maltosa · 6%", precio: 4800, emoji: "🍺" },
        { id: "stout", foto: "fotos/stout.jpg", nombre: "Stout", desc: "Negra, notas a café · 5,8%", precio: 5000, emoji: "⚫" },
      ] },
      { nombre: "Para picar", items: [
        { id: "burger", foto: "fotos/burger.jpg", nombre: "Hamburguesa Lúpulo", desc: "Doble carne, cheddar, lechuga, tomate y papas", precio: 11500, emoji: "🍔", modelo: "modelos/hamburguesa.glb" },
        { id: "papas-cheddar", foto: "fotos/papas-cheddar.jpg", nombre: "Papas con cheddar y panceta", desc: "Para compartir", precio: 8200, emoji: "🍟" },
        { id: "nachos", foto: "fotos/nachos.jpg", nombre: "Nachos", desc: "Con guacamole, cheddar y pico de gallo", precio: 7600, emoji: "🌮", etiquetas: ["veggie"] },
        { id: "picada", foto: "fotos/picada.jpg", nombre: "Picada para 2", desc: "Fiambres, quesos, aceitunas y pan", precio: 14800, emoji: "🧀" },
      ] },
      { nombre: "Sin alcohol", items: [
        { id: "gaseosa", foto: "fotos/gaseosa.jpg", nombre: "Gaseosa", desc: "500 ml", precio: 2800, emoji: "🥤" },
        { id: "agua", foto: "fotos/agua.jpg", nombre: "Agua saborizada", desc: "500 ml", precio: 2500, emoji: "💧" },
      ] },
    ],
  },
  bodegon: {
    nombre: "El Bodegón de Barrio",
    tipo: "Bodegón",
    lema: "Comida casera como la de la abuela",
    emoji: "🍝",
    colorPrincipal: "#9f1239",
    direccion: "San Martín 2100, Rosario",
    whatsapp: "5493410000000",
    mesas: 16,
    moneda: "$",
    categorias: [
      { nombre: "Platos", items: [
        { id: "mila", foto: "fotos/mila.jpg", nombre: "Milanesa con papas fritas", desc: "De ternera, con limón", precio: 12900, emoji: "🍖", modelo: "modelos/milanesa.glb" },
        { id: "napo", nombre: "Milanesa napolitana", desc: "Con jamón, queso y salsa, más guarnición", precio: 14500, emoji: "🍕" },
        { id: "ravioles", foto: "fotos/ravioles.jpg", nombre: "Ravioles de ricota", desc: "Con tuco o bolognesa", precio: 10800, emoji: "🍝", etiquetas: ["veggie"] },
        { id: "bife", foto: "fotos/bife.jpg", nombre: "Bife de chorizo", desc: "400 g, con ensalada o papas", precio: 18500, emoji: "🥩", etiquetas: ["sin TACC"] },
      ] },
      { nombre: "Postres", items: [
        { id: "flan", foto: "fotos/flan.jpg", nombre: "Flan casero", desc: "Con dulce de leche o crema", precio: 4500, emoji: "🍮", etiquetas: ["sin TACC"] },
        { id: "vigilante", nombre: "Queso y dulce", desc: "El clásico", precio: 4200, emoji: "🧀" },
      ] },
      { nombre: "Bebidas", items: [
        { id: "vino", foto: "fotos/vino.jpg", nombre: "Vino de la casa", desc: "Pingüino de tinto (1 L)", precio: 7800, emoji: "🍷" },
        { id: "sifon", foto: "fotos/sifon.jpg", nombre: "Sifón de soda", desc: "Para acompañar el vino", precio: 1800, emoji: "💧" },
        { id: "gaseosa-b", nombre: "Gaseosa 1,5 L", desc: "Para la mesa", precio: 4200, emoji: "🥤" },
      ] },
    ],
  },
};

const CLAVE_LOCAL = new URLSearchParams(location.search).get("local");
const LOCAL = LOCALES[CLAVE_LOCAL] || LOCALES.cafe;
const ID_LOCAL = LOCALES[CLAVE_LOCAL] ? CLAVE_LOCAL : "cafe";
