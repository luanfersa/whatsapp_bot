const whatsappModels   = require("../shared/whatsappmodels");
const whatsappServices = require("../services/whatsappServices");
const conversaciones = {};
const SOPORTE_TITULOS = {
    soporte_sifen:    "Facturacion Electronica / SIFEN",
    soporte_acceso:   "Acceso y Usuarios",
    soporte_caja:     "Caja y Cobros",
    soporte_reportes: "Reportes",
    soporte_otro:     "Otro modulo"
};
function getConversacion(number) {
    if (!conversaciones[number]) {
        conversaciones[number] = {
            estado:  "INICIO",
            ruc:     null,
            cliente: null,
            contactoPendiente: null,
            humano:  false
        };
    }
    return conversaciones[number];
}
function reiniciarConversacion(number) {
    if (conversaciones[number]) delete conversaciones[number];
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
            const partes      = [];
            const interactive = mensaje.interactive;
            if (interactive.header && interactive.header.text) partes.push(interactive.header.text);
            if (interactive.body   && interactive.body.text)   partes.push(interactive.body.text);
            if (interactive.footer && interactive.footer.text) partes.push(interactive.footer.text);
            return partes.length ? partes.join("\n\n") : null;
        }
    } catch (error) {
        console.error("No se pudo obtener texto del mensaje del bot:", error.message);
    }
    return null;
}
async function enviar(number, mensajes) {
    for (const messageData of mensajes) {
        await whatsappServices.sendMessageWhatsApp(messageData);
        const textoBot = obtenerTextoMensajeBot(messageData);
        if (textoBot) await whatsappServices.saveBotResponse(number, textoBot);
    }
}
function formatearGuaranies(monto) {
    return new Intl.NumberFormat("es-PY", {
        style: "currency", currency: "PYG",
        minimumFractionDigits: 0, maximumFractionDigits: 0
    }).format(monto || 0);
}
function finalizarParaAtencionHumana(sesion) {
    sesion.estado = "HUMANO";
    sesion.humano = true;
}
function cargarClienteEnSesion(sesion, contacto) {
    sesion.ruc = contacto.ruc;
    sesion.cliente = {
        ruc: contacto.ruc,
        nombre: contacto.nombre,
        nombrePersona: contacto.nombrePersona || contacto.nombre,
        nombreEmpresa: contacto.nombreEmpresa || contacto.nombre,
        idPropietario: contacto.idPropietario || contacto.propietario || "AGENTECH",
        idEmpresa: contacto.idEmpresa || null
    };
    sesion.estado = "CLIENTE_IDENTIFICADO";
    sesion.humano = false;
}
// ==========================================
// MANEJO DE MENSAJES MULTIMEDIA
// ==========================================
async function handleMediaMessage(number, messageObj) {
    const tipo = messageObj.type;
    const mediaTypes = ["image", "audio", "video", "document", "sticker"];
    if (!mediaTypes.includes(tipo)) return false;
    var mediaId        = null;
    var nombreArchivo  = null;
    if (tipo === "image"    && messageObj.image)    { mediaId = messageObj.image.id; }
    if (tipo === "audio"    && messageObj.audio)    { mediaId = messageObj.audio.id; }
    if (tipo === "video"    && messageObj.video)    { mediaId = messageObj.video.id; }
    if (tipo === "document" && messageObj.document) {
        mediaId       = messageObj.document.id;
        nombreArchivo = messageObj.document.filename || null;
    }
    if (tipo === "sticker"  && messageObj.sticker)  { mediaId = messageObj.sticker.id; }
    if (!mediaId) {
        console.warn("Media sin ID para tipo:", tipo);
        return true;
    }
    console.log("Multimedia entrante (" + tipo + ") de " + number + ", media_id: " + mediaId);
    await whatsappServices.saveMediaMessage(number, mediaId, tipo, nombreArchivo);
    const sesion = getConversacion(number);
    if (sesion.humano || sesion.estado === "HUMANO") {
        console.log("Conversacion en modo humano, multimedia guardada sin respuesta bot.");
        return true;
    }
    const mensajes = [];
    mensajes.push(whatsappModels.MessageText(
        "Recibimos tu archivo. Un agente lo revisara a la brevedad.",
        number
    ));
    await enviar(number, mensajes);
    return true;
}
async function processMessage(textUser, number, optionId, messageObj) {
    optionId   = optionId   || null;
    messageObj = messageObj || null;
    const sesion        = getConversacion(number);
    const textoOriginal = textUser || "";
    const texto         = limpiarTexto(textUser);
    const mensajes      = [];
    if (messageObj) {
        const esMedia = await handleMediaMessage(number, messageObj);
        if (esMedia) return;
    }
    whatsappServices.saveMessageOracle(number, textoOriginal, false);
    if (texto === "reiniciar" || texto === "menu") {
        conversaciones[number] = { estado: "INICIO", ruc: null, cliente: null, contactoPendiente: null, humano: false };
        mensajes.push(whatsappModels.MessageWelcome(number));
        await enviar(number, mensajes);
        return;
    }
    if (sesion.humano || sesion.estado === "HUMANO") {
        console.log("Conversacion en modo humano. Bot no responde:", number);
        return;
    }
    if (!optionId && sesion.estado === "CLIENTE_IDENTIFICADO") {
        if (texto.includes("administracion") || texto.includes("admin")) {
            optionId = "hablar_administracion";
        } else if (texto.includes("soporte") || texto.includes("tecnico")) {
            optionId = "soporte_tecnico";
        }
    }
    if (!optionId && sesion.estado === "INICIO") {
        const contacto = await whatsappServices.buscarContactoPorTelefono(number);
        if (contacto) {
            if (!contacto.nombrePersona) {
                sesion.ruc = contacto.ruc;
                sesion.cliente = contacto;
                sesion.contactoPendiente = {
                    ruc: contacto.ruc,
                    nombreEmpresa: contacto.nombreEmpresa,
                    idPropietario: contacto.idPropietario || "AGENTECH",
                    idEmpresa: contacto.idEmpresa || null
                };
                sesion.estado = "ESPERANDO_NOMBRE_PERSONA";
                mensajes.push(whatsappModels.MessageText(
                    "Hola. Tenemos este numero asociado a " + contacto.nombreEmpresa + ", pero necesitamos registrar el nombre de la persona que esta escribiendo.\n\nPor favor, indicanos tu nombre para continuar.",
                    number
                ));
                await enviar(number, mensajes);
                return;
            }
            cargarClienteEnSesion(sesion, contacto);
            mensajes.push(whatsappModels.MessageClienteMenu(number, contacto.nombre));
            await enviar(number, mensajes);
            return;
        }
    }
    if (optionId === "soy_cliente") {
        sesion.estado = "ESPERANDO_RUC";
        mensajes.push(whatsappModels.MessageText(
            "Perfecto. Para identificar tu empresa, por favor escribi el RUC. Si no lo tenes a mano, tambien podes escribir tu CI.", number
        ));
        await enviar(number, mensajes);
        return;
    }
    if (optionId === "quiero_cliente") {
        finalizarParaAtencionHumana(sesion);
        mensajes.push(whatsappModels.MessageText(
            "Gracias por tu interes en AGENTECH Software ERP.\n\nNuestro horario de atencion es de lunes a viernes, de 8:00 a 18:00 hs.\n\nPodes dejar tu mensaje por este medio y un asesor comercial se comunicara contigo a la brevedad.",
            number
        ));
        await enviar(number, mensajes);
        return;
    }
    if (optionId === "soporte_tecnico") {
        finalizarParaAtencionHumana(sesion);
        mensajes.push(whatsappModels.MessageText(
            "Gracias por comunicarte con Soporte Tecnico de AGENTECH.\n\nPor favor, describinos brevemente cual es el inconveniente, que accion estabas realizando y si aparece algun mensaje de error.\n\nTu conversacion ya fue derivada al area tecnica. Un tecnico se comunicara contigo a la brevedad.",
            number
        ));
        await enviar(number, mensajes);

        setTimeout(async function() {
            try {
                console.log("Asignando tecnico para " + number + " - soporte directo");
                const resultado = await whatsappServices.asignarTecnico(number, "TECNICO");
                if (resultado && resultado.success) {
                    console.log("Tecnico asignado: " + resultado.asignado + " para " + number);
                } else {
                    console.warn("Sin tecnico disponible:", resultado && resultado.mensaje);
                }
            } catch (err) {
                console.error("Error en asignacion:", err.message);
            }
        }, 3000);

        return;
    }
    if (optionId === "ver_deuda") {
        optionId = "hablar_administracion";
    }
    if (optionId === "hablar_administracion") {
        finalizarParaAtencionHumana(sesion);
        mensajes.push(whatsappModels.MessageText(
            "Gracias por comunicarte con AGENTECH.\n\nDerivamos tu conversacion al area de Administracion. Un asesor administrativo revisara tu solicitud y se pondra en contacto contigo a la brevedad.\n\nPor favor, indicanos brevemente el motivo de tu consulta para poder atenderte de manera mas eficiente.",
            number
        ));
        await enviar(number, mensajes);
        setTimeout(async function() {
            try {
                console.log("Asignando administracion para " + number);
                const resultado = await whatsappServices.asignarTecnico(number, "ADMIN"); // ? CAMBIO
                if (resultado && resultado.success) {
                    console.log("Administracion asignada: " + resultado.asignado + " para " + number);
                } else {
                    console.warn("Sin asesor administrativo disponible:", resultado && resultado.mensaje);
                }
            } catch (err) {
                console.error("Error en asignacion administrativa:", err.message);
            }
        }, 3000);
        return;
    }
    if (optionId === "hablar_asesor") {
        finalizarParaAtencionHumana(sesion);
        mensajes.push(whatsappModels.MessageText(
            "Listo. Un asesor de AGENTECH tomara la conversacion desde nuestro CRM.\n\nA partir de ahora el bot no respondera automaticamente.",
            number
        ));
        await enviar(number, mensajes);
        return;
    }
    if (SOPORTE_TITULOS[optionId]) {
        finalizarParaAtencionHumana(sesion);
        const modulo    = SOPORTE_TITULOS[optionId];
        const respuesta = "Soporte: " + modulo
            + "\n\nRegistramos tu solicitud de asistencia sobre " + modulo + "."
            + "\n\nPor favor, describinos brevemente el problema, el mensaje de error o la accion que estabas realizando cuando se presento el inconveniente."
            + "\n\nTu conversacion ya fue derivada al area de Soporte Tecnico. Un tecnico de AGENTECH se comunicara contigo a la brevedad.";
        mensajes.push(whatsappModels.MessageText(respuesta, number));
        await enviar(number, mensajes);
        setTimeout(async function() {
            try {
                console.log("Asignando tecnico para " + number + " - modulo: " + modulo);
                const resultado = await whatsappServices.asignarTecnico(number, "TECNICO");
                if (resultado && resultado.success) {
                    console.log("Tecnico asignado: " + resultado.asignado + " para " + number);
                } else {
                    console.warn("Sin tecnico disponible:", resultado && resultado.mensaje);
                }
            } catch (err) {
                console.error("Error en asignacion:", err.message);
            }
        }, 3000);
        return;
    }
    if (sesion.estado === "ESPERANDO_RUC") {
        const documento = textoOriginal.trim();
        if (!documento) {
            mensajes.push(whatsappModels.MessageText(
                "Por favor escribi el RUC de tu empresa o tu CI para continuar.", number
            ));
            await enviar(number, mensajes);
            return;
        }
        var cliente = null;
        try {
            cliente = await whatsappServices.buscarClientePorRucOCi(documento);
        } catch (error) {
            mensajes.push(whatsappModels.MessageText(
                "Ahora mismo no puedo validar el RUC o CI por un problema de conexion. Por favor intenta de nuevo en unos minutos o escribi hablar con asesor.",
                number
            ));
            await enviar(number, mensajes);
            return;
        }
        if (!cliente) {
            sesion.ruc     = null;
            sesion.cliente = null;
            sesion.contactoPendiente = null;
            mensajes.push(whatsappModels.MessageText(
                "No encontre ese RUC o CI como cliente activo de AGENTECH.\n\nPor favor verifica el numero y volvelo a escribir. Si necesitas ayuda, escribi hablar con asesor.",
                number
            ));
            await enviar(number, mensajes);
            return;
        }
        sesion.ruc     = cliente.ruc || documento;
        sesion.cliente = cliente;
        sesion.contactoPendiente = {
            ruc: cliente.ruc || documento,
            nombreEmpresa: cliente.nombre,
            idPropietario: cliente.idPropietario || cliente.propietario || "AGENTECH",
            idEmpresa: cliente.idEmpresa || null
        };
        sesion.estado  = "ESPERANDO_NOMBRE_PERSONA";
        mensajes.push(whatsappModels.MessageText(
            "Gracias. Identificamos la empresa como " + cliente.nombre + ".\n\nPara registrar correctamente este numero, por favor indicanos el nombre de la persona que esta escribiendo.",
            number
        ));
        await enviar(number, mensajes);
        return;
    }
    if (sesion.estado === "ESPERANDO_NOMBRE_PERSONA") {
        const nombrePersona = textoOriginal.trim();
        if (nombrePersona.length < 2) {
            mensajes.push(whatsappModels.MessageText(
                "Por favor escribi el nombre de la persona que esta escribiendo para completar el registro.",
                number
            ));
            await enviar(number, mensajes);
            return;
        }
        const pendiente = sesion.contactoPendiente || {};
        const nombreEmpresa = pendiente.nombreEmpresa || (sesion.cliente && sesion.cliente.nombre) || "AGENTECH";
        const ruc = pendiente.ruc || sesion.ruc;
        const idPropietario = pendiente.idPropietario || pendiente.propietario || "AGENTECH";
        const idEmpresa = pendiente.idEmpresa || null;
        sesion.cliente = {
            ruc: ruc,
            nombre: nombrePersona,
            nombrePersona: nombrePersona,
            nombreEmpresa: nombreEmpresa,
            idPropietario: idPropietario,
            idEmpresa: idEmpresa
        };
        sesion.estado = "CLIENTE_IDENTIFICADO";
        sesion.contactoPendiente = null;
        await whatsappServices.guardarContactoVerificado(number, ruc, nombreEmpresa, nombrePersona, idPropietario, idEmpresa);
        mensajes.push(whatsappModels.MessageClienteMenu(number, nombrePersona, nombreEmpresa));
        await enviar(number, mensajes);
        return;
    }
    if (texto.includes("hola") || texto.includes("buenas") || texto || sesion.estado === "INICIO") {
        sesion.estado = "BIENVENIDA";
        mensajes.push(whatsappModels.MessageWelcome(number));
        await enviar(number, mensajes);
        return;
    }
}
module.exports = { processMessage, reiniciarConversacion };