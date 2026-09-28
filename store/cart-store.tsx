import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ProductoCarrito = {
  id: number;
  nombre: string;
  precio: number;
  marca: string;
  cantidad: number;
};

type CartStore = {
  items: ProductoCarrito[];

  agregar: (
    producto: Omit<ProductoCarrito, "cantidad">
  ) => void;

  aumentar: (id: number) => void;
  disminuir: (id: number) => void;
  eliminar: (id: number) => void;
  vaciar: () => void;
};

export const useCartStore = create<CartStore>()(
  persist(
    (set) => ({
      items: [],

      agregar: (producto) =>
        set((state) => {
          const existe = state.items.find(
            (item) => item.id === producto.id
          );

          if (existe) {
            return {
              items: state.items.map((item) =>
                item.id === producto.id
                  ? {
                      ...item,
                      cantidad: item.cantidad + 1,
                    }
                  : item
              ),
            };
          }

          return {
            items: [
              ...state.items,
              {
                ...producto,
                cantidad: 1,
              },
            ],
          };
        }),

      aumentar: (id) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id
              ? {
                  ...item,
                  cantidad: item.cantidad + 1,
                }
              : item
          ),
        })),

      disminuir: (id) =>
        set((state) => ({
          items: state.items
            .map((item) =>
              item.id === id
                ? {
                    ...item,
                    cantidad: item.cantidad - 1,
                  }
                : item
            )
            .filter((item) => item.cantidad > 0),
        })),

      eliminar: (id) =>
        set((state) => ({
          items: state.items.filter(
            (item) => item.id !== id
          ),
        })),

      vaciar: () => set({ items: [] }),
    }),
    {
      name: "stockcenter-carrito",
    }
  )
);