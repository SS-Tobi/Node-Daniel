const facebook = require('express').Router();
const isGuest = require('../../shared/isGuest');
const commons = require('../../shared/commons');
const cloudscraper = require('cloudscraper');
const ENDPOINT = 'https://socialblade.com/facebook/page/';

facebook.get('/fb',isGuest,(req,res,next)=>{

})

facebook.checkExistence = function (page,cb){
    console.log("checking facebook existence of"+page);
    cloudscraper.get(ENDPOINT+page).then(
    (r)=> {
        let test = /Uh Oh!/i.test(r);
        cb(!test);
    },(err)=>{
        cb(false);
    });
}


facebook.parseSocialBlade = function(page,cb){


    //32,969,935 page likes | 78,034 talking about this
    let page_likes_re = /[0-9,]+ (page likes|talking about this)/g;

    let grade_re = /<p style="font-size: 2\.5em; font-weight: bold; color: #666; margin-top: -15px;"><span style ='color:#.*;'>([A-Za-z\-\+]{1,5})<\/span>/g;

    let likes_rank_re = /<p style="font-size: 1\.6em; color: #41a200; padding-top: 10px; font-weight: 600; margin-top: -15px;">([A-Za-z0-9,]+)<\/p>\s*<p style="color:#888; font-size: 10pt;">LIKES RANK<\/p>/g;

    cloudscraper.get(ENDPOINT+page).then(
        (r)=>{
            console.log("Got FB SB data for "+ page );

            //get
            let matches = r.match(page_likes_re);
            let page_likes = matches[0].replace(' page likes','');
            let talking_about = matches[1].replace(' talking about this','');

            let grade = "N/A";
            let grade_matches = r.match(grade_re);
            if(grade_matches){
                grade = commons.getTextFromHTML(grade_matches[0]);
            }

            let likes_rank_matches = r.match(likes_rank_re);

            let likes_rank = 'N/A';

            if(likes_rank_matches){
                likes_rank = commons.getTextFromHTML(likes_rank_matches[0]).replace('LIKES RANK','');

                let temp = likes_rank.split("\r");
                likes_rank = temp[0].replace('undefined','').trimRight();
            }

            const data = {
              page: page,
              page_likes: page_likes,
              talking_about: talking_about,
              grade:grade,
              likes_rank: likes_rank

            };

            cb(data);

        },
        (err)=>{
            console.log("Got error ", err);
        }
    );

}

module.exports = facebook;
