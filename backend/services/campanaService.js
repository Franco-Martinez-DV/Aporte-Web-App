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

  async obtenerPorId(id) {
    const doc = await db.collection(COLLECTION_NAME).doc(id).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() };
  }

  async crear(datosCampana) {
    const nuevaCampana = {
      titulo: datosCampana.titulo,
      descripcion: datosCampana.descripcion,
      categoria: datosCampana.categoria,
      montoObjetivo: Number(datosCampana.montoObjetivo),
      fechaLimite: datosCampana.fechaLimite,
      imagenPortada: datosCampana.imagenPortada || null,
      videoUrl: datosCampana.videoUrl || null,
      recaudado: Number(datosCampana.recaudado) || 0,
      estado: 'activa',
      fechaCreacion: new Date().toISOString()
    };
    
    const docRef = await db.collection(COLLECTION_NAME).add(nuevaCampana);
    return { id: docRef.id, ...nuevaCampana };
  }

  async actualizar(id, datosCampana) {
    const docRef = db.collection(COLLECTION_NAME).doc(id);
    const doc = await docRef.get();
    if (!doc.exists) return null;

    const datosActualizados = {
      ...datosCampana,
      montoObjetivo: Number(datosCampana.montoObjetivo),
      recaudado: Number(datosCampana.recaudado),
      fechaActualizacion: new Date().toISOString()
    };

    await docRef.update(datosActualizados);
    return { id, ...doc.data(), ...datosActualizados };
  }

  async eliminar(id) {
    const docRef = db.collection(COLLECTION_NAME).doc(id);
    const doc = await docRef.get();
    if (!doc.exists) return false;

    await docRef.delete();
    return true;
  }
}

module.exports = new CampanaService();