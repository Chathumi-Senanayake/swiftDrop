const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    phone: { type: String, default: '', trim: true }, // needed for delivery
    address: { type: String, default: '', trim: true }, // delivery address
    role: { type: String, enum: ['customer', 'admin'], default: 'customer' },
    active: { type: Boolean, default: true }, // false = deactivated by an admin
  },
  { timestamps: true }
);

// Never send the password hash to the browser
userSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.passwordHash;
    return ret;
  },
});

module.exports = mongoose.model('User', userSchema);
