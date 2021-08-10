const ticketMessage = require('express').Router();
const isGuest = require('../../shared/isGuest');
const Tickets = require('../../schemas/Ticket');
const TicketMessages = require('../../schemas/TicketMessages.js');
const common = require('../../shared/commons');
const User = require('../../schemas/User');

ticketMessage.get('/:id',isGuest,(req,res,next)=>{
    User.findOne({
        _id: req.body.user.id
    }).then((user)=> {

        var messageList = [];
        var hasMessage = false;

        TicketMessages.findOne({
            ticket_id: req.params.id,
            status: 'unread',
            user_id: { $ne: req.body.user.id }
        }).then(e => {
            let name = "Member";
            hasMessage = true;
            TicketMessages.update({_id:e._id},{status:'read'},function () {
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
                res.status(200).json({status: 'success',has_message : hasMessage, messages: messageList});
            });

        }).catch(error=>{
            res.status(200).json({status: 'success',has_message : false});
        });
    });
});

ticketMessage.post('/',isGuest,(req,res,next)=> {
    Tickets.findOne({
        _id: req.body.ticket_id
    }).then((obj,err) => {
        if (obj) {
            const ticketMessage = new TicketMessages({
                ticket_id: req.body.ticket_id,
                user_id: req.body.user.id,
                message: req.body.message,
            });
            ticketMessage.save().then((saved) => {
                if (saved)
                    res.status(200).json({status: 'success', object: saved});
                else
                    res.stats(500).json({status: 'error', message: saved});
            })
        } else {
            res.status(500).json({status: 'error'});
        }
    });
});

ticketMessage.get('/get-unread/:id',isGuest,(req,res,next)=> {
    Tickets.findOne({
        _id:req.params.id,
    }).then((obj,err) => {
        if (obj) {
            var messageList = null;
            TicketMessages.findOne({
                ticket_id:req.params.id,
                status:"unread",
                user_id: { $ne: req.body.user.id }
            }).then(e=>{
                if(e) {
                    let name = "Support";
                    if (obj.user_id == req.body.user.id) {
                        name = "User";
                    }
                    var d = new Date(e.added_on);
                    messageList = {
                        message: e.message,
                        user: name,
                        time: d.getFullYear() + '-' + d.getMonth() + '-' + d.getDay() + ' ' + d.getHours() + ':' + d.getMinutes() + ':' + d.getSeconds()
                    };
                    res.status(200).json({status: 'success', messages: messageList, has_message: true});
                }else{
                    res.status(200).json({status: 'success', messages: '', has_message: false});
                }
            });
        } else {
            res.status(500).json({status: 'error'});
        }
    });
});

ticketMessage.delete('/:id',isGuest,(req,res,next)=>{
    TicketMessages.deleteOne({
        user_id: req.body.user.id,
        _id: req.params.id
    }).then((obj)=>{
        res.status(200).json({status:'success'});
    })
});

module.exports = ticketMessage;
