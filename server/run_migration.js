const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runMigration() {
  let connection;
  
  try {
    // 데이터베이스 연결
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      charset: 'utf8mb4'
    });

    console.log('데이터베이스에 연결되었습니다.');

    // 마이그레이션 SQL 파일 읽기
    const migrationPath = path.join(__dirname, 'db_migration.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // SQL 문들을 분리하여 실행
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);

    console.log('마이그레이션을 시작합니다...');

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        try {
          await connection.execute(statement);
          console.log(`✅ SQL 문 ${i + 1} 실행 완료`);
        } catch (error) {
          console.log(`⚠️ SQL 문 ${i + 1} 실행 중 오류 (무시됨):`, error.message);
        }
      }
    }

    console.log('✅ 마이그레이션이 완료되었습니다!');
    console.log('추가된 필드:');
    console.log('- total_quiz_count: 총 퀴즈 수');
    console.log('- total_quiz_score: 총 퀴즈 점수');
    console.log('- best_quiz_score: 최고 퀴즈 점수');
    console.log('- average_quiz_score: 평균 퀴즈 점수');
    console.log('- last_quiz_date: 마지막 퀴즈 날짜');

  } catch (error) {
    console.error('마이그레이션 실패:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('데이터베이스 연결이 종료되었습니다.');
    }
  }
}

// 스크립트가 직접 실행될 때만 마이그레이션 실행
if (require.main === module) {
  runMigration();
}

module.exports = runMigration;
