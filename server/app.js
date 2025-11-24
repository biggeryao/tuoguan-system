// server/app.js
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

// 1. 引入数据库连接 (为了让服务启动时就连接数据库，而不是等请求来了才连)
require('./db'); 

// 2. 引入路由文件
const studentsRouter = require('./routes/studentRoutes');
const financeRouter = require('./routes/financeRoutes');
const teachersRouter = require('./routes/teachersRoutes'); 

const app = express();
const port = 3000;

// === 中间件配置 ===
// 允许跨域请求 (前端8080 -> 后端3000)
app.use(cors());
// 解析 JSON 格式的请求体
app.use(bodyParser.json());


// === 注册路由 ===
app.use('/api/students', studentsRouter);
app.use('/api/finance', financeRouter);
app.use('/api/teachers', teachersRouter);

// === 启动服务 ===
app.listen(port, () => {
    console.log(`---------------------------------------`);
    console.log(`🚀 服务已成功启动!`);
    console.log(`📡 接口地址: http://localhost:${port}`);
    console.log(`   - 学生管理: http://localhost:${port}/api/students`);
    console.log(`   - 财务记账: http://localhost:${port}/api/finance`);
    console.log(`---------------------------------------`);
});