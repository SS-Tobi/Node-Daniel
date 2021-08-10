const mongoose = require("mongoose");
const assert= require('assert');
const commons= require('../shared/commons');
const UserBillingHistory = require('./UserBillingHistory');
const config = require('../config');
const User = require('./User');
var stripe = require('stripe')(config.STRIPE.secret_key);

const PlansSchema = mongoose.Schema({
    name:{type:String,required:true},
    monthly_price:{type: Number, required: true},
    yearly_price:{type: Number, required: true},
    description:{type: String, required: true},
    update_interval:{type: Number, required: true},
    updated_on:{type:String,required:true},
    stripe_product_id:{type:String},
    stripe_monthly_plan_id:{type:String},
    stripe_yearly_plan_id:{type:String},
})

PlansSchema.pre('validate',function (next){
    // this.added_on = new Date().toISOString();
    this.updated_on = new Date().toISOString();
    const error = this.validateSync();
    assert.equal(error, null);
    next();
})

PlansSchema.methods.deleteFromStripe = function(){
    console.log("==> "+this._id);
    this.model('Plans').findOne({
        _id: this._id
    }).then((obj)=> {
        let stripId = null;
        if ('stripe_product_id' in obj){
            stripId = obj.stripe_product_id;
        }
        console.log("==> "+ stripId+ "  "+typeof  stripId);
        if (stripId !== undefined) {

            const monthlyPlanId = obj.stripe_monthly_plan_id;
            const yearlyPlanId = obj.stripe_yearly_plan_id;

            stripe.products.del(
                stripId,
                function(err, confirmation) {
                    if(err){
                        console.log("Failed to delete stripe product");
                    }else{
                        console.log("Stripe product deleted");
                        stripe.plans.del(
                            monthlyPlanId,
                            function(err, confirmation) {
                                if(err){
                                    console.log("Failed to delete monthly plan");
                                }else{
                                    console.log("Stripe monthly plan deleted");
                                }
                            }
                        );
                        stripe.plans.del(
                            yearlyPlanId,
                            function(err, confirmation) {
                                if(err){
                                    console.log("Failed to delete yearly plan");
                                }else{
                                    console.log("Stripe yearly plan deleted");
                                }
                            }
                        );
                    }
                },
            );
        }
    });
}

PlansSchema.methods.assignToUser = function(paymentIntent,cb){
    console.log(this);
    let stripePlan = paymentIntent.plan;
    User.findOne({
        stripe_customer_id:paymentIntent.customer
    }).then((user)=>{
        user.plan_id = this._id;
        if(stripePlan.interval=="month") {
            user.plan_type = "monthly";
        }else{
            user.plan_type = "yearly";
        }
        user.stripe_subscription_id = paymentIntent.id;
        user.plan_expiry = paymentIntent.current_period_end;
        user.save(function (err){
            if(err) {
                cb("Error while assign plan to user at last",'');
            }
            else
            {
                UserBillingHistory.findOne({
                    user_id: user._id,
                    stripe_plan_id: stripePlan.id,
                    payment_status: 'pending'
                }).then((history)=>{

                    history.payment_status = 'completed';
                    history.stripe_subscription_id = paymentIntent.id;
                    history.plan_starting = paymentIntent.current_period_start;
                    history.plan_expiry = paymentIntent.current_period_end;

                    history.save(function (err) {
                        if(err){
                            console.log("Failed to mark billing as completed");
                            cb("","Plan has been successfully assigned to user.");
                        }else{
                            cb("","Plan has been successfully assigned to user.");
                        }
                    });

                }).catch(error=>{
                    console.log("Failed to mark billing as completed.");
                    cb("","Plan has been successfully assigned to user.");
                });
            }
        });
    }).catch(error=>{
        cb(error,'');
    });
}

PlansSchema.methods.updateStripe = function(){
    console.log("==> "+this._id);
    this.model('Plans').findOne({
        _id: this._id
    }).then((obj)=> {

        let stripId = null;

        if ('stripe_product_id' in obj){
            stripId = obj.stripe_product_id;
        }

        console.log("==> "+ stripId+ "  "+typeof  stripId);

        if (stripId === undefined) {
            //new product
            stripe.products.create({
                name: obj.name,
                type: 'service',
            }, function (err, product) {
                if (err) {
                    console.log("Product not saved");
                    return false;
                } else {
                    stripId = product.id;
                    //save product id
                    obj.stripe_product_id = stripId;
                    obj.save(function (err){
                        if(err){
                            console.log(err);
                            console.log("product id not saved");
                            return false;
                        }
                    });

                    stripe.plans.create({
                        amount: obj.monthly_price*100,
                        interval: "month",
                        product: stripId,
                        currency: "usd",
                    }, function (err, plan) {
                        // asynchronously called
                        if (err) {
                            console.log("Monthly plan not saved");
                            return false;
                        } else {
                            //save plan id
                            obj.stripe_monthly_plan_id = plan.id;
                            obj.save(function (err){
                                if(err){
                                    console.log("Monthly plan id not saved");
                                    return false;
                                }
                            });

                            stripe.plans.create({
                                amount: obj.yearly_price*100,
                                interval: "year",
                                product: stripId,
                                currency: "usd",
                            }, function (err, plan) {
                                // asynchronously called
                                if (err) {
                                    console.log("Yearly plan not saved");
                                    return false;
                                } else {
                                    //save plan id
                                    obj.stripe_yearly_plan_id = plan.id;
                                    obj.save(function (err){
                                        if(err){
                                            console.log("yearly plan id not saved");
                                            return false;
                                        }else{
                                            return true;
                                        }
                                    });
                                }
                            });
                        }
                    });
                }
            });
        } else {
            //old product
            stripe.products.update(stripId, {
                name: obj.name,
            }, function (err, product) {
                if (err) {
                    console.log("Product not update");
                    return false;
                } else {
                    stripId = product.id;
                    //save product id
                    obj.stripe_product_id = stripId;
                    obj.save(function (err){
                        if(err){
                            console.log("Product id not update");
                            return false;
                        }
                    });

                    //check monthly plan for changes
                    stripe.plans.retrieve(
                        obj.stripe_monthly_plan_id,
                        function (err, plan) {
                            if (err) {
                                console.log("monthly plan not found");
                                return false;
                            } else {
                                let monthlyPlanAmount = plan.amount/100;
                                if (monthlyPlanAmount != obj.monthly_price) {
                                    //delete only if price is changed
                                    stripe.plans.del(
                                        obj.stripe_monthly_plan_id,
                                        function (err, confirmation) {
                                            if (err) {
                                                console.log("monthly plan not deleted");
                                                return false;
                                            } else {
                                                //create new monthly plan as amount is not update able
                                                stripe.plans.create({
                                                    amount: obj.monthly_price*100,
                                                    interval: "month",
                                                    product: stripId,
                                                    currency: "usd",
                                                }, function (err, plan) {
                                                    if (err) {
                                                        console.log("monthly plan not update");
                                                        return false;
                                                    } else {
                                                        obj.stripe_monthly_plan_id = plan.id;
                                                        obj.save(function (err){
                                                            if(err){
                                                                console.log("monthly plan id not update");
                                                                return false;
                                                            }
                                                        });
                                                    }
                                                });
                                            }
                                        }
                                    );
                                }
                            }
                        }
                    );

                    //check yearly plan for changes
                    stripe.plans.retrieve(
                        obj.stripe_yearly_plan_id,
                        function (err, plan) {
                            if (err) {
                                console.log("yearly plan not found");
                                return false;
                            } else {
                                let yearlyPlanAmount = plan.amount/100;
                                if (yearlyPlanAmount != obj.yearly_price) {
                                    //delete only if price is changed
                                    stripe.plans.del(
                                        obj.stripe_yearly_plan_id,
                                        function (err, confirmation) {
                                            if (err) {
                                                console.log("yearly plan not deleted");
                                                return false;
                                            } else {
                                                //create new monthly plan as amount is not update able
                                                stripe.plans.create({
                                                    amount: obj.yearly_price*100,
                                                    interval: "year",
                                                    product: stripId,
                                                    currency: "usd",
                                                }, function (err, plan) {
                                                    if (err) {
                                                        console.log("yearly plan not update");
                                                        return false;
                                                    } else {
                                                        obj.stripe_yearly_plan_id = plan.id;
                                                        obj.save(function (err){
                                                            if(err){
                                                                console.log("Product plan id not update");
                                                                return false;
                                                            }
                                                        });
                                                    }
                                                });
                                            }
                                        }
                                    );
                                }
                            }
                        }
                    );
                    return true;
                }
            });

        }
    }).catch(error=>{
       console.log(error);
        console.log("Catch error");
       return false;
    });
}

module.exports = mongoose.model('Plans',PlansSchema);
