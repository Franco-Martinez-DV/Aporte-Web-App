import axios from 'axios';
import { auth } from '../firebase';

const api = axios.create({
  baseURL: 'http://localhost:5000/api/v1'
});

api.interceptors.request.use(async (config) => {
  const usuario = auth.currentUser;
  if (usuario) {
    const token = await usuario.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default {
  async obtenerCampanas() {
    const response = await api.get('/campanas');
    return response.data.data;
  },

  async obtenerPorId(id) {
    const response = await api.get(`/campanas/${id}`);
    return response.data.data;
  },

  async crearCampana(datos) {
    const response = await api.post('/campanas', datos);
    return response.data.data;
  },

  async actualizarCampana(id, datos) {
    const response = await api.put(`/campanas/${id}`, datos);
    return response.data.data;
  },

  async eliminarCampana(id) {
    const response = await api.delete(`/campanas/${id}`);
    return response.data;
  },

  async registrarAporte(id, monto) {
    const response = await api.post(`/campanas/${id}/aportar`, { monto: Number(monto) });
    return response.data.data;
  },

  async registrarIngresoExterno(id, datos) {
    const response = await api.post(`/campanas/${id}/ingreso-externo`, datos);
    return response.data.data;
  },

  async registrarGasto(id, datosGasto) {
    const response = await api.post(`/campanas/${id}/gasto`, datosGasto);
    return response.data.data;
  },

  async reservarSlot(id, datosSlot) {
    const response = await api.post(`/campanas/${id}/reservar-slot`, datosSlot);
    return response.data.data;
  },

  async crearPreferenciaPago(datos) {
    const response = await api.post('/pagos/preferencia', {
      ...datos,
      urlRetornoBase: window.location.origin
    });
    return response.data.data;
  },

  async confirmarPagoMP(datos) {
    const response = await api.post('/pagos/confirmar', datos);
    return response.data.data;
  },

  async sincronizarPagosMP() {
    const response = await api.post('/pagos/sincronizar');
    return response.data.data;
  }
};