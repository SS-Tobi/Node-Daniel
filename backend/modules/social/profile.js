const profile = require('express').Router();
const isGuest = require('../../shared/isGuest');
const SocialProfile = require('../../schemas/SocialProfile');
const sbFacebook = require('./sb-facebook');
const common = require('../../shared/commons');
const User = require('../../schemas/User');

profile.get('/',isGuest,(req,res,next)=>{
    //get all social profiles for this user

    User.findOne({
        _id: req.body.user.id
    }).then((user)=>{
        if(user && user.role=="admin"){
            SocialProfile.find({
                user_id: req.query._id
            }).then(data=>{
                res.status(200).json(data);
            })
        }
        else{
            SocialProfile.find({
                user_id:req.body.user.id
            }).then(data=>{
                res.status(200).json(data);
            })
        }
    });
})

profile.delete('/:id',isGuest,(req,res,next)=>{
    SocialProfile.deleteOne({
        user_id: req.body.user.id,
        _id: req.params.id
    }).then((obj)=>{
        res.status(200).json({status:'success'});
    })
})

profile.post('/',isGuest,(req,res,next)=>{

    req.body.profile = common.parseSocialLinks(req.body.profile);

    SocialProfile.findOne({
        user_id: req.body.user.id,
        type: req.body.type
    }).then((err,obj)=>{

        if(err){
            //update the record
            err.profile = req.body.profile;
            err.stats = {};
            err.save().then((saved)=>{
                if(saved){
                    //check if exists
                    sbFacebook.checkExistence(saved.profile,function (exists){
                        res.status(200).json({status: 'success', object: saved,
                            exists:exists
                        });
                    });
                }
                else{
                    res.status(200).json({status:'error',message: saved});
                }
            }).catch((err)=>{
                res.status(200).json({status:'error',errors:err.errors});

            })

        }
        else{
            console.log("Adding SocialProfile");
            const social_profile = new SocialProfile({
                user_id: req.body.user.id,
                profile: req.body.profile,
                type: req.body.type,
            });

            console.log("Trying to save socialprofile ",social_profile);
            social_profile.save().then((saved)=>{
                console.log("Saving socialprofile, got ",saved);
                if(saved) {
                    //check if exists
                    // sbFacebook.checkExistence(saved.profile,function (exists){
                        res.status(200).json({status: 'success', object: saved});
                    // });

                }
                else
                    res.status(500).json({status:'error',message: saved});
            }).catch((err)=>{
                console.log("Error while saving socialprofile ", err);
                res.status(200).json({status:'error',errors:err.errors});

            })
        }
    })
})

module.exports = profile;
