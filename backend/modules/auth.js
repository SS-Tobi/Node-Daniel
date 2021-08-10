const auth = require('express').Router();
const User = require('../schemas/User');
const jwt = require('jsonwebtoken');
const config = require('../config');
const SECRET = config.SECRET;

auth.post('/login', (req, res, next) => {

    User.findOne({email: req.body.email}).then((data) => {
        if (data && data.login(req.body.password)) {
            const token = data.generateToken();
            res.status(200).json({success: true, token: token, on_boarding: data.on_boarding})
        } else {
            res.status(403).json({success: false})
        }
    })
})

auth.post('/register', (req, res, next) => {
    const final_response = {status: 'error'};
    const user = new User();

    Object.assign(user, req.body);
    user.role = 'user';

    console.log("Final user ", user);


    user.save().then((response) => {
        final_response.status = 'success';
        final_response.id = response._id;
        res.status(200).json(final_response);

    }).catch((err) => {
        final_response.errors = err.errors;
        res.status(200).json(final_response);

    });

});

auth.post('/reset', (req, res, next) => {
    let message = 'Failed to reset password';
    User.findOne({code: req.body.code}).then((user) => {
        if (user) {
            user.hash = user.generatePasswordHash(req.body.new_password);
            user.code = '';
            user.save(function (err) {
                if (err)
                    res.status(403).json({success: false,message:message});
                else {
                    res.status(200).json({
                        status: 'success',
                    });
                }
            })
        } else {
            let message = 'Invalid request.';
            res.status(403).json({success: false,message:message});
        }
    }).catch(error => {
        message = 'Invalid request';
        res.status(403).json({success: false,message:message});
    });
});

module.exports = auth;
