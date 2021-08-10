const mongoose = require("mongoose")
// const uniqueValidator = require("mongoose-unique-validator");
const assert= require('assert');

const sbFacebook = require('../modules/social/sb-facebook');
const sbTwitter = require('../modules/social/sb-twitter');
const sbInstagram = require('../modules/social/sb-instagram');


const SocialProfileSchema = mongoose.Schema({
    user_id:{type: String,required:true},
    profile:{type:String,required:true},
    type: {type: String, required:true},
    added_on:{type:String,required:true},
    stats:{},
})


// SocialProfileSchema.plugin(uniqueValidator);



SocialProfileSchema.methods.updateStats =  function (type){

    const obj = this;
    const old_stats= this.stats;

    let component = sbFacebook;

    if(type=="instagram")
        component = sbInstagram;
    else if(type=="twitter")
        component = sbTwitter;

    component.parseSocialBlade(this.profile,function (data){
        console.log("Got "+type+" data for "+data.page,data);

        obj.stats = data;

        obj.save().then((res)=>{
            console.log("SocialProfile "+type+" stats updated");
        }).catch((err)=>{
            console.log("SocialProfile "+type+" stats failed with",err);
        });
    });

}

SocialProfileSchema.pre('validate',function (next){

    console.log('prevalidate SocialProfile for profile '+ this.profile);
    this.added_on = new Date().toISOString();

    const error = this.validateSync();
    assert.equal(error, null);

    next();

})

module.exports = mongoose.model('SocialProfile',SocialProfileSchema);
