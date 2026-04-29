const fs = require("fs");

// guardar log en archivo local
const myConsole = new console.Console(fs.createWriteStream("./log.txt"));

const VERIFY_TOKEN = "TOHO2013419598LUANFERSA";

// 🔹 Verificación webhook
const verifyToken = (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }

  return res.sendStatus(403);
};

// 🔹 Recibir mensajes
const receiveMessage = (req, res) => {
  try {
    const entry = req.body.entry[0];
    const changes = entry.changes[0];
    const value = changes.value;
    const messages = value.messages;

    // log del mensaje recibido
    myConsole.log(JSON.stringify(messages));

    console.log("Mensaje recibido:", messages);

    return res.send("EVENT_RECEIVED");
  } catch (error) {
    console.log("Error:", error);
    return res.send("EVENT_RECEIVED");
  }
};

module.exports = {
  verifyToken,
  receiveMessage,
};
