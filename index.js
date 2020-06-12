const path            = require('path')
const express         = require('express')
const app             = express()
const SocketIO        = require('socket.io')
const client_mongo    = require('./config/database.js')
const bodyParser      = require('body-parser');
const admin           = require("firebase-admin");
const serviceAccount  = require("./serviceAccountKey.json");


const mongo = client_mongo()
require('events').EventEmitter.prototype._maxListeners = 0;



admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://prp1-dd8c6.firebaseio.com"
});



// settings
app.set('port', process.env.PORT || 3020 )

// static files
app.use(express.static(path.join(__dirname,'public')))

const server = app.listen(app.get('port'), ()=>{ 
    console.log('server on port', app.get('port'))
})





const io = SocketIO.listen(server)

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*"); // update to match the domain you will make the request from
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
   
    req.io = io

    next();
});


app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies


app.use(require('./api/api.js'));





const sessionMap = {}

io.on('connect',(client)=>{

    console.log("Se conecto", client.id)

    client.emit("askForUserId");  

    client.on("userIdReceived", (userId) => {
        sessionMap[userId] = client.id
        console.log(sessionMap)
    })


})
