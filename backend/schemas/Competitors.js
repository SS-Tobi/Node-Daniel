const mongoose = require("mongoose")
const assert= require('assert');
const commons= require('../shared/commons');
const sbFacebook = require('../modules/social/sb-facebook');
const sbTwitter = require('../modules/social/sb-twitter');
const sbInstagram = require('../modules/social/sb-instagram');


const CompetitorsSchema = mongoose.Schema({
    user_id:{type: String,required:true},
    name:{type:String,required:true},
    website:{type:String},
    facebook:{type:String},
    instagram:{type:String},
    twitter:{type:String},
    stats:{facebook: {}, twitter: {}, instagram: {}},
    website_speed:{type:String},
    // added_on:{type:String,required:true},
    updated_on:{type:String,required:true},
})


CompetitorsSchema.methods.checkSpeed =  function (){

    console.log("Checking website speed of "+this.website);
    const obj = this;
    commons.getWebsiteLoadSpeed(this.website,(error,speed)=>{

        if(error){
            console.log("Speed update failed",error);
        }
        else {
            obj.website_speed = speed;
            obj.save().then((res) => {
                console.log("Speed updated to " + speed);
            }).catch((err) => {
                console.log("Speed update failed", err);
            });
        }

    })


}
CompetitorsSchema.methods.updateStats =  function (){

    const obj = this;
    const old_stats= this.stats;

    sbInstagram.parseSocialBlade(this.twitter,function (data){
        console.log("Got instagram data for "+data.page,data);

            obj.stats.instagram = data;

        obj.save().then((res)=>{
            console.log("Competitor instagram stats updated");
        }).catch((err)=>{
            console.log("Competitor instagram stats failed with",err);
        });
    });
    sbTwitter.parseSocialBlade(this.twitter,function (data){
        console.log("Got twitter data for "+data.page,data);
        old_stats.twitter = data;
        obj.stats = old_stats;

        console.log("Updated object",obj);
        obj.save().then((res)=>{
            console.log("Competitor twitter stats updated",res);
        }).catch((err)=>{
            console.log("Competitor twitter stats failed with",err);
        });
    })

    sbFacebook.parseSocialBlade(this.facebook,function (data){
        console.log("Got stats for "+data.page,data);

        if(obj.stats)
            obj.stats.facebook = data;
        else
            obj.stats = {facebook: data};
        obj.save().then((res)=>{
            console.log("Competitor facebook stats updated");
        }).catch((err)=>{
            console.log("Competitor facebook stats failed with",err);
        });
    })
}
CompetitorsSchema.pre('validate',function (next){


    // this.added_on = new Date().toISOString();
    this.updated_on = new Date().toISOString();


    const error = this.validateSync();
    assert.equal(error, null);

    next();

})

module.exports = mongoose.model('Competitors',CompetitorsSchema);
