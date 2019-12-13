import * as mongoose from 'mongoose';
import * as bcrypt from 'bcrypt';

export const AdminSchema = new mongoose.Schema({
    email: {
        type: String,
        unique: true,
        required: true,
    },
    status:{
        suspended : { type: Boolean, default: false },
        emailVerifiedAt : { type: Date, default: null },
    },
    role:{
        type: String,
        require: true,
    },
    password: {
        type: String,
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    avatar: {
        type: String,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function(doc, ret) {
        delete ret.password;
      },
    },
  },
);

// sebelum save
AdminSchema.pre('save', function(next) {
  let user = this;
  // biar tidak mengulang hash password
  if (!user.isModified('password')) return next();
  // hash password jika belum dihash sebelumnya
  bcrypt.genSalt(10, (err, salt) => {
    if (err) return next(err);
    bcrypt.hash(user.password, salt, (err, hash) => {
      if (err) return next(err);
      user.password = hash;
      next();
    });
  });
});