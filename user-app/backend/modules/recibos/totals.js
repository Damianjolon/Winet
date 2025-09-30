function normalizeItems(items) {
  const map = new Map();
  for (const it of items) {
    const key = [
      it.tipo_item,
      it.servicio_id || 0,
      it.producto_id || 0,
      Number(it.precio_unitario).toFixed(2),
      Number(it.descuento_pct).toFixed(2),
      Number(it.impuesto_pct).toFixed(2)
    ].join('|');
    if (map.has(key)) {
      const cur = map.get(key);
      cur.cantidad += Number(it.cantidad);
    } else {
      map.set(key, {
        tipo_item: it.tipo_item,
        servicio_id: it.servicio_id || null,
        producto_id: it.producto_id || null,
        descripcion: it.descripcion,
        cantidad: Number(it.cantidad),
        precio_unitario: Number(it.precio_unitario),
        descuento_pct: Number(it.descuento_pct || 0),
        impuesto_pct: Number(it.impuesto_pct || 0)
      });
    }
  }
  return Array.from(map.values());
}

function calcLinea(cantidad, pu, descPct, impPct) {
  const base = +(cantidad * pu).toFixed(2);
  const descuento = +(base * (descPct / 100)).toFixed(2);
  const gravado = +(base - descuento).toFixed(2);
  const impuesto = +(gravado * (impPct / 100)).toFixed(2);
  const total = +(gravado + impuesto).toFixed(2);
  return { base, descuento, impuesto, total };
}

function calcTotales(items) {
  let subtotal = 0, descuento_total = 0, impuesto_total = 0, total = 0;
  for (const it of items) {
    const { base, descuento, impuesto, total: tl } =
      calcLinea(it.cantidad, it.precio_unitario, it.descuento_pct, it.impuesto_pct);
    subtotal += base;
    descuento_total += descuento;
    impuesto_total += impuesto;
    total += tl;
  }
  return {
    subtotal: +subtotal.toFixed(2),
    descuento_total: +descuento_total.toFixed(2),
    impuesto_total: +impuesto_total.toFixed(2),
    total: +total.toFixed(2)
  };
}

module.exports = { normalizeItems, calcLinea, calcTotales };
