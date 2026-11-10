const express = require('express');
const router = express.Router();
const campanaController = require('../controllers/campanaController');

router.get('/', campanaController.obtenerCampanas);
router.get('/:id', campanaController.obtenerCampanaPorId);
router.post('/', campanaController.crearCampana);
router.put('/:id', campanaController.actualizarCampana);
router.delete('/:id', campanaController.eliminarCampana);
router.post('/:id/aportar', campanaController.registrarAporte);

module.exports = router;