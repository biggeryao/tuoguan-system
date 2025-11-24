// server/db.js
const mysql = require('mysql');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '1234', // <--- 记得改密码
    database: 'tuoguan_db',
    timezone: '+08:00',
    dateStrings: true
});

db.connect((err) => {
    if (err) {
        console.error('❌ 数据库连接失败:', err.message);
    } else {
        console.log('✅ 数据库连接成功');
    }
});

module.exports = db;