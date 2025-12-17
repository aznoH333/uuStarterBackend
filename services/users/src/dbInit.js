const mongoose = require('mongoose');

// MongoDB connection
mongoose.connect('mongodb://user-db:27017/users', {});

// Create a Mongoose schema and model
const UserSchema = new mongoose.Schema({
    name: {type: String, required: true, unique: false},
    email: {type: String, required: true, unique: true},
    password: {type: String, required: true, unique: false},
    role: {type: String, required: true, enum: ["USER", "ADMIN"], default: "USER"},
    authType: {type: String, required: true, enum: ["GOOGLE", "BASIC"]},
    createdAt: {type: Date, required: true, default: Date.now},
    lastLoginAt: {type: Date, required: false},
});

const User = mongoose.model("User", UserSchema);

module.exports = {UserSchema, User}