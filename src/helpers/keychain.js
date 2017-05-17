const cfg = require('~/config-base');

/**
 * Keytar is a native module and we suspect it might not always work as expected.
 * Keytar malfunction is not blocking user from using the app so we'll try to handle errors gracefully.
 * The purpose of this module is to wrap keytar API into more suitable to us manner.
 */
let keytar;
try {
    keytar = require('keytar');
} catch (err) {
    L.error('Keytar error', err);
}

const service = cfg.keychainService;

async function saveSecret(username, passphrase) {
    if (!keytar) return false;
    try {
        await keytar.setPassword(service, username, passphrase);
        return true;
    } catch (err) {
        L.error('Error setting passphrase with keytar', err);
        return false;
    }
}

async function getSecret(username) {
    if (!keytar) return false;
    try {
        const ret = await keytar.getPassword(service, username);
        return ret || false;
    } catch (err) {
        L.error('Error getting passphrase with keytar', err);
        return false;
    }
}

async function removeSecret(username) {
    if (!keytar) return false;
    try {
        await keytar.deletePassword(service, username);
        return true;
    } catch (err) {
        L.error('Error getting passphrase with keytar', err);
        return false;
    }
}

module.exports = { saveSecret, getSecret, removeSecret };
