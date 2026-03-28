# ChitGPT — AI Chat Application

A production-grade, full-stack AI chat web application featuring a stunning glassmorphism UI, real-time AI streaming, guest mode, JWT authentication with email verification, and a robust scalable backend.

## Tech Stack

- **Frontend**: Next.js 14 App Router, TailwindCSS, Zustand, Framer Motion
- **Backend**: Node.js, Express.js, Zod
- **Database**: PostgreSQL (Supabase)
- **AI Integration**: Gemini (Default) / OpenAI swappable

---

## 🚀 Quick Start Guide

### 1. Database Setup
1. Create a free project at [Supabase](https://supabase.com).
2. Go to the **SQL Editor** in your Supabase dashboard.
3. Copy the contents of `backend/schema.sql` and run it to create the required tables and triggers.
4. Get your direct PostgreSQL connection string from **Settings > Database > Connection Parameters (URI)**. It should look like `postgresql://postgres.[project]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres`.

### 2. Backend Setup
1. Open a terminal and navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create your environment file:
   ```bash
   cp .env.example .env
   ```
4. Fill in the `.env` file with your specific credentials:
   - `DATABASE_URL` (From step 1)
   - `JWT_SECRET` (Can be any long random string)
   - `SMTP_*` (Your Gmail credentials. **You MUST use a Google App Password**, not your normal password).
   - `GEMINI_API_KEY` (Get from Google AI Studio).
5. Start the backend development server:
   ```bash
   npm run dev
   ```
   *The server should start on `http://localhost:5000`*.

### 3. Frontend Setup
1. Open a *new* terminal tab and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Create your environment file:
   ```bash
   cp .env.local.example .env.local
   ```
3. Start the frontend development server:
   ```bash
   npm run dev
   ```
   *The frontend should start on `http://localhost:3000`*.

---

## 🌟 Key Features

- **Smooth AI Streaming**: Uses Server-Sent Events (SSE) so you see the AI typing its response in real-time.
- **Glassmorphic UI**: Beautiful Apple-inspired design with blurs, subtle glow animations, and dark mode.
- **Guest Mode**: Try out the app instantly without verifying an email.
- **Optimistic Updates**: Your messages appear instantly before the server even responds, making the app feel incredibly fast.
- **Token-Aware Context Window**: Automatically manages chat history so you don't overwhelm the AI with too much text, while retaining recent conversation context.
