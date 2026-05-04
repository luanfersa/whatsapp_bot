const https = require("https");

function sendMessageWhatsApp(data) {

    const options = {
        host: "graph.facebook.com",
        path: "/v25.0/105196529329228/messages",
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer EAALN0A9Lo18BRbpJU9oizcOr5i7ICMeYjeRwp30o13KUEScafp3vMkzQl1KvTMcza40JUkeP8O6mBTXX4EsbI2y6IX4wXoJm0OGO64NWqJoaSfD9Sy3RMak7bE7mu3BWlMIK3O826fAVmbDBy4vTIgjeSZBrFci1tLtISNvFUPsvTrCWUqrZCZCVMzclLvkb0rQzPWbzFFlGe3w8Gm6SLPFjj6FLUhKQWs2kvFZA5RDnnArhrB9bhXHOdQW7SjxxUqZAXBw4CZAbQMVSS0rEQe7MwRxZCqVrXuJfnsZD"
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