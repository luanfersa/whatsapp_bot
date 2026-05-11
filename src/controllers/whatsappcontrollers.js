const fs = require("fs");
const axios = require("axios"); // Añade esta línea al inicio

const myConsole = new console.Console(
  fs.createWriteStream("./log.txt")
);

const processMessage = require("../shared/procesmesage").processMessage;

const VERIFY_TOKEN = "TOHO2013419598LUANFERSA";

// ============================================================
// CONFIGURACION DE ORACLE APEX
// ============================================================
const APEX_URL = 'https://c7291f4e4aa4c82-agentech.adb.sa-saopaulo-1oraclecloudapps.com/ords/agentech/chatbot/mensaje/';

// ============================================================
// FUNCION PARA GUARDAR EN ORACLE APEX
// ============================================================
const guardarEnOracle = async (telefono, mensaje, optionId) => {
    try {
        // Si es un botón, usar el texto del optionId como mensaje
        let textoGuardar = mensaje;
        if (optionId && !textoGuardar) {
            textoGuardar = `Boton: ${optionId}`;
        }
        
        const response = await axios.post(APEX_URL, {
            telefono: telefono,
            mensaje: textoGuardar,
            intencion: optionId || "PENDIENTE"
        }, {
            headers: { "Content-Type": "application/json" }
        });
        
        console.log("✅ Guardado en Oracle:", response.data);
        myConsole.log("✅ Guardado en Oracle:", JSON.stringify(response.data));
        
    } catch (error) {
        console.error("❌ Error guardando en Oracle:", error.response?.data || error.message);
        myConsole.log("❌ Error guardando en Oracle:", error.response?.data || error.message);
    }
};

// ============================================================
// VERIFICACION DEL WEBHOOK (GET)
// ============================================================
const verifyToken = (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }

  return res.sendStatus(403);
};

// ============================================================
// RECEPCION DE MENSAJES (POST)
// ============================================================
const receiveMessage = (req, res) => {
  try {
    const message = req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

    if (!message) return res.send("EVENT_RECEIVED");

    const number = message.from;

    let textUser = "";
    let optionId = null;

    // Extraer texto o botón según el tipo de mensaje
    if (message.type === "text") {
      textUser = message.text?.body || "";
    }

    if (message.type === "interactive") {
      const interactive = message.interactive;

      if (interactive?.type === "list_reply") {
        optionId = interactive.list_reply?.id || "";
        textUser = interactive.list_reply?.title || ""; // Guardar texto del botón
      }

      if (interactive?.type === "button_reply") {
        optionId = interactive.button_reply?.id || "";
        textUser = interactive.button_reply?.title || ""; // Guardar texto del botón
      }
    }

    console.log("TEXT:", textUser);
    console.log("OPTION:", optionId);
    myConsole.log("TEXT:", textUser);
    myConsole.log("OPTION:", optionId);

    // ========================================================
    // GUARDAR EN ORACLE APEX (NUEVO)
    // ========================================================
    guardarEnOracle(number, textUser, optionId);

    // ========================================================
    // PROCESAR MENSAJE PARA RESPUESTA DEL BOT
    // ========================================================
    processMessage(textUser, number, optionId);

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