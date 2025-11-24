// server/routes/studentRoutes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ dest: 'uploads/' }); // 配置上传目录

// 引入刚才写的控制器
const studentController = require('../controllers/studentController');
const auth = require('../middleware/auth'); // <--- 引入中间件

// 定义路由映射
// 这里的路径是相对于 /api/students 的
router.get('/', auth,studentController.getStudents);           // GET /api/students
router.post('/', auth,studentController.addStudent);           // POST /api/students
router.put('/', auth,studentController.updateStudent);         // PUT /api/students
router.delete('/:id', auth,studentController.deleteStudent);   // DELETE /api/students/:id
router.post('/renew', auth,studentController.renewStudent);    // POST /api/students/renew
router.post('/import', auth,upload.single('file'), studentController.importStudents); // POST /api/students/import
router.get('/template', studentController.getTemplate);

module.exports = router;