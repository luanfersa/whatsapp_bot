const express = require("express");
const {
    verifyToken,
    receiveMessage,
} = require("./controllers/whatsappcontrollers");
const { sendMessageWhatsApp } = require("./controllers/sendMessage");

const app = express();

// ============================================
// HABILITAR CORS para permitir peticiones desde APEX
// ============================================
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    // Responder a preflight requests (OPTIONS)
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

app.use(express.json());

// Ruta raíz para verificar que el bot está vivo
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
    console.log(`📤 Enviando a ${telefono}: ${mensaje}`);
    
    res.json({ 
        status: "enviado", 
        telefono: telefono, 
        mensaje: mensaje 
    });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, "0.0.0.0", () => {
    console.log("Servidor corriendo en puerto " + PORT);
});