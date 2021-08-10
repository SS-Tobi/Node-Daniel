const dashboard = require('express').Router();
const Ticket = require('../../schemas/Ticket');
const User = require('../../schemas/User');
const Domain = require('../../schemas/Domain');
const Hosting = require('../../schemas/Hosting');
const Competitor = require('../../schemas/Competitors');
const isGuest = require('../../shared/isGuest');

dashboard.post('/',(req,res,next)=>{
    res.status(200).json({message:'this is dashboard'})
});

dashboard.get('/stats',isGuest,(req,res,next)=>{
    let statsData = ['users','staff','competitors','domains','hosting','tickets'];
    User.findOne({
        _id:req.body.user.id
    }).then((user)=>{
        var storageArray = statsData.map(function(type) {
            console.log(type);
            switch (type) {
                case 'users':
                    return User.countDocuments({'role':'user'}).exec();
                    break;
                case 'staff':
                    return User.countDocuments({'role':'staff'}).exec();
                    break;
                case 'competitors':
                    return Competitor.countDocuments({}).exec();
                    break;
                case 'domains':
                    return Domain.countDocuments({}).exec();
                    break;
                case 'hosting':
                    return Hosting.countDocuments({}).exec();
                    break;
                case 'tickets':
                    return Ticket.countDocuments({}).exec();
                    break;
            }
        });
        return Promise.all(storageArray);
    }).then(function(storageList){
        let listData = {};
        storageList.forEach((item, i)=>{
            let newItem = statsData[i];
            listData[newItem] = item;
        });
        res.status(200).json({stats:listData});
    });
});

module.exports = dashboard;
