// server/controllers/financeController.js
const db = require('../db');

// 1. 获取列表
exports.getFinanceList = (req, res) => {
    const sql = 'SELECT * FROM finance_records ORDER BY record_date DESC, id DESC';
    db.query(sql, (err, results) => {
        if (err) return res.json({ code: 500, msg: '获取失败' });
        res.json({ code: 200, data: results });
    });
};

// 2. 新增账目
exports.createFinance = (req, res) => {
    const { type, amount, category, remark, record_date } = req.body;
    const sql = 'INSERT INTO finance_records SET ?';
    const data = { type, amount, category, remark, record_date };

    db.query(sql, data, (err, result) => {
        if (err) return res.json({ code: 500, msg: '记账失败' });
        res.json({ code: 200, msg: '记账成功' });
    });
};

// 3. 删除账目
exports.deleteFinance = (req, res) => {
    const sql = 'DELETE FROM finance_records WHERE id = ?';
    db.query(sql, [req.params.id], (err, result) => {
        if (err) return res.json({ code: 500, msg: '删除失败' });
        res.json({ code: 200, msg: '删除成功' });
    });
};