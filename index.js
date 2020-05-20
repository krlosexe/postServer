const path            = require('path')
const express         = require('express')
const app             = express()
const SocketIO        = require('socket.io')
const client_mongo    = require('./config/database.js')
const bodyParser      = require('body-parser');
//var   multer          = require('multer');
//var   upload          = multer();
const admin           = require("firebase-admin");
const serviceAccount  = require("./serviceAccountKey.json");

const mongo = client_mongo()
require('events').EventEmitter.prototype._maxListeners = 0;


app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*"); // update to match the domain you will make the request from
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});







app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

/*
app.use(upload.array());
app.use(express.static('public'));
app.use('/files', express.static('files'));
*/



app.use(require('./api/api.js'));








admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://prp1-dd8c6.firebaseio.com"
});



// settings
app.set('port', process.env.PORT || 3010 )

// static files
app.use(express.static(path.join(__dirname,'public')))

const server = app.listen(app.get('port'), ()=>{ 
    console.log('server on port', app.get('port'))
})
const io = SocketIO.listen(server)





const sessionMap = {}

io.on('connect',(client)=>{

    console.log("Se conecto", client.id)

    client.emit("askForUserId");  

    client.on("userIdReceived", (userId) => {
        sessionMap[userId] = client.id
        console.log(sessionMap)
    })



    client.on("updateUserChatToken", function(data) {

        console.log("#")
        console.log("#")
        console.log(data);
        console.log("#")
        console.log("#")

        const dbo = mongo.db("prp");

        dbo.collection("users_app").updateOne({'user_id' : data.user_id}, {
            $set : {
                    "user_id"                  :  data.user_id,
                    "token_chat"               :  data.token_chat,
                    "push_notifications_token" :  data.push_notifications_token,
                }
        },

        { upsert: true },
        function(err, res) {
            if (err) throw err;
            console.log("1 document inserted");
        });





    });






    client.on("clientMessage", function(data) {

        let chat_id = MergeToken(data)

        var chat = {
            messages:
                {
                    from : data.receiver.user_id,
                    to   : data.sender.user_id,
                    message : data.message
                }
        }
        
        const textMessage   = data.message.text
        const name_sender   = data.sender.nombres


        const dbo = mongo.db("prp");
        dbo.collection("conversations").updateOne({'_id' : chat_id}, {
            $push: {messages: chat.messages},
        },
        { upsert: true },
        function(err, res) {
            if (err) throw err;

            const dbo = mongo.db("prp");

            const result = dbo.collection("users_app").find({user_id : {$in : [data.sender.user_id, data.receiver.user_id]} }).toArray()
            
            let userId1 = data.sender.user_id
            let userId2 = data.receiver.user_id

           result.then((data) => {


                console.log("ESTE ES EL ID")
                console.log(client.id)
                console.log("ESTE ES EL ID")
                console.log(sessionMap)

                loadConversation(chat_id, userId1, userId2, data)
                
                var receiver = data.find(function(element) {
                    return element.user_id == userId2;
                });

                if(receiver){
                    sendNotificationDevice(receiver.push_notifications_token, textMessage, name_sender)
                }
               
           })
          
        });

        

    });




    client.on("loadChat", function(data) {

        let chat_id = MergeToken(data)

        const dbo = mongo.db("prp");

        dbo.collection("conversations").findOne({"_id" : chat_id}, function(err, res) {
            if (err) throw err;

            if(!res){
                io.to(client.id).emit("receiveChat", []);  
            }else{
                io.to(client.id).emit("receiveChat", res.messages);  
            }
        });

    });

})






function MergeToken(data){

    let chat_id = ''
    if(data.sender.user_id < data.receiver.user_id)
        chat_id = `${data.sender.token_chat}-${data.receiver.token_chat}`
    else
        chat_id = `${data.receiver.token_chat}-${data.sender.token_chat}`

    return chat_id
}



function loadConversation(chat_id, userId1, userId2){

    const dbo = mongo.db("prp");


    dbo.collection("conversations").findOne({"_id" : chat_id}, function(err, res) {
        if (err) throw err;
       
        io.to(sessionMap[userId1]).emit("receiveChat", res.messages);  
        io.to(sessionMap[userId2]).emit("receiveChat", res.messages);  
      
    });


}


function sendNotificationDevice(registrationToken, textMessage, name_sender){


    var message = {
    data: {
        score: '850',
        time: '2:45'
    },

    notification:{
        "body": textMessage,
        "title": name_sender
    },
    token: registrationToken
    };

    // Send a message to the device corresponding to the provided
    // registration token.
    admin.messaging().send(message)
    .then((response) => {
        // Response is a message ID string.
        console.log('Successfully sent message:', response);
    })
    .catch((error) => {
        console.log('Error sending message:', error);
    });

}


