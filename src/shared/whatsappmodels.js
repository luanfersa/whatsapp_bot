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


function MessageList(number) {
    return JSON.stringify({
        messaging_product: "whatsapp",
        to: number,
        type: "interactive",
        interactive: {
            type: "list",
            header: {
                type: "text",
                text: "Menú de opciones"
            },
            body: {
                text: "Selecciona una opción:"
            },
            footer: {
                text: "Bot de ejemplo"
            },
            action: {
                button: "Ver opciones",
                sections: [
                    {
                        title: "Opciones principales",
                        rows: [
                            {
                                id: "comprar",
                                title: "Comprar",
                                description: "Ver productos disponibles"
                            },
                            {
                                id: "soporte",
                                title: "Soporte",
                                description: "Ayuda técnica"
                            },
                            {
                                id: "contacto",
                                title: "Contacto",
                                description: "Hablar con un asesor"
                            }
                        ]
                    }
                ]
            }
        }
    });
}



function MessageComprar(number) {
    return JSON.stringify({
        messaging_product: "whatsapp",
        to: number,
        type: "interactive",
        interactive: {
            type: "button",
            body: {
                text: "¿Confirmas la acción?"
            },
            action: {
                buttons: [
                    {
                        type: "reply",
                        reply: {
                            id: "btn_si",
                            title: "Sí"
                        }
                    },
                    {
                        type: "reply",
                        reply: {
                            id: "btn_no",
                            title: "No"
                        }
                    }
                ]
            }
        }
    });
}


module.exports = {
    MessageText,
    MessageList,
    MessageComprar
};