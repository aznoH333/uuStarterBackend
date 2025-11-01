const express = require('express')
const app = express()
const port = 3000


app.use(express.json());

app.get('/publishEvent/', (req, res) => {
    console.debug("recievedEvent", req.json()); // TODO this
    res.ok();
});


app.get('/', (req, res) => {
    res.send('Hello World!')
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
});
