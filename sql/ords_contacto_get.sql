-- ORDS GET /ords/agentech/chatbot/contacto/:telefono
-- URI template sugerido: contacto/:telefono
-- Parametro:
--   TELEFONO | Bind: telefono | Source: URI | Access: IN

DECLARE
  l_telefono       VARCHAR2(30) := :telefono;
  l_ruc            VARCHAR2(50);
  l_nombre_empresa VARCHAR2(500);
BEGIN
  SELECT ruc, nombre_empresa
    INTO l_ruc, l_nombre_empresa
    FROM t_whatsapp_contactos
   WHERE telefono   = l_telefono
     AND verificado = 'S'
     AND ROWNUM     = 1;

  UPDATE t_whatsapp_contactos
     SET fecha_ult_contacto = SYSDATE
   WHERE telefono = l_telefono;

  COMMIT;

  apex_json.open_object;
  apex_json.write('encontrado', true);
  apex_json.write('telefono', l_telefono);
  apex_json.write('ruc', l_ruc);
  apex_json.write('nombre_empresa', l_nombre_empresa);
  apex_json.close_object;

EXCEPTION
  WHEN NO_DATA_FOUND THEN
    apex_json.open_object;
    apex_json.write('encontrado', false);
    apex_json.close_object;
  WHEN OTHERS THEN
    ROLLBACK;
    apex_json.open_object;
    apex_json.write('encontrado', false);
    apex_json.write('error', SQLERRM);
    apex_json.close_object;
END;
/

