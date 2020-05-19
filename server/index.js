const express = require('express')
const app = express()
const port = 5000
const bodyParser = require('body-parser')
const config = require('./config/key')
const cookieparser = require('cookie-parser')
const { auth } = require('./middleware/auth')
const { User } = require('./models/User')


// application/x-www-form-urlencoded type
app.use(bodyParser.urlencoded({extended: true}))
// json type
app.use(bodyParser.json())
app.use(cookieparser())

require('dotenv').config();

const mongoose = require('mongoose')
mongoose.connect(config.mongoURI, {
    useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true, useFindAndModify:false
}).then(()=> console.log('mongoDB connected'))
.catch(err => console.log(err))

app.get('/', (req, res) => res.send('Hello World! hh'))

app.get('/api/hello', (req, res)=>{
    res.send("Hello")
})

app.post('/api/users/register', (req, res)=>{
    const user = new User(req.body)

    user.save((err, doc)=>{
        if(err) return res.json({success: false, err})
        return res.status(200).json({
            success: true
        })
    })

})

app.post('/api/users/login', (req, res)=>{
    // 1. 요청된 email를 db에서 찾기

    User.findOne({email: req.body.email}, (err, user)=>{
        console.log("findOne start")
        if(!user){
            console.log("유저 없음")
            return res.json({
                loginSuccess: false,
                message: "유저 없음"
            })
        }
        //console.log(user)        

        // 2. 이메일 있으면 비밀번호 맞는지 확인
        user.comparePassword(req.body.password, (err, isMatch)=>{
            console.log("comparePassword start")
            if(!isMatch) {
                return res.json({
                    loginSuccess: false,
                    message: "비밀번호 틀림"
                })
            }
            console.log(`isMatch=${isMatch}`)

            // 3. 비밀번호도 맞다면 토큰 생성
            user.generateToken((err, user)=>{
                console.log("generateToken start")
                if(err) return res.status(400).send(err)
                
                // 토큰 저장: 쿠키 or 로컬 스토리지 or 세션
                return res.cookie("auth", user.token)
                .status(200)
                .json({
                    loginSuccess: true,
                    userId: user._id
                })

            })

        })
        
    })
})

app.get('/api/users/auth', auth , (req, res)=>{

    // auth 미들웨어 통과 후 req에 token, user 정보 받음
    res.status(200).json({
        // 유저정보 전달
        _id: req.user._id,
        isAdmin: req.user.role === 0 ? false : true, // 0이면 일반유저
        isAuth: true,
        email: req.user.email,
        name: req.user.name,
        image: req.user.image
    })    

})

// 로그아웃하려면 이미 auth있는 상태
app.get('/api/users/logout', auth, (req, res)=>{
    // _id로 찾아서 token을 지우는 업데이트
    User.findOneAndUpdate({_id: req.user._id}, {token: ""}, (err, user)=>{
        if(err) return res.json({success: false, err})
        return res.status(200).json({
            success: true
        })
    })
})

app.listen(port, () => console.log(`Example app listening at http://localhost:${port}`))