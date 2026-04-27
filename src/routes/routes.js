const express = require("express");
const router = express.Router();

const whatsappcontroller = require("../controllers/whatsappcontrollers");

router.get("/whatsapp", whatsappcontroller.verifyToken);
router.post("/whatsapp", whatsappcontroller.receiveMessage);

module.exports = router;