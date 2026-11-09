const express = require('express');
const cors = require('cors');
require('dotenv').config();

require('./config/firebase');

const campanaRoutes = require('./routes/campanaRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get('/api/v1/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Backend API de Aporte funcionando correctamente',
    timestamp: new Date().toISOString()
  });
});

app.use('/api/v1/campanas', campanaRoutes);

app.use((req, res) => {
  res.status(404).json({
    error: 'NotFound',
    message: `La ruta ${req.originalUrl} no existe en este servidor.`
  });
});

app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});