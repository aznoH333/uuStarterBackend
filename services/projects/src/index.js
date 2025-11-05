const express = require('express');
const app = express();
const {Project} = require("./dbInit");
const {sendLog, LOG_TYPE} = require("../../../common/utils/loggingUtils");
const {ProjectEntity} = require("../../../common/entities/projectEntity");

app.use(express.json());

// get all projects
app.get("/", async (req, res) => {
    // TODO : filtering
    const projects = await Project.find();
    res.status(200).json(projects);
});

app.get("/:projectId", async (req, res) => {
    const { projectId } = req.params;

    try {
        const project = await Project.findById(projectId);
        res.status(200).json(project);

    }catch (e) {
        res.status(400);
    }
});

/**
 * Creates a new project
 * @param name : String
 * @param description : String
 * @param ownerId : String - id of owner user
 * @param goalAmount : Number - number in $?
 * @param deadLine : Date
 * @param categoryId : String | undefined - category id (optional)
 * @returns {ProjectEntity}
 */
app.post("/", async (req, res) => {
    const project = ProjectEntity.createNew(
        req.body.name,
        req.body.description,
        req.body.ownerId,
        req.body.goalAmount,
        req.body.deadLine,
        req.body.categoryId,
    );
    console.debug(Object.values(project));
    console.debug(req.body)

    try {
        const newProject = new Project({...project});
        console.debug(newProject)
        await newProject.save();
        sendLog("Created new project : " + project.toString(), LOG_TYPE.INFO);
        res.status(200).send();
    }catch (e) {
        sendLog("Failed to create a project : " + project.toString() + "\n Failed with error : " + e, LOG_TYPE.ERROR);
        res.status(400).send();

    }
});




app.listen(3000, () => {
    console.log('Projects service is running on port 3000');
});



