const https = require("https");

function sendMessageWhatsApp(data) {

    const options = {
        host: "graph.facebook.com",
        path: "/v25.0/105196529329228/messages",
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer EAALN0A9Lo18BRe5YrHHT0l04wkrEoZB1ExFuyis3zbYbGZALdjmMSWyHwLQdtwmAqymZCYXNZBhOqJ66ufiUjfod3Jzxe27VkYuHTAgrKNeu7rlZC2DbAs9TIRm624m8rwUdvXP6K8yWqwoiF3uamwtauoJ9ZBArRZCVRLsCOa3VhykJE99p0ZA4w6QsgJ7tXDEcZC8dlbiUiLTcq6SShlPHhZAXaZAQVQUGehlmhGZCnRNP2WZByjBzexI3HJwd7rL6hJPUKOLVXqlgOMzqacfNq79qS1jB2nsOKPmZCCZBwZDZD"
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
    sendMessageWhatsApp
};