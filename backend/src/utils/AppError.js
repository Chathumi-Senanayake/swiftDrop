// An error we expect (wrong password, sold out, ...). The error handler turns it into clean JSON.
class AppError extends Error {
  constructor(status, message, code = 'ERROR') {
    super(message);
    this.status = status; // HTTP status code, e.g. 400, 404, 409
    this.code = code; // short machine-readable code, e.g. 'SOLD_OUT'
  }
}

module.exports = AppError;
