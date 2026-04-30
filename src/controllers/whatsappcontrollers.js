const fs = require("fs");

const myConsole = new console.Console(
  fs.createWriteStream("./log.txt")
);

const whatsappServices = require("../services/whatsappServices");
const samples = require("../shared/sampleModels");

const VERIFY_TOKEN = "TOHO2013419598LUANFERSA";

const verifyToken = (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }

  return res.sendStatus(403);
};

const receiveMessage = (req, res) => {
  try {
    const entry = req.body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;

    const messages = value?.messages;

    if (!messages || messages.length === 0) {
      return res.send("EVENT_RECEIVED");
    }

    const message = messages[messages.length - 1];

    const text = getTextUser(message);
    const number = message.from;

    console.log("Mensaje:", text);

    switch (text) {
      case "texto":
      case "hola": {
        const data = samples.SampleText("Hola bot 🤖", number);
        whatsappServices.sendMessageWhatsApp(data);
        break;
      }

      case "imagen": {
        const data = samples.SampleImage(number);
        whatsappServices.sendMessageWhatsApp(data);
        break;
      }

      case "audio": {
        const data = samples.SampleAudio(number);
        whatsappServices.sendMessageWhatsApp(data);
        break;
      }

      case "boton": {
        const data = samples.SampleBoton(number);
        whatsappServices.sendMessageWhatsApp(data);
        break;
      }

      case "lista": {
        const data = samples.SampleLista(number);
        whatsappServices.sendMessageWhatsApp(data);
        break;
      }

      case "location":
      case "ubicacion": {
        const data = samples.Samplelocation(number);
        whatsappServices.sendMessageWhatsApp(data);
        break;
      }

      default: {
        const data = samples.SampleText(
          "Comandos: texto, imagen, audio, boton, lista, location",
          number
        );
        whatsappServices.sendMessageWhatsApp(data);
        break;
      }
    }

    return res.send("EVENT_RECEIVED");

  } catch (error) {
    console.log(error);
    return res.sendStatus(200);
  }
};

function getTextUser(message) {
  if (!message) return "";

  const type = message.type;

  if (type === "text") {
    return message.text?.body || "";
  }

  if (type === "interactive") {
    const interactive = message.interactive;

    if (interactive?.type === "button_reply") {
      return interactive.button_reply?.title || "";
    }

    if (interactive?.type === "list_reply") {
      return interactive.list_reply?.title || "";
    }
  }

  return "";
}

module.exports = {
  verifyToken,
  receiveMessage
};