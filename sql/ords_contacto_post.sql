-- ORDS POST /ords/agentech/chatbot/contacto/
-- Parametros HTTP BODY:
--   TELEFONO       | Bind: telefono
--   RUC            | Bind: ruc
--   NOMBRE_EMPRESA | Bind: nombre_empresa

DECLARE
  l_telefono       VARCHAR2(30)  := :telefono;
  l_ruc            VARCHAR2(50)  := :ruc;
  l_nombre_empresa VARCHAR2(500) := :nombre_empresa;
BEGIN
  MERGE INTO t_whatsapp_contactos c
  USING (
    SELECT l_telefono AS telefono,
           l_ruc AS ruc,
           l_nombre_empresa AS nombre_empresa
      FROM dual
  ) src
  ON (c.telefono = src.telefono)
  WHEN MATCHED THEN UPDATE SET
    c.ruc                = src.ruc,
    c.nombre_empresa     = src.nombre_empresa,
    c.verificado         = 'S',
    c.fecha_ult_contacto = SYSDATE,
    c.usuario_mod        = 'WHATSAPP_BOT',
    c.fecha_mod          = SYSDATE
  WHEN NOT MATCHED THEN INSERT (
    telefono, ruc, nombre_empresa,
    verificado, fecha_alta, fecha_ult_contacto, usuario_alta
  ) VALUES (
    src.telefono, src.ruc, src.nombre_empresa,
    'S', SYSDATE, SYSDATE, 'WHATSAPP_BOT'
  );

  COMMIT;

  apex_json.open_object;
  apex_json.write('success', true);
  apex_json.write('telefono', l_telefono);
  apex_json.write('ruc', l_ruc);
  apex_json.write('nombre_empresa', l_nombre_empresa);
  apex_json.close_object;

EXCEPTION
  WHEN OTHERS THEN
    ROLLBACK;
    apex_json.open_object;
    apex_json.write('success', false);
    apex_json.write('error', SQLERRM);
    apex_json.close_object;
END;
/
