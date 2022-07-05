const express = require("express");
const dotenv = require("dotenv");
dotenv.config({path : "./configuration/config.env"});
const database = require("./configuration/databaseConfig");
const cartDataRouter = require("./routes/cartDataRoutes");
const logger = require("./utils/logger/logger");


const app = express();

app.use(express.urlencoded({extended : true}));

app.use("/api/v1/cartData",cartDataRouter);

database()
    .then(()=>logger.verbose("Connected to database"))
    .catch(()=>logger.verbose("Connection to database failed"));



const PORT = process.env.PORT || 8000;
app.listen(PORT,()=>logger.verbose(`Server has started at PORT ${PORT}`));
