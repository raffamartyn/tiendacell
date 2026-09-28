import { NextRequest, NextResponse } from "next/server";
import { LOCAL } from "@/lib/delivery";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const lat = Number(body.lat);
    const lng = Number(body.lng);

    // Validar ubicación recibida
    if (
      !Number.isFinite(lat) ||
      !Number.isFinite(lng)
    ) {
      return NextResponse.json(
        {
          error: "Ubicación del cliente inválida",
        },
        {
          status: 400,
        }
      );
    }

    // Validación básica de coordenadas
    if (
      lat < -90 ||
      lat > 90 ||
      lng < -180 ||
      lng > 180
    ) {
      return NextResponse.json(
        {
          error: "Coordenadas inválidas",
        },
        {
          status: 400,
        }
      );
    }

    const apiKey = process.env.STADIA_API_KEY;

    if (!apiKey) {
      console.error(
        "Falta STADIA_API_KEY en las variables de entorno"
      );

      return NextResponse.json(
        {
          error:
            "El servicio de rutas no está configurado",
        },
        {
          status: 500,
        }
      );
    }

    /*
      Stadia calcula:

      LA REINA MÓDULOS
              ↓
          ruta en moto
              ↓
           CLIENTE
    */

    const respuesta = await fetch(
      "https://api.stadiamaps.com/route/v1",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",

          Authorization:
            `Stadia-Auth ${apiKey}`,
        },

        body: JSON.stringify({
          locations: [
            {
              lat: LOCAL.lat,
              lon: LOCAL.lng,
              type: "break",
            },

            {
              lat,
              lon: lng,
              type: "break",
            },
          ],

          costing: "motorcycle",

          units: "kilometers",
        }),

        cache: "no-store",
      }
    );

    if (!respuesta.ok) {
      const detalle =
        await respuesta.text();

      console.error(
        "Error Stadia:",
        respuesta.status,
        detalle
      );

      return NextResponse.json(
        {
          error:
            "No pudimos calcular la ruta",
        },
        {
          status: 502,
        }
      );
    }

    const data = await respuesta.json();

    /*
      Stadia devuelve la información
      general dentro de trip.summary.
    */

    const distanciaKm = Number(
      data?.trip?.summary?.length
    );

    const tiempoSegundos = Number(
      data?.trip?.summary?.time
    );

    if (!Number.isFinite(distanciaKm)) {
      console.error(
        "Respuesta inesperada de Stadia:",
        data
      );

      return NextResponse.json(
        {
          error:
            "No pudimos obtener la distancia",
        },
        {
          status: 502,
        }
      );
    }

    const tiempoMinutos =
      Number.isFinite(tiempoSegundos)
        ? Math.ceil(tiempoSegundos / 60)
        : null;

    return NextResponse.json({
      ok: true,

      origen: {
        nombre: LOCAL.nombre,
        lat: LOCAL.lat,
        lng: LOCAL.lng,
      },

      destino: {
        lat,
        lng,
      },

      distanciaKm:
        Math.round(distanciaKm * 100) /
        100,

      tiempoMinutos,
    });
  } catch (error) {
    console.error(
      "Error calculando ruta:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Ocurrió un error calculando la ruta",
      },
      {
        status: 500,
      }
    );
  }
}