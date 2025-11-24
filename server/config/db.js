const Sequelize = require('sequelize');

// 数据库名：tuoguan_db，账号：root，密码：你的数据库密码
const sequelize = new Sequelize('tuoguan_db', 'root', '123456', {
    host: 'localhost',
    dialect: 'mysql',
    timezone: '+08:00' // 设置中国时区，这很重要，不然时间会差8小时
});

module.exports = sequelize;