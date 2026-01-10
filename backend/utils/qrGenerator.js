const QRCode = require('qrcode');

/**
 * Generate QR code as base64 data URL
 * @param {string} data - The data to encode in the QR code
 * @returns {Promise<string>} Base64 encoded QR code image
 */
async function generateQRCode(data) {
    try {
        const qrDataUrl = await QRCode.toDataURL(data, {
            errorCorrectionLevel: 'M',
            type: 'image/png',
            width: 300,
            margin: 2,
            color: {
                dark: '#000000',
                light: '#ffffff'
            }
        });
        return qrDataUrl;
    } catch (error) {
        console.error('Error generating QR code:', error);
        throw error;
    }
}

module.exports = { generateQRCode };
