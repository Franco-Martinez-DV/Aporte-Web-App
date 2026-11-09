import axios from 'axios';


const api = axios.create({
  baseURL: 'http://localhost:5000/api/v1'
});

export default {
  async obtenerCampanas() {
    const response = await api.get('/campanas');
    return response.data.data;
  },

  async crearCampana(datos) {
    const response = await api.post('/campanas', datos);
    return response.data.data;
  }
};