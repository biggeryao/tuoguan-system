const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');

router.get('/stats', dashboardController.getTopStats);
router.get('/chart/finance', dashboardController.getFinanceChart);
router.get('/chart/student', dashboardController.getStudentChart);

module.exports = router;