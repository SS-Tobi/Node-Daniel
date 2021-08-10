const web = require('express').Router();
const config = require('../../config');
const User = require('../../schemas/User')
const Domain = require('../../schemas/Domain')
const Hosting = require('../../schemas/Hosting')
const isGuest = require('../../shared/isGuest')

const whmcs = require('./whmcs');
const analytics = require('./analytics');


whmcs.init({
    DOMAIN:config.WHMCS.DOMAIN,
    USERNAME: config.WHMCS.USERNAME,
    PASSWORD: config.WHMCS.PASSWORD
});

web.get('/domains',isGuest,(req,res,next)=>{
    User.findOne({
        _id: req.body.user.id
    }).then((user)=>{
        if(user){
            user.getDomains((data)=>{
                res.status(200).json(data);
            })
        }
        else{
            res.status(403).json({message:'Invalid request'});
        }
    });
})

web.get('/all-domains',isGuest,(req,res,next)=>{
    User.findOne({
        _id: req.body.user.id
    }).then((user)=>{
        if(user){

            if(user.role=="admin" || user.role=="staff") {

                let dataMain = [];

                Domain.find({}).then(function (data) {
                    dataMain = data;
                    var storageArray = data.map(function (item) {
                        console.log(item.user_id);
                        return User.findOne({_id: item.user_id}).exec()
                    });
                    return Promise.all(storageArray);
                }).then(function (storageList) {
                    let domainList = [];
                    storageList.forEach((item, i) => {
                        var domain = dataMain[i];
                        var newDomain = domain.toObject();
                        newDomain['user'] = item;
                        domainList.push(newDomain);
                    });
                    console.log(domainList);
                    res.status(200).json(domainList);
                });
            }
        }
        else{
            res.status(403).json({message:'Invalid request'});
        }
    });
})

web.get('/all-hosting',isGuest,(req,res,next)=>{
    User.findOne({
        _id: req.body.user.id
    }).then((user)=>{
        if(user && user.role=="admin"){

            let dataMain = [];

            Hosting.find({}).then(function(data){
                dataMain = data;
                var storageArray = data.map(function(item) {
                    return User.findOne({_id: item.user_id }).exec()
                });
                return Promise.all(storageArray);
            }).then(function(storageList){
                let hostingList = [];
                storageList.forEach((item, i)=>{
                    var hosingItem = dataMain[i];
                    var newHostingItem = hosingItem.toObject();
                    newHostingItem['user'] = item;
                    hostingList.push(newHostingItem);
                });
                res.status(200).json(hostingList);
            });

        }
        else{
            res.status(403).json({message:'Invalid request'});
        }
    });
})

web.get('/domains/:id',isGuest,(req,res,next)=>{
    User.findOne({
        _id: req.body.user.id
    }).then((user)=>{
        if(user){
            user.getDomain(req.params.id,(data)=>{
                res.status(200).json(data);
            })
        }
        else{
            res.status(403).json({message:'Invalid request'});
        }
    })

})

web.put('/domains/:id',isGuest,(req,res,next)=>{
    User.findOne({
        _id: req.body.user.id
    }).then((user)=>{
        if(user){


            user.updateDomainNameservers(
                req.params.id,
                req.body.nameservers,(err,data)=>{
                if(err!=undefined && err != null && err!=false)
                    res.status(500).json({message:'Invalid request '+err});
                else {
                    //update on whmcs
                    whmcs.updateNameservers(data.domain,req.body.nameservers,
                        (err,response)=>{
                            if(err)
                                res.status(500).json({status:'error',
                                    'message':err});
                            else
                                res.status(200).json({status:'success'});
                        })

                }
            })
        }
        else{
            res.status(403).json({message:'Not logged in'});
        }
    }).catch(err=>{
        res.status(500).json({message:'Invalid request '+ err});
    })

})

web.delete('/domains/:id',isGuest,(req,res,next)=>{
    console.log("Body user" ,req.body.user);

    console.log(req);

    Domain.deleteOne({
        _id: req.params.id,
        user_id: req.body.user.id }
        ).then(response=>{
            res.status(200).json({status:'success'})
                .catch(err=>{
                    res.status(500).json({status:'error'})
                })
    });
});

web.post('/domains',isGuest,(req,res,next)=>{

    //check if auth succeeds
    console.log("Body user" ,req.body.user);
    const domain = new Domain({
       user_id:req.body.user.id,
       domain:req.body.domain.domain,
       years:req.body.domain.years,
       nameservers: req.body.domain.nameservers,
    });
    console.log("Domain object ", domain);
    //save it and then register it
    domain.save().then(domain_obj=>{
        whmcs.registerDomain(domain,(response)=>{
            if(response.status == 'success'){
                console.log("Domain registered successfully ",
                    "Order id = "+response.data.order_id,"Domain ID "+ response.data.domain_id);
                res.status(200).json({
                    status:'success',
                    order_id: response.data.order_id,
                    domain_id: response.data.domain_id
                });

            }

            else {
                domain_obj.delete();
                console.log("Error in registering domain", response.message)
                res.status(500).json({
                    status:'error',message: response.message
                });
            }
        });
    })
        .catch((err)=>{
            res.status(500).json({
                status:'error',message: 'Domain should be unique',
            });
        });


});


web.get('/hosting',isGuest,(req,res,next)=>{
    User.findOne({
        _id: req.body.user.id
    }).then((user)=>{
        if(user){
            user.getHosting((data)=>{
                res.status(200).json(data);
            })
        }
        else{
            res.status(403).json({message:'Invalid request'});
        }
    })
})

web.post('/hosting',isGuest,(req,res,next)=>{
    User.findOne({
        _id: req.body.user.id
    }).then((user)=>{
        if(user){
            user.createHostingAccount(req.body.domain,
                (data)=>{
                res.status(200).json(data);
            })
        }
        else{
            res.status(403).json({message:'Invalid request'});
        }
    })
})

web.use('/analytics',analytics);

module.exports = web;
