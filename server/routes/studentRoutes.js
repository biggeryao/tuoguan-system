// server/routes/studentRoutes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ dest: 'uploads/' }); // 配置上传目录

// 引入刚才写的控制器
const studentController = require('../controllers/studentController');

// 定义路由映射
// 这里的路径是相对于 /api/students 的
router.get('/', studentController.getStudents);           // GET /api/students
router.post('/', studentController.addStudent);           // POST /api/students
router.put('/', studentController.updateStudent);         // PUT /api/students
router.delete('/:id', studentController.deleteStudent);   // DELETE /api/students/:id
router.post('/renew', studentController.renewStudent);    // POST /api/students/renew
router.post('/import', upload.single('file'), studentController.importStudents); // POST /api/students/import
router.get('/template', studentController.getTemplate);

module.exports = router;