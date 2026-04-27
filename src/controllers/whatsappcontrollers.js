const VERIFY_TOKEN = "TOHO2013419598LUANFERSA";

const verifyToken = (req, res) => {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    if (mode === "subscribe" && token === VERIFY_TOKEN) {
        return res.status(200).send(challenge);
    }

    return res.sendStatus(403);
};

const receiveMessage = (req, res) => {
    res.sendStatus(200);
};

module.exports = {
    verifyToken,
    receiveMessage
};