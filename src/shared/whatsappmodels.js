function MessageText(textResponse, number) {
    return JSON.stringify({
        messaging_product: "whatsapp",
        to: number,
        type: "text",
        text: {
            body: textResponse
        }
    });
}

function MessageWelcome(number) {
    return JSON.stringify({
        messaging_product: "whatsapp",
        to: number,
        type: "interactive",
        interactive: {
            type: "button",
            header: {
                type: "text",
                text: "AGENTECH Software ERP"
            },
            body: {
                text: "Hola! Bienvenido al asistente virtual de AGENTECH.\n\nComo podemos ayudarte hoy?"
            },
            footer: {
                text: "Selecciona una opcion para continuar"
            },
            action: {
                buttons: [
                    {
                        type: "reply",
                        reply: {
                            id: "soy_cliente",
                            title: "Soy cliente"
                        }
                    },
                    {
                        type: "reply",
                        reply: {
                            id: "quiero_cliente",
                            title: "Quiero ser cliente"
                        }
                    }
                ]
            }
        }
    });
}

function MessageClienteMenu(number, nombreCliente) {
    return JSON.stringify({
        messaging_product: "whatsapp",
        to: number,
        type: "interactive",
        interactive: {
            type: "button",
            body: {
                text: "Hola, " + nombreCliente + ". En que podemos ayudarte?"
            },
            footer: {
                text: "AGENTECH"
            },
            action: {
                buttons: [
                    {
                        type: "reply",
                        reply: {
                            id: "ver_deuda",
                            title: "Ver deuda"
                        }
                    },
                    {
                        type: "reply",
                        reply: {
                            id: "soporte_tecnico",
                            title: "Soporte tecnico"
                        }
                    },
                    {
                        type: "reply",
                        reply: {
                            id: "hablar_asesor",
                            title: "Hablar asesor"
                        }
                    }
                ]
            }
        }
    });
}

function MessageSupportModules(number) {
    return JSON.stringify({
        messaging_product: "whatsapp",
        to: number,
        type: "interactive",
        interactive: {
            type: "list",
            header: {
                type: "text",
                text: "Soporte Tecnico AGENTECH"
            },
            body: {
                text: "Estamos aqui para ayudarte.\n\nCon que modulo necesitas asistencia?"
            },
            footer: {
                text: "Selecciona el modulo con el problema"
            },
            action: {
                button: "Ver modulos",
                sections: [
                    {
                        title: "Modulos AGENTECH",
                        rows: [
                            {
                                id: "soporte_sifen",
                                title: "Facturacion / SIFEN",
                                description: "Problemas con facturacion electronica"
                            },
                            {
                                id: "soporte_acceso",
                                title: "Acceso y Usuarios",
                                description: "Claves, permisos o usuarios"
                            },
                            {
                                id: "soporte_caja",
                                title: "Caja y Cobros",
                                description: "Consultas de caja, recibos o pagos"
                            },
                            {
                                id: "soporte_reportes",
                                title: "Reportes",
                                description: "Listados, informes o exportaciones"
                            },
                            {
                                id: "soporte_otro",
                                title: "Otro modulo",
                                description: "Otro tipo de consulta tecnica"
                            }
                        ]
                    }
                ]
            }
        }
    });
}

module.exports = {
    MessageText,
    MessageWelcome,
    MessageClienteMenu,
    MessageSupportModules
};
