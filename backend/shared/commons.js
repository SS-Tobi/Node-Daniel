const htmlStrip = /<[^>]+>/g;
const numberRegex = /[0-9,%\.]+/;
const url = require("url");
const loadtest = require("loadtest");
const nodemailer = require('nodemailer');
const config = require('../config');

module.exports = {

    validURL(input) {
        var pattern = new RegExp('^(https?:\\/\\/)?'+ // protocol
            '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // domain name
            '((\\d{1,3}\\.){3}\\d{1,3}))'+ // OR ip (v4) address
            '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // port and path
            '(\\?[;&a-z\\d%_.~+=-]*)?'+ // query string
            '(\\#[-a-z\\d_]*)?$','i'); // fragment locator
        return !!pattern.test(input);
    },
    parseSocialLinks(input){
        if(this.validURL(input))
        {
            //explode and store
            if(input.indexOf("http://") == -1 && input.indexOf("https://") == -1)
                input = "https://"+input;

            const myURL = new URL(input);
            return myURL.pathname.substr(1);
        }
        return input;
    },

    getTextFromHTML(string){
        return string.replace(htmlStrip,'');
    },

    getNumbersFromHTML(string){
        string = this.getTextFromHTML(string);
        let numbers = string.match(numberRegex);
        if(numbers.length>1)
            return numbers;
        else
            return numbers[0];
    },
    addhttp(url) {
        if (!/^(?:f|ht)tps?\:\/\//.test(url)) {
            url = "http://" + url;
        }
        return url;
    },

    getWebsiteLoadSpeed(url,cb){
        url = this.addhttp(url);
        loadtest.loadTest({
            url:url,
            statusCallback: function (error,result,latency){

                cb(error,latency.totalTimeSeconds);
            },
            maxRequests: 1
        });
    },

    generateRandomString(length=10) {
        var result           = '';
        var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        var charactersLength = characters.length;
        for ( var i = 0; i < length; i++ ) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
        return result;
    },

    sendEmail(to,subject,message){
        console.log("Message to send");
        console.log("To "+to);
        console.log("Subject "+subject);
        console.log(message);
        this.sendEmailViaTransPort(to,subject,message).catch(
            error=>{
                console.log("Email Not sent");
                console.log(error);
            }
        )
    },

    async sendEmailViaTransPort(to,subject,message){
        let testAccount = await nodemailer.createTestAccount();

        // create reusable transporter object using the default SMTP transport
        let transporter = nodemailer.createTransport(config.MAIL);

        // send mail with defined transport object
        let info = await transporter.sendMail({
            from: '"no-reply" <no-reply@iologue.co>', // sender address
            to: to, // list of receivers
            subject: subject, // Subject line
            text: message, // plain text body
            html: message // html body
        });

        console.log('Message sent: %s', info.messageId);
        // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>

        // Preview only available when sending through an Ethereal account
        console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
        // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
    },
};
