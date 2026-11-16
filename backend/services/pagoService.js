const { MercadoPagoConfig, Preference, Payment } = require('mercadopago');
const { db } = require('../config/firebase');
const campanaService = require('./campanaService');

const INTENCIONES_COLLECTION = 'intencionesPago';
const PAGOS_COLLECTION = 'pagosAcreditados';

function obtenerClienteMP() {
  const accessToken = process.env.MP_ACCESS_TOKEN;
  if (!accessToken) {
    throw new Error('Falta configurar MP_ACCESS_TOKEN en el archivo .env del backend');
  }
  return new MercadoPagoConfig({ accessToken });
}

class PagoService {
  async crearPreferencia({
    tipoOperacion,
    campanaId,
    monto,
    idSlot,
    nombreEmpresa,
    cuit,
    logoUrl,
    uidUsuario,
    urlRetornoBase
  }) {
    const campana = await campanaService.obtenerPorId(campanaId);
    if (!campana) {
      throw new Error('La campaña seleccionada no existe');
    }

    if (campana.creadorId && uidUsuario && campana.creadorId === uidUsuario) {
      throw new Error('No podés realizar pagos en tu propia campaña');
    }

    let montoFinal = 0;
    let tituloItem = '';
    let datosIntencion = {
      tipoOperacion,
      campanaId,
      uidUsuario: uidUsuario || '',
      estado: 'pendiente',
      fechaCreacion: new Date().toISOString()
    };

    if (tipoOperacion === 'patrocinio') {
      const slots = campana.slotsIndumentaria || [];
      const slot = slots.find(s => s.idSlot === idSlot);

      if (!slot) {
        throw new Error('El espacio publicitario seleccionado no existe');
      }
      if (slot.estado === 'reservado') {
        throw new Error('El espacio publicitario ya se encuentra ocupado');
      }
      if (!nombreEmpresa || !nombreEmpresa.trim()) {
        throw new Error('Debés ingresar el nombre o razón social de la empresa sponsor');
      }

      montoFinal = Number(slot.precio);
      tituloItem = `Patrocinio (${slot.posicion}) - ${campana.titulo}`;
      datosIntencion = {
        ...datosIntencion,
        monto: montoFinal,
        idSlot: slot.idSlot,
        posicion: slot.posicion,
        nombreEmpresa: nombreEmpresa.trim(),
        cuit: (cuit || '').trim(),
        logoUrl: (logoUrl || '').trim()
      };
    } else {
      montoFinal = Number(monto);
      if (!montoFinal || montoFinal <= 0) {
        throw new Error('El monto a aportar debe ser mayor a 0');
      }

      tituloItem = `Aporte Deportivo - ${campana.titulo}`;
      datosIntencion = {
        ...datosIntencion,
        monto: montoFinal
      };
    }

    const intencionRef = await db.collection(INTENCIONES_COLLECTION).add(datosIntencion);

    const baseUrl = (urlRetornoBase || 'http://localhost:5173').replace(/\/$/, '');
    const client = obtenerClienteMP();
    const preference = new Preference(client);

    const bodyPreferencia = {
      items: [
        {
          id: intencionRef.id,
          title: tituloItem.slice(0, 250),
          quantity: 1,
          unit_price: montoFinal,
          currency_id: 'ARS'
        }
      ],
      back_urls: {
        success: `${baseUrl}/?mp_status=approved`,
        failure: `${baseUrl}/?mp_status=failure`,
        pending: `${baseUrl}/?mp_status=pending`
      },
      auto_return: 'approved',
      external_reference: intencionRef.id,
      statement_descriptor: 'APORTE DEPORTIVO'
    };

    let respuestaMP;
    try {
      respuestaMP = await preference.create({ body: bodyPreferencia });
    } catch (error) {
      // Si Mercado Pago rechaza auto_return por tratarse de localhost, creamos la preferencia sin auto_return
      delete bodyPreferencia.auto_return;
      respuestaMP = await preference.create({ body: bodyPreferencia });
    }

    await intencionRef.update({
      preferenceId: respuestaMP.id
    });

    return {
      intencionId: intencionRef.id,
      preferenceId: respuestaMP.id,
      initPoint: respuestaMP.init_point,
      sandboxInitPoint: respuestaMP.sandbox_init_point
    };
  }

  async confirmarPago({ paymentId, externalReference }) {
    if (!paymentId) {
      throw new Error('Falta el identificador de pago (paymentId)');
    }

    const pagoIdStr = String(paymentId);

    const pagoExistenteDoc = await db.collection(PAGOS_COLLECTION).doc(pagoIdStr).get();
    if (pagoExistenteDoc.exists) {
      const pagoPrevio = pagoExistenteDoc.data();
      const campanaActualizada = await campanaService.obtenerPorId(pagoPrevio.campanaId);
      return {
        yaAcreditado: true,
        paymentId: pagoIdStr,
        tipoOperacion: pagoPrevio.tipoOperacion,
        monto: pagoPrevio.monto,
        campana: campanaActualizada
      };
    }

    const client = obtenerClienteMP();
    const payment = new Payment(client);
    const detallePago = await payment.get({ id: pagoIdStr });

    if (detallePago.status !== 'approved') {
      throw new Error(`El pago aún no está aprobado (estado actual: ${detallePago.status})`);
    }

    const intencionId = externalReference || detallePago.external_reference;
    if (!intencionId) {
      throw new Error('El pago no contiene referencia de intención válida');
    }

    const intencionRef = db.collection(INTENCIONES_COLLECTION).doc(intencionId);
    const intencionDoc = await intencionRef.get();
    if (!intencionDoc.exists) {
      throw new Error('No se encontró la intención de pago asociada');
    }

    const intencion = intencionDoc.data();

    if (intencion.estado === 'acreditado') {
      const campanaActualizada = await campanaService.obtenerPorId(intencion.campanaId);
      return {
        yaAcreditado: true,
        paymentId: pagoIdStr,
        tipoOperacion: intencion.tipoOperacion,
        monto: intencion.monto,
        campana: campanaActualizada
      };
    }

    let campanaActualizada;
    if (intencion.tipoOperacion === 'patrocinio') {
      campanaActualizada = await campanaService.reservarSlot(intencion.campanaId, {
        idSlot: intencion.idSlot,
        nombreEmpresa: intencion.nombreEmpresa,
        cuit: intencion.cuit,
        logoUrl: intencion.logoUrl,
        uidUsuario: intencion.uidUsuario
      });
    } else {
      campanaActualizada = await campanaService.aportar(
        intencion.campanaId,
        intencion.monto,
        intencion.uidUsuario
      );
    }

    const ahora = new Date().toISOString();

    await intencionRef.update({
      estado: 'acreditado',
      paymentId: pagoIdStr,
      fechaAcreditacion: ahora
    });

    await db.collection(PAGOS_COLLECTION).doc(pagoIdStr).set({
      paymentId: pagoIdStr,
      intencionId,
      campanaId: intencion.campanaId,
      tipoOperacion: intencion.tipoOperacion,
      monto: intencion.monto,
      uidUsuario: intencion.uidUsuario,
      statusMP: detallePago.status,
      fechaAcreditacion: ahora
    });

    return {
      yaAcreditado: false,
      paymentId: pagoIdStr,
      tipoOperacion: intencion.tipoOperacion,
      monto: intencion.monto,
      campana: campanaActualizada
    };
  }

  async sincronizarPendientes(uidUsuario) {
    if (!uidUsuario) return [];

    const snapshot = await db
      .collection(INTENCIONES_COLLECTION)
      .where('uidUsuario', '==', uidUsuario)
      .get();

    const pendientes = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.estado === 'pendiente') {
        pendientes.push({ id: doc.id, ...data });
      }
    });

    if (pendientes.length === 0) return [];

    const client = obtenerClienteMP();
    const payment = new Payment(client);
    const acreditados = [];

    for (const intencion of pendientes) {
      try {
        const busqueda = await payment.search({
          options: {
            external_reference: intencion.id
          }
        });

        const resultados = busqueda?.results || busqueda?.body?.results || [];
        const pagoAprobado = resultados.find(p => p.status === 'approved');

        if (pagoAprobado) {
          const confirmado = await this.confirmarPago({
            paymentId: String(pagoAprobado.id),
            externalReference: intencion.id
          });
          if (!confirmado.yaAcreditado) {
            acreditados.push(confirmado);
          }
        }
      } catch (err) {
        console.error(`Error sincronizando intención ${intencion.id}:`, err.message);
      }
    }

    return acreditados;
  }
}

module.exports = new PagoService();