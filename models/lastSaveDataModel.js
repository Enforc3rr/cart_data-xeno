const mongoose = require("mongoose");

const schema = new mongoose.Schema({
    lastSavedCartID : {
        type : Number ,
        default : 0
    },
},{
    timestamps : true
});

module.exports = mongoose.model("lastSavedInfo",schema);