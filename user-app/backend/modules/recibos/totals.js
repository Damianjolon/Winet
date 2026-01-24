// backend/modules/recibos/totals.js
function calcLinea(cant, pu, descPct, impPct){
  const base = +(Number(cant) * Number(pu)).toFixed(2);
  const desc = +(base * (Number(descPct)||0) / 100).toFixed(2);
  const grav = +(base - desc).toFixed(2);
  const imp  = +(grav * (Number(impPct)||0) / 100).toFixed(2);
  const tot  = +(grav + imp).toFixed(2);
  return { base, desc, imp, tot };
}

function normalize(items){
  const map = new Map();
  for (const it of items){
    const key = [
      it.servicio_id || 0,
      Number(it.precio_unitario).toFixed(2),
      Number(it.descuento_pct||0).toFixed(2),
      Number(it.impuesto_pct||0).toFixed(2)
    ].join('|');
    const cur = map.get(key);
    if (cur) cur.cantidad += Number(it.cantidad);
    else map.set(key, {
      servicio_id: Number(it.servicio_id),
      descripcion: String(it.descripcion || ''),
      cantidad: Number(it.cantidad),
      precio_unitario: Number(it.precio_unitario),
      descuento_pct: Number(it.descuento_pct || 0),
      impuesto_pct: Number(it.impuesto_pct || 0)
    });
  }
  return Array.from(map.values());
}

function calcTotales(items){
  let subtotal=0, descuento_total=0, impuesto_total=0, total=0;
  for (const it of items){
    const L = calcLinea(it.cantidad, it.precio_unitario, it.descuento_pct, it.impuesto_pct);
    subtotal += L.base;
    descuento_total += L.desc;
    impuesto_total += L.imp;
    total += L.tot;
  }
  return {
    subtotal:+subtotal.toFixed(2),
    descuento_total:+descuento_total.toFixed(2),
    impuesto_total:+impuesto_total.toFixed(2),
    total:+total.toFixed(2)
  };
}

module.exports = { calcLinea, normalize, calcTotales };
