const cronjob = require('cron').CronJob;
const Competitor = require('./schemas/Competitors');
const SocialProfile = require('./schemas/SocialProfile');
const config = require('./config');


new cronjob('0 */5 * * * *',function (){
    console.log("Fetching sb data for competitors");
    Competitor.find().then((data)=>{
        data.map(function (k,i){
            data[i].updateStats();
            data[i].checkSpeed();
        })

    });

    if(config.CRON_ONCE)
        this.stop();

},null,config.RUN_CRON);

new cronjob('0 */5 * * * *',function (){
    console.log("Fetching data for user's social links");
    SocialProfile.find().then((data)=>{
        data.map(function (k,i){
            data[i].updateStats(data[i].type);

        })

    });

    if(config.CRON_ONCE)
        this.stop();

},null,config.RUN_CRON);
