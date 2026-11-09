const campanaService = require('../services/campanaService');

exports.obtenerCampanas = async (req, res) => {
  try {
    const campanas = await campanaService.obtenerTodas();
    res.status(200).json({ success: true, data: campanas });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Error al obtener las campañas', details: error.message });
  }
};

exports.crearCampana = async (req, res) => {
  try {
    const { titulo, descripcion, categoria, montoObjetivo, fechaLimite, imagenPortada, videoUrl } = req.body;
    
    if (!titulo || !descripcion || !categoria || !montoObjetivo || !fechaLimite) {
      return res.status(400).json({
        success: false,
        error: 'Los campos titulo, descripcion, categoria, montoObjetivo y fechaLimite son obligatorios.'
      });
    }

    const nuevaCampana = await campanaService.crear({
      titulo,
      descripcion,
      categoria,
      montoObjetivo,
      fechaLimite,
      imagenPortada,
      videoUrl
    });

    res.status(201).json({ success: true, data: nuevaCampana });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Error al crear la campaña', details: error.message });
  }
};