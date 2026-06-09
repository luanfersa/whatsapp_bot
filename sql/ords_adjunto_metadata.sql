-- Endpoint ORDS POST /chatbot/adjunto/
-- Version para guardar metadata del archivo servido por Node.js, sin BLOB/base64.
--
-- Requisitos de tabla, si aun no existen:
-- ALTER TABLE t_whatsapp_adjuntos ADD (
--     media_url    VARCHAR2(2000),
--     media_tipo   VARCHAR2(50),
--     ruta_archivo VARCHAR2(2000)
-- );
--
-- Si la columna CONTENIDO es NOT NULL, debe permitirse NULL o usarse un endpoint/tabla
-- de metadata separada, porque este flujo ya no guarda el archivo como BLOB.

DECLARE
  l_telefono     VARCHAR2(30)   := :telefono;
  l_nombre       VARCHAR2(500)  := :nombre_archivo;
  l_mime         VARCHAR2(200)  := :tipo_mime;
  l_tamano       NUMBER         := :tamano;
  l_media_url    VARCHAR2(2000) := :media_url;
  l_media_tipo   VARCHAR2(50)   := :media_tipo;
  l_ruta_archivo VARCHAR2(2000) := :ruta_archivo;
  l_next_id      NUMBER;
  l_empresa      NUMBER         := 1;
  l_prop         VARCHAR2(200)  := 'AGENTECH';
  l_conv_id      NUMBER;
BEGIN
  SELECT id_conversacion, id_empresa
    INTO l_conv_id, l_empresa
    FROM t_whatsapp_conversaciones
   WHERE telefono       = l_telefono
     AND id_propietario = l_prop
     AND estado         = 'ACTIVA'
     AND ROWNUM         = 1;

  SELECT NVL(MAX(id_adjunto), 0) + 1
    INTO l_next_id
    FROM t_whatsapp_adjuntos;

  INSERT INTO t_whatsapp_adjuntos (
    id_adjunto, id_empresa, id_conversacion,
    nombre_archivo, tipo_mime, tamano,
    media_url, media_tipo, ruta_archivo,
    usuario_alta, fecha_alta
  ) VALUES (
    l_next_id, l_empresa, l_conv_id,
    l_nombre, l_mime, l_tamano,
    l_media_url, l_media_tipo, l_ruta_archivo,
    'WHATSAPP_BOT', SYSDATE
  );

  COMMIT;

  apex_json.open_object;
  apex_json.write('status', 'ok');
  apex_json.write('id_adjunto', l_next_id);
  apex_json.close_object;

EXCEPTION
  WHEN OTHERS THEN
    ROLLBACK;
    apex_json.open_object;
    apex_json.write('status', 'error');
    apex_json.write('msg', SQLERRM);
    apex_json.close_object;
END;
/
