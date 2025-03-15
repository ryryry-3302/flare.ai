const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true
    },
    age: {
        type: Number,
        required: true
    },
    writingGrade: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    essaysReviewed: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Essay'
    }]
});

const User = mongoose.model('User', userSchema);

module.exports = User;