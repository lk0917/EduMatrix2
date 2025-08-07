const pool = require("./db");

async function initializeDatabase() {
  try {
    const conn = await pool.getConnection();

    // learning_goals 테이블 생성
    await conn.query(`
      CREATE TABLE IF NOT EXISTS learning_goals (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        subject VARCHAR(100) NOT NULL,
        detail VARCHAR(100) NOT NULL,
        level VARCHAR(50) NOT NULL,
        goal TEXT NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        field VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_user_id (user_id)
      )
    `);

    // test_results 테이블 수정 (필요한 컬럼 추가)
    await conn.query(`
      CREATE TABLE IF NOT EXISTS test_results (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        subject VARCHAR(100) NOT NULL,
        detail VARCHAR(100) NOT NULL,
        level VARCHAR(50) NOT NULL,
        goal TEXT,
        start_date DATE,
        end_date DATE,
        field VARCHAR(100),
        score INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_user_id (user_id)
      )
    `);

    // 기존 test_results 테이블에 컬럼 추가 (이미 존재하는 경우)
    try {
      await conn.query("ALTER TABLE test_results ADD COLUMN goal TEXT AFTER level");
    } catch (error) {
      // 컬럼이 이미 존재하는 경우 무시
      console.log("goal 컬럼이 이미 존재합니다.");
    }

    try {
      await conn.query("ALTER TABLE test_results ADD COLUMN start_date DATE AFTER goal");
    } catch (error) {
      console.log("start_date 컬럼이 이미 존재합니다.");
    }

    try {
      await conn.query("ALTER TABLE test_results ADD COLUMN end_date DATE AFTER start_date");
    } catch (error) {
      console.log("end_date 컬럼이 이미 존재합니다.");
    }

    try {
      await conn.query("ALTER TABLE test_results ADD COLUMN field VARCHAR(100) AFTER end_date");
    } catch (error) {
      console.log("field 컬럼이 이미 존재합니다.");
    }

    try {
      await conn.query("ALTER TABLE test_results ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP");
    } catch (error) {
      console.log("created_at 컬럼이 이미 존재합니다.");
    }

    // user_fields 테이블 생성 (이미 있다면 무시)
    await conn.query(`
      CREATE TABLE IF NOT EXISTS user_fields (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        field VARCHAR(100) NOT NULL,
        level VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_user_id (user_id)
      )
    `);

    console.log("데이터베이스 테이블 초기화 완료");
    conn.release();
  } catch (error) {
    console.error("데이터베이스 초기화 실패:", error);
  }
}

module.exports = { initializeDatabase };
