export const calcularPorcentaje = (recaudado, objetivo) => {
  if (!objetivo || objetivo === 0) return 0;
  const pct = Math.round((recaudado / objetivo) * 100);
  return pct > 100 ? 100 : pct;
};

export const formatearMoneda = (valor) => {
  return Number(valor || 0).toLocaleString('es-AR');
};

export const obtenerUrlCampana = (id) => {
  return `${window.location.origin}/campana/${id}`;
};