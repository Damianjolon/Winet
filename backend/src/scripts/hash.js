const bcrypt = require('bcryptjs');

(async () => {
  const plain = 'Admin#2025'; // cambia si quieres otra clave
  const hash = await bcrypt.hash(plain, 10);
  console.log('PASSWORD:', plain);
  console.log('HASH:', hash);
})();
