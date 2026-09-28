export const LOCAL = {
  nombre: "LA REINA MÓDULOS",
  lat: -24.79468,
  lng: -65.4137865,
};
export function calcularEnvio(distanciaKm: number) {
  const ENVIO_MINIMO = 2000;
  const PRECIO_POR_KM = 800;
  const LIMITE_KM = 5;
  const PRECIO_KM_EXTRA = 500;

  let costo: number;

  // Hasta 5 km: $800 por km
  if (distanciaKm <= LIMITE_KM) {
    costo = distanciaKm * PRECIO_POR_KM;
  } else {
    // Primeros 5 km = $4.000
    // Después: $500 por cada km adicional
    costo =
      LIMITE_KM * PRECIO_POR_KM +
      (distanciaKm - LIMITE_KM) * PRECIO_KM_EXTRA;
  }

  // Mínimo $2.000
  costo = Math.max(costo, ENVIO_MINIMO);

  // Redondear hacia arriba cada $100
  return Math.ceil(costo / 100) * 100;
}