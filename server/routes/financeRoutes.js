// server/routes/finance.js
const express = require('express');
const router = express.Router();
const financeController = require('../controllers/financeController'); // 引入控制器

// 路由映射
router.get('/', financeController.getFinanceList);
router.post('/', financeController.createFinance);
router.delete('/:id', financeController.deleteFinance);

module.exports = router;