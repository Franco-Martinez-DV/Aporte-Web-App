const express = require('express');
const router = express.Router();
const pagoController = require('../controllers/pagoController');
const { verificarToken } = require('../middlewares/authMiddleware');

router.post('/preferencia', verificarToken, pagoController.crearPreferencia);
router.post('/confirmar', verificarToken, pagoController.confirmarPago);
router.post('/sincronizar', verificarToken, pagoController.sincronizarPendientes);

module.exports = router;