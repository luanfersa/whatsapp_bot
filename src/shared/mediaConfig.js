const path = require("path");

const DEFAULT_MEDIA_DIR = path.resolve(__dirname, "..", "..", "media");
const DEFAULT_MEDIA_BASE_URL = "http://38.242.218.97:3001/media";

const MEDIA_DIR = process.env.MEDIA_DIR
    ? path.resolve(process.env.MEDIA_DIR)
    : DEFAULT_MEDIA_DIR;

function getMediaBaseUrl() {
    const mediaBaseUrl = process.env.MEDIA_BASE_URL || DEFAULT_MEDIA_BASE_URL;
    return mediaBaseUrl.replace(/\/$/, "");
}

module.exports = {
    MEDIA_DIR,
    getMediaBaseUrl
};
