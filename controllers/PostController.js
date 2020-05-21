const express         = require('express')
const app             = express()
const bcrypt          = require("bcrypt");
const client_mongo    = require('../config/database.js')
const jwt             = require('jsonwebtoken')
const config          = require('../config/config')
const mongo           = client_mongo()
const requesting      = require('request');
const fs              = require('fs');

app.set('key', config.key);

exports.store = function(request, response) {

    const dbo = mongo.db("prp");

    const lines  =  request.body.lines.split(',')
    var today    = new Date();
    var date     = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
    var time     = `${today.getHours()}:${today.getMinutes()}:${today.getSeconds()}`;
    var dataTime = `${date} ${time}`



    const data = {
        "post"      :  request.body.post,
        "lines"     :  lines,
        "create_at" :  dataTime,
     }

    let file_name = "0"
    let extension = "0"
    if(request.file != undefined){
        file_name = "upload/" + request.file.originalname
        extension = request.file.mimetype.split('/')
        let base64str = base64_encode(`public/${file_name}`);

        data.file         =  file_name 
        data.extension    =  extension[1] 
        data.base_64      =  `data:${request.file.mimetype};base64,${base64str}`
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
    console.log("ejencuntado query")
   const dbo = mongo.db("prp");

   var   data  = []

   const query = {lines : request.params.name_line}

   dbo.collection("posts")
    .find(query, 
        {fields : {base_64 : 0}}
    )

    .toArray(function(err, result) {
        data = result
        response.status(200).json(data)

   });
   
};





exports.getById = function(request, response) {
   
   const dbo = mongo.db("prp");
   
   var ObjectID = require('mongodb').ObjectID; 

   const query = {"_id" : new ObjectID(request.params.id) }
   console.log("El query ",query)
   dbo.collection("posts").findOne(query, function(err, result) {
    response.status(200).json(result.base_64)
  });


   
};



function base64_encode(file) {
    // read binary data
    var bitmap = fs.readFileSync(file);
    // convert binary data to base64 encoded string
    return new Buffer(bitmap).toString('base64');
}




