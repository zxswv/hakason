-- 1. users テーブル (すべてのデータの親となるユーザー管理)
-- CREATE TABLE users (
--     user_id SERIAL PRIMARY KEY,
--     name VARCHAR(255) NOT NULL,
--     email VARCHAR(255) UNIQUE NOT NULL,
--     password_hash VARCHAR(255) NOT NULL
-- );
-- 2. companies テーブル (ユーザーが登録した企業情報)
CREATE TABLE companies (
    company_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES
    users(user_id) ON DELETE CASCADE,
    company_name VARCHAR(255) NOT NULL,
    description TEXT,
    job_categories VARCHAR(255),
    benefits TEXT,
    starting_salary INTEGER,
    locations VARCHAR(255),
    selection_flow TEXT,
    review TEXT,
    memo TEXT
);
-- 3. selections テーブル (企業ごとの選考ステータスや志望度)
CREATE TABLE selections (
    selection_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES
    users(user_id) ON DELETE CASCADE,
    company_id INT NOT NULL REFERENCES
    companies(company_id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL,
    priority INTEGER CHECK (priority>= 1 AND priority <= 5),
    next_deadline TIMESTAMP
);
-- 4. schedules テーブル (面接や説明会などの予定管理)
-- CREATE TABLE schedules (
--     schedule_id SERIAL PRIMARY KEY,
--     user_id INT NOT NULL REFERENCES
--     users(user_id) ON DELETE CASCADE,
--     company_id INT REFERENCES
--     companies(company_id) ON DELETE SET NULL,
--     title VARCHAR(255) NOT NULL,
--     start_datetime TIMESTAMP NOT NULL,
--     end_datetime TIMESTAMP NOT NULL,
--     location VARCHAR(255),
--     memo TEXT,
--     source VARCHAR(50)
-- );
-- -- 5. notifications テーブル (予定に連動した通知・リマインダータスク)
-- CREATE TABLE notifications (
--     notification_id SERIAL PRIMARY KEY,
--     user_id INT NOT NULL REFERENCES
--     users(user_id) ON DELETE CASCADE,
--     schedule_id INT REFERENCES
--     schedules(schedule_id) ON DELETE CASCADE,
--     message VARCHAR(255) NOT NULL,
--     notify_at TIMESTAMP NOT NULL,
--     is_completed BOOLEAN DEFAULT FALSE
-- );
-- -- 6. documents テーブル (エントリーシート、履歴書等のドキュメント管理)
-- CREATE TABLE documents (
--     document_id SERIAL PRIMARY KEY,
--     user_id INT NOT NULL REFERENCES
--     users(user_id) ON DELETE CASCADE,
--     company_id INT REFERENCES
--     companies(company_id) ON DELETE SET NULL,
--     category VARCHAR(50) NOT NULL,
--     title VARCHAR(255) NOT NULL,
--     content TEXT,
--     file_path TEXT,
--     updated_at TIMESTAMP DEFAULT
--     CURRENT_TIMESTAMP
-- );