const https = require("https");

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

    req.on("error", (error) => { console.error("Error enviando mensaje:", error); });
    req.write(data);
    req.end();
}

module.exports = { sendMessageWhatsApp };