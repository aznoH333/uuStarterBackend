const mongoose = require('mongoose');
const {PROJECT_STATUS} = require("../../../common/entities/projectEntity");

// MongoDB connection
mongoose.connect('mongodb://projects-db:27017/projects', {});


// Create a Mongoose schema and model
const ProjectSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    ownerId: { type: String, required: true },
    creationDate: { type: Date, required: true},
    lastUpdatedDate: { type: Date, required: true },
    goalAmount: { type: Number, required: true },
    deadLine: { type: Date, required: true },
    status: { type: String, enum: [...Object.values(PROJECT_STATUS)], required: true },
    categoryId: { type: String, required: false },
});

const Project = mongoose.model("Project", ProjectSchema);

module.exports = { ProjectSchema, Project }