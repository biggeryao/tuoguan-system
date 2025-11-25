// server/controllers/dashboardController.js
const db = require('../db');

// 1. 获取顶部卡片数据 (学生总数、本月收支)
exports.getTopStats = (req, res) => {
    const currentMonth = new Date().toISOString().substring(0, 7); // "2023-11"

    // 并行执行三个查询，为了简单我们用嵌套回调，实际可以用 Promise.all
    // A. 查在读学生数
    db.query("SELECT COUNT(*) as count FROM students WHERE status = 1", (err, res1) => {
        const studentCount = res1[0].count;

        // B. 查本月收入 (type=1)
        const sqlIncome = "SELECT SUM(amount) as total FROM finance_records WHERE type=1 AND record_date LIKE ?";
        db.query(sqlIncome, [`${currentMonth}%`], (err, res2) => {
            const income = res2[0].total || 0;

            // C. 查本月支出 (type=2)
            const sqlExpense = "SELECT SUM(amount) as total FROM finance_records WHERE type=2 AND record_date LIKE ?";
            db.query(sqlExpense, [`${currentMonth}%`], (err, res3) => {
                const expense = res3[0].total || 0;

                res.json({
                    code: 200,
                    data: {
                        student_count: studentCount,
                        month_income: income,
                        month_expense: expense,
                        month_profit: income - expense
                    }
                });
            });
        });
    });
};

// 2. 获取近6个月财务走势 (折线图)
exports.getFinanceChart = (req, res) => {
    // 按月份分组，统计收入和支出
    // 注意：这里取最近6条数据
    const sql = `
        SELECT 
            DATE_FORMAT(record_date, '%Y-%m') as month, 
            SUM(CASE WHEN type=1 THEN amount ELSE 0 END) as income,
            SUM(CASE WHEN type=2 THEN amount ELSE 0 END) as expense
        FROM finance_records 
        GROUP BY month 
        ORDER BY month DESC 
        LIMIT 6
    `;
    db.query(sql, (err, results) => {
        if (err) return res.json({ code: 500, msg: '查询失败' });
        // 数据库查出来是倒序的(最近的在前面)，图表需要正序(从左到右)，所以 reverse 一下
        res.json({ code: 200, data: results.reverse() });
    });
};

// 3. 获取学生年级分布 (饼图/柱状图)
exports.getStudentChart = (req, res) => {
    const sql = "SELECT grade, COUNT(*) as count FROM students WHERE status=1 GROUP BY grade";
    db.query(sql, (err, results) => {
        if (err) return res.json({ code: 500, msg: '查询失败' });
        res.json({ code: 200, data: results });
    });
};