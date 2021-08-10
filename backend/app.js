const express = require("express");
const mongoose = require("mongoose");
const app = express();
const cors = require("cors");
const bodyParser = require("body-parser");
const payment = require('./modules/payment/payment');
const googleplay = require('google-play-scraper');
const AppStore = require('app-store-scraper');
const isGuest = require('./shared/isGuest')
//for payment gateway ipns only
app.use('/api/modules/payment', bodyParser.raw({type: 'application/json'}),payment);

const api = require('./api');
app.use(cors());

app.use(bodyParser.json());


mongoose.connect("mongodb+srv://db:teamOxioRocks@mean-test-2gucu.mongodb.net/mean?retryWrites=true&w=majority")
    .then(()=>console.log("Connected"));


app.use('/api',api);

app.post('/SearchStore', isGuest, async (req, res) => {
	try {
		var max_pages = 10
		var reviews_to_show = 5000
		if (req.body.hasOwnProperty('max_pages'))
		{
			max_pages = req.body.max_pages
		}
		if (req.body.hasOwnProperty('reviews_to_show'))
		{
			reviews_to_show = req.body.reviews_to_show
		}
		googleplay
			.search({
				term: req.body.SearchTerm,
				num: 1,
			})
			.then((google_play_app_id) => {
				console.log('Google play app id: ' + google_play_app_id[0].appId);

				googleplay
					.reviews({
						appId: google_play_app_id[0].appId,
						num: reviews_to_show,
					})
					.then((google_play_results) => {
						AppStore.search({
							term: req.body.SearchTerm,
							num: 1,
						})
							.then((app_store_app_id) => {
								console.log('App store app id: ' + app_store_app_id[0].appId);

								AppStore.reviews({
									appId: app_store_app_id[0].appId,
									page: max_pages,
								})
									.then((app_store_res) => {
										return res.status(200).json({
											Error: 0,
											ErrorMessage: '',
											Response: {
												google_play_results: google_play_results,
												app_store_results: app_store_res,
											},
										});
									})
									.catch((err) => {
										console.log(err);
										return res.status(200).json({
											Error: 0,
											ErrorMessage: '',
											Response: {
												google_play_results: google_play_results,
												app_store_results: [],
											},
										});
									});
							})
							.catch((err) => {
								console.log(err);
								return res.status(200).json({
									Error: 0,
									ErrorMessage: '',
									Response: {
										google_play_results: google_play_results,
										app_store_results: [],
									},
								});
							});
					})
					.catch((err) => {
						console.log(err);
						return res.status(400).json({
							Error: 1,
							ErrorMessage: 'Unable to find reviews for this app!',
							Response: '',
						});
					});
			})
			.catch((err) => {
				console.log(err);
				AppStore.search({
					term: req.body.SearchTerm,
					num: 1,
				})
					.then((app_store_app_id) => {
						console.log('App store app id: ' + app_store_app_id[0].appId);

						AppStore.reviews({
							appId: app_store_app_id[0].appId,
							page: max_pages,
						})
							.then((app_store_res) => {
								return res.status(200).json({
									Error: 0,
									ErrorMessage: '',
									Response: {
										google_play_results: [],
										app_store_results: app_store_res,
									},
								});
							})
							.catch((err) => {
								console.log(err);
								return res.status(200).json({
									Error: 0,
									ErrorMessage: '',
									Response: { google_play_results: google_play_results, app_store_results: [] },
								});
							});
					})
					.catch((err) => {
						console.log(err);
						return res.status(400).json({
							Error: 1,
							ErrorMessage: 'Unable to find reviews for this app!',
							Response: '',
						});
					});
			});
	} catch (err) {
		console.log(err);
		return res
			.status(400)
			.json({ Error: 1, ErrorMessage: 'Unable to find reviews for this app!', Response: '' });
	}
});

// whmcs.registerDomain("anothernicedomainforuser2.com",5,(response)=>{
//     if(response.status == 'success')
//         console.log("Domain registered successfully ",
//             "Order id = "+response.data.order_id,"Domain ID "+ response.data.domain_id);
//     else
//         console.log("Error in registering domain",response.message)
// });


/*
//all our models
const Product = require("./schemas/Product");




app.post("/api/products",(req,res,next)=>{

    const product = new Product({
      name:req.body.name,
      description:req.body.description,
      price:Number(req.body.price)
    });


    product.save();

    res.status(200).json({message:"Done dona done"});
})

app.get("/api/products",(req,res,next)=>{
    Product.find().then((data)=>{
      res.status(200).json(
          data);
    })

});

*/

module.exports = app;
