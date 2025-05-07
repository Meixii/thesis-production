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

// Add this function for expense receipt filenames
const generateExpenseReceiptFilename = (category, amount, quantity, unit, date = new Date()) => {
  const formattedDate = formatDateForFilename(date); // MMDDYYYY_HHMMSS
  const safeCategory = (category || 'Cat').replace(/[^a-zA-Z0-9]/g, '').slice(0, 6);
  const safeUnit = (unit || 'unit').replace(/[^a-zA-Z0-9]/g, '').slice(0, 6);
  const safeAmount = String(amount).replace(/[^0-9.]/g, '');
  const safeQuantity = String(quantity).replace(/[^0-9.]/g, '');
  return `ER_${safeCategory}${safeAmount}-${safeQuantity}${safeUnit}_${formattedDate}`;
};

// Add this function for loan repayment proof filenames
const generateLoanRepaymentFilename = (loanId, userId, date = new Date()) => {
  const formattedDate = formatDateForFilename(date);
  return `loanrepayments/repayment_${loanId}_${userId}_${formattedDate}`;
};

/**
 * Upload a file to Cloudinary
 * @param {Object} file - The file object from multer
 * @param {Object} metadata - Additional metadata (user, payment method, etc.)
 * @returns {Promise<Object>} - Cloudinary upload response
 */
const uploadToCloudinary = async (file, metadata = {}) => {
  try {
    const b64 = Buffer.from(file.buffer).toString('base64');
    const dataURI = `data:${file.mimetype};base64,${b64}`;

    let publicId;
    if (metadata.loanRepayment && metadata.loanId && metadata.userId) {
      publicId = generateLoanRepaymentFilename(metadata.loanId, metadata.userId);
    } else if (metadata.expenseReceipt && metadata.category && metadata.amount && metadata.quantity && metadata.unit) {
      publicId = `expenses/${generateExpenseReceiptFilename(metadata.category, metadata.amount, metadata.quantity, metadata.unit)}`;
    } else if (metadata.profilePic && metadata.lastName) {
      publicId = `profile_pics/${formatProfilePicFilename(metadata.lastName)}`;
    } else if (metadata.lastName && metadata.paymentMethod) {
      publicId = `payments/${generateReceiptFilename(metadata.lastName, metadata.paymentMethod)}`;
    } else {
      publicId = `uploads/${Date.now()}`;
    }

    const uploadOptions = {
      public_id: publicId,
      resource_type: 'auto',
    };

    const result = await cloudinary.uploader.unsigned_upload(
      dataURI,
      'thesis_finance_receipts',
      uploadOptions
    );

    return result;
  } catch (error) {
    console.error('Cloudinary unsigned upload error:', error);
    throw error;
  }
};

module.exports = {
  uploadToCloudinary,
  formatDateForFilename,
  formatProfilePicFilename,
  generateExpenseReceiptFilename,
  generateLoanRepaymentFilename,
}; 