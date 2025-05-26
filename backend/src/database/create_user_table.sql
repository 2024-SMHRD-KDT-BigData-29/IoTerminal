CREATE TABLE IF NOT EXISTS users (
    user_id VARCHAR(50) PRIMARY KEY,  -- 사용자 아이디
    password VARCHAR(255) NOT NULL,    -- 비밀번호 (해시된 값 저장)
    name VARCHAR(100) NOT NULL,         -- 이름
    email VARCHAR(100) NOT NULL UNIQUE,         -- 이메일
    phone VARCHAR(20),                 -- 전화번호
    gender ENUM('male', 'female'),
    birth_date DATE,                    -- 생년월일
    address VARCHAR(255),              -- 주소
    role ENUM('admin', 'user') DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  -- 계정 생성 시간
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,  -- 정보 수정 시간
    status ENUM('active', 'inactive', 'suspended') DEFAULT 'active'  -- 계정 상태
); 