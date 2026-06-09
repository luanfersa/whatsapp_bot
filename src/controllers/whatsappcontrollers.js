const fs = require("fs");

const myConsole = new console.Console(
    fs.createWriteStream("./log.txt")
);

const processMessage = require("../shared/procesmesage").processMessage;

const VERIFY_TOKEN = "TOHO2013419598LUANFERSA";

// ============================================================
// VERIFICACION DEL WEBHOOK (GET)
// ============================================================
const verifyToken = (req, res) => {
    const mode      = req.query["hub.mode"];
    const token     = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    if (mode === "subscribe" && token === VERIFY_TOKEN) {
        return res.status(200).send(challenge);
    }
    return res.sendStatus(403);
};

// ============================================================
// RECEPCION DE MENSAJES (POST)
// ============================================================
const receiveMessage = async (req, res) => {
    try {
        const message = req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

        if (!message) return res.send("EVENT_RECEIVED");

        const number = message.from;

        let textUser = "";
        let optionId = null;

        // -- Texto plano --
        if (message.type === "text") {
            textUser = message.text?.body || "";
        }

        // -- Botones / listas interactivas --
        if (message.type === "interactive") {
            const interactive = message.interactive;

            if (interactive?.type === "list_reply") {
                optionId = interactive.list_reply?.id    || "";
                textUser = interactive.list_reply?.title || "";
            }

            if (interactive?.type === "button_reply") {
                optionId = interactive.button_reply?.id    || "";
                textUser = interactive.button_reply?.title || "";
            }
        }

        // -- Multimedia: imagen, audio, video, documento, sticker --
        // Para estos tipos pasamos el message completo y processMessage
        // lo detecta en handleMediaMessage()
        const tiposMedia = ["image", "audio", "video", "document", "sticker"];
        if (tiposMedia.includes(message.type)) {
            console.log(`?? Multimedia entrante tipo: ${message.type} de ${number}`);
            myConsole.log(`?? Multimedia entrante tipo: ${message.type} de ${number}`);
            // processMessage recibe messageObj y maneja el guardado internamente
            await processMessage("", number, null, message);
            return res.send("EVENT_RECEIVED");
        }

        console.log("TEXT:", textUser);
        console.log("OPTION:", optionId);
        myConsole.log("TEXT:", textUser);
        myConsole.log("OPTION:", optionId);

        // processMessage ya guarda el mensaje en Oracle internamente
        // NO llamar a guardarEnOracle por separado para evitar duplicados
        await processMessage(textUser, number, optionId, message);

        return res.send("EVENT_RECEIVED");

    } catch (error) {
        console.log(error);
        myConsole.log(error);
        return res.sendStatus(200);
    }
};

module.exports = {
    verifyToken,
    receiveMessage
};