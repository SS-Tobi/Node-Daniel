const mongoose = require("mongoose");
const assert= require('assert');

const UserBillingHistorySchema = mongoose.Schema({
    user_id:{type:String,required:true},
    user_email:{type:String,required:true},
    stripe_session_id:{type:String,required:true},
    stripe_subscription_id:{type:String},
    plan_id:{type:String,required:true},
    stripe_plan_id:{type:String,required:true},
    plan_starting:{type:String},
    plan_expiry:{type:String},
    amount:{type:String,required:true},
    plan_type:{
        type:String,required:true,
        enum: ['monthly','yearly']
    },
    payment_status:{
        type:String,required:true,
        enum: ['pending','completed','failed']
    },
    updated_on:{type:String,required:true},
});

UserBillingHistorySchema.pre('validate',function (next){
    this.updated_on = new Date().toISOString();
    const error = this.validateSync();
    assert.equal(error, null);
    next();
});

module.exports = mongoose.model('UserBillingHistory',UserBillingHistorySchema);
