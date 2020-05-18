const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const saltRounds = 10;
var jwt = require('jsonwebtoken');


const userSchema = mongoose.Schema({
    name: {
        type: String,
        maxlength: 50
    },
    email: {
        type: String,
        trim: true,
        unique: 1
    },
    password:{
        type: String,
        minlength: 5
    },
    role: {
        type: Number,
        default: 0
    },
    image: String,
    token: {
        type:String
    },
    tokenExp:{
        type: Number
    }
})

// 유저 정보 저장하기 전 실행
userSchema.pre('save', function(next){
    var user = this;

    if(user.isModified('password')){
        // salt를 이용해 비밀번호 암호화
        // 1. saltRounds 이용해 salt 만들기
        bcrypt.genSalt(saltRounds, function(err, salt) {
            if(err) return next(err)
            bcrypt.hash(user.password, salt, function(err, hash) {
                if(err) return next(err)
                user.password = hash
                next()
                // Store hash in your password DB.
            })
        })
    } else {
        next()
    }
})

// cb=콜백함수
userSchema.methods.comparePassword = function(plainPassword, cb){
    bcrypt.compare(plainPassword, this.password, function(err, isMatch){
        if(err) return cb(err)
        cb(null, isMatch)
    })
}

userSchema.methods.generateToken = function(cb) {
    const user = this;

    // jsonwebtoken 이용해서 토큰 생성
    const token = jwt.sign(user._id.toHexString(), "bolier-plate");

    user.token = token
    user.save(function(err, user) {
        if(err) return cb(err)
        cb(null, user)
    })

}

// 
userSchema.statics.findByToken = function(token, cb){
    const user = this
    // 토큰 복호화
    jwt.verify(token, "bolier-plate", function(err, decoded) {
        // decode = user._id
        // user._id를 이용해 db에서 user 찾기
        user.findOne({"_id":decoded, "token": token}, (err, user)=>{
            if(err) return cb(err)
            cb(null, user)
        })
    });

}

const User = mongoose.model('User', userSchema)
module.exports = { User }
