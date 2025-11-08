const express = require('express');
const app = express();
require("dotenv").config();


const {useProjectsController} = require("./projectsController");
const {useProjectUpdateController} = require("./projectUpdateController");
const {useProjectCommentController} = require("./projectCommentController");
const {useProjectRatingController} = require("./projectRatingController");

app.use(express.json());

useProjectsController(app);
useProjectUpdateController(app);
useProjectCommentController(app);
useProjectRatingController(app);


app.listen(3000, () => {
    console.log('Projects service is running on port 3000');
});



