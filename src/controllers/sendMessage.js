const https = require("https");

function sendMessageWhatsApp(data) {
    const options = {
        host: "graph.facebook.com",
        path: "/v25.0/105196529329228/messages",
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer EAALN0A9Lo18BRSslFZAXTsaZCd7PmUoEf5c84CeZCpqQtqXzkhZCc9uZCjiaxMxOCJfjCLDYliCVFKjcfMWAvdMtyAN0mfZCLXqJkq097AEF8bQf4trrarOBYKWAmnQptdK6pqyXN7wPMXwwsnVBkpOV7lQuQNAZBxBAGuMJGxuYP5kb8ZAiSnZCvoRi5ix0WbwZDZD"
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