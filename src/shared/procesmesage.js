const whatsappModels = require('../shared/whatsappmodels');
const whatsappServices = require('../services/whatsappServices');

function processMessage(textUser, number, optionId = null) {
    textUser = textUser ? textUser.toLowerCase() : "";
    
    // Guardar mensaje del cliente en Oracle
    whatsappServices.saveMessageOracle(number, textUser);
    
    const models = [];

    if (optionId === "comprar") {
        models.push(whatsappModels.MessageComprar(number));
        // Guardar respuesta del bot
        whatsappServices.saveBotResponse(number, "Opciones de compra enviadas");
    }
    else if (optionId === "btn_si") {
        const respuesta = "✔ Compra confirmada (demo).";
        models.push(whatsappModels.MessageText(respuesta, number));
        whatsappServices.saveBotResponse(number, respuesta);
    }
    else if (optionId === "btn_no") {
        const respuesta1 = "❌ Cancelado.";
        const respuesta2 = "¿En qué más podemos ayudarte?";
        models.push(
            whatsappModels.MessageText(respuesta1, number),
            whatsappModels.MessageList(number)
        );
        whatsappServices.saveBotResponse(number, respuesta1);
        whatsappServices.saveBotResponse(number, respuesta2);
    }
    else if (optionId === "soporte") {
        const respuesta = "🛠️ Soporte técnico: describe tu problema y te ayudamos.";
        models.push(whatsappModels.MessageText(respuesta, number));
        whatsappServices.saveBotResponse(number, respuesta);
    }
    else if (optionId === "contacto") {
        const respuesta = "📞 Un asesor se pondrá en contacto contigo.";
        models.push(whatsappModels.MessageText(respuesta, number));
        whatsappServices.saveBotResponse(number, respuesta);
    }
    else if (textUser.includes("hola")) {
        const respuesta = "¡Hola! ¿Cómo estás?";
        models.push(
            whatsappModels.MessageText(respuesta, number),
            whatsappModels.MessageList(number)
        );
        whatsappServices.saveBotResponse(number, respuesta);
        whatsappServices.saveBotResponse(number, "Opciones del menú enviadas");
    }
    else if (textUser.includes("menu")) {
        models.push(whatsappModels.MessageList(number));
        whatsappServices.saveBotResponse(number, "Menú de opciones enviado");
    }
    else if (textUser.includes("gracias")) {
        const respuesta = "De nada! Un placer ayudarte.";
        models.push(whatsappModels.MessageText(respuesta, number));
        whatsappServices.saveBotResponse(number, respuesta);
    }
    else if (textUser.includes("adios") || textUser.includes("chau")) {
        const respuesta = "¡Adiós! Que tengas un buen día.";
        models.push(whatsappModels.MessageText(respuesta, number));
        whatsappServices.saveBotResponse(number, respuesta);
    }
    else {
        const respuesta = "No entiendo tu mensaje. Escribe 'menu' para ver opciones.";
        models.push(whatsappModels.MessageText(respuesta, number));
        whatsappServices.saveBotResponse(number, respuesta);
    }

    // Enviar cada mensaje por WhatsApp
    models.forEach((messageData) => {
        whatsappServices.sendMessageWhatsApp(messageData);
    });
}

module.exports = {
    processMessage
};