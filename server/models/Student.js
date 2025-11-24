const Sequelize = require('sequelize');
const sequelize = require('../config/db');

const Student = sequelize.define('student', {
    name: {
        type: Sequelize.STRING,
        allowNull: false // 必填
    },
    grade: {
        type: Sequelize.STRING // 年级
    },
    parent_phone: {
        type: Sequelize.STRING // 家长电话
    },
    valid_until: {
        type: Sequelize.DATEONLY // 有效期截止日 (只存日期，不存几点几分)
    },
    status: {
        type: Sequelize.INTEGER,
        defaultValue: 1 // 1:在读, 0:结课
    }
});

// 自动在数据库创建这个表
Student.sync({ alter: true });

module.exports = Student;