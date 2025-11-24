const jwt = require('jsonwebtoken');
const SECRET_KEY = 'tuoguan-system-secret-key-888'; // 必须和 userController 里的密钥一致

module.exports = (req, res, next) => {
    // 1. 从请求头获取 Token
    // 前端通常发过来的格式是: Authorization: Bearer <token>
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // 取出 Bearer 后面的部分

    if (!token) {
        return res.status(401).json({ code: 401, msg: '未登录或Token过期' });
    }

    // 2. 验证 Token
    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) {
            return res.status(403).json({ code: 403, msg: 'Token无效' });
        }
        // 3. 把解析出来的用户信息存入 req.user，方便后面的 Controller 使用
        req.user = user;
        next(); // 继续执行下一个步骤
    });
};