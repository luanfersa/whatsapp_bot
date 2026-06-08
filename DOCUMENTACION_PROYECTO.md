# WhatsApp Bot + Oracle APEX CRM

Este proyecto recibe mensajes de WhatsApp Cloud API, guarda la conversacion en Oracle APEX/ORDS y responde automaticamente con un flujo de atencion para AGENTECH.

## Estructura Principal

```text
Whatsapp_bot/
├── src/
│   ├── index.js
│   ├── routes/
│   │   └── routes.js
│   ├── controllers/
│   │   ├── whatsappcontrollers.js
│   │   └── sendMessage.js
│   ├── services/
│   │   └── whatsappServices.js
│   └── shared/
│       ├── procesmesage.js
│       └── whatsappmodels.js
├── package.json
└── log.txt
```

## Flujo General

1. El cliente escribe al numero de WhatsApp.
2. Meta envia el evento al webhook `POST /whatsapp`.
3. `whatsappcontrollers.js` recibe el mensaje.
4. El mensaje se guarda en Oracle APEX por ORDS.
5. `procesmesage.js` decide que debe responder el bot.
6. `whatsappmodels.js` arma el JSON del mensaje.
7. `whatsappServices.js` envia el mensaje a Meta.
8. El cliente recibe la respuesta.

```text
WhatsApp
  ↓
Meta Webhook
  ↓
POST /whatsapp
  ↓
controllers/whatsappcontrollers.js
  ↓
shared/procesmesage.js
  ↓
shared/whatsappmodels.js
  ↓
services/whatsappServices.js
  ↓
Meta Graph API /messages
  ↓
Cliente
```

## Archivos y Responsabilidades

### `src/index.js`

Es el punto de entrada del servidor Express.

Responsabilidades:

- Levanta el servidor.
- Activa `express.json()`.
- Define rutas principales.
- Expone endpoint opcional para que APEX envie mensajes manualmente.

Rutas importantes:

```text
GET  /
GET  /whatsapp
POST /whatsapp
POST /enviar-whatsapp
```

### `src/routes/routes.js`

Define rutas de webhook cuando se usa router.

```js
router.get("/whatsapp", whatsappcontroller.verifyToken);
router.post("/whatsapp", whatsappcontroller.receiveMessage);
```

Si `index.js` ya define las rutas directo, este archivo puede quedar como soporte o para una version mas ordenada.

### `src/controllers/whatsappcontrollers.js`

Controlador del webhook de WhatsApp.

Responsabilidades:

- Verificar el webhook de Meta con `verifyToken`.
- Recibir mensajes entrantes con `receiveMessage`.
- Extraer:
  - telefono del cliente
  - texto
  - opcion seleccionada en botones/listas
- Guardar el mensaje en Oracle APEX.
- Enviar el mensaje a la logica del bot.

Funciones:

```js
verifyToken(req, res)
receiveMessage(req, res)
guardarEnOracle(telefono, mensaje, optionId)
```

Donde revisar si no entran mensajes:

```js
console.log("WEBHOOK COMPLETO:", JSON.stringify(req.body, null, 2));
console.log("WEBHOOK METADATA:", value?.metadata);
```

Si al escribir al numero real no aparece ese log, el problema no esta en Node. Esta en la configuracion del webhook de Meta.

### `src/services/whatsappServices.js`

Servicio principal usado por el bot automatico.

Responsabilidades:

- Guardar mensajes en Oracle APEX.
- Guardar respuestas del bot.
- Enviar mensajes de WhatsApp con Graph API.

Funciones:

```js
saveMessageOracle(number, message, esRespuestaBot)
saveBotResponse(number, message)
sendAndSaveMessage(number, message)
sendMessageWhatsApp(data)
```

Este archivo es el mas importante para respuestas automaticas, porque `procesmesage.js` usa:

```js
const whatsappServices = require("../services/whatsappServices");
```

Si hay que cambiar el numero real de WhatsApp, revisar:

```js
path: "/v25.0/PHONE_NUMBER_ID/messages"
```

Para AGENTECH, el Phone Number ID real usado fue:

```text
1166278486566526
```

### `src/controllers/sendMessage.js`

Funcion de envio usada por el endpoint manual `/enviar-whatsapp`.

Responsabilidades:

- Enviar mensajes desde APEX/CRM hacia WhatsApp.

Importante:

- El bot automatico normalmente usa `services/whatsappServices.js`.
- Las respuestas manuales desde APEX pueden usar `controllers/sendMessage.js`.

Si se cambia el numero real, conviene cambiarlo en ambos archivos:

```text
src/services/whatsappServices.js
src/controllers/sendMessage.js
```

### `src/shared/procesmesage.js`

Contiene la logica conversacional del bot.

Responsabilidades:

- Decidir que responder segun texto u opcion.
- Manejar estado simple de conversacion en memoria.
- Cortar respuesta automatica cuando la conversacion pasa a atencion humana.

Estados actuales:

```text
INICIO
BIENVENIDA
ESPERANDO_RUC
CLIENTE_IDENTIFICADO
SOPORTE_MENU
HUMANO
```

Flujo actual:

1. Cualquier primer mensaje muestra bienvenida.
2. El usuario elige:
   - `Soy cliente`
   - `Quiero ser cliente`
3. Si es cliente, el bot pide RUC.
4. Al recibir RUC, identifica temporalmente como `cliente AGENTECH`.
5. Muestra menu:
   - Ver deuda
   - Soporte tecnico
   - Hablar asesor
6. Si va a soporte, muestra modulos.
7. Al elegir modulo, registra consulta y pasa a modo humano.

Donde conectar Oracle para buscar cliente por RUC:

```js
function buscarClientePorRuc(ruc) {
    // TODO: conectar con Oracle/APEX para traer el nombre real del cliente.
}
```

Donde el bot deja de responder:

```js
function finalizarParaAtencionHumana(sesion) {
    sesion.estado = "HUMANO";
    sesion.humano = true;
}
```

Nota:

El estado esta en memoria. Si se reinicia Node, se pierde. Para produccion conviene guardar el estado en Oracle.

### `src/shared/whatsappmodels.js`

Arma los JSON que se envian a WhatsApp Cloud API.

Responsabilidades:

- Crear mensajes de texto.
- Crear botones.
- Crear listas interactivas.

Funciones actuales:

```js
MessageText(textResponse, number)
MessageWelcome(number)
MessageClienteMenu(number, nombreCliente)
MessageSupportModules(number)
```

Donde tocar textos del bot:

- Bienvenida: `MessageWelcome`
- Menu cliente: `MessageClienteMenu`
- Modulos de soporte: `MessageSupportModules`
- Mensajes simples: normalmente en `procesmesage.js`

## Flujo Conversacional Actual

### Bienvenida

Se dispara con cualquier primer mensaje o con:

```text
menu
reiniciar
```

Mensaje:

```text
AGENTECH Software ERP
Hola! Bienvenido al asistente virtual de AGENTECH.
Como podemos ayudarte hoy?

[Soy cliente] [Quiero ser cliente]
```

### Cliente Existente

Si elige `Soy cliente`:

```text
Perfecto. Para identificar tu empresa, por favor escribi el RUC.
```

Despues de escribir RUC:

```text
Gracias. Identificamos tu empresa como cliente AGENTECH.
```

Luego muestra:

```text
[Ver deuda] [Soporte tecnico] [Hablar asesor]
```

### Nuevo Cliente

Si elige `Quiero ser cliente`:

```text
Gracias por tu interes en AGENTECH Software ERP.
Un asesor comercial se comunicara contigo a la brevedad.
```

Luego pasa a modo humano.

### Soporte Tecnico

Si elige `Soporte tecnico`, muestra lista:

```text
Facturacion / SIFEN
Acceso y Usuarios
Caja y Cobros
Reportes
Otro modulo
```

Al elegir un modulo:

```text
Registramos tu consulta...
Un tecnico de soporte de AGENTECH te atendera en breve.
```

Luego pasa a modo humano y el bot deja de responder.

## Configuracion de Meta

### Phone Number ID

Numero real:

```text
+595 984 186000
```

Phone Number ID:

```text
1166278486566526
```

Endpoint de envio:

```text
POST https://graph.facebook.com/v25.0/1166278486566526/messages
```

### Webhook

En Meta Developers:

```text
App > WhatsApp > Configuracion
```

Debe tener:

```text
Callback URL: https://TU_DOMINIO/whatsapp
Verify token: TOHO2013419598LUANFERSA
Campo suscrito: messages
```

Si el numero test responde pero el numero real no:

- El codigo funciona.
- El token funciona.
- El envio funciona.
- Falta suscribir el webhook al WABA real o pasar la app a Live.

### WABA Real

WABA real de AGENTECH:

```text
26351829751165922
```

El webhook debe estar suscrito a ese WABA real, no solo al ambiente `Test`.

## Comandos

Instalar dependencias:

```bash
npm install
```

Iniciar local:

```bash
npm run start
```

Reiniciar con PM2:

```bash
pm2 restart crm
```

Ver logs:

```bash
pm2 logs crm
```

Probar local con ngrok:

```bash
ngrok http 3000
```

## Diagnostico Rapido

### Postman envia y llega, pero el bot no responde

Revisar si entra webhook:

```js
console.log("WEBHOOK COMPLETO:", JSON.stringify(req.body, null, 2));
```

Si no aparece log:

```text
Problema de webhook Meta, no de Node.
```

### El test responde pero el real no

Revisar:

```text
App en modo Live
Webhook suscrito a messages
Webhook asociado al WABA real
URL publica correcta
```

### El bot responde desde numero equivocado

Revisar `PHONE_NUMBER_ID` en:

```text
src/services/whatsappServices.js
src/controllers/sendMessage.js
```

### Error Oracle ENOTFOUND

Revisar que el dominio tenga el punto:

```text
sa-saopaulo-1.oraclecloudapps.com
```

No:

```text
sa-saopaulo-1oraclecloudapps.com
```

## Pendientes Recomendados

1. Mover token de Meta a `.env`.
2. Mover Phone Number ID a `.env`.
3. Guardar estado de conversacion en Oracle.
4. Implementar busqueda real por RUC.
5. Crear estado en Oracle para `HUMANO`, asi APEX pueda tomar la conversacion.
6. Regenerar token permanente porque el actual fue expuesto durante pruebas.

