const { db } = require('../config/firebase');
const COLLECTION_NAME = 'campanas';

const SLOTS_PREDETERMINADOS = [
  { idSlot: 'pecho_principal', posicion: 'Pecho Principal', precio: 50000, estado: 'disponible', sponsor: null },
  { idSlot: 'pecho_secundario', posicion: 'Pecho Secundario', precio: 30000, estado: 'disponible', sponsor: null },
  { idSlot: 'manga_izq', posicion: 'Manga Izquierda', precio: 20000, estado: 'disponible', sponsor: null },
  { idSlot: 'manga_der', posicion: 'Manga Derecha', precio: 20000, estado: 'disponible', sponsor: null },
  { idSlot: 'espalda_sup', posicion: 'Espalda Superior', precio: 40000, estado: 'disponible', sponsor: null },
  { idSlot: 'zocalo_inf', posicion: 'Zócalo Inferior', precio: 25000, estado: 'disponible', sponsor: null }
];

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

  async crear(datos) {
    const tipo = datos.tipo || 'donacion';
    
    const slotsIndumentaria = tipo === 'patrocinio' 
      ? JSON.parse(JSON.stringify(SLOTS_PREDETERMINADOS)) 
      : [];

    const nuevaCampana = {
      titulo: datos.titulo || '',
      descripcion: datos.descripcion || '',
      categoria: datos.categoria || 'Deportista Individual',
      montoObjetivo: Number(datos.montoObjetivo) || 0,
      recaudado: Number(datos.recaudado) || 0,
      fechaLimite: datos.fechaLimite || '',
      estado: 'activa',
      tipo: tipo,
      slotsIndumentaria: slotsIndumentaria,
      fechaCreacion: new Date().toISOString()
    };

    const docRef = await db.collection(COLLECTION_NAME).add(nuevaCampana);
    return { id: docRef.id, ...nuevaCampana };
  }

  async actualizar(id, datos) {
    const docRef = db.collection(COLLECTION_NAME).doc(id);
    const doc = await docRef.get();
    if (!doc.exists) return null;

    const datosActualizar = {
      ...datos,
      montoObjetivo: Number(datos.montoObjetivo) || 0,
      recaudado: Number(datos.recaudado) || 0,
      fechaActualizacion: new Date().toISOString()
    };

    await docRef.update(datosActualizar);
    return { id, ...doc.data(), ...datosActualizar };
  }

  async eliminar(id) {
    const docRef = db.collection(COLLECTION_NAME).doc(id);
    const doc = await docRef.get();
    if (!doc.exists) return false;

    await docRef.delete();
    return true;
  }

  async aportar(id, monto) {
    const docRef = db.collection(COLLECTION_NAME).doc(id);
    const doc = await docRef.get();
    if (!doc.exists) return null;

    const data = doc.data();
    const recaudadoActual = Number(data.recaudado) || 0;
    const nuevoRecaudado = recaudadoActual + Number(monto);

    await docRef.update({
      recaudado: nuevoRecaudado,
      fechaActualizacion: new Date().toISOString()
    });

    return { id, ...data, recaudado: nuevoRecaudado };
  }

  async registrarIngresoExterno(id, { monto, concepto, fecha }) {
    const docRef = db.collection(COLLECTION_NAME).doc(id);
    const doc = await docRef.get();
    if (!doc.exists) return null;

    const data = doc.data();
    const recaudadoActual = Number(data.recaudado) || 0;
    const nuevoRecaudado = recaudadoActual + Number(monto);

    const ingresosExternos = data.ingresosExternos || [];
    ingresosExternos.push({
      monto: Number(monto),
      concepto,
      fecha: fecha || new Date().toISOString().split('T')[0],
      fechaRegistro: new Date().toISOString()
    });

    await docRef.update({
      recaudado: nuevoRecaudado,
      ingresosExternos,
      fechaActualizacion: new Date().toISOString()
    });

    return { id, ...data, recaudado: nuevoRecaudado, ingresosExternos };
  }

  async reservarSlot(id, { idSlot, nombreEmpresa, cuit, logoUrl }) {
    const docRef = db.collection(COLLECTION_NAME).doc(id);
    const doc = await docRef.get();
    if (!doc.exists) return null;

    const data = doc.data();
    const slots = data.slotsIndumentaria || [];
    
    const slotIndex = slots.findIndex(s => s.idSlot === idSlot);
    if (slotIndex === -1) {
      throw new Error('El slot seleccionado no existe');
    }

    if (slots[slotIndex].estado === 'reservado') {
      throw new Error('El espacio publicitario ya se encuentra ocupado');
    }

    slots[slotIndex].estado = 'reservado';
    slots[slotIndex].sponsor = {
      nombreEmpresa,
      cuit: cuit || '',
      logoUrl: logoUrl || '',
      fechaReserva: new Date().toISOString()
    };

    const recaudadoActual = Number(data.recaudado) || 0;
    const nuevoRecaudado = recaudadoActual + Number(slots[slotIndex].precio);

    await docRef.update({
      slotsIndumentaria: slots,
      recaudado: nuevoRecaudado,
      fechaActualizacion: new Date().toISOString()
    });

    return { id, ...data, slotsIndumentaria: slots, recaudado: nuevoRecaudado };
  }
}

module.exports = new CampanaService();