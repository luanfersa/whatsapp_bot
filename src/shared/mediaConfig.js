const path = require("path");

const DEFAULT_MEDIA_DIR = path.resolve(__dirname, "..", "..", "media");

const MEDIA_DIR = process.env.MEDIA_DIR
    ? path.resolve(process.env.MEDIA_DIR)
    : DEFAULT_MEDIA_DIR;

function getMediaBaseUrl() {
    if (process.env.MEDIA_BASE_URL) {
        return process.env.MEDIA_BASE_URL.replace(/\/$/, "");
    }

    const baseUrl = process.env.PUBLIC_BASE_URL || "http://localhost:" + (process.env.PORT || 3000);

    return baseUrl.replace(/\/$/, "") + "/media";
}

module.exports = {
    MEDIA_DIR,
    getMediaBaseUrl
};
