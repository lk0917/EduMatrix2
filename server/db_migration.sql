-- 사용자 테이블에 퀴즈 통계 필드 추가
-- 각 컬럼을 개별적으로 추가하여 이미 존재하는 경우 오류를 방지

-- total_quiz_count 컬럼 추가
ALTER TABLE users ADD COLUMN total_quiz_count INT DEFAULT 0;

-- total_quiz_score 컬럼 추가
ALTER TABLE users ADD COLUMN total_quiz_score INT DEFAULT 0;

-- best_quiz_score 컬럼 추가
ALTER TABLE users ADD COLUMN best_quiz_score INT DEFAULT 0;

-- average_quiz_score 컬럼 추가
ALTER TABLE users ADD COLUMN average_quiz_score DECIMAL(5,2) DEFAULT 0.00;

-- last_quiz_date 컬럼 추가
ALTER TABLE users ADD COLUMN last_quiz_date DATETIME NULL;

-- updated_at 컬럼 추가
ALTER TABLE users ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- 기존 데이터가 있다면 기본값 설정
UPDATE users 
SET total_quiz_count = 0, 
    total_quiz_score = 0, 
    best_quiz_score = 0, 
    average_quiz_score = 0.00
WHERE total_quiz_count IS NULL;

-- 인덱스 추가 (성능 향상)
CREATE INDEX idx_users_quiz_stats ON users(total_quiz_count, best_quiz_score, last_quiz_date);
