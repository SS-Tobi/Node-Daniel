const plans = require('express').Router();
const isGuest = require('../../shared/isGuest');
const isAdmin = require('../../shared/isAdmin');
const Plans = require('../../schemas/Plans');
const UserBillingHistory = require('../../schemas/UserBillingHistory');
const User = require('../../schemas/User');
const common = require('../../shared/commons');
const config = require('../../config');
var stripe = require('stripe')(config.STRIPE.secret_key);

plans.get('/confirm-activation',isGuest,(req,res,next)=>{
    User.findOne({
        _id:req.body.user.id
    }).then(async (user) => {
        var date = new Date();
        let currentTimeZone = date.getTime()/1000;
        if(user.plan_expiry>currentTimeZone){
            res.status(200).json({
                status: 'success',
                message:'Your account has been activated.',
                token: user.generateToken()
            })
        }
    }).catch(error=>{
        res.status(500).json({status:'error',message:'User not found'});
    });
});

plans.get('/',isGuest,(req,res,next)=>{
    Plans.find({
    }).then(data=>{
        res.status(200).json(data);
    })
});

/*plans.get('/deleteallplans',(req,res,next)=>{
    stripe.plans.list(
        {limit: 250},
        function(err, plans) {
            plans.data.forEach(plan=>{
                stripe.plans.del(
                    plan.id,
                    function(err, confirmation) {
                        if(!err){
                            console.log(plan.id+" ==> plan deleted");
                        }
                    },
                );
            });
        }
    );
    res.status(200).json({status:'success'});
});

plans.get('/deleteallproducts',(req,res,next)=>{
    stripe.products.list(
        {limit: 250},
        function(err, products) {
            products.data.forEach(product=>{
                stripe.products.del(
                    product.id,
                    function(err, confirmation) {
                        if(!err){
                            console.log(product.id+" ==> product deleted");
                        }
                    },
                );
            });
        }
    );
    res.status(200).json({status:'success'});
});*/

plans.delete('/:id',isAdmin,(req,res,next)=>{
    Plans.findOne({
        _id: req.params.id
    }).then((obj)=> {
        obj.deleteFromStripe();
        Plans.deleteOne({
            _id: req.params.id
        }).then((obj) => {
            res.status(200).json({status: 'success'});
        })
    });
})

plans.get('/:id',isGuest,(req,res,next)=>{
    Plans.findOne({
        _id: req.params.id
    }).then((obj)=>{
        res.status(200).json({status:'success',object:obj});
    })
})

plans.put('/:id',isAdmin,(req,res,next)=>{
    Plans.findOne({
        _id: req.params.id
    }).then((obj)=>{
        obj.name= req.body.name;
        obj.monthly_price = req.body.monthly_price;
        obj.yearly_price = req.body.yearly_price;
        obj.description = req.body.description;
        obj.update_interval = req.body.update_interval;
        obj.save((saved)=>{
            obj.updateStripe();
            res.status(200).json({status:'success',object:saved});
        }).catch((err)=>{
            res.status(500).json({status:'error'});
        });
    })
})

plans.post('/',isAdmin,(req,res,next)=>{

    const plan = new Plans({
        name: req.body.name,
        monthly_price: req.body.monthly_price,
        yearly_price: req.body.yearly_price,
        description: req.body.description,
        update_interval: req.body.update_interval,
    });

    plan.save().then((saved)=>{
        if(saved) {
            saved.updateStripe();
            res.status(200).json({status: 'success', object: saved});
        }
        else {
            res.stats(500).json({status: 'error', message: saved});
        }
    })

});

plans.post('/buy-now',isGuest,(req,res,next)=>{
    Plans.findOne({
        _id: req.body.id
    }).then((obj)=>{
        (async () => {
            let planId = obj.stripe_monthly_plan_id;
            let letPlayType = "monthly";
            let playAmountSite = obj.monthly_price;

            if(req.body.duration=="yearly"){
                planId = obj.stripe_yearly_plan_id;
                letPlayType = "yearly";
                playAmountSite = obj.yearly_price;
            }

            /*const session = await stripe.checkout.sessions.create({
                payment_method_types: ['card'],
                subscription_data: {
                    items: [{
                        plan: planId,
                    }],
                },
                customer_email: req.body.user.email,
                success_url: config.WEBSITE_PATH + "payment/success",
                cancel_url: config.WEBSITE_PATH + "payment/failed",
            });

            const billingHistory = new UserBillingHistory({
                user_id: req.body.user.id,
                user_email: req.body.user.email,
                stripe_session_id: session.id,
                plan_id: obj._id,
                stripe_plan_id: planId,
                amount: playAmountSite,
                plan_type: letPlayType,
                payment_status: 'pending',
            });

            billingHistory.save().then((saved)=>{
                if(saved) {
                    console.log(saved);
                    res.status(200).json({status: 'success', public_key: config.STRIPE.publishable_key ,object: session});
                }
                else {
                    res.stats(500).json({status: 'error', message: 'Failed to complete your request.'});
                }
            });*/

            User.findOne({
                _id:req.body.user.id
            }).then(async (user) => {

                let stripeCustomerId = user.stripe_customer_id ? user.stripe_customer_id : '';

                if (stripeCustomerId !== '') {
                    const session = await stripe.checkout.sessions.create({
                        payment_method_types: ['card'],
                        subscription_data: {
                            items: [{
                                plan: planId,
                            }],
                        },
                        customer: stripeCustomerId,
                        success_url: config.WEBSITE_PATH + "payment/success",
                        cancel_url: config.WEBSITE_PATH + "payment/failed",
                    });

                    console.log(session);
                    res.status(200).json({status: 'success', public_key: config.STRIPE.publishable_key ,object: session});
                } else {
                    //create customer
                    stripe.customers.create({
                        email: user.email,
                        name: user.name,
                    }, function(err, customer) {
                        if(err){
                            res.status(500).json({status: 'error',message: 'Customer not created.'});
                        }else{
                            user.stripe_customer_id = customer.id;
                            user.save(async function (err) {
                                if (err) {
                                    res.status(500).json({
                                        status: 'error',
                                        message: 'Failed to update stripe customer id.'
                                    });
                                } else {

                                    const session = await stripe.checkout.sessions.create({
                                        payment_method_types: ['card'],
                                        subscription_data: {
                                            items: [{
                                                plan: planId,
                                            }],
                                        },
                                        customer: customer.id,
                                        success_url: config.WEBSITE_PATH + "payment/success",
                                        cancel_url: config.WEBSITE_PATH + "payment/failed",
                                    });

                                    console.log(session);
                                    res.status(200).json({
                                        status: 'success',
                                        public_key: config.STRIPE.publishable_key,
                                        object: session
                                    });
                                }

                            });
                        }
                    });
                }

            }).catch(error=>{
                console.log(error);
                res.status(500).json({status: 'error',message: 'User not found'});
            })

        })();
    });
});


module.exports = plans;
