const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const User = require('../models/User');

function generateJwt(userId){
    return jwt.sign({userId: userId}, process.env.JWT_SECRET)
}


function isValidString(string) {
    if (string !== null && string.length !== 0) {
        return true;
    }
    return false;
}

exports.createUser = (req, res) => {
   
    const { username, email, phoneNumber, password } = req.body;

    if (!isValidString(username) || !isValidString(email) || !isValidString(phoneNumber) || !isValidString(password)) {
        return res.status(400).json({ message: 'Bad parameters: Something is missing' })
    }

    User.findOne({where:{email: email}})
    .then((user)=>{
        if(user){
            //if user already exist, send 409 conflict response
            return res.status(409).json({ message: 'User already exist' });
        }

        const saltRounds = 10;
        bcrypt.hash(password, saltRounds, async (err, hash) => {
            if(err){
                throw new Error(err);
            }
    
            const user = await User.create({username, email, phoneNumber, password: hash});
            res.status(201).json({ message: 'Sign Up Successfully' });
           
        })
    })
    .catch((err)=>{
        res.status(500).json({message: err.message || 'Something went wrong'});
    })
}

exports.checkUser = (req, res)=>{
    const {email, password } = req.body;

    if (!isValidString(email) || !isValidString(password)) {
        return res.status(400).json({ message: 'Bad parameters: Something is missing' })
    }

    User.findOne({ where: { email: email } })
        .then((user) => {
            if (!user) {
                return res.status(404).json({ message: 'User not found' })
            }

            bcrypt.compare(password, user.password, (err, result) => {
                if (err) {
                    throw new Error('Something went wrong');
                }
                else if (!result) {
                    res.status(400).json({ message: 'Wrong Email or password' });
                }
                else{
                    const token = generateJwt(user.id);
                    res.status(200).json({message: 'Successfully login', token: token});
                }  
            })
        })
        .catch((err) => {
            res.status(500).json({ message: err || 'Something went wrong'});
        })
}

exports.getUser = (req, res)=>{
    try{
        const user = req.user;
        const userDetails = {
            username: user.username,
            userId: user.id,
        }
        res.status(200).json(userDetails);
    }
    catch(err){
        res.status(500).json('Something is fishy')
    } 
}