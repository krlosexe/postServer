const express         = require('express')
const app             = express()
const bcrypt          = require("bcrypt");
const client_mongo    = require('../config/database.js')
const jwt             = require('jsonwebtoken')
const config          = require('../config/config')
const mongo           = client_mongo()
const requesting      = require('request');

app.set('key', config.key);

exports.store = function(request, response) {

    const dbo = mongo.db("prp");

   // console.log(request.file)

    const lines  =  request.body.lines.split(',')
    var today    = new Date();
    var date     = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
    var time     = `${today.getHours()}:${today.getMinutes()}:${today.getSeconds()}`;
    var dataTime = `${date} ${time}`

    let file_name = "0"
    if(request.file != undefined){
        file_name = "upload/" + request.file.originalname
    }


    const extension = request.file.mimetype.split('/')

     const data = {
        "post"      :  request.body.post,
        "lines"     :  lines,
        "create_at" :  dataTime,
        "file"      :  file_name,
        "extension" : extension[1]
     }

    dbo.collection("posts").insertOne(data, function(err, res) {
         console.log("1 document inserted");
     });
     



     const form = {
        form:{
            "lines" : lines
        }
      }
     requesting.post('https://pdtclientsolutions.com/crm-public/api/notification/post',form,function(err,res,body){
        console.log(body)
     });



    setTimeout(() => {
        response.status(200).json({"success" : data})
    }, 2000)
    
};





exports.get = function(request, response) {

   const dbo = mongo.db("prp");

   var   data  = []
   const query = {lines : request.params.name_line}

   dbo.collection("posts").find(query).toArray(function(err, result) {
        data = result
        response.status(200).json(data)

   });


   
   
};



