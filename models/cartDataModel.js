const mongoose = require("mongoose");


const dataSchema = new mongoose.Schema({},{strict : false});
const mainSchema = new mongoose.Schema({
    cartID : {
        type : Number,
        unique : true
    },
    companyName : {
      type : String,
      index : true
    },
    createdAt : {
        type : Date,
        index : true
    },
    customerPhoneNumber : {
      type : String,
      index : true
    },

    details : dataSchema
});


module.exports = mongoose.model("cartData",mainSchema);