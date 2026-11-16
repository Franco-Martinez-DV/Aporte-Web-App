const pagoService = require('../services/pagoService');

class PagoController {
  async crearPreferencia(req, res) {
    try {
      const uidUsuario = req.usuario?.uid || req.user?.uid || '';
      const {
        tipoOperacion,
        campanaId,
        monto,
        idSlot,
        nombreEmpresa,
        cuit,
        logoUrl,
        urlRetornoBase
      } = req.body;

      if (!campanaId) {
        return res.status(400).json({ success: false, error: 'El ID de la campaña es obligatorio' });
      }

      const resultado = await pagoService.crearPreferencia({
        tipoOperacion: tipoOperacion || 'aporte',
        campanaId,
        monto,
        idSlot,
        nombreEmpresa,
        cuit,
        logoUrl,
        uidUsuario,
        urlRetornoBase
      });

      res.status(201).json({
        success: true,
        data: resultado
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message || 'No se pudo generar la preferencia de pago en Mercado Pago'
      });
    }
  }

  async confirmarPago(req, res) {
    try {
      const { paymentId, externalReference } = req.body;

      const resultado = await pagoService.confirmarPago({
        paymentId,
        externalReference
      });

      res.status(200).json({
        success: true,
        data: resultado
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message || 'No se pudo confirmar el pago con Mercado Pago'
      });
    }
  }

  async sincronizarPendientes(req, res) {
    try {
      const uidUsuario = req.usuario?.uid || req.user?.uid || '';
      const acreditados = await pagoService.sincronizarPendientes(uidUsuario);

      res.status(200).json({
        success: true,
        data: acreditados
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message || 'No se pudieron sincronizar los pagos pendientes'
      });
    }
  }
}

module.exports = new PagoController();