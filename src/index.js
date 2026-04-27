const express = require("express");
const app = express();

app.use(express.json());

const whatsappRoutes = require("./routes/routes");

app.use("/", whatsappRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
    console.log("Servidor corriendo en puerto " + PORT);
});