const mongoose = require("mongoose")
const uniqueValidator = require("mongoose-unique-validator");
const crypto = require("crypto");
const assert= require('assert');
const jwt = require('jsonwebtoken');
const config = require('../config');
const Domain = require('./Domain');
const UserModel = require('./User');
const Hosting = require('./Hosting');
const Settings = require('./Settings');
const EmailChangeRequest = require('./EmailChangeRequest');
const common = require('../shared/commons');

const UserSchema = mongoose.Schema({
    email:{type: String,required:true,unique:true},
    full_name:{type:String,required:true},
    mobile_no:{type:String},
    zip_code:{type:String},
    stripe_customer_id:{type:String},
    stripe_subscription_id:{type:String},
    plan_id:{type:String},
    plan_type:{
        type:String,
        enum: ['monthly','yearly']
    },
    plan_expiry:{type:String},
    code:{type:String,unique:true},
    hash:{type:String,required:true},
    role:{
        type:String,required:true,
        enum: ['user','admin','support','agency','staff']
    },
    on_boarding:{
        type:String,required:true,
        enum: ['pending','completed']
    },
    added_on:{type:String,required:true},
});


UserSchema.plugin(uniqueValidator);
//statics
UserSchema.methods.login = function (password){
    const hash = crypto.createHash("sha512").
    update(password)
        .digest('hex');
    if(this.hash == hash)
        return true;
    else
        return false;
};

UserSchema.methods.sendResetPasswordEmail = function(cb){
    let date = new Date().toISOString();
    let randomString = common.generateRandomString()+this.email+"ResetPassRocks"+this._id+date;
    let newHash = crypto.createHash("sha512").update(randomString)
        .digest('hex');

    let receiptEmailToSend = this.email;
    console.log(receiptEmailToSend);

    this.model('User').updateOne(
        {_id: this._id},
        {
            code : newHash,
        },
        function(err, numberAffected){
            if(err){
                cb({status:'error'});
            }else{
                let url = config.WEBSITE_PATH+"site/reset-password/"+newHash;
                let message = "<p>Please click on link below to reset your password.</p></br>" +
                    "<a target='_blank' href='"+url+"'>"+url+"</a>";
                common.sendEmail(receiptEmailToSend,'Password Reset Request',message);
                cb({status:'success'});
            }
        });
}


UserSchema.methods.addEmailChangeRequest = function(email,cb){
    EmailChangeRequest.deleteOne({
        user_id:this._id
    }).then(res=>{
       console.log(res);
    });

    let date = new Date().toISOString();
    let randomString = common.generateRandomString()+email+"Rocks"+this._id+date;

    let newHash = crypto.createHash("sha512").update(randomString)
        .digest('hex');

    const newRequest = new EmailChangeRequest({
        user_id:this._id,
        email:email,
        hash:newHash,
        added_on:date,
    });

    newRequest.save().then(res=>{

        let url = config.WEBSITE_PATH+"site/verify/change-email/"+newHash;
        let message = "<p>Please click on link below to verify your email, so we can update your new email" +
            " to your account.</p></br>" +
            "<a target='_blank' href='"+url+"'>"+url+"</a>";

        common.sendEmail(email,'Email Verification',message);

        cb({status:'success'});

    }).catch(error=>{
        cb({status:'error'});
    });
}

UserSchema.methods.getHosting = function(cb){
    Hosting.find({
        user_id:this._id
    }).then(hosting=>cb(hosting));
}

UserSchema.methods.createHostingAccount = function (domain,cb){
    const user_id = this._id;
    Hosting.findOne({
        user_id:user_id
    }).then((hosting)=>{
        if(!hosting){

            //create new hosting account

            //access module

            Hosting.create(domain,
                function (response){
                if(response.status == 'success') {

                    const hosting = new Hosting({
                        user_id: user_id,
                        domain: domain,
                        ip: '193.70.66.50',
                        username: response.username,
                        password: response.password,

                    });

                    hosting.save().then(obj=>{
                        if(obj)
                            cb({status:'success'});
                        else
                            cb({status:'error'});
                    })

                }
                else {

                    cb({status:'error'});
                }
            });



        }
        else{
            cb(hosting);
        }

    });
}

UserSchema.methods.getDomains = function(cb){
    Domain.find({
        user_id:this._id
    }).then(domains=>cb(domains));
}

UserSchema.methods.generateToken = function (){
    const token = jwt.sign({
        email:this.email,
        name:this.full_name,
        mobile_no:this.mobile_no,
        zip_code:this.zip_code,
        role:this.role,
        id:this._id,
        added_on:this.added_on,
        on_boarding:this.on_boarding,
        stripe_customer_id:this.stripe_customer_id,
        plan_id:this.plan_id?this.plan_id:'',
        plan_expiry:this.plan_expiry?this.plan_expiry:'',
    },config.SECRET,{expiresIn: "1h"});
    return token;
}

UserSchema.methods.getSettings = function (type,cb){
    Settings.findOne({
        user_id:this._id,
        name:type,
    }).then((settings)=>{
        console.log("Get settings ",settings);
        if(!settings){
            cb(true,null);

        }
        else{
            const config = settings.settings;
            if(config){
                cb(false,config)
            }
            else{
                cb(true,null);
            }
        }
    });
}
UserSchema.methods.updateSettings = function (type,config,cb){
    Settings.findOne({
        user_id:this._id,
        name: type
    }).then((settings)=>{
        if(!settings){
            const settings = new Settings({
                name:type,
                settings:config,
                user_id:this._id
            });
            console.log("New setting ob",settings);
            settings.save((err,response)=>{
                cb(err,response);
            })
        }
        else{
            console.log("Got old setting of",settings.settings);
            //update
            settings.settings= config;
            settings.save((err,response)=>{
                cb(err,response);
            })
        }
    })
}
UserSchema.methods.updateDomainNameservers= function(id,nameservers,cb){
    Domain.findOne({
        user_id:this._id,
        _id:id
    }).then((domain)=>{
        if(!domain)
            cb("Not found",null);
        else{
            domain.nameservers = nameservers;
            console.log("Updated domain",domain);
            console.log("ns",nameservers);
            domain.save(function (err,domain){
                if(err)
                    cb(err,null)
                else{
                    cb(false,domain);
                }
            })
        }


    })
        // .catch(err=>{
        //     cb(err,null)
        // });
}



UserSchema.methods.getDomain = function(id,cb){
    Domain.findOne({
        user_id:this._id,
        _id:id
    }).then(domain=>cb(domain));
}

UserSchema.methods.generatePasswordHash = function (password){
    return crypto.createHash("sha512").update(password)
        .digest('hex');
}
UserSchema.pre('validate',function (next){

    console.log('prevalidate with has ',this.password);

    if(this.password) {
        console.log("New user");
        this.added_on = new Date().toISOString();
        if(this.role=='') {
            this.role = "user";
        }

        this.hash = crypto.createHash("sha512").update(this.password)
            .digest('hex');

        delete this.password;
    }
    else{
        console.log("Old user");
    }

    const error = this.validateSync();
    assert.equal(error, null);

    next();

})

module.exports = mongoose.model('User',UserSchema);
