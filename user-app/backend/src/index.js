// backend/src/index.js
process.on('unhandledRejection', (reason) => console.error('[unhandledRejection]', reason));
process.on('uncaughtException', (err) => console.error('[uncaughtException]', err));

require('dotenv').config({ path: __dirname + '/../.env' });

const express = require('express');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors({ origin: ['http://localhost:4200'], credentials: false }));

app.use('/api/modulos',       require('../modules/modulos/modulos.routes'));


app.use('/api/auth',          require('../modules/auth/auth.routes'));


app.use('/api/auth/users',    require('../modules/auth/users.routes'));

// Rutas que ya tenías:
app.use('/api/roles',         require('../modules/roles/roles.routes'));
app.use('/api/usuarios',      require('../modules/usuarios/usuarios.routes')); // ← tu otro módulo de usuarios
app.use('/api/empleados',     require('../modules/empleados/empleados.routes'));
app.use('/api/municipios',    require('../modules/municipios/municipios.routes'));
app.use('/api/asignaciones',  require('../modules/asignaciones/asignaciones.routes'));
app.use('/api/clientes',      require('../modules/clientes/clientes.routes'));
app.use('/api',               require('../modules/clientes/clientes.alias.routes'));
app.use('/api/departamentos', require('../modules/departamentos/departamentos.routes'));
app.use('/api/servicios',     require('../modules/servicios/servicios.routes'));
app.use('/api/recibos',       require('../modules/recibos/recibos.routes'));
app.use('/api/inventario', require('../modules/inventario/inventario.routes'));

// app.use('/auth',     require('../modules/auth/auth.routes'));
// app.use('/usuarios', require('../modules/auth/users.routes'));

// Health/simple debug
app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.get('/api/__routes', (req, res) => {
  const items = [];
  app._router.stack.forEach((m) => {
    if (m.route && m.route.path) {
      const method = Object.keys(m.route.methods)[0]?.toUpperCase();
      items.push({ method, path: m.route.path });
    } else if (m.name === 'router' && m.handle?.stack) {
      m.handle.stack.forEach((s) => {
        if (s.route) {
          const method = Object.keys(s.route.methods)[0]?.toUpperCase();
          items.push({ base: m.regexp?.toString(), method, path: s.route.path });
        }
      });
    }
  });
  res.json(items);
});

const PORT = Number(process.env.PORT || 3001);
app.listen(PORT, () => console.log(`✅ API escuchando en http://localhost:${PORT}`));



// process.on('unhandledRejection', (reason) => {
//   console.error('[unhandledRejection]', reason);
// });
// process.on('uncaughtException', (err) => {
//   console.error('[uncaughtException]', err);
// });

// require('dotenv').config({ path: __dirname + '/../.env' });
// const express = require('express');
// const cors = require('cors');

// const app = express();
// app.use(express.json());

// // CORS para Angular dev
// app.use(cors({ origin: ['http://localhost:4200'], credentials: false }));


// // Rutas (asegúrate que la ruta relativa es correcta)
// app.use('/api/modulos', require('../modules/modulos/modulos.routes'));

// // (Si ya tienes estas, déjalas)
// app.use('/api/auth', require('../modules/auth/auth.routes'));
// app.use('/api/roles', require('../modules/roles/roles.routes'));
// app.use('/api/usuarios', require('../modules/usuarios/usuarios.routes'));
// app.use('/api/empleados', require('../modules/empleados/empleados.routes'));
// app.use('/api/municipios', require('../modules/municipios/municipios.routes'));
// app.use('/api/asignaciones', require('../modules/asignaciones/asignaciones.routes'));
// app.use('/api/clientes', require('../modules/clientes/clientes.routes'));
// app.use('/api',           require('../modules/clientes/clientes.alias.routes'));
// app.use('/api/departamentos', require('../modules/departamentos/departamentos.routes'));
// app.use('/api/municipios',    require('../modules/municipios/municipios.routes'));
// app.use('/api/servicios', require('../modules/servicios/servicios.routes'));
// app.use('/api/recibos',   require('../modules/recibos/recibos.routes'));
// app.use('/auth',     require('../modules/auth/auth.routes'));
// app.use('/usuarios', require('../modules/auth/users.routes'));

// // Health
// app.get('/api/health', (_req, res) => res.json({ ok: true }));



// // (opcional) quitar espacios codificados al final
// app.use((req, _res, next) => {
//   req.url = req.url.replace(/%20+$/g, '');
//   next();
// });



// const PORT = Number(process.env.PORT || 3001);
// app.listen(PORT, () => console.log(`✅ API escuchando en http://localhost:${PORT}`));





