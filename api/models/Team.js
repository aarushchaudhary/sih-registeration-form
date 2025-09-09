const mongoose = require('mongoose');

const MemberSchema = new mongoose.Schema({
    name: { type: String, required: true },
    sapId: { type: String, required: true },
    course: { type: String, required: true },
    year: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
});

const TeamSchema = new mongoose.Schema({
    teamName: { type: String, required: true, unique: true },
    teamLeaderName: { type: String, required: true },
    teamLeaderPhone: { type: String, required: true },
    sihProblemStatementId: { type: String, required: true },
    sihProblemStatement: { type: String, required: true },
    category: { type: String, enum: ['Hardware', 'Software'], required: true },
    members: [MemberSchema],
    status: {
        type: String,
        enum: ['approved'],
        default: 'approved'
    },
    registrationDate: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Team', TeamSchema);