const express = require('express');
const app = express();

const {useProjectsController} = require("./projectsController");
const {useProjectUpdateController} = require("./projectUpdateController");
const {useProjectCommentController} = require("./projectCommentController");

app.use(express.json());

useProjectsController(app);
useProjectUpdateController(app);
useProjectCommentController(app);


app.listen(3000, () => {
    console.log('Projects service is running on port 3000');
});



