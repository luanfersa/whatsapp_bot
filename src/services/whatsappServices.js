const https = require("https");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const axios = require("axios");
const { MEDIA_DIR, getMediaBaseUrl } = require("../shared/mediaConfig");

// URLs ORDS APEX
const APEX_URL        = "https://g7291f4e4aa4c82-agentech.adb.sa-saopaulo-1.oraclecloudapps.com/ords/agentech/chatbot/mensaje/";
const CLIENTE_RUC_URL = process.env.CLIENTE_RUC_URL || "https://g7291f4e4aa4c82-agentech.adb.sa-saopaulo-1.oraclecloudapps.com/ords/agentech/chatbot/cliente/";
const CLIENTE_CI_URL  = process.env.CLIENTE_CI_URL  || "https://g7291f4e4aa4c82-agentech.adb.sa-saopaulo-1.oraclecloudapps.com/ords/agentech/chatbot/ci_clientes/";
const DEUDA_RUC_URL   = process.env.DEUDA_RUC_URL   || "https://g7291f4e4aa4c82-agentech.adb.sa-saopaulo-1.oraclecloudapps.com/ords/agentech/chatbot/deuda";
const ASIGNAR_URL     = "https://g7291f4e4aa4c82-agentech.adb.sa-saopaulo-1.oraclecloudapps.com/ords/agentech/chatbot/asignar/";
const ADJUNTO_URL     = "https://g7291f4e4aa4c82-agentech.adb.sa-saopaulo-1.oraclecloudapps.com/ords/agentech/chatbot/adjunto/";
const CONTACTO_URL    = process.env.CONTACTO_URL || "https://g7291f4e4aa4c82-agentech.adb.sa-saopaulo-1.oraclecloudapps.com/ords/agentech/chatbot/contacto";

// Token Meta
const META_TOKEN = "EAALN0A9Lo18BRmZCW3kBS5yxpIKflThzUwiOkFiIXX8UPac38Ei5oMxawVPDwjFqcIy5uqGFweJAuTvM9lgKVjB0fZBf4ZBuBL31yAKDJARAxVZAjUiMqMRHZCN8LAXWe452r8lArtl0BikwlGV6XDrbSn3TJOnZBKqxFUTOtVFRZBcYw3w9GyJBKaSpZBvN1wZDZD";

// ==========================================
// OBTENER URL PUBLICA DE MEDIA (Meta API)
// ==========================================
async function getMediaUrl(mediaId) {
    try {
        const response = await axios.get(
            "https://graph.facebook.com/v25.0/" + mediaId,
            {
                headers: { "Authorization": "Bearer " + META_TOKEN },
                timeout: 8000
            }
        );
        return response.data.url || null;
    } catch (error) {
        console.error("Error obteniendo media URL:", error.response && error.response.data || error.message);
        return null;
    }
}

// ==========================================
// DESCARGAR ARCHIVO DE META Y GUARDAR
// EN DISCO, REGISTRANDO METADATA EN ORACLE
// ==========================================
async function saveMediaAsAdjunto(number, mediaId, mediaTipo, nombreArchivo) {
    try {
        // 1. Obtener URL temporal de Meta
        const metaMediaUrl = await getMediaUrl(mediaId);
        if (!metaMediaUrl) {
            console.error("No se pudo obtener URL de media para:", mediaId);
            return false;
        }

        // 2. Descargar el archivo binario desde Meta
        const fileResponse = await axios.get(metaMediaUrl, {
            headers: { "Authorization": "Bearer " + META_TOKEN },
            responseType: "arraybuffer",
            timeout: 30000
        });

        const fileBuffer = Buffer.from(fileResponse.data);

        // 3. Determinar nombre, tipo MIME y ruta local
        const tipoMime = fileResponse.headers["content-type"] || _getMimeType(mediaTipo);
        const nombre   = _getNombreArchivo(number, mediaTipo, tipoMime, nombreArchivo);
        const filePath = path.join(MEDIA_DIR, nombre);
        const mediaUrl = getMediaBaseUrl() + "/" + encodeURIComponent(nombre);

        fs.mkdirSync(MEDIA_DIR, { recursive: true });
        fs.writeFileSync(filePath, fileBuffer);

        const metadata = {
            telefono:       number,
            nombre_archivo: nombre,
            tipo_mime:      tipoMime,
            tamano:         fileBuffer.length,
            media_url:      mediaUrl,
            media_tipo:     mediaTipo,
            ruta_archivo:   filePath
        };

        // 4. Registrar metadata en Oracle, sin enviar el binario/base64
        try {
            const uploadResponse = await axios.post(
                ADJUNTO_URL,
                metadata,
                {
                    headers: { "Content-Type": "application/json" },
                    timeout: 10000
                }
            );

            console.log("Metadata de adjunto registrada para " + number + ":", uploadResponse.data);
        } catch (error) {
            console.error("Archivo guardado, pero fallo metadata Oracle:", error.response && error.response.data || error.message);
        }

        console.log("Adjunto guardado en servidor para " + number + ":", filePath);
        return metadata;

    } catch (error) {
        console.error("Error guardando adjunto:", error.response && error.response.data || error.message);
        return false;
    }
}

function _getMimeType(mediaTipo) {
    var tipos = {
        "image":    "image/jpeg",
        "audio":    "audio/ogg",
        "video":    "video/mp4",
        "document": "application/pdf",
        "sticker":  "image/webp"
    };
    return tipos[mediaTipo] || "application/octet-stream";
}

function _getNombreArchivo(number, mediaTipo, mimeType, nombreArchivo) {
    var now = new Date();
    var ts  = now.getFullYear() + "" + (now.getMonth()+1) + "" + now.getDate()
            + "_" + now.getHours() + "" + now.getMinutes() + "" + now.getSeconds();
    var ext = _getExtension(mediaTipo, mimeType, nombreArchivo);
    var telefono = String(number || "sin_numero").replace(/[^\dA-Za-z_-]/g, "");
    var random = crypto.randomBytes(4).toString("hex");

    return telefono + "_" + mediaTipo + "_" + ts + "_" + random + "." + ext;
}

function _getExtension(mediaTipo, mimeType, nombreArchivo) {
    if (nombreArchivo) {
        var originalExt = path.extname(path.basename(nombreArchivo)).replace(".", "");
        if (originalExt) return originalExt.toLowerCase();
    }

    var mime = (mimeType || "").split(";")[0].trim().toLowerCase();
    var tipos = {
        "image/jpeg":      "jpg",
        "image/png":       "png",
        "image/webp":      "webp",
        "audio/ogg":       "ogg",
        "audio/mpeg":      "mp3",
        "video/mp4":       "mp4",
        "application/pdf": "pdf"
    };

    return tipos[mime] || (mime.split("/")[1] || mediaTipo || "bin").replace(/[^a-z0-9]/g, "");
}

// ==========================================
// GUARDAR MENSAJE MULTIMEDIA ENTRANTE
// Guarda en mensajes (URL temporal) Y
// como adjunto permanente en Oracle
// ==========================================
async function saveMediaMessage(number, mediaId, mediaTipo, nombreArchivo, waMessageId) {
    try {
        const textoDescriptivo = mediaTipo === "image"    ? "[Imagen]"
                               : mediaTipo === "audio"    ? "[Audio]"
                               : mediaTipo === "video"    ? "[Video]"
                               : mediaTipo === "document" ? "[Documento]"
                               : "[Archivo]";

        // Guardar el archivo en servidor y usar su URL permanente en el mensaje.
        const metadata = await saveMediaAsAdjunto(number, mediaId, mediaTipo, nombreArchivo);
        const mediaUrl = metadata && metadata.media_url ? metadata.media_url : null;

        await saveMessageOracle(number, textoDescriptivo, false, mediaUrl, mediaTipo, waMessageId);
        console.log("Media procesada (" + mediaTipo + ") para " + number);
    } catch (error) {
        console.error("Error en saveMediaMessage:", error.message);
    }
}

// ==========================================
// GUARDAR MENSAJE EN ORACLE APEX
// waMessageId: wamid de Meta (mensaje entrante o respuesta del bot),
// se guarda en t_whatsapp_mensajes.wa_message_id para poder citarlo
// despues desde el CRM (reply real de WhatsApp).
// ==========================================
async function saveMessageOracle(number, message, esRespuestaBot, mediaUrl, mediaTipo, waMessageId) {
    esRespuestaBot = esRespuestaBot || false;
    mediaUrl       = mediaUrl       || null;
    mediaTipo      = mediaTipo      || null;
    waMessageId    = waMessageId    || null;
    try {
        const response = await axios.post(
            APEX_URL,
            {
                telefono:       number,
                mensaje:        message   || "",
                intencion:      esRespuestaBot ? "RESPUESTA_BOT" : "MENSAJE_CLIENTE",
                media_url:      mediaUrl  || "",
                media_tipo:     mediaTipo || "",
                wa_message_id:  waMessageId || ""
            },
            {
                headers: { "Content-Type": "application/json" },
                timeout: 5000
            }
        );
        console.log((esRespuestaBot ? "Respuesta Bot" : "Mensaje Cliente") + " guardado:", response.data);
    } catch (error) {
        console.error("Error Oracle:", error.response && error.response.data || error.message);
    }
}

// ==========================================
// BUSCAR CLIENTE POR DOCUMENTO EN ORACLE APEX
// ==========================================
async function buscarClientePorDocumento(documento, tipoDocumento, baseUrl) {
    try {
        const response = await axios.get(
            baseUrl + encodeURIComponent(documento),
            {
                headers: { "Accept": "application/json" },
                timeout: 5000
            }
        );

        const data    = response.data || {};
        const cliente = Array.isArray(data.items) ? data.items[0] : data;

        if (!cliente || cliente.existe === false || cliente.encontrado === false) {
            return null;
        }

        const nombre = cliente.nombre       || cliente.desc_empresa   ||
                       cliente.DESC_EMPRESA || cliente.razon_social   ||
                       cliente.razonSocial;

        if (!nombre) return null;

        return {
            ruc: cliente.ruc || cliente.RUC || documento,
            ci: cliente.ci || cliente.CI || cliente.cedula || cliente.CEDULA || null,
            documento: documento,
            tipoDocumento: tipoDocumento,
            nombre: nombre,
            idEmpresa: cliente.id_empresa || cliente.ID_EMPRESA || null,
            idPropietario: cliente.id_propietario || cliente.ID_PROPIETARIO || cliente.propietario || cliente.PROPIETARIO || "AGENTECH"
        };

    } catch (error) {
        if (error.response && error.response.status === 404) {
            return null;
        }
        console.error("Error buscando cliente por " + tipoDocumento + ":", error.response && error.response.data || error.message);
        throw error;
    }
}

async function buscarClientePorRuc(ruc) {
    return buscarClientePorDocumento(ruc, "RUC", CLIENTE_RUC_URL);
}

async function buscarClientePorCi(ci) {
    return buscarClientePorDocumento(ci, "CI", CLIENTE_CI_URL);
}

async function buscarClientePorRucOCi(documento) {
    var errorRuc = null;

    try {
        const clienteRuc = await buscarClientePorRuc(documento);
        if (clienteRuc) return clienteRuc;
    } catch (error) {
        errorRuc = error;
    }

    try {
        const clienteCi = await buscarClientePorCi(documento);
        if (clienteCi) return clienteCi;
    } catch (error) {
        if (CLIENTE_CI_URL === CLIENTE_RUC_URL && errorRuc) throw errorRuc;
        throw error;
    }

    return null;
}

// ==========================================
// BUSCAR CONTACTO YA VERIFICADO POR TELEFONO
// ==========================================
async function buscarContactoPorTelefono(telefono) {
    try {
        const response = await axios.get(
            CONTACTO_URL,
            {
                params: { telefono: telefono },
                headers: { "Accept": "application/json" },
                timeout: 5000
            }
        );

        const data = response.data || {};
        var contacto = Array.isArray(data.items) ? data.items[0] : data;

        if (!contacto || contacto.encontrado === false || contacto.existe === false) {
            return null;
        }
        if (Array.isArray(contacto.empresas) && contacto.empresas.length) {
            contacto = contacto.empresas.find(function(empresa) {
                return empresa.predeterminado === "S";
            }) || contacto.empresas[0];
        }

        const ruc = contacto.ruc || contacto.RUC;
        const nombreEmpresa = contacto.nombre_empresa || contacto.NOMBRE_EMPRESA || contacto.empresa || contacto.EMPRESA;
        const nombrePersona = contacto.nombre_persona || contacto.NOMBRE_PERSONA || contacto.nombre || contacto.NOMBRE;
        const idPropietario = contacto.id_propietario || contacto.ID_PROPIETARIO || contacto.propietario || contacto.PROPIETARIO || "AGENTECH";
        const idEmpresa = contacto.id_empresa || contacto.ID_EMPRESA || null;

        if (!ruc || !nombreEmpresa) return null;

        return {
            telefono: contacto.telefono || telefono,
            ruc: ruc,
            nombre: nombrePersona || nombreEmpresa,
            nombrePersona: nombrePersona || null,
            nombreEmpresa: nombreEmpresa,
            idPropietario: idPropietario,
            idEmpresa: idEmpresa
        };
    } catch (error) {
        console.error("Error buscando contacto por telefono:", error.response && error.response.data || error.message);
        return null;
    }
}

// ==========================================
// GUARDAR CONTACTO VERIFICADO
// ==========================================
async function guardarContactoVerificado(telefono, ruc, nombreEmpresa, nombrePersona, idPropietario, idEmpresa) {
    try {
        const response = await axios.post(
            CONTACTO_URL,
            {
                telefono: telefono,
                ruc: ruc,
                nombre_empresa: nombreEmpresa,
                nombre_persona: nombrePersona || "",
                id_propietario: idPropietario || "AGENTECH",
                id_empresa: idEmpresa || null
            },
            {
                headers: { "Content-Type": "application/json" },
                timeout: 5000
            }
        );

        console.log("Contacto verificado guardado:", response.data);
        return response.data || {};
    } catch (error) {
        console.error("Error guardando contacto verificado:", error.response && error.response.data || error.message);
        return { success: false };
    }
}

// ==========================================
// CONSULTAR DEUDA POR RUC EN ORACLE APEX
// ==========================================
async function consultarDeudaPorRuc(ruc) {
    try {
        const response = await axios.get(
            DEUDA_RUC_URL,
            {
                params:  { RUC: ruc },
                headers: { "Accept": "application/json" },
                timeout: 5000
            }
        );

        const data  = response.data || {};
        const deuda = Array.isArray(data.items) ? data.items[0] : data;

        return {
            ruc:                deuda.ruc || ruc,
            cliente:            deuda.cliente || null,
            tieneDeuda:         deuda.tiene_deuda === "S" || deuda.tiene_deuda === true,
            cantidadPendientes: Number(deuda.cantidad_pendientes || 0),
            totalDeuda:         Number(deuda.total_deuda || 0),
            moneda:             deuda.moneda || "PYG"
        };
    } catch (error) {
        console.error("Error consultando deuda:", error.response && error.response.data || error.message);
        throw error;
    }
}

// ==========================================
// GUARDAR RESPUESTA DEL BOT
// ==========================================
async function saveBotResponse(number, message) {
    return saveMessageOracle(number, message, true);
}

// ==========================================
// ENVIAR Y GUARDAR MENSAJE (combinado)
// ==========================================
async function sendAndSaveMessage(number, message) {
    await saveBotResponse(number, message);
    const data = {
        messaging_product: "whatsapp",
        to:   number,
        type: "text",
        text: { body: message }
    };
    await sendMessageWhatsApp(JSON.stringify(data));
    console.log("Bot respondio a " + number + ": " + message);
}

function normalizarTelefono(number) {
    return String(number || "").replace(/[^\d]/g, "");
}

function crearParametrosTexto(valores) {
    if (!Array.isArray(valores)) return [];
    return valores.map(function(valor) {
        return {
            type: "text",
            text: String(valor == null ? "" : valor)
        };
    });
}

function crearComponentesTemplate(variables, componentes) {
    if (Array.isArray(componentes) && componentes.length) return componentes;

    const parametros = crearParametrosTexto(variables);
    if (!parametros.length) return [];

    return [{
        type: "body",
        parameters: parametros
    }];
}

function crearPayloadTemplate(number, templateName, languageCode, variables, componentes) {
    const payload = {
        messaging_product: "whatsapp",
        to: normalizarTelefono(number),
        type: "template",
        template: {
            name: templateName,
            language: {
                code: languageCode || "es"
            }
        }
    };

    const templateComponents = crearComponentesTemplate(variables, componentes);
    if (templateComponents.length) {
        payload.template.components = templateComponents;
    }

    return payload;
}

async function sendTemplateMessage(number, templateName, languageCode, variables, componentes) {
    return sendMessageWhatsApp(JSON.stringify(
        crearPayloadTemplate(number, templateName, languageCode, variables, componentes)
    ));
}

// ==========================================
// ASIGNAR TECNICO AUTOMATICAMENTE
// ==========================================
async function asignarTecnico(telefono, tipo) {
    tipo = tipo || "TECNICO";
    try {
        const response = await axios.post(
            ASIGNAR_URL,
            { telefono: telefono, tipo: tipo },
            {
                headers: { "Content-Type": "application/json" },
                timeout: 8000
            }
        );
        console.log("Tecnico asignado para " + telefono + ":", response.data);
        return response.data || {};
    } catch (error) {
        console.error("Error asignando tecnico:", error.response && error.response.data || error.message);
        return { success: false, mensaje: "Error de asignacion" };
    }
}

// ==========================================
// ENVIAR MENSAJE A WHATSAPP
// data: string JSON del payload a mandar a Meta.
// Devuelve el string de respuesta cruda de Meta (como antes), para
// no romper a quien ya consume esta funcion esperando ese formato.
// ==========================================
function sendMessageWhatsApp(data) {
    return new Promise(function(resolve) {
        const options = {
            host:   "graph.facebook.com",
            path:   "/v25.0/1166278486566526/messages",
            method: "POST",
            headers: {
                "Content-Type":  "application/json",
                "Authorization": "Bearer " + META_TOKEN
            }
        };

        const req = https.request(options, function(res) {
            var responseData = "";
            res.on("data", function(chunk) { responseData += chunk; });
            res.on("end",  function() {
                console.log("Respuesta Meta:", responseData);
                resolve(responseData);
            });
        });

        req.on("error", function(error) {
            console.error("Error enviando:", error);
            resolve(null);
        });
        req.write(data);
        req.end();
    });
}

// ==========================================
// helper: extrae el wamid ("messages"[0].id) de la respuesta
// cruda de Meta (string JSON) devuelta por sendMessageWhatsApp.
// Devuelve null si no se pudo parsear o no vino wamid.
// ==========================================
function extraerWamidDeRespuestaMeta(respuestaCruda) {
    try {
        var parsed = JSON.parse(respuestaCruda);
        if (parsed && Array.isArray(parsed.messages) && parsed.messages[0] && parsed.messages[0].id) {
            return parsed.messages[0].id;
        }
    } catch (e) {
        // respuesta no parseable, no hay wamid
    }
    return null;
}

module.exports = {
    sendMessageWhatsApp,
    saveMessageOracle,
    saveBotResponse,
    sendAndSaveMessage,
    saveMediaMessage,
    saveMediaAsAdjunto,
    getMediaUrl,
    sendTemplateMessage,
    crearPayloadTemplate,
    buscarClientePorRuc,
    buscarClientePorCi,
    buscarClientePorRucOCi,
    buscarContactoPorTelefono,
    guardarContactoVerificado,
    consultarDeudaPorRuc,
    asignarTecnico,
    extraerWamidDeRespuestaMeta
};