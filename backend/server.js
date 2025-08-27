// require('dotenv').config();
// const express = require('express');
// const cors = require('cors');

// const app = express();
// app.use((req, _res, next) => { console.log(`[${req.method}] ${req.path}`); next(); });
// app.use(cors());
// app.use(express.json());

// // 👇 IMPORTA DESDE src/routes (porque server.js está en la raíz)
// const empleadosRoutes  = require('./src/routes/empleados.routes');
// const clientesRoutes   = require('./src/routes/clientes.routes');
// const inventarioRoutes = require('./src/routes/inventario.routes');
// const recibosRoutes    = require('./src/routes/recibos.routes');

// // 👇 Prefijo EXACTO que vas a llamar desde Postman
// app.use('/api', empleadosRoutes);
// app.use('/api/clientes', require('./routes/clientes.routes'));
// app.use('/api', inventarioRoutes);
// app.use('/api', recibosRoutes);

// const port = process.env.PORT || 3000;
// app.listen(port, () => {
//   console.log(`✅ Backend corriendo en http://localhost:${port}`);
// });
