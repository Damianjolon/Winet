const repo = require('./clientes.repo');

function httpError(msg, code = 400) { const e = new Error(msg); e.status = code; return e; }
function isValidEmail(s) { return !s || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s); }

async function listar(req, res, next) {
  try {
    // Anti-cache contundente para evitar 304 con cuerpo vacío
    res.set({
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Surrogate-Control': 'no-store',
      'Vary': 'Accept-Encoding'
    });
    // ETag variable en cada respuesta
    res.set('ETag', `${Date.now()}-${Math.random()}`);

    const { q, estado, municipio, departamento, page, pageSize, sort, order, lite } = req.query;
    const data = await repo.listar({ q, estado, municipio, departamento, page, pageSize, sort, order });

    if (String(lite) === '1') {
      // Respuesta liviana para autocomplete
      return res.json(data.items.map(c => ({
        id: c.id,
        nombre: c.nombre,
        Telefono: c.telefono ?? c.Telefono ?? null,
      })));
    }

    res.json(data);
  } catch (e) { next(e); }
}

async function ver(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (!id) throw httpError('id inválido');
    const one = await repo.obtener(id);
    if (!one) throw httpError('Cliente no encontrado', 404);
    res.json(one);
  } catch (e) { next(e); }
}

async function crear(req, res, next) {
  try {
    const b = req.body || {};
    if (!b.primer_nombre) throw httpError('primer_nombre es requerido');
    if (!b.primer_apellido) throw httpError('primer_apellido es requerido');
    if (!b.correo) throw httpError('correo es requerido');
    if (!isValidEmail(b.correo)) throw httpError('correo inválido');

    const created = await repo.crear(b);
    res.status(201).json(created);
  } catch (e) {
    if (e?.code === 'ER_DUP_ENTRY') e.status = 409;
    next(e);
  }
}

async function editar(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (!id) throw httpError('id inválido');
    const b = req.body || {};
    if (b.correo && !isValidEmail(b.correo)) throw httpError('correo inválido');
    const updated = await repo.actualizar(id, b);
    res.json(updated);
  } catch (e) { next(e); }
}

async function eliminar(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (!id) throw httpError('id inválido');
    const hard = String(req.query.hard || '').toLowerCase() === '1';
    const r = await repo.eliminar(id, hard);
    res.json(r);
  } catch (e) { next(e); }
}

async function stats(_req, res, next) {
  try {
    res.json(await repo.stats());
  } catch (e) { next(e); }
}

module.exports = { listar, ver, crear, editar, eliminar, stats };
