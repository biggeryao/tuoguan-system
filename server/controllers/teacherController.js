const db = require('../db');

// 1. 获取教师列表
exports.getTeacherList = (req, res) => {
    const sql = 'SELECT * FROM teachers WHERE status = 1 ORDER BY created_at DESC';
    db.query(sql, (err, results) => {
        if (err) return res.json({ code: 500, msg: '获取失败' });
        res.json({ code: 200, data: results });
    });
};

// 2. 新增教师
exports.addTeacher = (req, res) => {
    const { name, phone, job_title, base_salary, entry_date, insurance_type, insurance_deduction } = req.body;
    const sql = 'INSERT INTO teachers SET ?';
    const data = {
        name, phone, job_title, base_salary, entry_date,
        insurance_type, insurance_deduction
    };

    db.query(sql, data, (err, result) => {
        if (err) return res.json({ code: 500, msg: '添加失败' });
        res.json({ code: 200, msg: '添加成功' });
    });
};

// 3. 修改教师
exports.updateTeacher = (req, res) => {
    const id = req.params.id;
    const { name, phone, job_title, base_salary, entry_date, insurance_type, insurance_deduction } = req.body;
    const sql = 'UPDATE teachers SET name=?, phone=?, job_title=?, base_salary=?, entry_date=?, insurance_type=?, insurance_deduction=? WHERE id=?';
    const data = [name, phone, job_title, base_salary, entry_date, insurance_type, insurance_deduction, id];

    db.query(sql, data, (err, result) => {
        if (err) return res.json({ code: 500, msg: '修改失败' });
        res.json({ code: 200, msg: '修改成功' });
    });
};

// 4. 删除教师 (逻辑删除)
exports.deleteTeacher = (req, res) => {
    const sql = 'UPDATE teachers SET status = 0 WHERE id = ?';
    db.query(sql, [req.params.id], (err, result) => {
        if (err) return res.json({ code: 500, msg: '删除失败' });
        res.json({ code: 200, msg: '删除成功' });
    });
};

// 5. 获取历史工资
exports.getSalaryHistory = (req, res) => {
    const sql = 'SELECT * FROM salary_records WHERE teacher_id = ? ORDER BY month DESC';
    db.query(sql, [req.params.id], (err, results) => {
        if (err) return res.json({ code: 500, msg: '获取失败' });
        res.json({ code: 200, data: results });
    });
};

// 6. ⭐️ 工资预计算接口 (获取底薪、补贴/扣款标准)
// server/controllers/teacherController.js

exports.calcSalaryPreview = (req, res) => {
    const { teacher_id, month } = req.body; // month 格式 "2025-11"

    // 1. 先查老师的基础配置
    const teacherSql = 'SELECT * FROM teachers WHERE id = ?';
    db.query(teacherSql, [teacher_id], (err, results) => {
        if (err || results.length === 0) return res.json({ code: 500, msg: '教师不存在' });

        const t = results[0];

        // 2. 核心 SQL：自动计算该老师名下学生的缴费总额
        // 逻辑：
        // A. 在 finance_records 表找 type=1 (收入) 且 record_date 是这个月的
        // B. 关联 students 表，条件是 finance_records.student_id = students.id
        // C. 过滤条件：students.teacher_id 必须是当前老师
        const performanceSql = `
            SELECT SUM(f.amount) as total_tuition
            FROM finance_records f
            JOIN students s ON f.student_id = s.id
            WHERE s.teacher_id = ? 
              AND f.type = 1 
              AND f.record_date LIKE ?
        `;

        const monthPattern = `${month}%`; // 匹配 "2025-11%"

        db.query(performanceSql, [teacher_id, monthPattern], (err2, result2) => {
            // 如果没人交钱，result2[0].total_tuition 会是 null，转成 0
            const classPerformance = result2[0].total_tuition || 0;

            // 医社保逻辑
            let subsidy = 0;
            let deduction = 0;
            if (t.insurance_type === 1) {
                subsidy = 1070;
            } else {
                deduction = t.insurance_deduction || 0;
            }

            res.json({
                code: 200,
                data: {
                    base_salary: t.base_salary,
                    subsidy: subsidy,
                    insurance_deduction: deduction,
                    class_performance: classPerformance, // <--- 把算出来的业绩返回给前端
                    commission_rate: 0.06
                }
            });
        });
    });
};

// 7. ⭐️ 确认发放工资
exports.paySalary = (req, res) => {
    const { teacher_id, teacher_name, month, base_amount, commission, subsidy, deduction, total, remark } = req.body;

    // A. 写入工资表
    const sql = 'INSERT INTO salary_records SET ?';
    const data = { teacher_id, teacher_name, month, base_amount, commission, subsidy, deduction, total, remark };

    db.query(sql, data, (err) => {
        if (err) return res.json({ code: 500, msg: '保存工资记录失败' });

        // B. 写入财务总表 (支出)
        const financeSql = 'INSERT INTO finance_records (type, amount, category, remark, record_date) VALUES (?, ?, ?, ?, ?)';
        const financeNote = `工资发放: ${teacher_name} (${month}) [含提成${commission}]`;

        db.query(financeSql, [2, total, '人员工资', financeNote, new Date().toISOString().substring(0, 10)], (err2) => {
            res.json({ code: 200, msg: '发放成功，已自动记入财务支出' });
        });
    });
};