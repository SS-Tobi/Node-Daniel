const request = require('request');
const crypto = require('crypto');
const Domain = require('../../schemas/Domain');

const whmcs = {
    config:{
        DOMAIN:'',
        USERNAME:'',
        PASSWORD:''
    },

    init(config){
        this.config  = config;
        this.sanityCheck();
    },

    sanityCheck(){

        Object.keys(this.config).map((key,index)=>{

            if(key=='PASSWORD')
                this.config.PASSWORD=crypto.
                createHash('md5').update(this.config[key]).digest('hex');

            console.log(this.config.PASSWORD);
            if(this.config[key]==undefined ||
            this.config[key]==""){


                console.log("WHMCS module isn't configured properly.");
                process.exit(1);
            }
        })
    },

    registerDomain(domain,cb){

        const final_response = {};

        //let's add an order first
        this.addOrder({
           domaintype:['register'],
           domain:[domain.domain],
            regperiod:[domain.years],
            nameserver1:domain.nameservers.ns1,
            nameserver2:domain.nameservers.ns2,
            nameserver3:domain.nameservers.ns3,
            nameserver4:domain.nameservers.ns4,

        },(err,response)=>{

            const order_response = response;
            console.log("OR = ",order_response);

            if(!err && response.result !='error') {
                this.sendRequest({
                    action: 'AcceptOrder',
                    orderid:order_response.orderid,
                    sendregistrar:true,
                    registrar:'namecheap'
                }, (err, response) => {
                    console.log("Accept order",response);

                    if (err || response.result=='error') {
                        final_response.status = 'error';
                        final_response.message = err;

                    } else {
                        final_response.status = 'success';
                        final_response.data = {
                            order_id:order_response.orderid,
                            domain_id:order_response.domainids,

                        };

                    }

                    cb(final_response);
                })
            }
            else{
                final_response.status = 'error';
                final_response.message = response.message;
                cb(final_response);
            }
        })

    },

    createHosting(domain,cb){

        const final_response = {};
        console.log("Creating hosting order");
        //let's add an order first
        this.addOrder({
                domain:[domain],
                pid: [1],


            },(err,response)=>{
            const order_response = response;
            console.log("OR = ",order_response);

            if(!err && response.result !='error') {
                this.acceptHosting(order_response.orderid,
                    order_response.productids,
                    function (accept_response){
                    if(accept_response){
                        //all good

                        final_response.status = 'success';
                        final_response.username = accept_response.username;
                        final_response.password = accept_response.password;
                    }
                    else{
                        final_response.status = 'error';
                        final_response.message = 'error in accepting order';
                    }
                        cb(final_response);
                })
            }
            else{

                final_response.status = 'error';
                final_response.message = response.message;
                cb(final_response);

            }
        });

    },
    acceptHosting(order_id,
                  service_id,
                  cb){

        const random_username =

            this.randomString(3) + crypto.randomBytes(5)
            .toString('hex');

        const random_password = crypto.randomBytes(10)
            .toString('hex');

        this.sendRequest({
            action: 'AcceptOrder',
            orderid: order_id,
            serviceusername: random_username,
            servicepassword: random_password
        }, (err, response) => {
            console.log("Accept order",response);

            if (err || response.result=='error') {
                cb(false);

            } else {
                this.sendRequest({
                    action: 'ModuleCreate',
                    serviceid: service_id
                }, (create_err, create_response) => {

                    console.log("MoC response ", create_response," mc err = ",err);

                    if(create_err ==null
                        && create_response.result == 'success') {

                        //all good
                        cb({
                            username: random_username,
                            password: random_password
                        });
                    }
                    else{
                        cb(false);
                    }


                });



            }


        })

    },
    updateNameservers(domain,nameservers,cb){
        const data = {};
        data.action = 'DomainUpdateNameservers';
        data.domain = domain;
        data.ns1 = nameservers.ns1;
        data.ns2 = nameservers.ns2;
        data.ns3 = nameservers.ns3;
        data.ns4 = nameservers.ns4;
        console.log("UpdateNS data",data);
        this.sendRequest(data,(err,response)=>{
            console.log("Domain NS updated er ",err," res", response);
            cb(err,response)
        })
    },
    addOrder(order_data,cb){

        const data = {};

        Object.assign(data,order_data);

        data.action = 'AddOrder';
        data.clientid = 2; //todo generate this
        data.paymentmethod= 'banktransfer'; //todo change this
        data.noinvoice = true;
        data.noinvoiceemail = true;


        this.sendRequest(data,(err,response)=>{
            console.log("Added order ", response," er", err);
            cb(err,response);
        })


    },

    sendRequest(data,cb){
        data.responsetype='json';
        data = this.addAuthFields(data);
        request.post(this.config.DOMAIN+
            'includes/api.php', {form:data}, (err,httpresponse,body)=>{
            console.log("Got response ",body);
            try {
                body = JSON.parse(body);
                cb(err, body);
            }
            catch(err){
                cb(err, body);
            }
        })
    },

    addAuthFields(data){
      data.username = this.config.USERNAME;
      data.password = this.config.PASSWORD;
      return data;
    },

    randomString(length) {
    var result           = '';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
    },


};


module.exports = whmcs;
