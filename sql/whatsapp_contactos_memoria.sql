-- Memoria de clientes WhatsApp por telefono.
-- Objetivo: si un cliente ya verifico su RUC una vez, el bot lo reconoce
-- en proximas conversaciones sin volver a preguntarle si es cliente.

CREATE TABLE t_whatsapp_contactos (
  telefono            VARCHAR2(30) PRIMARY KEY,
  ruc                 VARCHAR2(50) NOT NULL,
  nombre_empresa      VARCHAR2(500) NOT NULL,
  verificado          VARCHAR2(1) DEFAULT 'S' NOT NULL,
  fecha_alta          DATE DEFAULT SYSDATE NOT NULL,
  fecha_ult_contacto  DATE,
  usuario_alta        VARCHAR2(100) DEFAULT 'WHATSAPP_BOT',
  usuario_mod         VARCHAR2(100),
  fecha_mod           DATE
);

CREATE INDEX ix_whatsapp_contactos_ruc
  ON t_whatsapp_contactos (ruc);

