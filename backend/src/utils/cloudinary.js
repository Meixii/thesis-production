const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

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
  return `${sanitizedLastName}_${formattedDate}_${paymentMethod.toUpperCase()}`;
};

/**
 * Save a file to local storage as a fallback
 * @param {Object} file - The file object from multer
 * @param {Object} metadata - Additional metadata (user, payment method, etc.)
 * @returns {Promise<Object>} - Local storage metadata
 */
const saveToLocalStorage = async (file, metadata = {}) => {
  try {
    const uploadsDir = path.join(__dirname, '../../uploads/receipts');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    // Generate descriptive filename if metadata provided, otherwise fallback to hash
    let filename;
    if (metadata.lastName && metadata.paymentMethod) {
      const baseFilename = generateReceiptFilename(
        metadata.lastName,
        metadata.paymentMethod
      );
      const extension = path.extname(file.originalname) || '.jpg';
      filename = `${baseFilename}${extension}`;
    } else {
      // Fallback to hash-based filename
      const hash = crypto.createHash('md5').update(Date.now().toString()).digest('hex');
      filename = `${hash}-${file.originalname.replace(/\s+/g, '-')}`;
    }
    
    const filepath = path.join(uploadsDir, filename);
    
    // Write file
    fs.writeFileSync(filepath, file.buffer);
    
    // Return metadata similar to Cloudinary
    return {
      secure_url: `/uploads/receipts/${filename}`,
      public_id: filename.replace(path.extname(filename), ''),
      format: path.extname(file.originalname).substring(1) || 'jpg',
      resource_type: file.mimetype.split('/')[0],
      original_filename: filename
    };
  } catch (error) {
    console.error('Local storage error:', error);
    throw new Error('Failed to save file locally');
  }
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
      public_id: `thesis-finance/receipts/${fileName}`,
      resource_type: 'auto',
      // Removed display_name as it's not allowed in unsigned uploads
      // Note: No need to set use_filename, unique_filename, or overwrite as they're
      // already configured in the upload preset
    };

    // Upload to Cloudinary using the unsigned upload preset
    const result = await cloudinary.uploader.unsigned_upload(
      dataURI, 
      'thesis_finance_receipts', // Use the exact preset name you created
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
        publicId = `thesis-finance/receipts/${generateReceiptFilename(
          metadata.lastName,
          metadata.paymentMethod
        )}`;
      } else {
        publicId = `thesis-finance/receipts/${Date.now()}`;
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
      
      // Try local storage as last fallback
      console.log('Attempting local storage fallback...');
      try {
        const localResult = await saveToLocalStorage(file, metadata);
        console.log('Successfully saved file locally');
        return localResult;
      } catch (localError) {
        console.error('Local storage fallback failed:', localError);
        throw new Error('Failed to upload file: All storage methods failed');
      }
    }
  }
};

module.exports = {
  uploadToCloudinary
}; 