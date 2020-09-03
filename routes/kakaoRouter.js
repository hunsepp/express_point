const express = require("express");
const router = express.Router();
const fs = require("fs");
const axios = require("axios");
const { walletHeaders } = require("../kas");
const Kuser = require("../model/kuser");

router.post("/signUp", (req, res) => {
  Kuser.findOne({ kakaoId: req.body.user_id }, async (err, kuser) => {
    //디비 조회 중 에러 발생시
    if (err) return res.status(500).json({ error: err });
    //디비에 저장된 유저 정보가 없을 경우
    if (!kuser) {
      kuser = new Kuser();
      //카카오 로그인 API에서 받아온 정보로 모델에 값 채우기
      kuser.kakaoId = req.body.user_id;
      kuser.nickName = req.body.user_nickname;

      // //이미지 url에서 디비에 저장하기
      // const imgURL = req.body.user_thumbnail_image;
      // //kuser.img.data = fs.readFileSync(imgURL);
      // await axios.get(imgURL).then(({ data }) => {
      //   kuser.img.data = Buffer.from(data, "utf-8");
      // });
      // kuser.img.contentType = "image/png";

      //KAS에서 새 주소 생성해서 주소 어트리뷰트 값 넣기
      await axios
        .post("https://wallet-api.beta.klaytn.io/v2/account", "", walletHeaders)
        .then(({ data }) => {
          kuser.address = data.result.address;
        });
    }

    kuser.access_token = req.body.user_access_token;
    kuser.refresh_token = req.body.user_refresh_token;

    //console.log("★kuser", kuser);

    kuser.save(function (err) {
      if (err) {
        console.error(err);
        res.json({ result: 0 });
        return;
      }

      res.json({ result: 1, kuser });
    });
  });
});

// 액세스 토큰으로 유저 정보 확인
router.get('/:token', (req, res) => {
  Kuser.findOne({access_token: req.params.token}, (err, kuser) => {
      if(err) res.json({result: 0, error: err});
      else res.json({result: 1, kuser});
  })
})

module.exports = router;
