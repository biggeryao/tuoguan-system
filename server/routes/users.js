const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// 登录
router.post('/login', userController.login);

// 用户管理接口
router.get('/', userController.getUserList);      // 查
router.post('/', userController.createUser);      // 增
router.put('/:id', userController.updateUser);    // 改
router.delete('/:id', userController.deleteUser); // 删

module.exports = router;