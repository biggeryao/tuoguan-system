const express = require('express');
const router = express.Router();
const teacherController = require('../controllers/teacherController');

router.get('/', teacherController.getTeacherList);
router.post('/', teacherController.addTeacher);
router.put('/:id', teacherController.updateTeacher);
router.delete('/:id', teacherController.deleteTeacher);

// 工资相关
router.get('/:id/salary', teacherController.getSalaryHistory);
router.post('/calc-preview', teacherController.calcSalaryPreview); // 预计算
router.post('/pay', teacherController.paySalary); // 发放

module.exports = router;