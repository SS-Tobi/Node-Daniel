const mongoose = require("mongoose")
const uniqueValidator = require("mongoose-unique-validator");
const assert= require('assert');
const whmcs = require('../modules/web/whmcs');

const HostingSchema = mongoose.Schema({
    user_id:{type: String,required:true},
    domain:{type:String,required:true,unique:true},
    ip: {type:String,required:true},
    added_on:{type:String,required:true},
    username:{type: String, required: true},
    password:{type: String, required: true},


})


HostingSchema.plugin(uniqueValidator);

HostingSchema.statics.create  = function (domain,cb){
    whmcs.createHosting(domain,function (response){
        if(response.status=='success'){
            cb({
                status: 'success',
                username: response.username,
                password: response.password
            });
        }
        else{
            cb(false);
        }
    })

}

HostingSchema.pre('validate',function (next){

    console.log('prevalidate Hosting for domain '+ this.domain);
    this.added_on = new Date().toISOString();

    const error = this.validateSync();
    assert.equal(error, null);

    next();

})

module.exports = mongoose.model('Hosting',HostingSchema);
