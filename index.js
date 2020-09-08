const express = require("express");
const dotenv = require("dotenv");
const mongoose = require("mongoose");

const app = express();
const port = 5000;

dotenv.config();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// 몽고 디비 연결
mongoose.connect(process.env.MONGO_URI, {useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true, useFindAndModify: false})
.then(() => console.log('connected to mongodb'))
.catch(e => console.error(e));

// 라우터 설정
const testRouter = require('./routes/testRouter');
const menuRouter = require('./routes/menuRouter');
const storeRouter = require('./routes/storeRouter');
const kakaoRouter = require("./routes/kakaoRouter");
const orderRouter = require('./routes/orderRouter');
const pointRouter = require('./routes/pointRouter');
const approveRouter = require('./routes/approveRouter');

app.use('/api', testRouter);
app.use('/api/menu', menuRouter);
app.use('/api/store', storeRouter);
app.use("/api/kakao", kakaoRouter);
app.use('/api/order', orderRouter);
app.use('/api/point', pointRouter);
app.use('/api/approve', approveRouter);

// 서버 시작
app.listen(port, () => {
  console.log(`server start port ${port}`);
});
