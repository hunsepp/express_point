const express = require("express");
const kakaoRoutes = express.Router();
const router = express.Router();

kakaoRoutes.get('/oauth/', (req, res, next)=>{
    console.log("---oauth---");
    console.log(req.query);
    res.send(JSON.stringify(req.query.code));
  })


module.exports = kakaoRoutes;