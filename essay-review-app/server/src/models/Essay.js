const mongoose = require('mongoose');

const essaySchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    content: {
        type: String,
        required: true,
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
    analysis: {
        grammarErrors: [{
            message: String,
            suggestion: String,
            position: {
                start: Number,
                end: Number,
            },
        }],
        tone: {
            type: String,
            enum: ['formal', 'informal', 'persuasive', 'narrative', 'expository'],
        },
        metrics: {
            readabilityScore: Number,
            wordCount: Number,
            overusedWords: [{
                word: String,
                frequency: Number,
                alternatives: [String],
            }],
        },
    },
});

module.exports = mongoose.model('Essay', essaySchema);