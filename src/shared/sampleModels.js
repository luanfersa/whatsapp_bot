function SampleText(textResponse, number) {
    return JSON.stringify({
        messaging_product: "whatsapp",
        to: number,
        type: "text",
        text: {
            body: textResponse
        }
    });
}

function SampleImage(number) {
    return JSON.stringify({
        messaging_product: "whatsapp",
        to: number,
        type: "image",
        image: {
            link: "https://biostoragecloud.blob.core.windows.net/resource-udemy-whatsapp-node/image_whatsapp.png"
        }
    });
}

function SampleAudio(number) {
    return JSON.stringify({
        messaging_product: "whatsapp",
        to: number,
        type: "audio",
        audio: {
            link: "https://biostoragecloud.blob.core.windows.net/resource-udemy-whatsapp-node/audio_whatsapp.mp3"
        }
    });
}

function SampleBoton(number) {
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

function SampleLista(number) {
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
                                id: "opcion_1",
                                title: "Comprar",
                                description: "Ver productos disponibles"
                            },
                            {
                                id: "opcion_2",
                                title: "Soporte",
                                description: "Ayuda técnica"
                            },
                            {
                                id: "opcion_3",
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

function SampleLocation(number) {
    return JSON.stringify({
        messaging_product: "whatsapp",
        to: number,
        type: "location",
        location: {
            latitude: -25.350331507676792,   
            longitude: -57.5739020755661, 
            name: "Agentech",
            address: "JCXG+VC4 Villa Elisa"
        }
    });
}

module.exports = {
    SampleText,
    SampleImage,
    SampleAudio,
    SampleBoton,
    SampleLista,
    SampleLocation
};