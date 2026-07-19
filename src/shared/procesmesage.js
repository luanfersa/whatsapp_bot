const whatsappModels   = require("../shared/whatsappmodels");
const whatsappServices = require("../services/whatsappServices");

const conversaciones = {};

// Cuantas veces se le permite al cliente escribir "cualquier cosa" en un
// paso del formulario (RUC / nombre) antes de cortar y derivar a un agente.
const MAX_INTENTOS = 2;

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
            estado: "INICIO",
            ruc: null,
            cliente: null,
            contactoPendiente: null,
            humano: false,
            intentos: { ruc: 0, nombre: 0 },
            ultimoTextoInvalido: null
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

async function derivarAHumano(number, sesion, mensajes, motivo) {
    finalizarParaAtencionHumana(sesion);
    mensajes.push(whatsappModels.MessageText(
        "Te derivamos con un asesor de AGENTECH para ayudarte mejor. En breve te va a contactar.",
        number
    ));
    await enviar(number, mensajes);
    setTimeout(async function () {
        try {
            console.log("Asignando agente para " + number + " - motivo: " + motivo);
            const resultado = await whatsappServices.asignarTecnico(number, "TECNICO");
            if (resultado && resultado.success) {
                console.log("Agente asignado: " + resultado.asignado + " para " + number);
            } else {
                console.warn("Sin agente disponible:", resultado && resultado.mensaje);
            }
        } catch (err) {
            console.error("Error en asignacion:", err.message);
        }
    }, 3000);
}

// ==========================================
// ANTI-BOBOS: registra un intento fallido en un paso del formulario.
// Devuelve true si hay que CORTAR el formulario y derivar a un agente.
// ==========================================
function registrarIntentoFallido(sesion, campo, textoOriginal) {
    const textoNormalizado = limpiarTexto(textoOriginal);

    // Si el cliente repite exactamente lo mismo que ya fue rechazado,
    // no tiene sentido volver a pedirselo: se corta directo.
    if (sesion.ultimoTextoInvalido !== null && textoNormalizado === sesion.ultimoTextoInvalido) {
        return true;
    }
    sesion.ultimoTextoInvalido = textoNormalizado;

    sesion.intentos[campo] = (sesion.intentos[campo] || 0) + 1;
    return sesion.intentos[campo] >= MAX_INTENTOS;
}

function limpiarIntentos(sesion) {
    sesion.intentos = { ruc: 0, nombre: 0 };
    sesion.ultimoTextoInvalido = null;
}

// ==========================================
// MANEJO DE MENSAJES MULTIMEDIA
// ==========================================
async function handleMediaMessage(number, messageObj) {
    const tipo = messageObj.type;
    const mediaTypes = ["image", "audio", "video", "document", "sticker"];
    if (!mediaTypes.includes(tipo)) return false;

    var mediaId       = null;
    var nombreArchivo = null;
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
    var waMessageId = messageObj.id || null;
    await whatsappServices.saveMediaMessage(number, mediaId, tipo, nombreArchivo, waMessageId);

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

    var waMessageIdTexto = messageObj && messageObj.id ? messageObj.id : null;
    await whatsappServices.saveMessageOracle(number, textoOriginal, false, null, null, waMessageIdTexto);

    if (texto === "reiniciar" || texto === "menu") {
        reiniciarConversacion(number);
        mensajes.push(whatsappModels.MessageWelcome(number));
        await enviar(number, mensajes);
        return;
    }

    if (sesion.humano || sesion.estado === "HUMANO") {
        console.log("Conversacion en modo humano. Bot no responde:", number);
        return;
    }

    const estadosTextoDirectoAHumano = ["INICIO", "BIENVENIDA", "CLIENTE_IDENTIFICADO"];
    if (!optionId && texto && estadosTextoDirectoAHumano.includes(sesion.estado)) {
        await derivarAHumano(number, sesion, mensajes, "mensaje directo del cliente");
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
        limpiarIntentos(sesion);
        mensajes.push(whatsappModels.MessageText(
            "Perfecto. Para identificar tu empresa, por favor escribi el RUC. Si no lo tenes a mano, tambien podes escribir tu CI.", number
        ));
        await enviar(number, mensajes);
        return;
    }

    if (optionId === "quiero_cliente") {
        await derivarAHumano(number, sesion, mensajes, "quiere ser cliente");
        return;
    }

    if (optionId === "soporte_tecnico") {
        await derivarAHumano(number, sesion, mensajes, "soporte tecnico directo");
        return;
    }

    if (optionId === "ver_deuda") {
        optionId = "hablar_administracion";
    }

    if (optionId === "hablar_administracion") {
        await derivarAHumano(number, sesion, mensajes, "administracion");
        return;
    }

    if (optionId === "hablar_asesor") {
        await derivarAHumano(number, sesion, mensajes, "pidio asesor");
        return;
    }

    if (SOPORTE_TITULOS[optionId]) {
        const modulo = SOPORTE_TITULOS[optionId];
        await derivarAHumano(number, sesion, mensajes, "soporte modulo: " + modulo);
        return;
    }

    // ---------- Paso: esperando RUC (con anti-bobos) ----------
    if (sesion.estado === "ESPERANDO_RUC") {
        const documento = textoOriginal.trim();

        if (!documento) {
            const cortar = registrarIntentoFallido(sesion, "ruc", textoOriginal);
            if (cortar) {
                await derivarAHumano(number, sesion, mensajes, "no respondio RUC tras varios intentos");
                return;
            }
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
            await derivarAHumano(number, sesion, mensajes, "error validando RUC/CI");
            return;
        }

        if (!cliente) {
            const cortar = registrarIntentoFallido(sesion, "ruc", textoOriginal);
            if (cortar) {
                await derivarAHumano(number, sesion, mensajes, "RUC/CI invalido tras varios intentos");
                return;
            }
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

        limpiarIntentos(sesion);
        sesion.ruc     = cliente.ruc || documento;
        sesion.cliente = cliente;
        sesion.contactoPendiente = {
            ruc: cliente.ruc || documento,
            nombreEmpresa: cliente.nombre,
            idPropietario: cliente.idPropietario || cliente.propietario || "AGENTECH",
            idEmpresa: cliente.idEmpresa || null
        };
        sesion.estado = "ESPERANDO_NOMBRE_PERSONA";
        mensajes.push(whatsappModels.MessageText(
            "Gracias. Identificamos la empresa como " + cliente.nombre + ".\n\nPara registrar correctamente este numero, por favor indicanos el nombre de la persona que esta escribiendo.",
            number
        ));
        await enviar(number, mensajes);
        return;
    }

    // ---------- Paso: esperando nombre de la persona (con anti-bobos) ----------
    if (sesion.estado === "ESPERANDO_NOMBRE_PERSONA") {
        const nombrePersona = textoOriginal.trim();

        if (nombrePersona.length < 2) {
            const cortar = registrarIntentoFallido(sesion, "nombre", textoOriginal);
            if (cortar) {
                await derivarAHumano(number, sesion, mensajes, "no respondio nombre tras varios intentos");
                return;
            }
            mensajes.push(whatsappModels.MessageText(
                "Por favor escribi el nombre de la persona que esta escribiendo para completar el registro.",
                number
            ));
            await enviar(number, mensajes);
            return;
        }

        limpiarIntentos(sesion);
        const pendiente      = sesion.contactoPendiente || {};
        const nombreEmpresa  = pendiente.nombreEmpresa || (sesion.cliente && sesion.cliente.nombre) || "AGENTECH";
        const ruc            = pendiente.ruc || sesion.ruc;
        const idPropietario  = pendiente.idPropietario || pendiente.propietario || "AGENTECH";
        const idEmpresa      = pendiente.idEmpresa || null;

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

    console.log("Mensaje sin respuesta automatica:", number, "estado:", sesion.estado);
}

module.exports = { processMessage, reiniciarConversacion };
