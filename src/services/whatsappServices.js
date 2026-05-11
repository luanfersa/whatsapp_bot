const https = require("https");
const axios = require("axios");

// URL ORDS APEX
const APEX_URL = "https://g7291f4e4aa4c82-agentech.adb.sa-saopaulo-1.oraclecloudapps.com/ords/agentech/chatbot/mensaje/";

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
        path: "/v25.0/105196529329228/messages",
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer EAALN0A9Lo18BRanZAwwZAdDDira092FxvCxg6d5dbjfaOt9ZBpMaXTYwLcUliGNmpRqfY1ZBy5vNf5JgZCzCzqwqInoHkA8ZCEXvcBZAV22h0AtbCVER8UumOnVzzmGmORzocEg4yKKqoXKSlmNoqljtrxY4UC2ZAUvLJteVncVf6yQggqvv73lSEgeYXlCiJcGGTAuZC6jSlOnfUhX5CJTupb42Tn2DPdmSVs3GuMq7H8UZBWgT2qcQsF3rLZBoIJyS1FsG52vac5ZAQhOcvvcZAmBtnFLOUdKqtrRsLPAZDZD"
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
    sendAndSaveMessage
};