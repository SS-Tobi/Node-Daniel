const instagram = require('express').Router();
const isGuest = require('../../shared/isGuest');
const cloudscraper = require('cloudscraper');
const ENDPOINT = 'https://socialblade.com/instagram/user/';
const commons = require('../../shared/commons');

instagram.get('/instagram',isGuest,(req,res,next)=>{

})



instagram.parseSocialBlade = function(page,cb){


    let media_re = /<span class="YouTubeUserTopLight">Media Uploads<\/span><br>\s*<span style="font-weight: bold;">([0-9,]+)<\/span>/g;

    let followers_re = /<span class="YouTubeUserTopLight">Followers<\/span><br>\s*<span style="font-weight: bold;">([0-9,]+)<\/span>/g;

    let following_re = /<span class="YouTubeUserTopLight">Following<\/span><br>\s*<span style="font-weight: bold;">([0-9,]+)<\/span>/g;

    let engagement_re = /<span class="YouTubeUserTopLight" sty>Engagement Rate<\/span>\s*.*<br>\s*<span style="font-weight: bold;">\s*([0-9\.,%]+)\s*<\/span>/g;

    cloudscraper.get(ENDPOINT+page).then(
        (r)=>{
            console.log("Got Instagram SB data for "+ page);

            //get
            let matches = r.match(media_re);

            let media = commons.getNumbersFromHTML(matches[0]);

            matches = r.match(followers_re);
            let followers = commons.getNumbersFromHTML(matches[0]);

            matches = r.match(following_re);
            let following = commons.getNumbersFromHTML(matches[0]);

            matches = r.match(engagement_re);
            console.log("Enagement match",matches);
            let engagement = commons.getNumbersFromHTML(matches[0]);

            const data = {
                page: page,
                media: media,
                followers: followers,
                following: following,
                engagement_rate:engagement,
            };

            cb(data);


        },
        (err)=>{
            console.log("Got error ", err);
        }
    );


}

module.exports = instagram;
