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
        // raw: false 保证读出来全是字符串，防止日期变成数字
        const jsonData = xlsx.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { raw: false });
        
        const students = [];
        jsonData.forEach(row => {
            // 1. 必填检查
            if (!row['姓名'] || !row['家长电话']) return;

            // 2. 数据清洗
            // 性别：转成 1或2
            let gender = 1;
            if (row['性别'] && row['性别'].trim() === '女') gender = 2;

            // 托管类型：转成 1,2,3
            let careType = 3; // 默认全托
            const typeStr = row['托管类型'] || '';
            if (typeStr.includes('午')) careType = 1;
            else if (typeStr.includes('晚')) careType = 2;

            // 日期处理：如果没有填，或者格式不对，默认给个空或者当前日期
            // 建议：如果没填生日，就存 null
            const birthday = row['出生日期'] || null;
            const enrollDate = row['入托时间'] || new Date().toISOString().substring(0, 10);

            // 3. 构建数据数组 (顺序必须和 SQL 语句对应！)
            students.push([
                row['姓名'], 
                gender, 
                birthday,  // 新增
                enrollDate,
                row['年级'] || '一年级',
                row['家长电话'], // 建议做一下去空格处理: String(row['家长电话']).trim()
                row['学校'] || '', 
                row['班级'] || '', 
                careType, 
                row['健康备注'] || '', // 新增
                0, // payment_status
                null, // teacher_id (导入时先不分配老师，后续在系统里分配)
                new Date() // created_at
            ]);
        });

        if (students.length === 0) {
            fs.unlinkSync(filePath);
            return res.json({ code: 400, msg: 'Excel无有效数据' });
        }

        // 4. 更新 SQL 语句 (增加 birthday, health_notes 等字段)
        const sql = `
            INSERT INTO students 
            (name, gender, birthday, enrollment_date, grade, parent_phone, school, class_name, care_type, health_notes, payment_status, teacher_id, created_at) 
            VALUES ?
        `;
        
        db.query(sql, [students], (err, result) => {
            fs.unlinkSync(filePath); // 删临时文件
            if (err) {
                console.error(err);
                return res.json({ code: 500, msg: '导入失败，请检查电话是否重复' });
            }
            res.json({ code: 200, msg: `成功导入 ${result.affectedRows} 人` });
        });

    } catch (e) {
        fs.unlinkSync(filePath);
        console.error(e);
        res.json({ code: 500, msg: '解析出错' });
    }
};

// 辅助函数：删除临时文件
function deleteFile(path) {
    fs.unlink(path, (err) => {
        if (err) console.error('删除临时文件失败:', err);
    });
}

// server/controllers/studentController.js


// 6. 下载导入模板 (后端生成版)
exports.getTemplate = (req, res) => {
    // 1. 定义表头 (对应你新表单的结构)
    // 把 学校、年级、班级 放在一起，符合逻辑
    const headers = [
        ['姓名', '性别', '出生日期', '入托时间', '家长电话', '学校', '年级', '班级', '托管类型', '健康备注']
    ];

    // 2. 提供示例数据 (让用户知道格式)
    const example = [
        // 示例 1
        [
            '张小明',      // 姓名
            '男',          // 性别
            '2015-05-20',  // 出生日期 (yyyy-MM-dd)
            '2023-09-01',  // 入托时间
            '13800138000', // 电话 (纯数字)
            '实验小学',    // 学校
            '一年级',      // 年级
            '3',           // 班级 (填数字即可，或者填 3班)
            '午托',        // 类型
            '花生过敏'     // 备注
        ],
        // 示例 2
        [
            '李小红', 
            '女', 
            '2014-08-15', 
            '2023-09-01', 
            '13900139000', 
            '第一小学', 
            '二年级', 
            '1', 
            '全托', 
            '无'
        ]
    ];

    // 3. 创建工作簿和工作表
    const wb = xlsx.utils.book_new();
    // 合并表头和示例数据
    const ws = xlsx.utils.aoa_to_sheet([...headers, ...example]);

    // 4. 设置列宽 (让表格看起来更专业，wch 代表字符宽度)
    ws['!cols'] = [
        { wch: 10 }, // A 姓名
        { wch: 6 },  // B 性别
        { wch: 12 }, // C 生日
        { wch: 12 }, // D 入托
        { wch: 15 }, // E 电话 (宽一点)
        { wch: 18 }, // F 学校
        { wch: 10 }, // G 年级
        { wch: 8 },  // H 班级
        { wch: 10 }, // I 类型
        { wch: 25 }  // J 备注 (最宽)
    ];

    // 5. 把 Sheet 放入 Workbook
    xlsx.utils.book_append_sheet(wb, ws, "学生导入模板");

    // 6. 生成二进制流并发送给前端
    const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
    
    // 设置响应头，告诉浏览器这是一个要下载的文件
    res.setHeader('Content-Disposition', 'attachment; filename="student_import_template.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
};
