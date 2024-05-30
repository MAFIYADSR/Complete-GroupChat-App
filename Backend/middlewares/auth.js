const jwt = require('jsonwebtoken');
const User = require('../models/User'); 

const authenticate = (req, res, next)=> {
    try{
        const token = req.header('Authorization');

        const user = jwt.verify(token, process.env.JWT_SECRET);

        User.findByPk(user.userId)
        .then((user)=> {
            if(user){
                req.user = user;
                next();
            }
        })
        .catch((err)=> {
            throw new Error(err);
        })
    }
    catch(err){
        res.status(401).json({error: err})
    }
   
}

module.exports = {
    authenticate
}