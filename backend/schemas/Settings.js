const mongoose = require("mongoose")
const assert= require('assert');


const SettingsSchema = mongoose.Schema({
    user_id:{type: String,required:true},
    name:{type:String,required:true},
    settings:{},
    updated_on:{type:String,required:true},
})


SettingsSchema.pre('validate',function (next){

    this.updated_on = new Date().toISOString();

    const error = this.validateSync();
    assert.equal(error, null);

    next();

})

module.exports = mongoose.model('Settings',SettingsSchema);
