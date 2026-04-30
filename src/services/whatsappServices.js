const https = require("https");

function sendMessageWhatsApp(data) {

    const options = {
        host: "graph.facebook.com",
        path: "/v25.0/105196529329228/messages",
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer EAALN0A9Lo18BRYIG8T39oqrAtsZB5Y4eNg6NgcZAmwcjiGuXngIBGXkvXDVldThH5Q6ppZCoSgFa7bUZA740mzelAEfanGNmdi665VJjxfmoFOtpudaGFf3IyiCer7bs2jZAOSLtupinh9aIgqy7r8yqJS1vzdjyhhpRI7l7giECiR6odTHJmt5pNXVc7hjgC7CmOZAFc2g5ZAsteNOy5jtbPP0MWJZBJSfZA7ZCsJZAgiRODgZCGJBgZBMXN0hSbIIZAXDSdIsjD01JilcZC54mpLOhcW0gaInff62LcCqiwZDZD"
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