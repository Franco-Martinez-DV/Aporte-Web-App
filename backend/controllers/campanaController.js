const campanaService = require('../services/campanaService');

exports.obtenerCampanas = async (req, res) => {
  try {
    const campanas = await campanaService.obtenerTodas();
    res.status(200).json({ success: true, data: campanas });
  } catch (error) {
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
    res.status(500).json({ success: false, error: 'Error al buscar campaña', details: error.message });
  }
};

exports.crearCampana = async (req, res) => {
  try {
    const { titulo, descripcion, categoria, montoObjetivo, fechaLimite } = req.body;
    if (!titulo || !descripcion || !categoria || !montoObjetivo || !fechaLimite) {
      return res.status(400).json({ success: false, error: 'Faltan campos obligatorios' });
    }
    const nuevaCampana = await campanaService.crear(req.body);
    res.status(201).json({ success: true, data: nuevaCampana });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Error al crear campaña', details: error.message });
  }
};

exports.actualizarCampana = async (req, res) => {
  try {
    const campanaActualizada = await campanaService.actualizar(req.params.id, req.body);
    if (!campanaActualizada) {
      return res.status(404).json({ success: false, error: 'Campaña no encontrada' });
    }
    res.status(200).json({ success: true, data: campanaActualizada });
  } catch (error) {
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
    res.status(500).json({ success: false, error: 'Error al registrar el aporte', details: error.message });
  }
};