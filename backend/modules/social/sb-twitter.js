const twitter = require('express').Router();
const isGuest = require('../../shared/isGuest');
const cloudscraper = require('cloudscraper');
const ENDPOINT = 'https://socialblade.com/twitter/user/';
const commons = require('../../shared/commons');

twitter.get('/twitter',isGuest,(req,res,next)=>{

})



twitter.parseSocialBlade = function(page,cb){


    let followers_re = /<span class="YouTubeUserTopLight">Followers<\/span><br>\s*<span style="font-weight: bold;">([0-9,]+)<\/span>/g;

    let following_re = /<span class="YouTubeUserTopLight">Following<\/span><br>\s*<span style="font-weight: bold;">([0-9,]+)<\/span>/g;

    let likes_re = /<span class="YouTubeUserTopLight">Likes<\/span><br>\s*<span style="font-weight: bold;">([0-9,]+)<\/span>/g;

    let tweets_re = /<span class="YouTubeUserTopLight">Tweets<\/span><br>\s*<span style="font-weight: bold;">([0-9,]+)<\/span>/g;

    cloudscraper.get(ENDPOINT+page).then(
        (r)=>{
            console.log("Got Twitter SB data for " + page);

            //get
            let matches = r.match(followers_re);
            let followers = commons.getNumbersFromHTML(matches[0]);

            matches = r.match(following_re);
            let following = commons.getNumbersFromHTML(matches[0]);

            matches = r.match(likes_re);
            let likes = commons.getNumbersFromHTML(matches[0]);

            matches = r.match(tweets_re);
            let tweets = commons.getNumbersFromHTML(matches[0]);

            const data = {
                page: page,
                followers: followers,
                following: following,
                likes: likes,
                tweets:tweets,
            };

            cb(data);


        },
        (err)=>{
            console.log("Got error ", err);
        }
    );


}

module.exports = twitter;
