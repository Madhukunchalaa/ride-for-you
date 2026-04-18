const QRCode = require('qrcode');

/**
 * Generates a UPI QR code image buffer.
 * @param {string} upiId - The merchant's UPI ID.
 * @param {string} name - The merchant's name.
 * @param {number} amount - The amount to pay.
 * @returns {Promise<Buffer>} - Image buffer.
 */
const generateUPIQRCode = async (upiId, name, amount) => {
  try {
    const upiUrl = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(name)}&am=${amount}&cu=INR`;
    return await QRCode.toBuffer(upiUrl);
  } catch (err) {
    console.error('QR Generation Error:', err);
    throw err;
  }
};

module.exports = { generateUPIQRCode };
