// src/index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Rutas existentes
app.use('/api/empleados', require('./routes/empleados.routes'));
app.use('/api/clientes', require('./routes/clientes.routes'));

// Nueva: autenticación
app.use('/api/auth', require('./routes/auth.routes'));

app.get('/', (_req, res) => res.send('WINET API OK'));
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Backend corriendo en http://localhost:${PORT}`));
