// Saves uploaded images into the /uploads folder (shared by all app servers in Docker).
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const config = require('../config');
const AppError = require('../utils/AppError');

const storage = multer.diskStorage({
  destination: config.uploadDir,
  filename: (req, file, cb) => cb(null, crypto.randomUUID() + path.extname(file.originalname).toLowerCase()),
});

module.exports = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB per image
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new AppError(400, 'Only image files can be uploaded.', 'UPLOAD_ERROR'));
  },
});
