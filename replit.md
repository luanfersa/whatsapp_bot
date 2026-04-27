# WhatsApp Bot

A simple Express.js webhook server for the WhatsApp Cloud API (Meta).

## Project Structure

- `src/index.js` — Express app entry point. Listens on `process.env.PORT || 5000` on host `0.0.0.0`.
- `src/routes/routes.js` — Defines `GET /whatsapp` (verification) and `POST /whatsapp` (incoming messages).
- `src/controllers/whatsappcontrollers.js` — Implements the verification handshake (`hub.mode`, `hub.verify_token`, `hub.challenge`) and the message receiver.

## Stack

- Node.js (>=24, runs on 20 in this environment)
- Express 5
- CommonJS modules

## Run

- `npm start` — starts the server on port 5000.

## Replit Setup

- Workflow `Start application` runs `npm start` and serves on port 5000 (webview).
- Deployment: autoscale, run command `node src/index.js`.

## WhatsApp Webhook Notes

- Verify token is hardcoded in `src/controllers/whatsappcontrollers.js` (`VERIFY_TOKEN`).
- The public URL for the webhook (configure in Meta) will be `<replit-domain>/whatsapp`.
