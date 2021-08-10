const mongoose = require("mongoose");
const assert= require('assert');
const Tickets= require('./Ticket');

const TicketMessagesSchema = mongoose.Schema({
    ticket_id:{type: String,required:true},
    user_id:{type: String,required:true},
    message:{type:String,required:true},
    status:{
        type:String,required:true,
        enum: ['unread','read']
    },
    added_on:{type:String,required:true},
    updated_on:{type:String,required:true},
});

TicketMessagesSchema.pre('validate',function (next){
    if(this.isNew) {
        this.status = "unread";
        this.added_on = new Date().toISOString();
    }
    this.updated_on = new Date().toISOString();
    const error = this.validateSync();
    assert.equal(error, null);
    next();
});



module.exports = mongoose.model('TicketMessages',TicketMessagesSchema);
