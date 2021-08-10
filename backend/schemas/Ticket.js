const mongoose = require("mongoose");
const assert= require('assert');
const Tickets= require('./Ticket');

const TicketsSchema = mongoose.Schema({
    ticket_id:{type: String,required:true,unique:true},
    user_id:{type: String,required:true},
    subject:{type:String,required:true},
    message:{type:String,required:true},
    status:{
        type:String,required:true,
        enum: ['open','closed']
    },
    closed_by:{
        type:String,
        enum: ['user','admin']
    },
    added_on:{type:String,required:true},
    updated_on:{type:String,required:true},
});

TicketsSchema.pre('validate',function (next){
    if(this.isNew) {
        this.ticket_id = "TKT"+new Date().getTime();
        this.added_on = new Date().toISOString();
    }
    this.updated_on = new Date().toISOString();
    const error = this.validateSync();
    assert.equal(error, null);
    next();
});

module.exports = mongoose.model('Tickets',TicketsSchema);
