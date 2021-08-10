const mongoose = require("mongoose")
const uniqueValidator = require("mongoose-unique-validator");
const crypto = require("crypto");
const assert= require('assert');

const DomainSchema = mongoose.Schema({
    user_id:{type: String,required:true},
    domain:{type:String,required:true,unique:true},
    years: {type:Number,required:true},
    nameservers:{ type: Map, of: String,required: true},
    added_on:{type:String,required:true},
})


DomainSchema.plugin(uniqueValidator);


DomainSchema.pre('validate',function (next){

    console.log('prevalidate Domains for domain '+ this.domain);
    this.added_on = new Date().toISOString();

    const error = this.validateSync();
    assert.equal(error, null);

    next();

})

module.exports = mongoose.model('Domain',DomainSchema);
