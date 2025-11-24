// server/controllers/studentController.js
const db = require('../db'); // 引入刚才写的数据库配置
const xlsx = require('xlsx');
const fs = require('fs');


// 1. 获取学生列表 (支持多维度搜索)
exports.getStudents = (req, res) => {
       // req.user 是从中间件 auth.js 里解解出来的
    const currentUser = req.user; 
    
    const { name, teacher_id, school, care_type } = req.query;

    let sql = `
        SELECT s.*, t.name as teacher_name 
        FROM students s 
        LEFT JOIN teachers t ON s.teacher_id = t.id 
        WHERE 1=1 
    `;
    const params = [];

    // === 🕵️‍♂️ 权限控制核心代码 ===
    
    if (currentUser.role === 'teacher') {
        // 如果是普通老师，强制只查他自己的班级
        // 即使前端故意传了别人的 teacher_id，这里也会覆盖，保证安全
        sql += ' AND s.teacher_id = ?';
        params.push(currentUser.teacher_id); 
    } else {
        // 如果是管理员 (admin)，则允许按前端传来的 teacher_id 筛选
        if (teacher_id) {
            sql += ' AND s.teacher_id = ?';
            params.push(teacher_id);
        }
    }

    // === 其他通用搜索条件 ===
    if (name) { sql += ' AND s.name LIKE ?'; params.push(`%${name}%`); }
    if (school) { sql += ' AND s.school LIKE ?'; params.push(`%${school}%`); }
    if (care_type) { sql += ' AND s.care_type = ?'; params.push(care_type); }

    sql += ' ORDER BY s.created_at DESC';

    db.query(sql, params, (err, results) => {
        if (err) return res.json({ code: 500, msg: '查询失败' });
        res.json({ code: 200, data: results });
    });
};

// 2. 新增学生
exports.addStudent = (req, res) => {
    const { name, gender, birthday, enrollment_date, grade, school, class_name, care_type, health_notes, parent_phone ,teacher_id } = req.body;
    const sql = 'INSERT INTO students SET ?';
    const data = { name, gender, birthday, enrollment_date, grade, school, class_name, care_type, health_notes, parent_phone,teacher_id , created_at: new Date() };
    db.query(sql, data, (err) => {
        if (err) return res.json({ code: 500, msg: '添加失败' });
        res.json({ code: 200, msg: '添加成功' });
    });
};

// 3. 修改学生
exports.updateStudent = (req, res) => {
    const { id, name, gender, birthday, enrollment_date, grade, school, class_name, care_type, health_notes, parent_phone, payment_status,teacher_id  } = req.body;
    const sql = 'UPDATE students SET name=?, gender=?, birthday=?, enrollment_date=?, grade=?, school=?, class_name=?, care_type=?, health_notes=?, parent_phone=?, payment_status=?, teacher_id=? WHERE id=?';
    const data = [name, gender, birthday, enrollment_date, grade, school, class_name, care_type, health_notes, parent_phone, payment_status, teacher_id, id];
    db.query(sql, data, (err) => {
        if (err) return res.json({ code: 500, msg: '修改失败' });
        res.json({ code: 200, msg: '修改成功' });
    });
};

// 4. 删除学生
exports.deleteStudent = (req, res) => {
    const sql = 'DELETE FROM students WHERE id = ?';
    db.query(sql, [req.params.id], (err) => {
        if (err) return res.json({ code: 500, msg: '删除失败' });
        res.json({ code: 200, msg: '删除成功' });
    });
};

// 5. 学生续费 (简化版)
exports.renewStudent = (req, res) => {
    const { student_id, student_name, amount, target_month, remark } = req.body;
    const financeDate = target_month + '-01';
    const [year, month] = target_month.split('-');
    const lastDay = new Date(year, month, 0).getDate();
    const expireDate = `${target_month}-${lastDay}`;

    const financeSql = 'INSERT INTO finance_records (type, amount, category, remark, record_date,student_id) VALUES (?, ?, ?, ?, ?, ?)';
    const financeData = [1, amount, '学费收入', `${student_name} 续费 [${target_month}月] ${remark || ''}`, financeDate, student_id];
    const studentSql = 'UPDATE students SET expire_date = ?, payment_status = 1 WHERE id = ?';

    db.query(financeSql, financeData, (err) => {
        console.log(err);
        
        if (err) return res.json({ code: 500, msg: '记账失败' });
        db.query(studentSql, [expireDate, student_id], (err2) => {
            if (err2) return res.json({ code: 200, msg: '记账成功但状态异常' });
            res.json({ code: 200, msg: '续费成功' });
        });
    });
};

// 6. 批量导入 (最占地方的那个)
exports.importStudents = (req, res) => {
    if (!req.file) return res.json({ code: 400, msg: '请上传文件' });

    const filePath = req.file.path;

    try {
        const workbook = xlsx.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        // raw: false 保证读取到的是字符串（如日期读成 '2023-09-01' 而不是数字）
        const jsonData = xlsx.utils.sheet_to_json(sheet, { raw: false });

        if (jsonData.length === 0) {
            deleteFile(filePath);
            return res.json({ code: 400, msg: 'Excel 中没有数据' });
        }

        const students = [];
        jsonData.forEach(row => {
            // 数据清洗与映射
            let gender = (row['性别'] && row['性别'].trim() === '女') ? 2 : 1;

            let careType = 3; // 默认全托
            if (row['托管类型'] === '午托') careType = 1;
            if (row['托管类型'] === '晚托') careType = 2;

            // 简单的日期处理，如果没有填，默认今天
            let enrollDate = row['入托时间'] || new Date().toISOString().substring(0, 10);

            students.push([
                row['姓名'],
                gender,
                row['年级'],
                row['家长电话'],
                row['学校'] || '',
                row['班级'] || '',
                careType,
                enrollDate,
                0, // payment_status 默认0
                new Date() // created_at
            ]);
        });

        // 批量插入 SQL
        const sql = 'INSERT INTO students (name, gender, grade, parent_phone, school, class_name, care_type, enrollment_date, payment_status, created_at) VALUES ?';

        db.query(sql, [students], (err, result) => {
            deleteFile(filePath); // 成功后删除临时文件

            if (err) {
                console.error('导入数据库报错:', err);
                return res.json({ code: 500, msg: '导入失败，请检查手机号是否重复或格式错误' });
            }
            res.json({ code: 200, msg: `成功导入 ${result.affectedRows} 名学生` });
        });

    } catch (error) {
        deleteFile(filePath); // 报错也要删除临时文件
        console.error('解析Excel报错:', error);
        res.json({ code: 500, msg: 'Excel 解析出错，请检查文件格式' });
    }
};

// 辅助函数：删除临时文件
function deleteFile(path) {
    fs.unlink(path, (err) => {
        if (err) console.error('删除临时文件失败:', err);
    });
}
exports.getTemplate = (req, res) => {
    // 我们动态生成一个 Excel 文件发给前端
    const headers = [
        ['姓名', '性别', '年级', '家长电话', '学校', '班级', '托管类型', '入托时间']
    ];
    const example = [
        ['张小明', '男', '一年级', '13800138000', '实验小学', '1班', '午托', '2025-09-01'],
        ['李小花', '女', '二年级', '13900139000', '第二小学', '3班', '全托', '2025-09-01']
    ];

    // 创建工作簿
    const wb = xlsx.utils.book_new();
    const ws = xlsx.utils.aoa_to_sheet([...headers, ...example]);

    // 设置列宽 (可选)
    ws['!cols'] = [{ wch: 10 }, { wch: 5 }, { wch: 10 }, { wch: 15 }, { wch: 15 }];

    xlsx.utils.book_append_sheet(wb, ws, "导入模板");

    // 写入 buffer 并发送
    const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Disposition', 'attachment; filename="student_template.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
};
