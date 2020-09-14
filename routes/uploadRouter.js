const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const router = express.Router();

fs.readdir("uploads", (error) => {
  // uploads 폴더 없으면 생성
  if (error) {
    fs.mkdirSync("uploads");
  }
});

const upload = multer({
  storage: multer.diskStorage({
    destination(req, file, cb) {
      cb(null, "uploads/");
    },
    filename(req, file, cb) {
      const ext = path.extname(file.originalname);
      cb(null, req.params.account + ext);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
});
// 이미지 업로드를 위한 API
// upload의 single 메서드는 하나의 이미지를 업로드할 때 사용
router.post("/:account", upload.any("storeImage"), (req, res) => {
  console.log(req.files);
  res.json({ url: `/img/${req.files[0].filename}`, result: "success" });
});

// 이미지 찾아오기
router.get('/:account', (req, res) => {
  fs.readFile(`uploads/${req.params.account}.jpg`, (err, data) => {
    if(err) {
      fs.readFile('uploads/main.jpg', (err, data) => {
        res.writeHead(200, {'Content-Type': 'text/html'});
        res.end(data);
      })
    } else {
      res.writeHead(200, {'Content-Type': 'text/html'});
      res.end(data);
    }
  })
})

module.exports = router;
