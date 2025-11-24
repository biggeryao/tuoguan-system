// server/controllers/userController.js
const db = require('../db');
const jwt = require('jsonwebtoken');

const SECRET_KEY = 'tuoguan-system-secret-key-888'; 

// 1. 登录 
exports.login = (req, res) => {
    const { username, password } = req.body;
    const sql = 'SELECT * FROM users WHERE username = ? AND password = ?';
    
    db.query(sql, [username, password], (err, results) => {
        if (err || results.length === 0) return res.json({ code: 400, msg: '账号或密码错误' });

        const user = results[0];

        // ⭐️ 重点：把 teacher_id 放入 Token payload 中
        const token = jwt.sign(
            { 
                id: user.id, 
                username: user.username, 
                role: user.role, 
                teacher_id: user.teacher_id // <--- 新增这行
            }, 
            SECRET_KEY, 
            { expiresIn: '24h' }
        );

        res.json({
            code: 200,
            msg: '登录成功',
            data: { token, name: user.name, role: user.role }
        });
    });
};

// 2. 获取用户列表 (关联查询出老师名字，方便前端看)
exports.getUserList = (req, res) => {
    // 这里的 t.name as teacher_name 是为了在列表里直接显示 "关联：王老师"
    const sql = `
        SELECT u.id, u.username, u.name, u.role, u.created_at, u.teacher_id, t.name as teacher_profile_name
        FROM users u
        LEFT JOIN teachers t ON u.teacher_id = t.id
        ORDER BY u.created_at DESC
    `;
    db.query(sql, (err, results) => {
        if (err) return res.json({ code: 500, msg: '获取失败' });
        res.json({ code: 200, data: results });
    });
};

// 3. 新增用户 (接收 teacher_id)
exports.createUser = (req, res) => {
    // 多接收一个 teacher_id
    const { username, password, name, role, teacher_id } = req.body;
    
    const checkSql = 'SELECT * FROM users WHERE username = ?';
    db.query(checkSql, [username], (err, results) => {
        if (results.length > 0) return res.json({ code: 400, msg: '账号已存在' });

        // 如果角色是admin，强制把 teacher_id 设为 null
        const finalTeacherId = role === 'admin' ? null : (teacher_id || null);

        const sql = 'INSERT INTO users (username, password, name, role, teacher_id) VALUES (?, ?, ?, ?, ?)';
        db.query(sql, [username, password, name, role, finalTeacherId], (err) => {
            if (err) return res.json({ code: 500, msg: '创建失败' });
            res.json({ code: 200, msg: '创建成功' });
        });
    });
};

// 4. 修改用户 (接收 teacher_id)
exports.updateUser = (req, res) => {
    const { id, password, name, role, teacher_id } = req.body;
    
    const finalTeacherId = role === 'admin' ? null : (teacher_id || null);

    if (password) {
        const sql = 'UPDATE users SET password=?, name=?, role=?, teacher_id=? WHERE id=?';
        db.query(sql, [password, name, role, finalTeacherId, id], (err) => {
            if (err) return res.json({ code: 500, msg: '修改失败' });
            res.json({ code: 200, msg: '修改成功' });
        });
    } else {
        const sql = 'UPDATE users SET name=?, role=?, teacher_id=? WHERE id=?';
        db.query(sql, [name, role, finalTeacherId, id], (err) => {
            if (err) return res.json({ code: 500, msg: '修改失败' });
            res.json({ code: 200, msg: '修改成功' });
        });
    }
};

// 5. 删除用户
exports.deleteUser = (req, res) => {
    // 防止删除自己 (虽然前端也可以做限制，后端做更安全)
    // 这里为了简单暂不判断当前登录ID，但在实际生产中要注意
    const sql = 'DELETE FROM users WHERE id = ?';
    db.query(sql, [req.params.id], (err) => {
        if (err) return res.json({ code: 500, msg: '删除失败' });
        res.json({ code: 200, msg: '删除成功' });
    });
};