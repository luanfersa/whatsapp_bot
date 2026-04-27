const express = require("express");
const app = express();

app.use(express.json());

const whatsappRoutes = require("./routes/routes");

app.use("/", whatsappRoutes);

const PORT = 10000;

app.listen(PORT, () => {
    console.log("Servidor corriendo en puerto " + PORT);
});