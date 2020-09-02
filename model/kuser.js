const mongoose = require("mongoose");

const kuserSchema = new mongoose.Schema({
  //카카오에서 가져온 id, 닉네임, wallet address, 썸네일 이미지
  kakaoId: { type: String, required: true, unique: true },
  nickName: { type: String, required: true, unique: false },
  address: { type: String, required: true, unique: true },
  img: { data: Buffer, contentType: String },
  //토큰 관련 어트리뷰트
  access_token: { type: String, required: true, unique: true },
  refresh_token: { type: String, required: true, unique: true },
});

module.exports = mongoose.model("kuser", kuserSchema);
