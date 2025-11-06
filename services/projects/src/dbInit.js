const mongoose = require('mongoose');
const {PROJECT_STATUS} = require("../../../common/entities/projectEntity");

// MongoDB connection
mongoose.connect('mongodb://projects-db:27017/projects', {});


// Project
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


// Project update
const ProjectUpdateSchema = new mongoose.Schema({
    name: { type: String, required: true },
    projectId: { type: String, required: true },
    content: { type: String, required: true },
    creationDate: { type: String, required: true},
    lastUpdatedDate: { type: Date, required: true },
});
const ProjectUpdate = mongoose.model("ProjectUpdate", ProjectUpdateSchema);


// Project comment
const ProjectCommentSchema = new mongoose.Schema({
    authorId: { type: String, required: true },
    projectId: { type: String, required: true },
    content: { type: String, required: true },
    creationDate: { type: Date, required: true },
});
const ProjectComment = mongoose.model("ProjectComment", ProjectCommentSchema);


module.exports = { ProjectSchema, Project, ProjectUpdate, ProjectUpdateSchema, ProjectCommentSchema, ProjectComment }