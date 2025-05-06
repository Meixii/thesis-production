const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * Format date for filename in MMDDYYYY_HHMMSS format
 * @param {Date} date - Date object
 * @returns {string} - Formatted date string
 */
const formatDateForFilename = (date = new Date()) => {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  return `${month}${day}${year}_${hours}${minutes}${seconds}`;
};

/**
 * Generate a descriptive filename for the receipt
 * @param {string} lastName - User's last name
 * @param {string} paymentMethod - Payment method (gcash, maya, etc.)
 * @param {Date} date - Date of the payment (default: current date)
 * @returns {string} - Formatted filename
 */
const generateReceiptFilename = (lastName, paymentMethod, date = new Date()) => {
  const formattedDate = formatDateForFilename(date);
  const sanitizedLastName = lastName.replace(/\s+/g, '');
  return `payment_${sanitizedLastName}_${paymentMethod.toUpperCase()}_${formattedDate}`;
};

/**
 * Generate a filename for profile pictures: profile_lastname_MMDDYYYY_HHMMSS
 */
const formatProfilePicFilename = (lastName, date = new Date()) => {
  const formattedDate = formatDateForFilename(date);
  const sanitizedLastName = lastName.replace(/\s+/g, '');
  return `profile_${sanitizedLastName}_${formattedDate}`;
};

/**
 * Upload a file to Cloudinary
 * @param {Object} file - The file object from multer
 * @param {Object} metadata - Additional metadata (user, payment method, etc.)
 * @returns {Promise<Object>} - Cloudinary upload response
 */
const uploadToCloudinary = async (file, metadata = {}) => {
  try {
    // Convert the buffer to base64
    const b64 = Buffer.from(file.buffer).toString('base64');
    const dataURI = `data:${file.mimetype};base64,${b64}`;

    let publicId;
    let folder;
    if (metadata.profilePic && metadata.lastName) {
      // Profile picture upload
      folder = 'profile_pics';
      publicId = formatProfilePicFilename(metadata.lastName);
    } else if (metadata.lastName && metadata.paymentMethod) {
      // Payment receipt upload
      folder = 'payments';
      publicId = generateReceiptFilename(metadata.lastName, metadata.paymentMethod);
    } else {
      // Fallback
      folder = 'uploads';
      publicId = Date.now().toString();
    }

    // Upload to Cloudinary using signed upload
    const result = await cloudinary.uploader.upload(dataURI, {
      folder: folder,
      public_id: publicId,
      resource_type: 'auto',
      overwrite: true,
      invalidate: true
    });

    return result;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw error;
  }
};

module.exports = {
  uploadToCloudinary,
  formatDateForFilename,
  formatProfilePicFilename,
}; 