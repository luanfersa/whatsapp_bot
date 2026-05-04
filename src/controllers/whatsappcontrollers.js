const fs = require("fs");

const myConsole = new console.Console(
  fs.createWriteStream("./log.txt")
);

const processMessage = require("../shared/procesmesage").processMessage;

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
    const message = req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

    if (!message) return res.send("EVENT_RECEIVED");

    const number = message.from;

    let textUser = "";
    let optionId = null;

    if (message.type === "text") {
      textUser = message.text?.body || "";
    }

    if (message.type === "interactive") {
      const interactive = message.interactive;

      if (interactive?.type === "list_reply") {
        optionId = interactive.list_reply?.id || "";
      }

      if (interactive?.type === "button_reply") {
        optionId = interactive.button_reply?.id || "";
      }
    }

    console.log("TEXT:", textUser);
    console.log("OPTION:", optionId);

    processMessage(textUser, number, optionId);

    return res.send("EVENT_RECEIVED");

  } catch (error) {
    console.log(error);
    return res.sendStatus(200);
  }
};

module.exports = {
  verifyToken,
  receiveMessage
};