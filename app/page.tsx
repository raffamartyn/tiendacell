"use client";

import { useEffect, useMemo, useState } from "react";
import Carrito from "@/components/Carrito";
import { useCartStore } from "@/store/cart-store";
import { supabase } from "@/lib/supabase";

/* =====================================================
   TIPO DE PRODUCTO
===================================================== */

type Producto = {
  id: number;
  Nombre: string;
  Descripción: string | null;
  Precio: number;
  Imagen: string | null;
  Marca: string | null;
  Destacado: string | boolean | null;
};

/* =====================================================
   FORMATO PRECIO
===================================================== */

function precio(valor: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(valor);
}

/* =====================================================
   IMAGEN APPSHEET

   Supabase guarda algo como:
   tienda_Images/foto.jpg

   Next arma la URL completa.
===================================================== */

function obtenerImagen(imagen: string | null) {
  if (!imagen) return null;

  // Si ya viene una URL completa, la usamos directamente
  if (
    imagen.startsWith("http://") ||
    imagen.startsWith("https://")
  ) {
    return imagen;
  }

  const appName = "tiendacell-1001769426-26-09-10";
  const tableName = "tienda";

  return `https://www.appsheet.com/template/gettablefileurl?appName=${appName}&tableName=${tableName}&fileName=${encodeURIComponent(
    imagen
  )}`;
}

/* =====================================================
   DESTACADO APPSHEET

   Soporta:
   SI
   Sí
   si
   true
   TRUE
   boolean true
===================================================== */

function esDestacado(valor: Producto["Destacado"]) {
  if (valor === true) return true;

  if (typeof valor !== "string") {
    return false;
  }

  const normalizado = valor
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  return (
    normalizado === "si" ||
    normalizado === "true"
  );
}

/* =====================================================
   HOME
===================================================== */

export default function Home() {
  const [carritoAbierto, setCarritoAbierto] =
    useState(false);

  const [busqueda, setBusqueda] =
    useState("");

  const [marcaSeleccionada, setMarcaSeleccionada] =
    useState("Todas");

  const [productos, setProductos] =
    useState<Producto[]>([]);

  const [cargando, setCargando] =
    useState(true);

  const [errorCarga, setErrorCarga] =
    useState("");

  /* ===================================================
     CARRITO
  =================================================== */

  const items = useCartStore(
    (state) => state.items
  );

  const agregar = useCartStore(
    (state) => state.agregar
  );

  const cantidadTotal = items.reduce(
    (total, item) =>
      total + item.cantidad,
    0
  );

  const totalCarrito = items.reduce(
    (total, item) =>
      total +
      item.precio * item.cantidad,
    0
  );

  function agregarProducto(
    producto: Producto
  ) {
    agregar({
      id: producto.id,
      nombre: producto.Nombre,
      precio: Number(producto.Precio),
      marca: producto.Marca ?? "",
    });
  }

  /* ===================================================
     CARGAR PRODUCTOS DE SUPABASE
  =================================================== */

  useEffect(() => {
    async function cargarProductos() {
      try {
        setCargando(true);
        setErrorCarga("");

        const { data, error } =
          await supabase
            .from("tienda")
            .select("*")
            .order("id", {
              ascending: true,
            });

        if (error) {
          console.error(
            "Error Supabase:",
            error
          );

          setErrorCarga(
            "No pudimos cargar los productos."
          );

          return;
        }

        setProductos(
          (data ?? []) as Producto[]
        );
      } catch (error) {
        console.error(error);

        setErrorCarga(
          "No pudimos cargar los productos."
        );
      } finally {
        setCargando(false);
      }
    }

    cargarProductos();
  }, []);

  /* ===================================================
     MARCAS AUTOMÁTICAS
  =================================================== */

  const marcas = useMemo(() => {
    const lista = productos
      .map((producto) =>
        producto.Marca?.trim()
      )
      .filter(
        (marca): marca is string =>
          Boolean(marca)
      );

    return Array.from(
      new Set(lista)
    ).sort();
  }, [productos]);

  /* ===================================================
     PRODUCTOS DESTACADOS
  =================================================== */

  const productosDestacados =
    useMemo(() => {
      return productos.filter(
        (producto) =>
          esDestacado(
            producto.Destacado
          )
      );
    }, [productos]);

  /* ===================================================
     BUSCADOR + FILTRO MARCA
  =================================================== */

  const productosFiltrados =
    useMemo(() => {
      const texto = busqueda
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(
          /[\u0300-\u036f]/g,
          ""
        );

      return productos.filter(
        (producto) => {
          const nombre = (
            producto.Nombre ?? ""
          )
            .toLowerCase()
            .normalize("NFD")
            .replace(
              /[\u0300-\u036f]/g,
              ""
            );

          const coincideNombre =
            texto === "" ||
            nombre.includes(texto);

          const coincideMarca =
            marcaSeleccionada ===
              "Todas" ||
            producto.Marca ===
              marcaSeleccionada;

          return (
            coincideNombre &&
            coincideMarca
          );
        }
      );
    }, [
      productos,
      busqueda,
      marcaSeleccionada,
    ]);

  /* ===================================================
     HTML
  =================================================== */

  return (
    <main className="min-h-screen bg-[#f7f8fa] pb-28 md:pb-20">

      {/* =================================================
          HEADER
      ================================================= */}

      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur-xl">

        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-6">

          <div>

            <h1 className="text-xl font-black tracking-tight text-slate-900">
              STOCK
              <span className="text-blue-600">
                CENTER
              </span>
            </h1>

            <p className="text-[10px] font-medium text-slate-400">
              Repuestos para celulares
            </p>

          </div>

          {/* BOTÓN CARRITO */}

          <button
            onClick={() =>
              setCarritoAbierto(true)
            }
            className="relative flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 transition hover:bg-slate-200 active:scale-95"
          >

            <span className="text-xl">
              🛒
            </span>

            {cantidadTotal > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-600 px-1 text-[10px] font-bold text-white">
                {cantidadTotal}
              </span>
            )}

          </button>

        </div>

      </header>

      <div className="mx-auto max-w-7xl">

        {/* =================================================
            BANNER
        ================================================= */}

        <section className="px-4 py-5 md:px-6">

          <div className="relative overflow-hidden rounded-[28px] bg-slate-950 shadow-xl">

            <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-blue-600/30 blur-3xl" />

            <div className="absolute -bottom-24 left-20 h-64 w-64 rounded-full bg-cyan-500/20 blur-3xl" />

            <div className="relative z-10 flex min-h-[310px] flex-col justify-center p-7 md:min-h-[390px] md:p-14">

              <div className="mb-5 w-fit rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-semibold text-blue-100 backdrop-blur">
                ⚡ Stock disponible
              </div>

              <h2 className="max-w-2xl text-4xl font-black leading-[1.05] tracking-tight text-white md:text-6xl">

                Todo para reparar

                <span className="block text-blue-400">
                  tu celular.
                </span>

              </h2>

              <p className="mt-5 max-w-lg text-sm leading-6 text-slate-300 md:text-base">
                Pantallas, baterías, flex,
                cámaras y repuestos para las
                principales marcas.
              </p>

              <a
                href="#productos"
                className="mt-7 w-fit rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/30 transition hover:-translate-y-0.5 hover:bg-blue-500"
              >
                Ver productos
              </a>

              <div className="mt-7 flex items-center gap-2 text-xs text-slate-300">

                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10">
                  🛵
                </span>

                <span>
                  Entregas realizadas por{" "}
                  <strong className="text-white">
                    DeliveryBald
                  </strong>
                </span>

              </div>

            </div>

          </div>

        </section>

        {/* =================================================
            MARCAS
        ================================================= */}

        <section className="py-3">

          <div className="px-4 md:px-6">

            <h2 className="text-xl font-black text-slate-900">
              Marcas
            </h2>

            <p className="text-xs text-slate-500">
              Encontrá repuestos por fabricante
            </p>

          </div>

          <div className="mt-4 flex gap-3 overflow-x-auto px-4 pb-4 md:px-6">

            <button
              onClick={() =>
                setMarcaSeleccionada(
                  "Todas"
                )
              }
              className={`min-w-[110px] rounded-2xl border px-5 py-5 text-sm font-bold shadow-sm transition ${
                marcaSeleccionada ===
                "Todas"
                  ? "border-blue-600 bg-blue-600 text-white"
                  : "border-slate-200 bg-white text-slate-700"
              }`}
            >
              Todas
            </button>

            {marcas.map((marca) => (

              <button
                key={marca}
                onClick={() =>
                  setMarcaSeleccionada(
                    marca
                  )
                }
                className={`min-w-[125px] rounded-2xl border px-5 py-5 text-sm font-bold shadow-sm transition hover:-translate-y-1 ${
                  marcaSeleccionada ===
                  marca
                    ? "border-blue-600 bg-blue-600 text-white"
                    : "border-slate-200 bg-white text-slate-700 hover:border-blue-300"
                }`}
              >
                {marca}
              </button>

            ))}

          </div>

        </section>

        {/* =================================================
            BUSCADOR
        ================================================= */}

        <section className="px-4 pb-2 pt-6 md:px-6">

          <div className="mb-3 flex items-center justify-between">

            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Buscar en el catálogo
            </p>

            {(busqueda ||
              marcaSeleccionada !==
                "Todas") && (

              <button
                onClick={() => {
                  setBusqueda("");
                  setMarcaSeleccionada(
                    "Todas"
                  );
                }}
                className="text-xs font-bold text-blue-600"
              >
                Limpiar filtros
              </button>

            )}

          </div>

          <div className="flex items-center rounded-2xl border border-slate-200 bg-white px-4 shadow-sm transition focus-within:border-blue-500 focus-within:shadow-md">

            <span className="mr-3 text-lg">
              🔎
            </span>

            <input
              type="text"
              value={busqueda}
              onChange={(e) =>
                setBusqueda(
                  e.target.value
                )
              }
              placeholder="Buscar Samsung A15, Moto G54..."
              className="h-14 w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
            />

            {busqueda && (

              <button
                onClick={() =>
                  setBusqueda("")
                }
                className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500"
              >
                ×
              </button>

            )}

          </div>

        </section>

        {/* =================================================
            CARGANDO
        ================================================= */}

        {cargando && (

          <div className="px-4 py-16 text-center md:px-6">

            <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

            <p className="mt-4 text-sm text-slate-500">
              Cargando productos...
            </p>

          </div>

        )}

        {/* =================================================
            ERROR
        ================================================= */}

        {!cargando &&
          errorCarga && (

            <div className="px-4 py-10 md:px-6">

              <div className="rounded-2xl border border-red-100 bg-red-50 p-5 text-center text-sm text-red-600">
                {errorCarga}
              </div>

            </div>

          )}

        {/* =================================================
            DESTACADOS
        ================================================= */}

        {!cargando &&
          !errorCarga &&
          productosDestacados.length >
            0 &&
          !busqueda &&
          marcaSeleccionada ===
            "Todas" && (

            <section className="py-6">

              <div className="px-4 md:px-6">

                <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
                  Seleccionados
                </span>

                <h2 className="mt-1 text-2xl font-black text-slate-900">
                  Destacados
                </h2>

              </div>

              {/* CARRUSEL DESTACADOS */}

              <div className="mt-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-6 md:px-6">

                {productosDestacados.map(
                  (producto) => {

                    const imagen =
                      obtenerImagen(
                        producto.Imagen
                      );

                    return (

                      <article
                        key={`destacado-${producto.id}`}
                        className="min-w-[72%] snap-start overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm sm:min-w-[320px] md:min-w-[300px] lg:min-w-[280px]"
                      >

                        {/* IMAGEN */}

                        <div className="relative flex h-48 items-center justify-center overflow-hidden bg-slate-100">

                          {imagen ? (

                            <img
                              src={imagen}
                              alt={
                                producto.Nombre
                              }
                              loading="lazy"
                              className="h-full w-full object-contain p-3"
                            />

                          ) : (

                            <span className="text-6xl">
                              📱
                            </span>

                          )}

                          <span className="absolute left-3 top-3 rounded-full bg-blue-600 px-3 py-1 text-[10px] font-black uppercase tracking-wide text-white shadow">
                            Destacado
                          </span>

                        </div>

                        {/* INFORMACIÓN */}

                        <div className="p-5">

                          {producto.Marca && (

                            <span className="text-xs font-bold text-blue-600">
                              {
                                producto.Marca
                              }
                            </span>

                          )}

                          <h3 className="mt-1 font-bold text-slate-900">
                            {
                              producto.Nombre
                            }
                          </h3>

                          {producto.Descripción && (

                            <p className="mt-1 line-clamp-2 text-xs text-slate-500">
                              {
                                producto.Descripción
                              }
                            </p>

                          )}

                          <div className="mt-5 flex items-center justify-between">

                            <strong className="text-xl text-slate-900">
                              {precio(
                                Number(
                                  producto.Precio
                                )
                              )}
                            </strong>

                            <button
                              onClick={() =>
                                agregarProducto(
                                  producto
                                )
                              }
                              className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-600 text-xl font-bold text-white shadow-lg shadow-blue-600/20 transition hover:scale-110 active:scale-75"
                            >
                              +
                            </button>

                          </div>

                        </div>

                      </article>

                    );
                  }
                )}

              </div>

            </section>

          )}

        {/* =================================================
            TODOS LOS PRODUCTOS
        ================================================= */}

        {!cargando &&
          !errorCarga && (

            <section
              id="productos"
              className="scroll-mt-20 py-6"
            >

              <div className="flex items-end justify-between px-4 md:px-6">

                <div>

                  <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
                    Catálogo
                  </span>

                  <h2 className="mt-1 text-2xl font-black text-slate-900">
                    Productos
                  </h2>

                  <p className="mt-1 text-xs text-slate-500">

                    {
                      productosFiltrados.length
                    }{" "}

                    {productosFiltrados.length ===
                    1
                      ? "producto"
                      : "productos"}

                  </p>

                </div>

              </div>

              {/* SIN RESULTADOS */}

              {productosFiltrados.length ===
                0 && (

                <div className="px-4 py-14 text-center md:px-6">

                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-2xl">
                    🔎
                  </div>

                  <h3 className="mt-4 font-bold text-slate-800">
                    No encontramos productos
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    Probá con otro nombre o
                    marca.
                  </p>

                  <button
                    onClick={() => {
                      setBusqueda("");

                      setMarcaSeleccionada(
                        "Todas"
                      );
                    }}
                    className="mt-5 rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white"
                  >
                    Ver todos
                  </button>

                </div>

              )}

              {/* GRID PRODUCTOS */}

              {productosFiltrados.length >
                0 && (

                <div className="mt-5 grid grid-cols-2 gap-3 px-4 md:grid-cols-3 md:gap-5 md:px-6 lg:grid-cols-4">

                  {productosFiltrados.map(
                    (producto) => {

                      const imagen =
                        obtenerImagen(
                          producto.Imagen
                        );

                      return (

                        <article
                          key={
                            producto.id
                          }
                          className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl md:rounded-3xl"
                        >

                          {/* IMAGEN */}

                          <div className="relative flex aspect-square items-center justify-center overflow-hidden bg-slate-100">

                            {imagen ? (

                              <img
                                src={
                                  imagen
                                }
                                alt={
                                  producto.Nombre
                                }
                                loading="lazy"
                                className="h-full w-full object-contain p-2 transition duration-300 group-hover:scale-105 md:p-3"
                              />

                            ) : (

                              <span className="text-5xl md:text-7xl">
                                📱
                              </span>

                            )}

                            {esDestacado(
                              producto.Destacado
                            ) && (

                              <span className="absolute left-2 top-2 rounded-full bg-blue-600 px-2 py-1 text-[8px] font-black uppercase text-white md:left-3 md:top-3 md:px-3 md:text-[9px]">
                                Destacado
                              </span>

                            )}

                          </div>

                          {/* INFO */}

                          <div className="p-3 md:p-5">

                            {producto.Marca && (

                              <span className="text-[10px] font-bold text-blue-600 md:text-xs">
                                {
                                  producto.Marca
                                }
                              </span>

                            )}

                            <h3 className="mt-1 line-clamp-2 min-h-[40px] text-sm font-bold leading-5 text-slate-900 md:text-base">
                              {
                                producto.Nombre
                              }
                            </h3>

                            {producto.Descripción && (

                              <p className="mt-1 hidden line-clamp-2 text-xs text-slate-500 sm:block">
                                {
                                  producto.Descripción
                                }
                              </p>

                            )}

                            <div className="mt-4 flex items-center justify-between gap-2">

                              <strong className="text-sm text-slate-900 sm:text-base md:text-lg">
                                {precio(
                                  Number(
                                    producto.Precio
                                  )
                                )}
                              </strong>

                              <button
                                onClick={() =>
                                  agregarProducto(
                                    producto
                                  )
                                }
                                aria-label={`Agregar ${producto.Nombre}`}
                                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-600 text-lg font-bold text-white shadow-md shadow-blue-600/20 transition hover:scale-110 active:scale-75 md:h-10 md:w-10 md:text-xl"
                              >
                                +
                              </button>

                            </div>

                          </div>

                        </article>

                      );
                    }
                  )}

                </div>

              )}

            </section>

          )}

        {/* =================================================
            DELIVERY BALD
        ================================================= */}

        <section className="px-4 py-8 md:px-6">

          <div className="flex flex-col gap-5 rounded-3xl border border-blue-100 bg-blue-50 p-6 md:flex-row md:items-center md:justify-between">

            <div className="flex items-center gap-4">

              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-2xl shadow-lg shadow-blue-600/20">
                🛵
              </div>

              <div>

                <p className="text-xs font-bold uppercase tracking-wider text-blue-600">
                  Logística
                </p>

                <h3 className="text-lg font-black text-slate-900">
                  Entregas por DeliveryBald
                </h3>

                <p className="text-sm text-slate-500">
                  Recibí tu pedido de forma
                  rápida y segura.
                </p>

              </div>

            </div>

          </div>

        </section>

      </div>

      {/* =================================================
          BARRA CARRITO MOBILE
      ================================================= */}

      {cantidadTotal > 0 && (

        <div className="fixed bottom-4 left-4 right-4 z-40 md:hidden">

          <button
            onClick={() =>
              setCarritoAbierto(true)
            }
            className="flex w-full items-center justify-between rounded-2xl bg-slate-950 px-5 py-4 text-white shadow-2xl transition active:scale-[0.98]"
          >

            <div className="flex items-center gap-3">

              <div className="flex h-9 min-w-9 items-center justify-center rounded-full bg-blue-600 px-2 text-sm font-black">
                {cantidadTotal}
              </div>

              <div className="text-left">

                <p className="text-[10px] text-slate-400">
                  Tu pedido
                </p>

                <p className="text-sm font-black">
                  {precio(
                    totalCarrito
                  )}
                </p>

              </div>

            </div>

            <span className="text-sm font-bold">
              Ver pedido →
            </span>

          </button>

        </div>

      )}

      {/* =================================================
          CARRITO
      ================================================= */}

      <Carrito
        abierto={carritoAbierto}
        cerrar={() =>
          setCarritoAbierto(false)
        }
      />

    </main>
  );
}