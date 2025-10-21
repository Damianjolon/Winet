/* ======= TC_SERVICIOS ======= */
CREATE TABLE IF NOT EXISTS TC_SERVICIOS (
  id              BIGINT AUTO_INCREMENT PRIMARY KEY,
  codigo          VARCHAR(60)  NOT NULL,
  nombre          VARCHAR(160) NOT NULL,
  descripcion     TEXT NULL,
  precio_unitario DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  impuesto_pct    DECIMAL(5,2)  NOT NULL DEFAULT 0.00,
  activo          TINYINT(1) NOT NULL DEFAULT 1,
  UNIQUE KEY uk_tc_servicios_codigo (codigo)
);

/* ======= TT_RECIBOS (exacto) ======= */
CREATE TABLE IF NOT EXISTS TT_RECIBOS (
  id              BIGINT AUTO_INCREMENT PRIMARY KEY,
  id_cliente      BIGINT NOT NULL,
  fecha           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  id_estado       TINYINT NOT NULL DEFAULT 2,
  numero          INT NOT NULL,
  subtotal        DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  estado          VARCHAR(20)   NOT NULL DEFAULT 'EMITIDO',
  descuento_total DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  impuesto_total  DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  total           DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  notas           VARCHAR(500) NULL,
  INDEX idx_rec_numero (numero),
  INDEX idx_rec_cliente (id_cliente)
);

/* ======= TT_RECIBO_SERVICIOS ======= */
CREATE TABLE IF NOT EXISTS TT_RECIBO_SERVICIOS (
  id               BIGINT AUTO_INCREMENT PRIMARY KEY,
  recibo_id        BIGINT NOT NULL,
  servicio_id      BIGINT NOT NULL,
  linea            INT NOT NULL,
  descripcion      VARCHAR(250) NOT NULL,
  cantidad         DECIMAL(14,3) NOT NULL DEFAULT 1.000,
  precio_unitario  DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  descuento_pct    DECIMAL(5,2)  NOT NULL DEFAULT 0.00,
  impuesto_pct     DECIMAL(5,2)  NOT NULL DEFAULT 0.00,
  total_linea      DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_recibo (recibo_id),
  KEY idx_servicio (servicio_id),
  KEY idx_recibo_linea (recibo_id, linea),
  CONSTRAINT fk_rec_ser_recibo   FOREIGN KEY (recibo_id)   REFERENCES TT_RECIBOS(id)    ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT fk_rec_ser_servicio FOREIGN KEY (servicio_id) REFERENCES TC_SERVICIOS(id)  ON DELETE RESTRICT ON UPDATE RESTRICT
);

/* ======= Vistas ======= */
CREATE OR REPLACE VIEW V_RECIBO_SERVICIOS AS
SELECT
  s.id,
  s.recibo_id,
  'SERVICIO' AS tipo_item,
  s.servicio_id,
  NULL       AS producto_id,
  s.descripcion,
  s.cantidad,
  s.precio_unitario,
  s.descuento_pct,
  s.impuesto_pct,
  s.total_linea
FROM TT_RECIBO_SERVICIOS s;

-- Si no usas productos aún dejamos una vista vacía compatible
CREATE OR REPLACE VIEW V_RECIBO_PRODUCTOS AS
SELECT
  NULL AS id,
  NULL AS recibo_id,
  'PRODUCTO' AS tipo_item,
  NULL AS servicio_id,
  NULL AS producto_id,
  NULL AS descripcion,
  0.000 AS cantidad,
  0.00  AS precio_unitario,
  0.00  AS descuento_pct,
  0.00  AS impuesto_pct,
  0.00  AS total_linea
WHERE 1=0;
