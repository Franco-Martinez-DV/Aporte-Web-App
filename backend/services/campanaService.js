const { db } = require('../config/firebase');
const COLLECTION_NAME = 'campanas';

const SLOTS_INDUMENTARIA = [
  { idSlot: 'pecho_principal', grupo: 'indumentaria', posicion: 'Pecho Principal', precio: 50000, estado: 'disponible', sponsor: null },
  { idSlot: 'pecho_secundario', grupo: 'indumentaria', posicion: 'Pecho Secundario', precio: 30000, estado: 'disponible', sponsor: null },
  { idSlot: 'manga_izq', grupo: 'indumentaria', posicion: 'Manga Izquierda', precio: 20000, estado: 'disponible', sponsor: null },
  { idSlot: 'manga_der', grupo: 'indumentaria', posicion: 'Manga Derecha', precio: 20000, estado: 'disponible', sponsor: null },
  { idSlot: 'espalda_sup', grupo: 'indumentaria', posicion: 'Espalda Superior', precio: 40000, estado: 'disponible', sponsor: null },
  { idSlot: 'zocalo_inf', grupo: 'indumentaria', posicion: 'Zócalo Inferior', precio: 25000, estado: 'disponible', sponsor: null }
];

const SLOTS_CLUB_INSTALACIONES = [
  { idSlot: 'naming_estadio', grupo: 'infraestructura', posicion: 'Naming Estadio / Predio', precio: 120000, estado: 'disponible', sponsor: null },
  { idSlot: 'pared_principal', grupo: 'infraestructura', posicion: 'Cartelería Pared Principal', precio: 60000, estado: 'disponible', sponsor: null },
  { idSlot: 'pared_lateral_a', grupo: 'infraestructura', posicion: 'Cartelería Pared Lateral A', precio: 40000, estado: 'disponible', sponsor: null },
  { idSlot: 'pared_lateral_b', grupo: 'infraestructura', posicion: 'Cartelería Pared Lateral B', precio: 40000, estado: 'disponible', sponsor: null }
];

const SLOTS_LIGA_TORNEO = [
  { idSlot: 'naming_liga', grupo: 'torneo', posicion: 'Naming Oficial Liga / Torneo', precio: 150000, estado: 'disponible', sponsor: null },
  { idSlot: 'auspicio_premio', grupo: 'torneo', posicion: 'Auspicio Premios y Trofeos', precio: 80000, estado: 'disponible', sponsor: null },
  { idSlot: 'carteleria_evento_1', grupo: 'torneo', posicion: 'Cartelería Central del Evento', precio: 50000, estado: 'disponible', sponsor: null },
  { idSlot: 'carteleria_evento_2', grupo: 'torneo', posicion: 'Cartelería Acceso / Mesa de Control', precio: 35000, estado: 'disponible', sponsor: null }
];

function generarSlotsPorCategoria(categoria, modalidadPatrocinio = 'ambos') {
  if (categoria === 'Club') {
    if (modalidadPatrocinio === 'camiseta') {
      return JSON.parse(JSON.stringify(SLOTS_INDUMENTARIA));
    }
    if (modalidadPatrocinio === 'instalaciones') {
      return JSON.parse(JSON.stringify(SLOTS_CLUB_INSTALACIONES));
    }
    return JSON.parse(JSON.stringify([...SLOTS_INDUMENTARIA, ...SLOTS_CLUB_INSTALACIONES]));
  }

  if (categoria === 'Liga/Torneo') {
    return JSON.parse(JSON.stringify(SLOTS_LIGA_TORNEO));
  }

  return JSON.parse(JSON.stringify(SLOTS_INDUMENTARIA));
}

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

  async verificarEsCreador(id, uidUsuario) {
    const doc = await db.collection(COLLECTION_NAME).doc(id).get();
    if (!doc.exists) return { existe: false, autorizado: false };

    const data = doc.data();
    const autorizado = !data.creadorId || data.creadorId === uidUsuario;
    return { existe: true, autorizado, data };
  }

  async crear(datos) {
    const tipo = datos.tipo || 'donacion';
    const categoria = datos.categoria || 'Deportista Individual';
    const modalidadPatrocinio = tipo === 'patrocinio'
      ? (categoria === 'Club' ? (datos.modalidadPatrocinio || 'ambos') : 'predeterminada')
      : '';

    const slotsIndumentaria = tipo === 'patrocinio'
      ? generarSlotsPorCategoria(categoria, modalidadPatrocinio)
      : [];

    const nuevaCampana = {
      titulo: datos.titulo || '',
      descripcion: datos.descripcion || '',
      categoria,
      imagenUrl: datos.imagenUrl || '',
      montoObjetivo: Number(datos.montoObjetivo) || 0,
      recaudado: Number(datos.recaudado) || 0,
      fechaLimite: datos.fechaLimite || '',
      estado: 'activa',
      tipo,
      modalidadPatrocinio,
      slotsIndumentaria,
      ingresosExternos: [],
      gastos: [],
      creadorId: datos.creadorId || '',
      creadorEmail: datos.creadorEmail || '',
      fechaCreacion: new Date().toISOString()
    };

    const docRef = await db.collection(COLLECTION_NAME).add(nuevaCampana);
    return { id: docRef.id, ...nuevaCampana };
  }

  async actualizar(id, datos) {
    const docRef = db.collection(COLLECTION_NAME).doc(id);
    const doc = await docRef.get();
    if (!doc.exists) return null;

    const dataActual = doc.data();

    const datosActualizar = {
      titulo: datos.titulo ?? dataActual.titulo,
      descripcion: datos.descripcion ?? dataActual.descripcion,
      categoria: datos.categoria ?? dataActual.categoria,
      imagenUrl: datos.imagenUrl !== undefined ? datos.imagenUrl : (dataActual.imagenUrl || ''),
      fechaLimite: datos.fechaLimite ?? dataActual.fechaLimite,
      montoObjetivo: Number(datos.montoObjetivo) || 0,
      recaudado: Number(dataActual.recaudado) || 0,
      slotsIndumentaria: dataActual.slotsIndumentaria || [],
      ingresosExternos: dataActual.ingresosExternos || [],
      gastos: dataActual.gastos || [],
      creadorId: dataActual.creadorId || '',
      creadorEmail: dataActual.creadorEmail || '',
      fechaActualizacion: new Date().toISOString()
    };

    await docRef.update(datosActualizar);
    return { id, ...dataActual, ...datosActualizar };
  }

  async eliminar(id) {
    const docRef = db.collection(COLLECTION_NAME).doc(id);
    const doc = await docRef.get();
    if (!doc.exists) return false;

    await docRef.delete();
    return true;
  }

  async aportar(id, monto, uidUsuario) {
    const docRef = db.collection(COLLECTION_NAME).doc(id);
    const doc = await docRef.get();
    if (!doc.exists) return null;

    const data = doc.data();

    if (data.creadorId && uidUsuario && data.creadorId === uidUsuario) {
      throw new Error('No podés realizar aportes en tu propia campaña');
    }

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

  async registrarGasto(id, { monto, concepto, fecha, comprobanteUrl, tipoArchivo }) {
    const docRef = db.collection(COLLECTION_NAME).doc(id);
    const doc = await docRef.get();
    if (!doc.exists) return null;

    const data = doc.data();
    const recaudadoActual = Number(data.recaudado) || 0;
    const gastos = data.gastos || [];

    const totalGastado = gastos.reduce((acc, g) => acc + Number(g.monto || 0), 0);
    const saldoDisponible = recaudadoActual - totalGastado;

    if (Number(monto) > saldoDisponible) {
      throw new Error(`El gasto ($${Number(monto)}) supera el saldo disponible para rendir ($${saldoDisponible})`);
    }

    gastos.push({
      monto: Number(monto),
      concepto: concepto.trim(),
      fecha: fecha || new Date().toISOString().split('T')[0],
      comprobanteUrl,
      tipoArchivo: tipoArchivo || 'pdf',
      fechaRegistro: new Date().toISOString()
    });

    await docRef.update({
      gastos,
      fechaActualizacion: new Date().toISOString()
    });

    return { id, ...data, gastos };
  }

  async reservarSlot(id, { idSlot, nombreEmpresa, cuit, logoUrl, uidUsuario }) {
    const docRef = db.collection(COLLECTION_NAME).doc(id);
    const doc = await docRef.get();
    if (!doc.exists) return null;

    const data = doc.data();

    if (data.creadorId && uidUsuario && data.creadorId === uidUsuario) {
      throw new Error('No podés patrocinar tu propia campaña');
    }

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