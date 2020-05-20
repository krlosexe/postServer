const express         = require('express')
const app             = express()
const bcrypt          = require("bcrypt");
const client_mongo    = require('../config/database.js')
const jwt             = require('jsonwebtoken')
const config          = require('../config/config')
const mongo           = client_mongo()

app.set('key', config.key);

exports.auth = function(request, response) {

    const dbo   = mongo.db("prp");
    const where = {
        "email" : request.body.email
    }
    const result = dbo.collection("users").find(where).toArray()

    result.then((data) => {
        if(data.length > 0){

            bcrypt.compare(request.body.password, data[0].password, function(err, result) {
               if(result){
                    const payload = {
                        check:  true
                    };
                    const token = jwt.sign(payload, app.get('key'), {
                        expiresIn: '365d' 
                    });
                    response.status(200).json({"access_token" : token})
               }else{
                response.status(400).json("Email o Password Incorrecto")
               }
            });

            
        }else{
            response.status(400).json("Email o Password Incorrecto")
        }
        
    })


};
