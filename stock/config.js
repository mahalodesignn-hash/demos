// Configuración del comercio. Para adaptar la demo a otro cliente o rubro,
// se cambia solo este archivo.
const NEGOCIO = {
  nombre: "Librería Papelito",
  rubro: "Librería y artística",
  colorPrincipal: "#1d4ed8",
  moneda: "$",
  categorias: ["Cuadernos", "Escritura", "Arte", "Oficina", "Libros"],
  proveedores: [
    { id: "distri-norte", nombre: "Distribuidora Norte", whatsapp: "5493410000001" },
    { id: "papelera-sur", nombre: "Papelera del Sur", whatsapp: "5493410000002" },
    { id: "editorial-rio", nombre: "Editorial Río", whatsapp: "5493410000003" },
  ],
  // Cuánto pedir al reponer: hasta llegar a (mínimo × este factor)
  factorReposicion: 2,
};
