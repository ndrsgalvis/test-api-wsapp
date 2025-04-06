const express = require("express");
const morgan = require("morgan");
const dotenv = require("dotenv").config();
const http = require("http");
const cors = require("cors");
const ApiRouter = require("./routes/index");

const port = 3012;
const app = express();

app.use(express.json());
app.use(cors());
app.use(morgan("dev"));
app.use('/mediaFiles', express.static(__dirname + '/mediaFiles'))
app.use(ApiRouter);

const server = http.Server(app);
server.listen(port, () => {
  console.log(`Server running on port: ${port}`);
});
