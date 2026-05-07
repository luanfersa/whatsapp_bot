const whatsappModels = require('../shared/whatsappmodels');
const whatsappServices = require('../services/whatsappServices');

function processMessage(textUser, number, optionId = null) {
    textUser = textUser ? textUser.toLowerCase() : "";
    whatsappServices.saveMessageOracle(number, textUser);  // guardar mensaje en Oracle APEX
    const models = [];

    if (optionId === "comprar") {
        models.push(
            whatsappModels.MessageComprar(number)
        );
    }
    else if (optionId === "btn_si") {
        models.push(
            whatsappModels.MessageText("✔ Compra confirmada (demo).", number)
        );
    }
    else if (optionId === "btn_no") {
        models.push(
            whatsappModels.MessageText("❌ Cancelado.", number),
            whatsappModels.MessageList(number)
        );
    }
    else if (optionId === "soporte") {
        models.push(
            whatsappModels.MessageText("🛠️ Soporte técnico: describe tu problema y te ayudamos.", number)
        );
    }
    else if (optionId === "contacto") {
        models.push(
            whatsappModels.MessageText("📞 Un asesor se pondrá en contacto contigo.", number)
        );
    }
    else if (textUser.includes("hola")) {
        models.push(
            whatsappModels.MessageText("¡Hola! ¿Cómo estás?", number),
            whatsappModels.MessageList(number)
        );
    }
    else if (textUser.includes("menu")) {
        models.push(
            whatsappModels.MessageList(number)
        );
    }
    else if (textUser.includes("gracias")) {
        models.push(
            whatsappModels.MessageText("De nada! Un placer ayudarte.", number)
        );
    }
    else if (textUser.includes("adios") || textUser.includes("chau")) {
        models.push(
            whatsappModels.MessageText("¡Adiós! Que tengas un buen día.", number)
        );
    }
    else {
        models.push(
            whatsappModels.MessageText(
                "No entiendo tu mensaje. Escribe 'menu' para ver opciones.",
                number
            )
        );
    }

    models.forEach((messageData) => {
        whatsappServices.sendMessageWhatsApp(messageData);
    });
}

module.exports = {
    processMessage
};