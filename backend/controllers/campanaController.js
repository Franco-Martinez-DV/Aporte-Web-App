const campanaService = require('../services/campanaService');

const obtenerFechaHoy = () => {
  const ahora = new Date();
  const local = new Date(ahora.getTime() - ahora.getTimezoneOffset() * 60000);
  return local.toISOString().split('T')[0];
};

exports.obtenerCampanas = async (req, res) => {
  try {
    const campanas = await campanaService.obtenerTodas();
    res.status(200).json({ success: true, data: campanas });
  } catch (error) {
    console.error('Error obtenerCampanas:', error);
    res.status(500).json({ success: false, error: 'Error al obtener campañas', details: error.message });
  }
};

exports.obtenerCampanaPorId = async (req, res) => {
  try {
    const campana = await campanaService.obtenerPorId(req.params.id);
    if (!campana) {
      return res.status(404).json({ success: false, error: 'Campaña no encontrada' });
    }
    res.status(200).json({ success: true, data: campana });
  } catch (error) {
    console.error('Error obtenerCampanaPorId:', error);
    res.status(500).json({ success: false, error: 'Error al buscar campaña', details: error.message });
  }
};

exports.crearCampana = async (req, res) => {
  try {
    const { titulo, descripcion, categoria, montoObjetivo, fechaLimite } = req.body;
    if (!titulo || !descripcion || !categoria || !montoObjetivo || !fechaLimite) {
      return res.status(400).json({ success: false, error: 'Faltan campos obligatorios' });
    }

    if (isNaN(montoObjetivo) || Number(montoObjetivo) < 10000) {
      return res.status(400).json({ success: false, error: 'El monto objetivo mínimo es de $10.000' });
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(fechaLimite) || fechaLimite < obtenerFechaHoy()) {
      return res.status(400).json({ success: false, error: 'La fecha límite no puede ser anterior al día de hoy' });
    }

    const datosNuevaCampana = {
      ...req.body,
      montoObjetivo: Number(montoObjetivo),
      recaudado: 0
    };

    const nuevaCampana = await campanaService.crear(datosNuevaCampana);
    res.status(201).json({ success: true, data: nuevaCampana });
  } catch (error) {
    console.error('Error crearCampana:', error);
    res.status(500).json({ success: false, error: 'Error al crear campaña', details: error.message });
  }
};

exports.actualizarCampana = async (req, res) => {
  try {
    const { montoObjetivo, fechaLimite } = req.body;

    if (montoObjetivo !== undefined && (isNaN(montoObjetivo) || Number(montoObjetivo) < 10000)) {
      return res.status(400).json({ success: false, error: 'El monto objetivo mínimo es de $10.000' });
    }

    if (fechaLimite && (!/^\d{4}-\d{2}-\d{2}$/.test(fechaLimite) || fechaLimite < obtenerFechaHoy())) {
      return res.status(400).json({ success: false, error: 'La fecha límite no puede ser anterior al día de hoy' });
    }

    const campanaActualizada = await campanaService.actualizar(req.params.id, req.body);
    if (!campanaActualizada) {
      return res.status(404).json({ success: false, error: 'Campaña no encontrada' });
    }
    res.status(200).json({ success: true, data: campanaActualizada });
  } catch (error) {
    console.error('Error actualizarCampana:', error);
    res.status(500).json({ success: false, error: 'Error al actualizar campaña', details: error.message });
  }
};

exports.eliminarCampana = async (req, res) => {
  try {
    const eliminado = await campanaService.eliminar(req.params.id);
    if (!eliminado) {
      return res.status(404).json({ success: false, error: 'Campaña no encontrada' });
    }
    res.status(200).json({ success: true, message: 'Campaña eliminada correctamente' });
  } catch (error) {
    console.error('Error eliminarCampana:', error);
    res.status(500).json({ success: false, error: 'Error al eliminar campaña', details: error.message });
  }
};

exports.registrarAporte = async (req, res) => {
  try {
    const { monto } = req.body;
    if (!monto || isNaN(monto) || Number(monto) <= 0) {
      return res.status(400).json({ success: false, error: 'Monto de aporte inválido' });
    }
    const campanaActualizada = await campanaService.aportar(req.params.id, monto);
    if (!campanaActualizada) {
      return res.status(404).json({ success: false, error: 'Campaña no encontrada' });
    }
    res.status(200).json({ success: true, data: campanaActualizada });
  } catch (error) {
    console.error('Error registrarAporte:', error);
    res.status(500).json({ success: false, error: 'Error al registrar el aporte', details: error.message });
  }
};

exports.registrarIngresoExterno = async (req, res) => {
  try {
    const { monto, concepto, fecha } = req.body;
    if (!monto || isNaN(monto) || Number(monto) <= 0) {
      return res.status(400).json({ success: false, error: 'El monto ingresado debe ser un valor positivo mayor a 0' });
    }
    if (!concepto || concepto.trim() === '') {
      return res.status(400).json({ success: false, error: 'El concepto del ingreso externo es obligatorio' });
    }

    const campanaActualizada = await campanaService.registrarIngresoExterno(req.params.id, { monto, concepto, fecha });
    if (!campanaActualizada) {
      return res.status(404).json({ success: false, error: 'Campaña no encontrada' });
    }
    res.status(200).json({ success: true, data: campanaActualizada });
  } catch (error) {
    console.error('Error registrarIngresoExterno:', error);
    res.status(500).json({ success: false, error: 'Error al registrar ingreso externo', details: error.message });
  }
};

exports.reservarSlot = async (req, res) => {
  try {
    const { idSlot, nombreEmpresa, cuit, logoUrl } = req.body;

    if (!idSlot || !nombreEmpresa || nombreEmpresa.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'El ID del slot y el nombre de la empresa son obligatorios'
      });
    }

    const campanaActualizada = await campanaService.reservarSlot(req.params.id, {
      idSlot,
      nombreEmpresa,
      cuit,
      logoUrl
    });

    if (!campanaActualizada) {
      return res.status(404).json({ success: false, error: 'Campaña no encontrada' });
    }

    res.status(200).json({ success: true, data: campanaActualizada });
  } catch (error) {
    console.error('Error reservarSlot:', error);
    res.status(400).json({ success: false, error: error.message });
  }
};