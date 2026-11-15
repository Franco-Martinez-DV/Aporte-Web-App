const { auth } = require('../config/firebase');

const verificarToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Debés iniciar sesión para realizar esta acción'
      });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(token);
    req.usuario = decodedToken;
    next();
  } catch (error) {
    console.error('Error verificando token Firebase:', error.message);
    return res.status(401).json({
      success: false,
      error: 'Sesión inválida o expirada. Volvé a iniciar sesión'
    });
  }
};

module.exports = { verificarToken };