const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Servir archivos estáticos desde el directorio actual
app.use(express.static(path.join(__dirname, '.')));

// Ruta principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'basic-game.html'));
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en el puerto ${PORT}`);
  console.log('Para acceder al juego, abre tu navegador en la URL que aparece arriba');
});