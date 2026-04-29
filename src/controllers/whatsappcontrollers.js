const fs = require("fs");

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

// 🔹 Guardar log
const logToFile = (data) => {
  fs.appendFileSync("log.txt", data + "\n");
};

// 🔹 Recibir mensajes
const receiveMessage = (req, res) => {
  try {
    // 🔥 log completo (IMPORTANTE)
    logToFile(JSON.stringify(req.body));

    const value = req.body.entry?.[0]?.changes?.[0]?.value;

    if (value?.messages) {
      console.log("📩 Mensaje:", value.messages);

      logToFile("MENSAJE: " + JSON.stringify(value.messages));
    }

    return res.send("EVENT_RECEIVED");

  } catch (error) {
    console.log("Error:", error);
    logToFile("ERROR: " + error.message);
    return res.send("EVENT_RECEIVED");
  }
};

module.exports = {
  verifyToken,
  receiveMessage,
};