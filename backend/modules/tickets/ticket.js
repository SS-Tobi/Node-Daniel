const ticket = require('express').Router();
const isGuest = require('../../shared/isGuest');
const Tickets = require('../../schemas/Ticket');
const User = require('../../schemas/User');
const TicketMessages = require('../../schemas/TicketMessages');
const common = require('../../shared/commons');

ticket.get('/all',isGuest,(req,res,next)=>{
    User.findOne({
        _id: req.body.user.id
    }).then((user)=>{
        if(user){

            if(user.role=="admin" || user.role=="staff") {

                let dataMain = [];

                Tickets.find({}).then(function (data) {
                    dataMain = data;
                    var storageArray = data.map(function (item) {
                        return User.findOne({_id: item.user_id}).exec()
                    });
                    return Promise.all(storageArray);
                }).then(function (storageList) {
                    let listData = [];
                    storageList.forEach((item, i) => {
                        let newItem = dataMain[i];
                        let newItemObj = newItem.toObject();
                        newItemObj['user'] = item;
                        listData.push(newItemObj);
                    });
                    res.status(200).json(listData);
                });

            }

        }
        else{
            res.status(500).json({message:'Invalid request'});
        }
    });
});

ticket.put('/mark-resolved',isGuest,(req,res,next)=>{
    Tickets.findOne({
        _id: req.body._id
    }).then((ticket)=>{
        if(ticket)
        {
            var closedBy = "admin";
            if(req.body.user.id==ticket.user_id){
                closedBy = "user";
            }

            ticket.status = "closed";
            ticket.closed_by = closedBy;

            ticket.save((err,response)=>{
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
});

ticket.get('/',isGuest,(req,res,next)=>{
    Tickets.find({
        user_id:req.body.user.id
    }).then(data=>{
        res.status(200).json(data);
    })
});

ticket.delete('/:id',isGuest,(req,res,next)=>{
    User.findOne({
        _id: req.body.user.id
    }).then((user)=>{

        if(user){
            if(user.role=="admin" || user.role=="staff") {
                Tickets.deleteOne({
                    _id: req.params.id
                }).then((obj) => {
                    res.status(200).json({status: 'success'});
                });
            }else{
                Tickets.deleteOne({
                    user_id: req.body.user.id,
                    _id: req.params.id
                }).then((obj)=>{
                    res.status(200).json({status:'success'});
                });
            }
        }else{
            res.status(500).json({status:'error'});
        }

    });
});

ticket.get('/:id',isGuest,(req,res,next)=>{

    User.findOne({
        _id: req.body.user.id
    }).then((user)=>{

        let ticketQuery = null;

        if(user){
            if(user.role=="admin" || user.role=="staff") {
                ticketQuery = Tickets.findOne({
                    _id: req.params.id
                });
            }else{
                ticketQuery = Tickets.findOne({
                    user_id: req.body.user.id,
                    _id: req.params.id
                });
            }
        }

        if(ticketQuery!=null) {

            ticketQuery.then((obj) => {
                var messageList = [];
                TicketMessages.find({
                    ticket_id: obj._id
                }).then((messageObj) => {
                    let name = "Member";
                    messageObj.forEach(e => {
                        if (e.user_id == user._id) {
                            name = "You";
                        }else{
                            if(user.role=="admin" || user.role=="staff") {
                                name = "User";
                            }else{
                                name = "Staff";
                            }
                        }
                        var d = new Date(e.added_on);
                        messageList.push({
                            message: e.message,
                            user: name,
                            time: d.getFullYear() + '-' + d.getMonth() + '-' + d.getDay() + ' ' + d.getHours() + ':' + d.getMinutes() + ':' + d.getSeconds()
                        });
                    });
                    res.status(200).json({status: 'success', object: obj, messages: messageList});
                });
            });
        }else{
            res.status(500).json({status:'error'});
        }

    });

});

ticket.put('/:id',isGuest,(req,res,next)=>{
    Tickets.findOne({
        user_id: req.body.user.id,
        _id: req.params.id
    }).then((obj)=>{
        obj.subject= req.body.subject;
        obj.message = req.body.message;
        obj.save((saved)=>{
            res.status(200).json({status:'success',object:saved});
        }).catch((err)=>{
            res.status(500).json({status:'error'});
        })
    })
});

ticket.post('/',isGuest,(req,res,next)=>{
    Tickets.findOne({
        user_id: req.body.user.id
    }).then((err,obj)=>{
        if(obj){
            res.status(200).json({status:'error'});
        }
        else{
            const ticket = new Tickets({
                user_id: req.body.user.id,
                subject: req.body.subject,
                message: req.body.message,
                status: "open"
            });
            ticket.save().then((saved)=>{
                if(saved)
                    res.status(200).json({status:'success',object:saved});
                else
                    res.stats(500).json({status:'error',message: saved});
            })
        }
    })
});

module.exports = ticket;
