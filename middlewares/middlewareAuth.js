const express         = require('express')
const app             = express()
const jwt             = require('jsonwebtoken')
const config          = require('../config/config')

app.set('key', config.key);


const middlewareJwt = express.Router();
middlewareJwt.use((req, res, next) => {
    const token = req.headers['access-token'];
    if (token) {
      jwt.verify(token, app.get('key'), (err, decoded) => {      
        if (err) {
          return res.status(403).json({ mensaje: 'Token inválido' });    
        } else {
          req.decoded = decoded;    
          next();
        }
      });
    } else {
      res.send({ 
          mensaje: 'Token no proveída.' 
      });
    }
});


module.exports = middlewareJwt;

