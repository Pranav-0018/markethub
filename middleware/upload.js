const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cloudinary = require('cloudinary').v2;

// Ensure local 'uploads' directory exists
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Check if Cloudinary credentials are provided in .env
const hasCloudinary = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

if (hasCloudinary) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
}

// Multer disk storage setup (stores file in uploads/ with a clean timestamped filename)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `product-${uniqueSuffix}${ext}`);
  }
});

// File filter: accept images only (jpg, jpeg, png, webp, gif)
const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|webp|gif/;
  const isExtOk = allowed.test(path.extname(file.originalname).toLowerCase());
  const isMimeOk = allowed.test(file.mimetype);

  if (isExtOk && isMimeOk) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (jpg, jpeg, png, webp, gif) are allowed'));
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
  fileFilter: fileFilter
});

// Middleware helper that handles multer upload and optional Cloudinary transfer
const handleImageUpload = (fieldName = 'image') => {
  const singleMulter = upload.single(fieldName);

  return (req, res, next) => {
    singleMulter(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ success: false, message: err.message });
      }

      // If a file was uploaded
      if (req.file) {
        if (hasCloudinary) {
          try {
            // Upload to Cloudinary
            const result = await cloudinary.uploader.upload(req.file.path, {
              folder: 'ecommerce_products'
            });
            // Remove local temp file after upload to Cloudinary
            fs.unlink(req.file.path, () => {});
            req.uploadedImageUrl = result.secure_url;
          } catch (uploadError) {
            console.error('Cloudinary upload failed, falling back to local file:', uploadError.message);
            req.uploadedImageUrl = `/uploads/${req.file.filename}`;
          }
        } else {
          // Fallback to local uploads folder
          req.uploadedImageUrl = `/uploads/${req.file.filename}`;
        }
      } else {
        // If no file was uploaded, check if image / imageUrl was supplied as text URL
        req.uploadedImageUrl = req.body.image || req.body.imageUrl || '';
      }

      next();
    });
  };
};

module.exports = { handleImageUpload };
