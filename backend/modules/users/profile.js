const profile = require('express').Router();
const User = require('../../schemas/User');
const Settings = require('../../schemas/Settings');
const isGuest = require('../../shared/isGuest');

profile.get('/',isGuest,(req,res,next)=>{
    User.findOne({
        _id:req.body.user.id
    }).then((user)=>{
        if(user)
            res.status(200).json(user);
        else
            res.status(500).json({status:'error'})
    })
})

profile.post('/settings',isGuest,(req,res,next)=>{
    User.findOne({
        _id:req.body.user.id
    }).then((user)=>{
        if(user)
        {
            //update analytics settings
            user.getSettings(req.body.type,
                function (err,response){
                    if(err){
                        res.status(200).json({status:'error',message:err});
                    }
                    else{
                        res.status(200).json({status:'success',
                        data:response});
                    }
                });
        }
        else
            res.status(500).json({status:'error'})
    });
})

/*profile.get('/delete-nav-settings',(req,res,next)=>{
    Settings.find({
        $or:[
            {'name':'user_navigation'},
            {'name':'admin_navigation'},
            {'name':'staff_navigation'},
        ]
    }).then(data=>{
        res.status(200).json(data);
    });
})*/

profile.put('/settings',isGuest,(req,res,next)=>{
    User.findOne({
        _id:req.body.user.id
    }).then((user)=>{
        if(user)
        {
            //update analytics settings
            user.updateSettings(req.body.type,req.body.config,
            function (err,response){
                if(err){
                    res.status(500).json({status:'error',message:err});
                }
                else{
                    res.status(200).json({status:'success'});
                }
            });
        }
        else
            res.status(500).json({status:'error'})
    })
})

profile.put('/password',isGuest,(req,res,next)=>{
    User.findOne({
        _id:req.body.user.id
    }).then((user)=>{
        if(user.login(req.body.old_password)){
            user.hash = user.generatePasswordHash(req.body.new_password);
            user.save(function (err){

                if(err)
                    res.status(500).json({status:"error"});
                else
                {

                    const token = user.generateToken();
                    res.status(200).json({status:'success',
                        token:token});
                }


            })
        }
        else{
            res.status(200).json({status:'error'});
        }

    }).catch((err)=>{
        res.status(403).json({status:"Not logged in"})
    })
})

profile.get('/send-password-reset-link',isGuest,(req,res,next)=>{
    User.findOne({
        _id: req.query.id
    }).then((user)=>{
        user.sendResetPasswordEmail((data)=>{
            if(data.status=='success') {
                res.status(200).json(data);
            }else{
                res.status(500).json(data);
            }
        });
    });
});

profile.put('/',isGuest,(req,res,next)=>{

    User.findOne({
        _id:req.body.user.id
    }).then((user)=>{

        var changeEmail = false;
        if(req.body.email && req.body.email!=''){
            if(req.body.email!=user.email){
                changeEmail = true;
            }
        }

        user.full_name = req.body.name;
        user.mobile_no = req.body.mobile_no;
        user.zip_code = req.body.zip_code;
        user.save(function (err){

            if(err)
                res.status(500).json({status:"error"});
            else
            {
                if(changeEmail){
                    user.addEmailChangeRequest(req.body.email,
                    (data)=>{
                        //res.status(200).json(data);
                    })
                }

                const token = user.generateToken();

                if(changeEmail) {
                    res.status(200).json({status: 'success', token: token, message: 'Your profile has been updated. ' +
                            'Verify your new email by clicking on link we sent to your new email to update in your account.'});
                }else{
                    res.status(200).json({status: 'success', token: token, message: 'Your profile has been updated.'});
                }
            }


        });

    }).catch((err)=>{
        res.status(403).json({status:"Not logged in"})
    })
})


profile.put('/on-boarding',isGuest,(req,res,next)=>{
    User.findOne({
        _id:req.body.user.id
    }).then((user)=>{

        user.on_boarding = req.body.on_boarding;
        user.save(function (err){

            if(err)
                res.status(500).json({status:"error"});
            else
            {
                const token = user.generateToken();
                res.status(200).json({status: 'success', token: token, message: 'Your profile has been updated.'});
            }
        });

    }).catch((err)=>{
        res.status(403).json({status:"Not logged in"})
    });
})

module.exports = profile;
