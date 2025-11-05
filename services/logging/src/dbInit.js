const mongoose = require('mongoose');

// MongoDB connection
mongoose.connect('mongodb://logging-db:27017/logs', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

// Create a Mongoose schema and model
const LogSchema = new mongoose.Schema({
    logMessage: { type: String, required: true },
    logType: { type: String, enum: ["INFO", "ERROR", "DEBUG"], required: true },
    time: { type: Date, required: true }
});

const Log = mongoose.model("Log", LogSchema);

module.exports = { LogSchema, Log }