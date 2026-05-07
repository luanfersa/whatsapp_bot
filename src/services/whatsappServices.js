
const https = require("https");
const axios = require("axios");

// URL ORDS APEX
const APEX_URL = "https://g7291f4e4aa4c82-agentech.adb.sa-saopaulo-1.oraclecloudapps.com/ords/agentech/chatbot/mensaje/";

// ==========================================
// GUARDAR MENSAJE EN ORACLE APEX
// ==========================================
async function saveMessageOracle(number, message) {

    try {

        const response = await axios.post(
            APEX_URL,
            {
                telefono: number,
                mensaje: message
            },
            {
                headers: {
                    "Content-Type": "application/json"
                }
            }
        );

        console.log("✅ Guardado Oracle:", response.data);

    } catch (error) {

        console.error(
            "❌ Error Oracle:",
            error.response?.data || error.message
        );
    }
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
            "Authorization":
                "Bearer EAALN0A9Lo18BRWYuCMisZCc77o0Uw7lueMuXvY30PUQKbKec2aTF7zdUHsZA1fx7Q0bZC6m8ieSXAp6ZBrVvZAZCiBZB7JuEZC67CMqz2jiNAzqaIZAJQvC3vhHZAZC5w3FQZCWlQt9S7yl9aBwXZCc5e8hfYFvEDli9KpthUAITL8k8ErZAiuab65V8pI8DL5OCuECD8wR33AJ1sFwMi3J4krayDs2S6deGvfzVE0FxPzeUZCao2vRR9BdPRXHWoByaYZBLdZBRH5O0QWPbUZCh9eyBrOtZCRxxoCRa4wYcxUmxQZDZD"
        }
    };

    const req = https.request(options, (res) => {

        let responseData = "";

        res.on("data", (chunk) => {
            responseData += chunk;
        });

        res.on("end", () => {
            console.log("Respuesta Meta:", responseData);
        });
    });

    req.on("error", (error) => {
        console.error("Error enviando mensaje:", error);
    });

    req.write(data);
    req.end();
}

module.exports = {
    sendMessageWhatsApp,
    saveMessageOracle
};