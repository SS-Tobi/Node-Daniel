const { google } = require('googleapis')
const analytics = require('express').Router();
const isGuest = require('../../shared/isGuest');
const User = require('../../schemas/User');
//const key = require('../../google.json');
const scopes = 'https://www.googleapis.com/auth/analytics.readonly';



analytics.get("/overview",isGuest,(req,res,next)=>{
    User.findOne({
        _id:req.body.user.id
    }).then((user)=>{
        if(!user){
            res.status(403).json({status:'error',message:'Not logged in'});
        }
        else{

            if(user.role=="admin"){

                User.findOne({
                    _id:req.query._id
                }).then((user)=> {
                    if (!user) {
                        res.status(403).json({status: 'error', message: 'Not logged in'});
                    }
                });

            }

            console.log("Getting analytics");
            user.getSettings('analytics',function (err,config){

                if(err){
                    res.status(200).json({status:'error'});
                }
                else{



                    const jwt = new google.auth.JWT(config.client_email, null,
                        config.private_key, scopes)
                    const view_id = config.view_id;
                    console.log("Using view id",config.view_id);

                    jwt.authorize((err, response) => {
                        google.analytics('v3').data.ga.get(
                            {
                                auth: jwt,
                                ids: 'ga:' + view_id,
                                'start-date': '30daysAgo',
                                'end-date': 'today',
                                dimensions:'ga:date',
                                metrics: 'ga:sessions,ga:bounces,ga:sessionDuration,ga:hits,' +
                                    'ga:bounceRate,ga:avgSessionDuration,ga:avgServerResponseTime' +
                                    ',ga:avgPageLoadTime'
                            },
                            (err, result) => {
                                console.log("Analytics 2 results");



                                if(err)
                                    res.status(200).json({status:'error'});
                                else{
                                    const analytics_data = result.data.totalsForAllResults;
                                    const chart_data = result.data.rows;
                                    const chart_headers = result.data.columnHeaders;
                                    res.status(200).json({
                                        status:'success',
                                        data:analytics_data,
                                        chart_data: chart_data,
                                        chart_headers: chart_headers
                                    })
                                }
                            }
                        )
                    })


                }
            });
        }
    })


})





module.exports = analytics;
