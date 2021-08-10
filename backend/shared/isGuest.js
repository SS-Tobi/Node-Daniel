const jwt = require('jsonwebtoken');
const config = require('../config');
const SECRET = config.SECRET;

module.exports = (req,res,next)=>{
    let header = req.get('Authorization');
    if(header) {
        const token = header.split(' ')[1];
        if(token!='null') {
            const response = jwt.verify(token, SECRET);
            console.log("Respon JWT", response);
            if (response) {
                req.body.user = response;
                next();
            } else {
                res.status(403).json({message: "Ki chakkar?"});
            }
        }
        else{
            res.status(403).json({message: "Ki chakkar?"});
        }
    }
    else{
        res.status(403).json({message: "Ki chakkar?"});
    }

}
