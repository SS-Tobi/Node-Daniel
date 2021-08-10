const competitors = require('express').Router();
const isGuest = require('../../shared/isGuest');
const Competitiors = require('../../schemas/Competitors');
const User = require('../../schemas/User');
const common = require('../../shared/commons');
const loadtest = require('loadtest');


competitors.get('/',isGuest,(req,res,next)=>{
    Competitiors.find({
        user_id:req.body.user.id
    }).then(data=>{
        res.status(200).json(data);
    })
});

competitors.get('/all',isGuest,(req,res,next)=>{
    User.findOne({
        _id: req.body.user.id
    }).then((user)=>{
        if(user && user.role=="admin"){

            let dataMain = [];

            Competitiors.find({}).then(function(data){
                dataMain = data;
                var storageArray = data.map(function(item) {
                    return User.findOne({_id: item.user_id }).exec()
                });
                return Promise.all(storageArray);
            }).then(function(storageList){
                let listData = [];
                storageList.forEach((item, i)=>{
                    let newItem = dataMain[i];
                    let newItemObj = newItem.toObject();
                    newItemObj['user'] = item;
                    listData.push(newItemObj);
                });
                res.status(200).json(listData);
            });

        }
        else{
            res.status(403).json({message:'Invalid request'});
        }
    });
});

// competitors.get('/',(req,res,next)=>{
//     Competitiors.find().then(data=>{
//         res.status(200).json(data);
//     })
// });

competitors.delete('/:id',isGuest,(req,res,next)=>{
    Competitiors.deleteOne({
        user_id: req.body.user.id,
        _id: req.params.id
    }).then((obj)=>{
        res.status(200).json({status:'success'});
    })
})

competitors.get('/:id',isGuest,(req,res,next)=>{
    Competitiors.findOne({
        user_id: req.body.user.id,
        _id: req.params.id
    }).then((obj)=>{
        res.status(200).json({status:'success',object:obj});
    })
})

competitors.put('/:id',isGuest,(req,res,next)=>{
    req.body.facebook = common.parseSocialLinks(req.body.facebook);
    req.body.twitter = common.parseSocialLinks(req.body.twitter);
    req.body.instagram = common.parseSocialLinks(req.body.instagram);

    Competitiors.findOne({
        user_id: req.body.user.id,
        _id: req.params.id
    }).then((obj)=>{
        obj.name= req.body.name;
        obj.website = req.body.website;
        obj.facebook = req.body.facebook;
        obj.twitter = req.body.twitter;
        obj.instagram = req.body.instagram;
        obj.stats = {facebook: {}, twitter: {}, instagram: {}};//reset stats
        obj.save((saved)=>{
            res.status(200).json({status:'success',object:saved});
        }).catch((err)=>{
            res.status(500).json({status:'error'});
        })

    })
})

competitors.post('/',isGuest,(req,res,next)=>{

    req.body.facebook = common.parseSocialLinks(req.body.facebook);
    req.body.twitter = common.parseSocialLinks(req.body.twitter);
    req.body.instagram = common.parseSocialLinks(req.body.instagram);

    Competitiors.findOne({
        user_id: req.body.user.id,
        name: req.body.name
    }).then((err,obj)=>{
        if(obj){
            res.status(200).json({status:'error'});
        }
        else{
            console.log("Adding competitor");
            const competitor = new Competitiors({
                user_id: req.body.user.id,
                name: req.body.name,
                website: req.body.website,
                facebook: req.body.facebook,
                twitter: req.body.twitter,
                instagram: req.body.instagram,
                stats: {facebook:{},twitter:{},instagram:{}}
            });

            competitor.save().then((saved)=>{
                if(saved)
                    res.status(200).json({status:'success',object:saved});
                else
                    res.stats(500).json({status:'error',message: saved});
            })
        }
    })
})

module.exports = competitors;
