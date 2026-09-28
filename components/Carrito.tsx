"use client";

import { useState } from "react";
import dynamic from "next/dynamic";

import {
  X,
  Plus,
  Minus,
  Trash2,
  ShoppingBag,
  MapPin,
  Map,
  Loader2,
  Navigation,
  CheckCircle2,
} from "lucide-react";

import { useCartStore } from "@/store/cart-store";
import { calcularEnvio } from "@/lib/delivery";

/* =====================================================
   MAPA
===================================================== */

const MapaEntrega = dynamic(
  () => import("@/components/MapaEntrega"),
  {
    ssr: false,

    loading: () => (
      <div className="flex h-[360px] items-center justify-center rounded-2xl bg-slate-100">
        <Loader2 className="animate-spin text-blue-600" />
      </div>
    ),
  }
);

/* =====================================================
   TYPES
===================================================== */

type CarritoProps = {
  abierto: boolean;
  cerrar: () => void;
};

type Ubicacion = {
  lat: number;
  lng: number;
};

/* =====================================================
   COMPONENTE
===================================================== */

export default function Carrito({
  abierto,
  cerrar,
}: CarritoProps) {
  const {
    items,
    aumentar,
    disminuir,
    eliminar,
  } = useCartStore();

  /* =====================================================
     UBICACIÓN / DELIVERY
  ===================================================== */

  const [
    ubicacionCliente,
    setUbicacionCliente,
  ] = useState<Ubicacion | null>(null);

  const [
    mostrarMapa,
    setMostrarMapa,
  ] = useState(false);

  const [
    calculandoUbicacion,
    setCalculandoUbicacion,
  ] = useState(false);

  const [
    calculandoRuta,
    setCalculandoRuta,
  ] = useState(false);

  const [
    distanciaKm,
    setDistanciaKm,
  ] = useState<number | null>(null);

  const [
    tiempoMinutos,
    setTiempoMinutos,
  ] = useState<number | null>(null);

  const [
    costoEnvio,
    setCostoEnvio,
  ] = useState<number | null>(null);

  const [
    errorUbicacion,
    setErrorUbicacion,
  ] = useState("");

  /* =====================================================
     CARRITO
  ===================================================== */

  const cantidadTotal = items.reduce(
    (total, item) =>
      total + item.cantidad,
    0
  );

  const subtotal = items.reduce(
    (total, item) =>
      total +
      item.precio * item.cantidad,
    0
  );

  const total =
    subtotal + (costoEnvio ?? 0);

  const formatoPrecio = (
    valor: number
  ) =>
    new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      maximumFractionDigits: 0,
    }).format(valor);

  /* =====================================================
     CALCULAR RUTA
  ===================================================== */

  async function calcularRuta(
    ubicacion: Ubicacion
  ) {
    try {
      setCalculandoRuta(true);
      setErrorUbicacion("");

      setDistanciaKm(null);
      setTiempoMinutos(null);
      setCostoEnvio(null);

      const respuesta = await fetch(
        "/api/ruta",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            lat: ubicacion.lat,
            lng: ubicacion.lng,
          }),
        }
      );

      const data =
        await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(
          data.error ||
            "No pudimos calcular el envío"
        );
      }

      const distancia = Number(
        data.distanciaKm
      );

      if (
        !Number.isFinite(distancia)
      ) {
        throw new Error(
          "La distancia recibida no es válida"
        );
      }

      setDistanciaKm(distancia);

      setTiempoMinutos(
        data.tiempoMinutos ?? null
      );

      const precioDelivery =
        calcularEnvio(distancia);

      setCostoEnvio(
        precioDelivery
      );
    } catch (error) {
      console.error(error);

      setErrorUbicacion(
        error instanceof Error
          ? error.message
          : "No pudimos calcular el envío"
      );
    } finally {
      setCalculandoRuta(false);
    }
  }

  /* =====================================================
     USAR GPS
  ===================================================== */

  function usarMiUbicacion() {
    if (!navigator.geolocation) {
      setErrorUbicacion(
        "Tu dispositivo no permite obtener la ubicación."
      );

      return;
    }

    setCalculandoUbicacion(true);
    setErrorUbicacion("");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        /*
          ESTA ES LA UBICACIÓN DEL CLIENTE.

          Después esta misma latitud/longitud
          se manda por WhatsApp.
        */

        const ubicacion = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };

        setUbicacionCliente(
          ubicacion
        );

        setMostrarMapa(false);

        setCalculandoUbicacion(
          false
        );

        await calcularRuta(
          ubicacion
        );
      },

      (error) => {
        console.error(error);

        setCalculandoUbicacion(
          false
        );

        if (
          error.code ===
          error.PERMISSION_DENIED
        ) {
          setErrorUbicacion(
            "Necesitamos permiso para usar tu ubicación. También podés elegirla manualmente en el mapa."
          );
        } else {
          setErrorUbicacion(
            "No pudimos obtener tu ubicación. Probá seleccionándola en el mapa."
          );
        }
      },

      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 30000,
      }
    );
  }

  /* =====================================================
     ABRIR MAPA
  ===================================================== */

  function abrirMapa() {
    /*
      Si todavía no tenemos ubicación,
      empezamos el mapa cerca del local.
    */

    if (!ubicacionCliente) {
      setUbicacionCliente({
        lat: -24.79468,
        lng: -65.4137865,
      });
    }

    setMostrarMapa(true);

    setDistanciaKm(null);
    setTiempoMinutos(null);
    setCostoEnvio(null);
    setErrorUbicacion("");
  }

  /* =====================================================
     CONFIRMAR UBICACIÓN DEL MAPA
  ===================================================== */

  async function confirmarMapa() {
    if (!ubicacionCliente) {
      setErrorUbicacion(
        "Seleccioná una ubicación en el mapa."
      );

      return;
    }

    setMostrarMapa(false);

    await calcularRuta(
      ubicacionCliente
    );
  }

  /* =====================================================
     WHATSAPP
  ===================================================== */

  function continuarPedido() {
    /*
      Primero comprobamos que tengamos
      la ubicación del cliente.
    */

    if (!ubicacionCliente) {
      setErrorUbicacion(
        "Primero seleccioná la ubicación de entrega."
      );

      return;
    }

    /*
      También necesitamos haber calculado
      la ruta y el precio.
    */

    if (
      costoEnvio === null ||
      distanciaKm === null
    ) {
      setErrorUbicacion(
        "Primero calculá el costo del envío."
      );

      return;
    }

    /* =========================================
       PRODUCTOS DEL PEDIDO
    ========================================= */

    const detalleProductos = items
      .map((item) => {
        const subtotalProducto =
          item.precio *
          item.cantidad;

        return `📦 *${item.nombre}*
${item.marca ? `Marca: ${item.marca}\n` : ""}Cantidad: ${item.cantidad}
Precio unitario: ${formatoPrecio(item.precio)}
Subtotal: ${formatoPrecio(subtotalProducto)}`;
      })
      .join("\n\n");

    /* =========================================
       UBICACIÓN DEL CLIENTE
    ========================================= */

    /*
      Creamos un enlace usando exactamente
      las coordenadas obtenidas por GPS
      o seleccionadas en el mapa.

      Cuando recibas el WhatsApp, tocás
      este link y se abre Google Maps.
    */

    const linkUbicacion =
      `https://www.google.com/maps/search/?api=1&query=${ubicacionCliente.lat},${ubicacionCliente.lng}`;

    /* =========================================
       DISTANCIA
    ========================================= */

    const distanciaTexto =
      distanciaKm.toLocaleString(
        "es-AR",
        {
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
        }
      );

    /* =========================================
       MENSAJE COMPLETO
    ========================================= */

    const mensaje = `🛒 *NUEVO PEDIDO - STOCKCENTER*

━━━━━━━━━━━━━━━━━━
📦 *PRODUCTOS*
━━━━━━━━━━━━━━━━━━

${detalleProductos}

━━━━━━━━━━━━━━━━━━
💰 *RESUMEN*
━━━━━━━━━━━━━━━━━━

Productos: ${formatoPrecio(subtotal)}
🚚 DeliveryBald: ${formatoPrecio(costoEnvio)}

*TOTAL: ${formatoPrecio(total)}*

━━━━━━━━━━━━━━━━━━
🚚 *ENTREGA*
━━━━━━━━━━━━━━━━━━

📏 Distancia: ${distanciaTexto} km
${
  tiempoMinutos !== null
    ? `⏱️ Tiempo estimado: ${tiempoMinutos} min`
    : ""
}

📍 *UBICACIÓN DEL CLIENTE*

${linkUbicacion}

🛵 Entrega realizada por *DeliveryBald*`;

    /* =========================================
       NÚMERO DEL NEGOCIO
    ========================================= */

    /*
      CAMBIAR POR EL WHATSAPP REAL.

      Argentina:
      54 + 9 + código de área + número

      Sin:
      +
      espacios
      guiones
    */

    const numeroWhatsApp =
      "5493872229664";

    /* =========================================
       ABRIR WHATSAPP
    ========================================= */

    const urlWhatsApp =
      `https://wa.me/${numeroWhatsApp}?text=${encodeURIComponent(
        mensaje
      )}`;

    window.open(
      urlWhatsApp,
      "_blank"
    );
  }

  /* =====================================================
     JSX
  ===================================================== */

  return (
    <>
      {/* =================================================
          FONDO OSCURO
      ================================================= */}

      <div
        onClick={cerrar}
        className={`
          fixed inset-0 z-[90]
          bg-black/40
          backdrop-blur-[2px]
          transition-opacity
          duration-300

          ${
            abierto
              ? "pointer-events-auto opacity-100"
              : "pointer-events-none opacity-0"
          }
        `}
      />

      {/* =================================================
          CARRITO
      ================================================= */}

      <aside
        className={`
          fixed z-[100]
          bg-white shadow-2xl

          bottom-0 left-0 right-0
          max-h-[92vh]
          rounded-t-[32px]

          md:bottom-0
          md:left-auto
          md:right-0
          md:top-0
          md:h-screen
          md:max-h-none
          md:w-[450px]
          md:rounded-none
          md:rounded-l-[32px]

          transition-transform
          duration-300
          ease-out

          ${
            abierto
              ? "translate-y-0 md:translate-x-0"
              : "translate-y-full md:translate-y-0 md:translate-x-full"
          }
        `}
      >
        {/* BARRITA MOBILE */}

        <div className="flex justify-center pt-3 md:hidden">
          <div className="h-1.5 w-12 rounded-full bg-slate-200" />
        </div>

        <div className="flex h-full flex-col">

          {/* =================================================
              CABECERA
          ================================================= */}

          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-5">
            <div>
              <h2 className="text-xl font-black text-slate-900">
                Tu pedido
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                {cantidadTotal === 0
                  ? "Tu carrito está vacío"
                  : `${cantidadTotal} ${
                      cantidadTotal === 1
                        ? "producto"
                        : "productos"
                    }`}
              </p>
            </div>

            <button
              onClick={cerrar}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200"
            >
              <X size={20} />
            </button>
          </div>

          {/* =================================================
              CONTENIDO CON SCROLL
          ================================================= */}

          <div className="flex-1 overflow-y-auto">

            {/* =================================================
                CARRITO VACÍO
            ================================================= */}

            {items.length === 0 ? (
              <div className="flex min-h-[400px] flex-col items-center justify-center px-5 text-center">

                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-100">
                  <ShoppingBag
                    size={32}
                    className="text-slate-400"
                  />
                </div>

                <h3 className="mt-5 font-bold text-slate-800">
                  Todavía no agregaste productos
                </h3>

                <p className="mt-2 max-w-[230px] text-sm leading-6 text-slate-500">
                  Agregá los repuestos que necesites y aparecerán acá.
                </p>

                <button
                  onClick={cerrar}
                  className="mt-5 rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white"
                >
                  Seguir comprando
                </button>

              </div>
            ) : (
              <>

                {/* =================================================
                    PRODUCTOS
                ================================================= */}

                <div className="space-y-3 px-5 py-4">

                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm"
                    >

                      <div className="flex justify-between gap-3">

                        <div>

                          {item.marca && (
                            <p className="text-[11px] font-bold uppercase tracking-wide text-blue-600">
                              {item.marca}
                            </p>
                          )}

                          <h3 className="mt-1 text-sm font-bold text-slate-900">
                            {item.nombre}
                          </h3>

                          <p className="mt-1 text-sm font-black">
                            {formatoPrecio(
                              item.precio
                            )}
                          </p>

                        </div>

                        {/* ELIMINAR PRODUCTO */}

                        <button
                          onClick={() =>
                            eliminar(
                              item.id
                            )
                          }
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-red-50 hover:text-red-500"
                        >
                          <Trash2
                            size={17}
                          />
                        </button>

                      </div>

                      <div className="mt-4 flex items-center justify-between">

                        {/* CANTIDAD */}

                        <div className="flex items-center rounded-xl bg-slate-100 p-1">

                          <button
                            onClick={() =>
                              disminuir(
                                item.id
                              )
                            }
                            className="flex h-8 w-8 items-center justify-center rounded-lg bg-white shadow-sm"
                          >
                            <Minus
                              size={15}
                            />
                          </button>

                          <span className="w-10 text-center text-sm font-bold">
                            {item.cantidad}
                          </span>

                          <button
                            onClick={() =>
                              aumentar(
                                item.id
                              )
                            }
                            className="flex h-8 w-8 items-center justify-center rounded-lg bg-white shadow-sm"
                          >
                            <Plus
                              size={15}
                            />
                          </button>

                        </div>

                        {/* SUBTOTAL PRODUCTO */}

                        <strong className="text-sm text-slate-900">
                          {formatoPrecio(
                            item.precio *
                              item.cantidad
                          )}
                        </strong>

                      </div>

                    </div>
                  ))}

                </div>

                {/* =================================================
                    ENTREGA
                ================================================= */}

                <div className="border-t border-slate-100 px-5 py-5">

                  <div className="flex items-center gap-3">

                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                      <Navigation
                        size={20}
                      />
                    </div>

                    <div>

                      <p className="text-[10px] font-black uppercase tracking-wider text-blue-600">
                        DeliveryBald
                      </p>

                      <h3 className="font-black text-slate-900">
                        Calcular entrega
                      </h3>

                    </div>

                  </div>

                  <p className="mt-4 text-sm text-slate-500">
                    Elegí dónde querés recibir tu pedido.
                  </p>

                  {/* =================================================
                      BOTONES UBICACIÓN
                  ================================================= */}

                  <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">

                    {/* GPS */}

                    <button
                      onClick={
                        usarMiUbicacion
                      }
                      disabled={
                        calculandoUbicacion ||
                        calculandoRuta
                      }
                      className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
                    >

                      {calculandoUbicacion ? (
                        <Loader2
                          size={17}
                          className="animate-spin"
                        />
                      ) : (
                        <MapPin
                          size={17}
                        />
                      )}

                      {calculandoUbicacion
                        ? "Buscando..."
                        : "Usar mi ubicación"}

                    </button>

                    {/* MAPA */}

                    <button
                      onClick={abrirMapa}
                      disabled={
                        calculandoUbicacion ||
                        calculandoRuta
                      }
                      className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                    >
                      <Map size={17} />

                      Elegir en mapa
                    </button>

                  </div>

                  {/* =================================================
                      MAPA
                  ================================================= */}

                  {mostrarMapa &&
                    ubicacionCliente && (

                    <div className="mt-4">

                      <div className="mb-3 rounded-xl bg-blue-50 p-3">

                        <p className="text-xs leading-5 text-blue-700">
                          Tocá el mapa o arrastrá el marcador hasta el lugar donde querés recibir el pedido.
                        </p>

                      </div>

                      <MapaEntrega
                        ubicacion={
                          ubicacionCliente
                        }
                        onCambiar={(
                          nuevaUbicacion
                        ) => {
                          setUbicacionCliente(
                            nuevaUbicacion
                          );

                          setDistanciaKm(
                            null
                          );

                          setTiempoMinutos(
                            null
                          );

                          setCostoEnvio(
                            null
                          );
                        }}
                      />

                      <button
                        onClick={
                          confirmarMapa
                        }
                        className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 py-3.5 text-sm font-black text-white"
                      >
                        <CheckCircle2
                          size={18}
                        />

                        Usar esta ubicación
                      </button>

                    </div>
                  )}

                  {/* =================================================
                      CALCULANDO
                  ================================================= */}

                  {calculandoRuta && (

                    <div className="mt-4 flex items-center gap-3 rounded-xl bg-slate-50 p-4">

                      <Loader2
                        size={20}
                        className="animate-spin text-blue-600"
                      />

                      <div>

                        <p className="text-sm font-bold text-slate-800">
                          Calculando envío...
                        </p>

                        <p className="text-xs text-slate-500">
                          Estamos calculando la ruta desde el local.
                        </p>

                      </div>

                    </div>
                  )}

                  {/* =================================================
                      ERROR
                  ================================================= */}

                  {errorUbicacion && (

                    <div className="mt-4 rounded-xl border border-red-100 bg-red-50 p-3">

                      <p className="text-xs leading-5 text-red-600">
                        {errorUbicacion}
                      </p>

                    </div>
                  )}

                  {/* =================================================
                      RESULTADO DELIVERY
                  ================================================= */}

                  {!calculandoRuta &&
                    distanciaKm !== null &&
                    costoEnvio !== null && (

                    <div className="mt-4 overflow-hidden rounded-2xl border border-green-100 bg-green-50">

                      <div className="flex items-center gap-2 border-b border-green-100 px-4 py-3">

                        <CheckCircle2
                          size={18}
                          className="text-green-600"
                        />

                        <span className="text-sm font-bold text-green-700">
                          Ubicación confirmada
                        </span>

                      </div>

                      <div className="space-y-3 p-4">

                        <div className="flex items-center justify-between">

                          <span className="text-sm text-slate-500">
                            Distancia
                          </span>

                          <strong className="text-sm text-slate-900">
                            {distanciaKm.toLocaleString(
                              "es-AR",
                              {
                                maximumFractionDigits: 2,
                              }
                            )}{" "}
                            km
                          </strong>

                        </div>

                        {tiempoMinutos !==
                          null && (

                          <div className="flex items-center justify-between">

                            <span className="text-sm text-slate-500">
                              Tiempo estimado
                            </span>

                            <strong className="text-sm text-slate-900">
                              {tiempoMinutos} min
                            </strong>

                          </div>
                        )}

                        <div className="flex items-center justify-between border-t border-green-100 pt-3">

                          <span className="text-sm font-bold text-slate-700">
                            Envío DeliveryBald
                          </span>

                          <strong className="text-lg font-black text-green-700">
                            {formatoPrecio(
                              costoEnvio
                            )}
                          </strong>

                        </div>

                      </div>

                    </div>
                  )}

                </div>
              </>
            )}

          </div>

          {/* =================================================
              RESUMEN FIJO INFERIOR
          ================================================= */}

          {items.length > 0 && (

            <div className="shrink-0 border-t border-slate-100 bg-white p-5 shadow-[0_-8px_30px_rgba(15,23,42,0.06)]">

              {/* PRODUCTOS */}

              <div className="flex items-center justify-between">

                <span className="text-sm text-slate-500">
                  Productos
                </span>

                <strong className="text-sm text-slate-900">
                  {formatoPrecio(
                    subtotal
                  )}
                </strong>

              </div>

              {/* ENVÍO */}

              <div className="mt-2 flex items-center justify-between">

                <span className="text-sm text-slate-500">
                  Envío
                </span>

                {costoEnvio !== null ? (

                  <strong className="text-sm text-slate-900">
                    {formatoPrecio(
                      costoEnvio
                    )}
                  </strong>

                ) : (

                  <span className="text-xs font-semibold text-orange-500">
                    Sin calcular
                  </span>

                )}

              </div>

              {/* TOTAL */}

              <div className="my-4 border-t border-slate-100" />

              <div className="flex items-center justify-between">

                <span className="font-bold text-slate-700">
                  Total
                </span>

                <strong className="text-2xl font-black text-slate-900">
                  {formatoPrecio(
                    total
                  )}
                </strong>

              </div>

              {/* CONTINUAR */}

              <button
                onClick={
                  continuarPedido
                }
                disabled={
                  costoEnvio === null ||
                  calculandoRuta
                }
                className="mt-5 w-full rounded-2xl bg-blue-600 py-4 text-sm font-black text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
              >

                {costoEnvio === null
                  ? "Calculá el envío para continuar"
                  : "Continuar pedido por WhatsApp"}

              </button>

              <div className="mt-3 flex items-center justify-center gap-2 text-[11px] text-slate-400">

                <span>🛵</span>

                <span>
                  Entrega realizada por DeliveryBald
                </span>

              </div>

            </div>
          )}

        </div>

      </aside>
    </>
  );
}