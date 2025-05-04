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
 * Upload a file to Cloudinary using unsigned upload
 * @param {Object} file - The file object from multer
 * @param {Object} metadata - Additional metadata
 * @returns {Promise<Object>} - Cloudinary upload response
 */
const uploadToCloudinaryUnsigned = async (file, metadata = {}) => {
  try {
    // Convert the buffer to base64
    const b64 = Buffer.from(file.buffer).toString('base64');
    const dataURI = `data:${file.mimetype};base64,${b64}`;

    // Generate a descriptive filename
    let fileName;
    if (metadata.lastName && metadata.paymentMethod) {
      fileName = generateReceiptFilename(metadata.lastName, metadata.paymentMethod);
    } else {
      fileName = `receipt_${Date.now()}`;
    }

    // Set options according to the preset configuration
    const uploadOptions = {
      public_id: `payments/${fileName}`,
      resource_type: 'auto',
    };

    // Upload to Cloudinary using the unsigned upload preset
    const result = await cloudinary.uploader.unsigned_upload(
      dataURI, 
      'thesis_finance_receipts',
      uploadOptions
    );

    console.log('Successfully uploaded with unsigned preset');
    return result;
  } catch (error) {
    console.error('Cloudinary unsigned upload error:', error);
    throw error;
  }
};

/**
 * Upload a file to Cloudinary
 * @param {Object} file - The file object from multer
 * @param {Object} metadata - Additional metadata (user, payment method, etc.)
 * @returns {Promise<Object>} - Cloudinary upload response
 */
const uploadToCloudinary = async (file, metadata = {}) => {
  // Try unsigned upload first as it's more reliable with your configuration
  try {
    console.log('Using unsigned upload method with preset: thesis_finance_receipts');
    return await uploadToCloudinaryUnsigned(file, metadata);
  } catch (unsignedError) {
    console.error('Unsigned upload failed, trying signed upload:', unsignedError);
    try {
      // Convert the buffer to base64
      const b64 = Buffer.from(file.buffer).toString('base64');
      const dataURI = `data:${file.mimetype};base64,${b64}`;

      // Generate a descriptive public_id if metadata provided
      let publicId;
      if (metadata.lastName && metadata.paymentMethod) {
        publicId = `payments/${generateReceiptFilename(
          metadata.lastName,
          metadata.paymentMethod
        )}`;
      } else {
        publicId = `payments/${Date.now()}`;
      }

      // Upload to Cloudinary with timestamp
      const timestamp = Math.floor(Date.now() / 1000);
      const result = await cloudinary.uploader.upload(dataURI, {
        public_id: publicId,
        resource_type: 'auto',
        timestamp: timestamp,
        overwrite: false
      });

      return result;
    } catch (error) {
      console.error('Cloudinary signed upload error:', error);
      console.error('Cloudinary config status:', {
        cloudName: process.env.CLOUDINARY_CLOUD_NAME ? 'Set' : 'Not set',
        apiKey: process.env.CLOUDINARY_API_KEY ? 'Set' : 'Not set',
        apiSecret: process.env.CLOUDINARY_API_SECRET ? 'Set' : 'Not set',
      });
      throw new Error('Failed to upload file: All Cloudinary upload methods failed');
    }
  }
};

module.exports = {
  uploadToCloudinary
}; 