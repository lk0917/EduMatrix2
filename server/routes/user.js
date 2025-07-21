const express = require("express");
const router = express.Router();
const pool = require("../db");
const bcrypt = require("bcrypt");

// 회원가입 //
router.post("/register", async (req, res) => {
        console.log("회원가입 요청 도착 :", req.body);
    const { email, password, name,username, gender, birth, phone } = req.body;
    try {
        const hash = await bcrypt.hash(password, 10);
        const [result] = await pool.query(
            `INSERT INTO users (email, password_hash, username,name, gender, birth, phone)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [email, hash, username, name, gender, birth, phone]
        );
        res.json({ success: true, user_id: result.insertId });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "회원가입을 실패하였습니다." });
    }
});

// 로그인 //
router.post("/login", async (req, res) => {
    const { idOrEmail, password } = req.body;

    try {
        const [rows] = await pool.query(
            "SELECT * FROM users WHERE email = ? OR username = ?",
            [idOrEmail, idOrEmail]
        );

        if (rows.length === 0) {
            return res.status(401).json({ success: false, message: "존재하지 않는 아이디입니다." });
        }

        const user = rows[0];

        const match = await bcrypt.compare(password, user.password_hash);
        if (!match) {
            return res.status(401).json({ success: false, message: "비밀번호가 틀렸습니다." });
        }

        res.json({
            success: true,
            user: {
                user_id: user.user_id,
                email: user.email,
                username: user.username
            }
        });
    } catch (err) {
        console.error("로그인 오류 : ", err);
        res.status(500).json({ success: false, message: "서버에 오류가 있어 로그인이 되지 않습니다." });
    }
});

//테마 업데이트//
router.post("/update-theme", async (req, res) => {
    const { user_id, theme } = req.body;


    //테마 유효성 검사
    const validThemes = ["light", "dark", "gradient"];
    if (!validThemes.includes(theme)) {
        return res.status(400).json({ error: "잘못된 테마 값" });
    }

    try {
        await pool.execute(
            "UPDATE users SET theme = ? WHERE user_id = ?",
            [theme, user_id]
        );
        res.json({ success: true });
    } catch (err) {
        console.error("테마 저장 실패:", err);
        res.status(500).json({ error: "서버 오류" });
    }
});


// 사용자 정보 조회 //
router.get("/userinfo", async (req, res) => {
    const userId = req.query.user_id;
    try {
        const [rows] = await pool.execute( //평문 삽입
            "SELECT user_id, email, username,name,theme FROM users WHERE user_id = ?",
            [userId]
        );
        if (rows.length === 0) return res.status(404).json({ error: "사용자가 존재하지 않습니다." }); 
        res.json(rows[0]);
    } catch (err) {
        console.error("유저정보 조회실패:", err);
        res.status(500).json({ error: "서버오류" });
    }
});

// 분야, 레벨 저장 API //
router.post("/save-user-fields", async (req, res) => {
    const { user_id, selections } = req.body;
    const conn = await pool.getConnection();

    try {
        await conn.beginTransaction();

        
        await conn.query("DELETE FROM user_fields WHERE user_id = ?", [user_id]);

        //저장 필드
        const values = selections.map(({ field, level }) => [user_id, field, level]);
        if (values.length > 0) {
            await conn.query(
                "INSERT INTO user_fields (user_id, field, level) VALUES ?",
                [values]
            );
        }

        await conn.commit();
        res.json({ success: true });
    } catch (err) {
        await conn.rollback();
        console.error("분야/레벨 저장 실패: 405", err);
        res.status(500).json({ success: false });
    } finally {
        conn.release();
    }
});

router.get("/user-fields", async (req, res) => {
    const { user_id } = req.query;
    try {
        const [rows] = await pool.query(
            "SELECT field, level FROM user_fields WHERE user_id = ?",
            [user_id]
        );
        res.json(rows); // 필드: [{ field: 'english', level: 'beginner' }, ...]
    } catch (err) {
        console.error("분야/레벨 조회 오류:", err);
        res.status(500).json({ error: "서버 오류" });
    }
});


router.patch('/update-userinfo', async (req, res) => {
  const { user_id, username, name, email, password } = req.body;
  try {
    const hash = await bcrypt.hash(password, 10);
    await pool.query(
      `UPDATE users
         SET username = ?, name = ?, email = ?, password_hash = ?
       WHERE user_id = ?`,
      [username, name, email, hash, user_id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('유저 정보 업데이트 실패:', err);
    res.status(500).json({ success: false, message: '서버 오류' });
  }
});
module.exports = router;
