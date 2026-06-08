const whatsappModels = require("../shared/whatsappmodels");
const whatsappServices = require("../services/whatsappServices");

const conversaciones = {};

const SOPORTE_TITULOS = {
    soporte_sifen: "Facturacion Electronica / SIFEN",
    soporte_acceso: "Acceso y Usuarios",
    soporte_caja: "Caja y Cobros",
    soporte_reportes: "Reportes",
    soporte_otro: "Otro modulo"
};

function getConversacion(number) {
    if (!conversaciones[number]) {
        conversaciones[number] = {
            estado: "INICIO",
            ruc: null,
            cliente: null,
            humano: false
        };
    }

    return conversaciones[number];
}

function reiniciarConversacion(number) {
    if (conversaciones[number]) {
        delete conversaciones[number];
    }
}

function limpiarTexto(textUser) {
    return textUser ? textUser.trim().toLowerCase() : "";
}

function obtenerTextoMensajeBot(messageData) {
    try {
        const mensaje = typeof messageData === "string" ? JSON.parse(messageData) : messageData;

        if (mensaje.type === "text") {
            return mensaje.text && mensaje.text.body ? mensaje.text.body : null;
        }

        if (mensaje.type === "interactive" && mensaje.interactive) {
            const partes = [];
            const interactive = mensaje.interactive;

            if (interactive.header && interactive.header.text) {
                partes.push(interactive.header.text);
            }

            if (interactive.body && interactive.body.text) {
                partes.push(interactive.body.text);
            }

            if (interactive.footer && interactive.footer.text) {
                partes.push(interactive.footer.text);
            }

            return partes.length ? partes.join("\n\n") : null;
        }
    } catch (error) {
        console.error("No se pudo obtener texto del mensaje del bot:", error.message);
    }

    return null;
}

function enviar(number, mensajes) {
    mensajes.forEach((messageData) => {
        whatsappServices.sendMessageWhatsApp(messageData);

        const textoBot = obtenerTextoMensajeBot(messageData);
        if (textoBot) {
            whatsappServices.saveBotResponse(number, textoBot);
        }
    });
}

function formatearGuaranies(monto) {
    return new Intl.NumberFormat("es-PY", {
        style: "currency",
        currency: "PYG",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(monto || 0);
}

function finalizarParaAtencionHumana(sesion) {
    sesion.estado = "HUMANO";
    sesion.humano = true;
}

async function processMessage(textUser, number, optionId = null) {
    const sesion = getConversacion(number);
    const textoOriginal = textUser || "";
    const texto = limpiarTexto(textUser);
    const mensajes = [];

    whatsappServices.saveMessageOracle(number, textoOriginal, false);

    if (texto === "reiniciar" || texto === "menu") {
        conversaciones[number] = {
            estado: "INICIO",
            ruc: null,
            cliente: null,
            humano: false
        };

        mensajes.push(whatsappModels.MessageWelcome(number));
        enviar(number, mensajes);
        return;
    }

    if (sesion.humano || sesion.estado === "HUMANO") {
        console.log("Conversacion en modo humano. Bot no responde:", number);
        return;
    }

    if (optionId === "soy_cliente") {
        sesion.estado = "ESPERANDO_RUC";

        const respuesta = "Perfecto. Para identificar tu empresa, por favor escribi el RUC.";
        mensajes.push(whatsappModels.MessageText(respuesta, number));
        enviar(number, mensajes);
        return;
    }

    if (optionId === "quiero_cliente") {
        finalizarParaAtencionHumana(sesion);

        const respuesta = "Gracias por tu interes en AGENTECH Software ERP.\n\nUn asesor comercial se comunicara contigo a la brevedad.\n\nTambien podes escribirnos directamente:\n+595 992 499341\n\nHorario de atencion: Lunes a Viernes de 8:00 a 18:00 hs.";
        mensajes.push(whatsappModels.MessageText(respuesta, number));
        enviar(number, mensajes);
        return;
    }

    if (optionId === "soporte_tecnico") {
        sesion.estado = "SOPORTE_MENU";

        mensajes.push(whatsappModels.MessageSupportModules(number));
        enviar(number, mensajes);
        return;
    }

    if (optionId === "ver_deuda") {
        if (!sesion.ruc) {
            sesion.estado = "ESPERANDO_RUC";

            const respuesta = "Para consultar tu deuda necesito identificar tu empresa. Por favor escribi el RUC.";
            mensajes.push(whatsappModels.MessageText(respuesta, number));
            enviar(number, mensajes);
            return;
        }

        let deuda = null;

        try {
            deuda = await whatsappServices.consultarDeudaPorRuc(sesion.ruc);
        } catch (error) {
            finalizarParaAtencionHumana(sesion);

            const respuesta = "Ahora mismo no puedo consultar tu deuda por un problema de conexion.\n\nUn asesor administrativo revisara tu cuenta y te contactara a la brevedad.";
            mensajes.push(whatsappModels.MessageText(respuesta, number));
            enviar(number, mensajes);
            return;
        }

        const nombreCliente = deuda.cliente || (sesion.cliente && sesion.cliente.nombre) || "cliente";
        let respuesta;

        if (deuda.tieneDeuda) {
            respuesta = nombreCliente + ", registramos " + deuda.cantidadPendientes + " factura(s) pendiente(s).\n\nSaldo total: " + formatearGuaranies(deuda.totalDeuda) + ".";
        } else {
            respuesta = nombreCliente + ", no registramos facturas pendientes actualmente.";
        }

        mensajes.push(whatsappModels.MessageText(respuesta, number));
        mensajes.push(whatsappModels.MessageClienteMenu(number, nombreCliente));
        enviar(number, mensajes);
        return;
    }

    if (optionId === "hablar_asesor") {
        finalizarParaAtencionHumana(sesion);

        const respuesta = "Listo. Un asesor de AGENTECH tomara la conversacion desde nuestro CRM.\n\nA partir de ahora el bot no respondera automaticamente.";
        mensajes.push(whatsappModels.MessageText(respuesta, number));
        enviar(number, mensajes);
        return;
    }

    if (SOPORTE_TITULOS[optionId]) {
        finalizarParaAtencionHumana(sesion);

        const modulo = SOPORTE_TITULOS[optionId];
        const respuesta = "Soporte: " + modulo + "\n\nRegistramos tu consulta sobre " + modulo + ".\n\nPodes describirnos brevemente el problema o error que estas viendo?\n\nUn tecnico de soporte de AGENTECH te atendera en breve.\nEquipo de soporte AGENTECH";
        mensajes.push(whatsappModels.MessageText(respuesta, number));
        enviar(number, mensajes);
        return;
    }

    if (sesion.estado === "ESPERANDO_RUC") {
        const ruc = textoOriginal.trim();

        if (!ruc) {
            const respuesta = "Por favor escribi el RUC de tu empresa para continuar.";
            mensajes.push(whatsappModels.MessageText(respuesta, number));
            enviar(number, mensajes);
            return;
        }

        let cliente = null;

        try {
            cliente = await whatsappServices.buscarClientePorRuc(ruc);
        } catch (error) {
            const respuesta = "Ahora mismo no puedo validar el RUC por un problema de conexion. Por favor intenta de nuevo en unos minutos o escribi hablar con asesor.";
            mensajes.push(whatsappModels.MessageText(respuesta, number));
            enviar(number, mensajes);
            return;
        }

        if (!cliente) {
            sesion.ruc = null;
            sesion.cliente = null;

            const respuesta = "No encontre ese RUC como cliente activo de AGENTECH.\n\nPor favor verifica el numero y volvelo a escribir. Si necesitas ayuda, escribi hablar con asesor.";
            mensajes.push(whatsappModels.MessageText(respuesta, number));
            enviar(number, mensajes);
            return;
        }

        sesion.ruc = ruc;
        sesion.cliente = cliente;
        sesion.estado = "CLIENTE_IDENTIFICADO";

        const respuestaIdentificacion = "Gracias. Identificamos tu empresa como " + cliente.nombre + ".";
        mensajes.push(whatsappModels.MessageText(respuestaIdentificacion, number));
        mensajes.push(whatsappModels.MessageClienteMenu(number, cliente.nombre));
        enviar(number, mensajes);
        return;
    }

    if (texto.includes("hola") || texto.includes("buenas") || texto || sesion.estado === "INICIO") {
        sesion.estado = "BIENVENIDA";

        mensajes.push(whatsappModels.MessageWelcome(number));
        enviar(number, mensajes);
        return;
    }
}

module.exports = {
    processMessage,
    reiniciarConversacion
};
