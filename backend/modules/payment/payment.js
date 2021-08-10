const payment = require('express').Router();
const isGuest = require('../../shared/isGuest');
const isAdmin = require('../../shared/isAdmin');
const Plans = require('../../schemas/Plans');
const User = require('../../schemas/User');
const common = require('../../shared/commons');
const config = require('../../config');
var stripe = require('stripe')(config.STRIPE.secret_key);
var request = require('request');
const bodyParser = require("body-parser");

payment.post('/stripe-ipn',(req,res,next)=>{
    //stripe ipn
    let eventType;
    let endpointSecret = 'whsec_VaFnBznNMdQGL5vZne3o5r3yi67VhSBk';
    const sig = req.headers['stripe-signature'];
    let event;
    try {
        event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
        console.log(`Webhook Error: ${err.message}`);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    const paymentIntent = event.data.object;
    eventType = event.type;
    console.log("===> Event Received "+eventType);

    // Handle the event
    switch (eventType) {
        case 'customer.subscription.updated':
            let stripePlan = paymentIntent.plan;
            //find plan
            if(stripePlan.interval=="month") {
                Plans.findOne({
                    stripe_monthly_plan_id:stripePlan.id
                }).then((plan)=>{
                    plan.assignToUser(paymentIntent,function (err,response) {
                        if(err!==''){
                            console.log("Failed to assign Monthly plan");
                            console.log(err);
                            return res.status(500).json({status:"error",message:"Failed to assign Monthly plan",error:err})
                        }
                        else{
                            return res.status(200).json({status:'success','message':'Monthly plan has been update'});
                        }
                    });
                }).catch(error=>{
                    console.log("Monthly plan not found");
                    return res.status(500).json({status:"error",message:"Monthly plan not found"})
                })
            }else{
                //yearly
                Plans.findOne({
                    stripe_yearly_plan_id:stripePlan.id
                }).then((plan)=>{
                    plan.assignToUser(paymentIntent,function (err,response) {
                        if(err!==''){
                            console.log("Failed to assign Yearly plan");
                            console.log(err);
                            return res.status(500).json({status:"error",message:"Failed to assign Yearly plan",error:err})
                        }
                        else{
                            return res.status(200).json({status:'success','message':'Yearly plan has been update'});
                        }
                    });
                }).catch(error=>{
                    console.log("Yearly plan not found");
                    return res.status(500).json({status:"error",message:"Yearly plan not found"})
                })
            }
            break;
        default:
            return res.status(400).end();
    }
});
module.exports = payment;
