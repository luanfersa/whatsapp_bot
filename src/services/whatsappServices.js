const https = require("https");
const axios = require("axios");

// URL ORDS APEX
const APEX_URL = "https://g7291f4e4aa4c82-agentech.adb.sa-saopaulo-1.oraclecloudapps.com/ords/agentech/chatbot/mensaje/";
const CLIENTE_RUC_URL = process.env.CLIENTE_RUC_URL || "https://g7291f4e4aa4c82-agentech.adb.sa-saopaulo-1.oraclecloudapps.com/ords/agentech/chatbot/cliente/";
const DEUDA_RUC_URL = process.env.DEUDA_RUC_URL || "https://g7291f4e4aa4c82-agentech.adb.sa-saopaulo-1.oraclecloudapps.com/ords/agentech/chatbot/deuda";

// ==========================================
// GUARDAR MENSAJE EN ORACLE APEX
// ==========================================
async function saveMessageOracle(number, message, esRespuestaBot = false) {
    try {
        const response = await axios.post(
            APEX_URL,
            {
                telefono: number,
                mensaje: message,
                intencion: esRespuestaBot ? "RESPUESTA_BOT" : "MENSAJE_CLIENTE"
            },
            {
                headers: {
                    "Content-Type": "application/json"
                },
                timeout: 5000
            }
        );

        console.log(`✅ ${esRespuestaBot ? 'Respuesta Bot' : 'Mensaje Cliente'} guardado:`, response.data);

    } catch (error) {
        console.error(
            "❌ Error Oracle:",
            error.response?.data || error.message
        );
    }
}

// ==========================================
// BUSCAR CLIENTE POR RUC EN ORACLE APEX
// ==========================================
async function buscarClientePorRuc(ruc) {
    try {
        const response = await axios.get(
            CLIENTE_RUC_URL + encodeURIComponent(ruc),
            {
                headers: {
                    "Accept": "application/json"
                },
                timeout: 5000
            }
        );

        const data = response.data || {};
        const cliente = Array.isArray(data.items) ? data.items[0] : data;

        if (!cliente || cliente.existe === false || cliente.encontrado === false) {
            return null;
        }

        const nombre = cliente.nombre || cliente.desc_empresa || cliente.DESC_EMPRESA || cliente.razon_social || cliente.razonSocial;

        if (!nombre) {
            return null;
        }

        return {
            ruc: cliente.ruc || ruc,
            nombre: nombre
        };
    } catch (error) {
        console.error(
            "âŒ Error buscando cliente por RUC:",
            error.response?.data || error.message
        );

        throw error;
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
                params: {
                    RUC: ruc
                },
                headers: {
                    "Accept": "application/json"
                },
                timeout: 5000
            }
        );

        const data = response.data || {};
        const deuda = Array.isArray(data.items) ? data.items[0] : data;

        return {
            ruc: deuda.ruc || ruc,
            cliente: deuda.cliente || null,
            tieneDeuda: deuda.tiene_deuda === "S" || deuda.tiene_deuda === true,
            cantidadPendientes: Number(deuda.cantidad_pendientes || 0),
            totalDeuda: Number(deuda.total_deuda || 0),
            moneda: deuda.moneda || "PYG"
        };
    } catch (error) {
        console.error(
            "Error consultando deuda por RUC:",
            error.response?.data || error.message
        );

        throw error;
    }
}

// ==========================================
// GUARDAR RESPUESTA DEL BOT (método específico)
// ==========================================
async function saveBotResponse(number, message) {
    return saveMessageOracle(number, message, true);
}

// ==========================================
// ENVIAR Y GUARDAR MENSAJE (combinado)
// ==========================================
async function sendAndSaveMessage(number, message) {
    // 1. Guardar en Oracle
    await saveBotResponse(number, message);
    
    // 2. Enviar por WhatsApp
    const data = {
        messaging_product: "whatsapp",
        to: number,
        type: "text",
        text: { body: message }
    };
    
    sendMessageWhatsApp(JSON.stringify(data));
    console.log(`📤 Bot respondió a ${number}: ${message}`);
}

// ==========================================
// ENVIAR MENSAJE A WHATSAPP
// ==========================================
function sendMessageWhatsApp(data) {
    const options = {
        host: "graph.facebook.com",
         path: "/v25.0/1166278486566526/messages",
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer EAALN0A9Lo18BRmZCW3kBS5yxpIKflThzUwiOkFiIXX8UPac38Ei5oMxawVPDwjFqcIy5uqGFweJAuTvM9lgKVjB0fZBf4ZBuBL31yAKDJARAxVZAjUiMqMRHZCN8LAXWe452r8lArtl0BikwlGV6XDrbSn3TJOnZBKqxFUTOtVFRZBcYw3w9GyJBKaSpZBvN1wZDZD"
        }
    };

    const req = https.request(options, (res) => {
        let responseData = "";
        res.on("data", (chunk) => { responseData += chunk; });
        res.on("end", () => { console.log("Respuesta Meta:", responseData); });
    });

    req.on("error", (error) => { console.error("Error enviando:", error); });
    req.write(data);
    req.end();
}

module.exports = {
    sendMessageWhatsApp,
    saveMessageOracle,
    saveBotResponse,
    sendAndSaveMessage,
    buscarClientePorRuc,
    consultarDeudaPorRuc
};
