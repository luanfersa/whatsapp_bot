const express = require("express");
const fs = require("fs");
const {
    verifyToken,
    receiveMessage,
} = require("./controllers/whatsappcontrollers");
const { sendMessageWhatsApp } = require("./controllers/sendMessage");
const { reiniciarConversacion } = require("./shared/procesmesage");
const { MEDIA_DIR } = require("./shared/mediaConfig");

const app = express();

fs.mkdirSync(MEDIA_DIR, { recursive: true });

// ============================================
// HABILITAR CORS para permitir peticiones desde APEX
// ============================================
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");

    // Responder a preflight requests (OPTIONS)
    if (req.method === "OPTIONS") {
        return res.sendStatus(200);
    }

    next();
});

app.use(express.json());
app.use("/media", express.static(MEDIA_DIR));

// Ruta raiz para verificar que el bot esta vivo
app.get("/", (req, res) => {
    res.send("WhatsApp Bot funcionando correctamente");
});

// Rutas del webhook de WhatsApp
app.get("/whatsapp", verifyToken);
app.post("/whatsapp", receiveMessage);

// ============================================================
// ENDPOINT PARA QUE APEX PUEDA ENVIAR MENSAJES
// ============================================================
app.post("/enviar-whatsapp", (req, res) => {
    const { telefono, mensaje } = req.body;

    if (!telefono || !mensaje) {
        return res.status(400).json({
            error: "Faltan datos",
            requerido: { telefono: "string", mensaje: "string" }
        });
    }

    const data = {
        messaging_product: "whatsapp",
        to: telefono,
        type: "text",
        text: { body: mensaje }
    };

    sendMessageWhatsApp(JSON.stringify(data));
    console.log(`Enviando a ${telefono}: ${mensaje}`);

    res.json({
        status: "enviado",
        telefono: telefono,
        mensaje: mensaje
    });
});

// ============================================================
// ENDPOINT PARA QUE APEX FINALICE LA CONVERSACION DEL BOT
// ============================================================
app.post("/reset-conversation", (req, res) => {
    const { telefono } = req.body;

    if (!telefono) {
        return res.status(400).json({
            error: "Falta telefono",
            requerido: { telefono: "string" }
        });
    }

    reiniciarConversacion(telefono);
    console.log(`Conversacion reiniciada para ${telefono}`);

    res.json({
        status: "reiniciada",
        telefono: telefono
    });
});

const PORT = process.env.PORT || 3001;
process.env.PORT = String(PORT);

app.listen(PORT, "0.0.0.0", () => {
    console.log("Servidor corriendo en puerto " + PORT);
});
