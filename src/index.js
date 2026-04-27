const express = require("express");
const { verifyToken, receiveMessage } = require("./controllers/whatsappcontrollers");

const app = express();

app.use(express.json());

// rutas
app.get("/whatsapp", verifyToken);
app.post("/whatsapp", receiveMessage);

// puerto
const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log("Servidor corriendo en puerto " + PORT);
});