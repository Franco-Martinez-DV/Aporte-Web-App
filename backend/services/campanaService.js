const { db } = require('../config/firebase');

const COLLECTION_NAME = 'campanas';

class CampanaService {
  async obtenerTodas() {
    const snapshot = await db.collection(COLLECTION_NAME).get();
    const campanas = [];
    snapshot.forEach(doc => {
      campanas.push({ id: doc.id, ...doc.data() });
    });
    return campanas;
  }

  async crear(datosCampana) {
    const nuevaCampana = {
      titulo: datosCampana.titulo,
      descripcion: datosCampana.descripcion,
      categoria: datosCampana.categoria, // Ej: 'Deportista', 'Club', 'Liga/Torneo'
      montoObjetivo: Number(datosCampana.montoObjetivo),
      fechaLimite: datosCampana.fechaLimite,
      imagenPortada: datosCampana.imagenPortada || null,
      videoUrl: datosCampana.videoUrl || null,
      recaudado: 0,
      estado: 'activa',
      fechaCreacion: new Date().toISOString()
    };
    
    const docRef = await db.collection(COLLECTION_NAME).add(nuevaCampana);
    return { id: docRef.id, ...nuevaCampana };
  }
}

module.exports = new CampanaService();