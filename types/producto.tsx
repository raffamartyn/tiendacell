export type Producto = {
  id: number;
  Nombre: string;
  Descripción: string;
  Precio: number;
  Imagen: string | null;
  imagen_url: string | null;
  Marca: string;
  Destacado: boolean | null; // "SI" o "NO" desde AppSheet
};