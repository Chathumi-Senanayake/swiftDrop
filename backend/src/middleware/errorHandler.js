// Every error ends up here and leaves as clean JSON: { error: { code, message } }
// Stack traces and internal details are only printed in the server log, never sent to the browser.
const multer = require('multer');
const AppError = require('../utils/AppError');

function send(res, status, code, message) {
  res.status(status).json({ error: { code, message } });
}

// eslint-disable-next-line no-unused-vars
module.exports = function errorHandler(err, req, res, next) {
  if (err instanceof AppError) return send(res, err.status, err.code, err.message);
  if (err.type === 'entity.parse.failed') return send(res, 400, 'BAD_JSON', 'The request data is not valid.');
  if (err instanceof multer.MulterError) return send(res, 400, 'UPLOAD_ERROR', 'Image upload failed: ' + err.message);
  if (err.name === 'CastError') return send(res, 400, 'BAD_ID', 'That ID is not valid.');

  console.error(err);
  send(res, 500, 'SERVER_ERROR', 'Something went wrong on our side. Please try again.');
};
