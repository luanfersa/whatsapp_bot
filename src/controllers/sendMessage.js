const https = require("https");

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

    req.on("error", (error) => { console.error("Error enviando mensaje:", error); });
    req.write(data);
    req.end();
}

module.exports = { sendMessageWhatsApp };