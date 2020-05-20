const bcrypt          = require("bcrypt");
const client_mongo    = require('../config/database.js')
const mongo           = client_mongo()

const dbo = mongo.db("prp");





userSeeders()




function createHash(password){
    const saltRounds = 10;
    return bcrypt.hash("123456789", saltRounds);

}
async function userSeeders(){
    
    console.log("Run Seeders User")

    const password = await createHash("123")
    
    let data = [
        {
            "name"     : "Carlos Cardenas",
            "email"    : "cardenascarlos18@gmail.com",
            "password" : password
        },
        {
            "name"     : "Leonardo Tapia",
            "email"    : "barinas.code@gmail.com",
            "password" : password
        },
    ]

    dbo.collection("users").drop(function(err, delOK) {
     //   if (err) throw err;
        if (delOK) console.log("Collection deleted");
    });

    dbo.collection("users").insertMany(data, function(err, res) {
       //if (err) throw err;
        console.log("1 document inserted");
    });
    console.log("Run Seeders User")
}