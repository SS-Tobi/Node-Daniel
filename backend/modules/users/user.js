const user = require('express').Router();
const isGuest = require('../../shared/isGuest');
const isAdmin = require('../../shared/isAdmin');
const profile = require('./profile');
const Users = require('../../schemas/User');
const EmailChangeRequest = require('../../schemas/EmailChangeRequest');
const UserBillingHistory = require('../../schemas/UserBillingHistory');
const Common = require('../../shared/commons');
const request = require('request');
const config = require('./../../config');

user.use('/profile',profile);


user.get('/locations/:place',isGuest,(req,res,next)=>{
    let stringToSearch = req.params.place;

    let URL = 'https://maps.googleapis.com/maps/api/place/autocomplete/json?input='+stringToSearch+
        '&key='+config.GOOGLE_API_KEY;

    let places = [];

    request(URL, function (error, response, body) {
        if(body){
            var resD = JSON.parse(body);
            resD.predictions.forEach(e=>{
                places.push(e.structured_formatting.main_text);
            });
            res.status(200).json({places:places,response:resD});
        }else{
            res.status(500).json({status:false});
        }
    });
});

user.get('/profile-details',isGuest,(req,res,next)=>{
    Users.find({
        _id: req.query.id
    }).then(data=>{
        res.status(200).json(data);
    });
});

user.get('/billing',isGuest,(req,res,next)=>{
    UserBillingHistory.find({
        user_id:req.body.user.id
    }).then(data=>{
        res.status(200).json(data);
    });
});

user.post('/verify-email',(req,res,next)=>{
    let action = req.body.action;
    let code = req.body.code;

    switch (action) {
        case 'change-email':
            EmailChangeRequest.findOne({
                hash:code
            }).then((data)=>{
                if(data) {
                    Users.findOne({
                        _id:data.user_id
                    }).then((user)=>{
                       if(user){
                           user.email = data.email;

                           user.save(function (err){

                               if(err)
                                   res.status(500).json({status:"error"});
                               else
                               {
                                   data.delete();
                                   res.status(200).json({
                                       status: 'success',
                                       message:'Email address has been update.',
                                       token: user.generateToken()
                                   })
                               }


                           });

                       } else{
                           res.status(500).json({status:'error'})
                       }
                    });
                }else{
                    res.status(500).json({status:'error'})
                }
            });
            break;
    }
});

user.get('/all',isGuest,(req,res,next)=>{
    if(req.query.role){
        Users.find({
            role: req.query.role
        }).then(data=>{
            res.status(200).json(data);
        });
    }else{
        Users.find({}).then(data=>{
            res.status(200).json(data);
        });
    }
});

user.get('/email-requests',(req,res,next)=>{
    EmailChangeRequest.find({}).then(data=>{
        res.status(200).json(data);
    });
});

user.delete('/:id',isAdmin,(req,res,next)=>{
    Users.deleteOne({
        _id: req.params.id
    }).then((obj)=>{
        res.status(200).json({status:'success'});
    })
});

user.post('/',isAdmin,(req,res,next)=>{
    if(req.body.role){
        if(req.body.role=='admin'){
            res.status(500).json({status:'error',message:'Invalid Request'});
        }
    }
    const newUser = new Users();

    Object.assign(newUser,req.body);

    newUser.save().then((saved)=>{
        if(saved)
            res.status(200).json({status:'success',object:saved});
        else
            res.stats(500).json({status:'error',message: saved});
    });

});


module.exports = user;
