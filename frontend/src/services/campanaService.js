import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api/v1'
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
  }
};