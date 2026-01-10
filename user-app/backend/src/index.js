process.on('unhandledRejection', (reason) => {
  console.error('[unhandledRejection]', reason);
});
process.on('uncaughtException', (err) => {
  console.error('[uncaughtException]', err);
});

require('dotenv').config({ path: __dirname + '/../.env' });
const express = require('express');
const cors = require('cors');

const app = express();
app.use(express.json());

// --- CORS ---
// En producción, Vercel asignará un dominio. Puedes poner '*' para permitir todo
// o agregar tu dominio de Vercel al array cuando lo tengas.
const allowedOrigins = ['http://localhost:4200'];
// Si existe la variable VERCEL_URL (Vercel la pone automáticamente), la agregamos a permitidos
if (process.env.VERCEL_URL) {
  allowedOrigins.push(`https://${process.env.VERCEL_URL}`);
}

app.use(cors({
  origin: (origin, callback) => {
    // Permitir solicitudes sin origen (como curl o apps móviles) o si está en la lista
    if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      // Opcional: callback(new Error('No permitido por CORS'));
      // Para desarrollo rápido, a veces es mejor permitir todo si da problemas:
      callback(null, true);
    }
  },
  credentials: false
}));


// --- Rutas ---
// (Tus rutas originales se mantienen intactas)
app.use('/api/modulos', require('../modules/modulos/modulos.routes'));
app.use('/api/auth', require('../modules/auth/auth.routes'));
app.use('/api/roles', require('../modules/roles/roles.routes'));
app.use('/api/usuarios', require('../modules/usuarios/usuarios.routes'));
app.use('/api/empleados', require('../modules/empleados/empleados.routes'));
app.use('/api/municipios', require('../modules/municipios/municipios.routes'));
app.use('/api/asignaciones', require('../modules/asignaciones/asignaciones.routes'));
app.use('/api/clientes', require('../modules/clientes/clientes.routes'));
app.use('/api', require('../modules/clientes/clientes.alias.routes'));
app.use('/api/departamentos', require('../modules/departamentos/departamentos.routes'));
app.use('/api/municipios', require('../modules/municipios/municipios.routes'));

// Otras rutas comentadas que tenías...
// app.use('/api/recibos', require('./modules/recibos/recibos.routes'));
// ...

// Health check
app.get('/api/health', (_req, res) => res.json({ ok: true }));

// (opcional) quitar espacios codificados al final
app.use((req, _res, next) => {
  req.url = req.url.replace(/%20+$/g, '');
  next();
});

// --- IMPORTANTE PARA VERCEL ---

// 1. Exportamos la app para que Vercel la pueda usar
module.exports = app;

// 2. Solo hacemos el 'listen' si el archivo se ejecuta directamente (modo local)
// Si require.main === module, significa que ejecutaste "node index.js"
if (require.main === module) {
    const PORT = Number(process.env.PORT || 3001);
    app.listen(PORT, () => {
        console.log(`✅ API escuchando en http://localhost:${PORT}`);
    });
}
