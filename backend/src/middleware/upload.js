const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const env = require('../config/env');
const { ALLOWED_CSV_TYPES, MAX_FILE_SIZE } = require('../utils/constants');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  }
});

const csvFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ext === '.csv' || ALLOWED_CSV_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only CSV files are allowed'), false);
  }
};

const uploadCSV = multer({
  storage,
  fileFilter: csvFilter,
  limits: { fileSize: MAX_FILE_SIZE }
}).single('file');

const handleUpload = (req, res, next) => {
  uploadCSV(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ success: false, message: 'File too large. Maximum size is 5MB' });
      }
      return res.status(400).json({ success: false, message: err.message });
    }
    if (err) return res.status(400).json({ success: false, message: err.message });
    next();
  });
};

module.exports = { uploadCSV, handleUpload };