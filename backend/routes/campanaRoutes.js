const express = require('express');
const router = express.Router();
const campanaController = require('../controllers/campanaController');
const { verificarToken } = require('../middlewares/authMiddleware');

router.get('/', campanaController.obtenerCampanas);
router.get('/:id', campanaController.obtenerCampanaPorId);

router.post('/', verificarToken, campanaController.crearCampana);
router.put('/:id', verificarToken, campanaController.actualizarCampana);
router.delete('/:id', verificarToken, campanaController.eliminarCampana);
router.post('/:id/aportar', verificarToken, campanaController.registrarAporte);
router.post('/:id/ingreso-externo', verificarToken, campanaController.registrarIngresoExterno);
router.post('/:id/gasto', verificarToken, campanaController.registrarGasto);
router.post('/:id/reservar-slot', verificarToken, campanaController.reservarSlot);

module.exports = router;