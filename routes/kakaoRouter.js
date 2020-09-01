const express = require("express");
const KakaoStrategy = require("passport-kakao").Strategy;
const passport = require("passport");

const kakaoRoutes = express.Router();
const router = express.Router();

const kakaoKey = {
  clientID: "02ced8bfeeec0a4a05a7ba7f1931de94",
  clientSecret: "ujahCdiADg9fg3J8JAHfbjJ1kGzE6lnA",
  callbackURL: "http://localhost:3000/api/kakao/oauth/callback",
};

passport.use(
  "kakao-login",
  new KakaoStrategy(kakaoKey, (accessToken, refreshToken, profile, done) => {
    console.log(profile);
  })
);

kakaoRoutes.get("/oauth/", () => {
  console.log("바보멍청이");
  passport.authenticate("kakao-login");
});

kakaoRoutes.get(
  "/oauth/callback",
  passport.authenticate("kakao-login", {
    successRedirect: "/",
    failureRedirect: "/api/auth/fail",
  })
);

module.exports = kakaoRoutes;
