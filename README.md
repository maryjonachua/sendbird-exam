# Sendbird Exam

A **Next.js 15** application integrated with **Sendbird UIKit** and **PostgreSQL**.  
This project demonstrates user creation and channel when created

## Installation

Clone the repo and install dependencies:

```bash
git clone https://github.com/maryjonachua/sendbird-exam.git
cd sendbird-exam
npm install
npm run dev

```

Open http://localhost:3000/

## .env variables

```bash
NEXT_PUBLIC_APP_ID="39CA08FB-6F0F-42D1-B796-AF4D0EDB5BF4"
NEXT_PUBLIC_USER_ID="user_ca3b457f"
NEXT_PUBLIC_USER_TOKEN="2995fe0987e17904498b74c4e743215daca238e9"
NEXT_PUBLIC_MASTER_API_TOKEN="321db940380b6b8de3dbb8c65cdb886bffc12960"

NEXT_PUBLIC_PGHOST=""
NEXT_PUBLIC_PGUSER=""
NEXT_PUBLIC_PGPASSWORD=""
NEXT_PUBLIC_PGPORT=""
NEXT_PUBLIC_PGDATABASE=""
```

## API routes

- POST /api/users/create → Create and saved a user in Sendbird + Database
- POST /api/users/update → Save updated nickname/profile in Database
- POST /api/channels/sync → Sync user’s channels from Sendbird and save to Database

## Database Schema

```bash
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) UNIQUE NOT NULL,
    nickname VARCHAR(255),
    profile_url TEXT,
    deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);


CREATE TABLE channels (
    id SERIAL PRIMARY KEY,
    channel_url VARCHAR(255) UNIQUE NOT NULL,
    created_by VARCHAR(255) NOT NULL,
    chatmate_id VARCHAR(255),
    is_deleted BOOLEAN DEFAULT FALSE,
    message_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

```

## Test Data 2

```bash
NEXT_PUBLIC_USER_ID="user_a9e7510d"
NEXT_PUBLIC_USER_TOKEN="550cad547fa1546f7bde27e45a12c700f673e949"
```
