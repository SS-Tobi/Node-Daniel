const mongoose = require("mongoose");

const EmailChangeRequestSchema = mongoose.Schema({
    user_id:{type: String, required: true},
    email:{type: String,required:true,unique:true},
    hash:{type:String,required:true,unique:true},
    added_on:{type:String,required:true},
});

module.exports = mongoose.model('EmailChangeRequest',EmailChangeRequestSchema);
