This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

# 🚀 1-on-1 MentorShip Frontend

A production-grade real-time mentorship platform frontend built with **Next.js (App Router)**, enabling collaborative coding, live chat, and peer-to-peer video communication.

---

## 🌐 Live Deployment

* 🔗 Frontend: https://your-frontend.vercel.app
* 🔗 Backend API: https://your-backend.onrender.com

---

## 📌 Product Overview

MentorHub is a real-time collaboration platform where:

* Mentors create sessions
* Students join via session ID
* Both collaborate through:

  * Code editor 💻
  * Chat 💬
  * Video call 🎥

---

## 🧱 System Architecture

```text
Browser (Next.js App)
        ↓
Socket.io Client
        ↓
Node.js Backend (Express + Socket.io)
        ↓
Supabase (Auth + Database)
```

---

## 🔄 Data Flow

### Authentication Flow

```text
User → Supabase Auth → Session → Protected Routes
```

### Real-time Flow

```text
Client A → Socket.io → Server → Client B
```

### WebRTC Flow

```text
Mentor → Offer → Server → Student  
Student → Answer → Server → Mentor  
ICE Exchange → Peer Connection
```

---

## ✨ Core Features

### 🔐 Authentication

* Supabase-based email/password auth
* Session persistence
* Route protection (Dashboard, Editor)

---

### 🎯 Role Management

* Mentor → creates session
* Student → joins session
* Role handled dynamically (no DB dependency)

---

### 💻 Code Editor

* Monaco Editor integration
* Real-time synchronization
* Low-latency updates

---

### 💬 Chat System

* Socket-based messaging
* Persistent storage in Supabase
* System messages (join/leave)

---

### 🎥 Video Communication

* WebRTC peer-to-peer connection
* STUN server usage
* Camera & microphone controls

---

### 📋 Session Management

* Create / Join / Leave / End session
* Copy session ID
* Role-based controls

---

## 🛠️ Tech Stack

| Category  | Technology    |
| --------- | ------------- |
| Framework | Next.js 13+   |
| UI        | React         |
| Styling   | Tailwind CSS  |
| Auth      | Supabase      |
| Realtime  | Socket.io     |
| Editor    | Monaco Editor |
| Video     | WebRTC        |

---

## 📂 Project Structure

```bash
app/
 ├── login/           # Authentication
 ├── signup/          # User registration
 ├── dashboard/       # Session management
 └── editor/[id]/     # Real-time collaboration

lib/
 └── supabase.ts      # Supabase client
```

---

## ⚙️ Environment Setup

### Required Variables

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_BACKEND_URL=
```

---

## 🧑‍💻 Local Development

```bash
git clone https://github.com/YOUR_USERNAME/mentorhub-frontend.git
cd mentorhub-frontend
npm install
npm run dev
```

---

## 🧪 Usage Guide

### 1. Login / Signup

* Navigate to `/login`
* Register if new user

---

### 2. Dashboard

* Create session → mentor
* Join session → student

---

### 3. Editor Page

* Real-time code editing
* Chat messaging
* Video call interaction

---

### 4. Video Call

* Mentor initiates call
* Student auto-connects
* Both control camera/mic

---

## 🔐 Security Considerations

* Supabase handles authentication securely
* No sensitive keys exposed (only public keys used)
* Backend validates session existence
* WebRTC is peer-to-peer (no media server)

---

## ⚡ Performance Optimizations

* Debounced code updates (optional)
* Efficient state updates
* Minimal re-renders via hooks
* WebRTC direct streaming (low latency)

---

## 🚀 Deployment

### Frontend (Vercel)

```bash
npm run build
```

Set env variables in Vercel dashboard.

---

## 📊 Scalability Notes

* Stateless frontend (scales easily)
* WebSocket server can be horizontally scaled
* WebRTC reduces server load (P2P)

---

## 🐛 Troubleshooting

### Issue: Video not working

* Check browser permissions
* Ensure HTTPS (required for WebRTC in production)

### Issue: Socket not connecting

* Verify backend URL
* Check CORS config

---

## 📌 Future Enhancements

* Screen sharing
* Multi-user sessions
* Chat attachments
* Dark mode

---

## 👨‍💻 Author

Your Name

---

## ⭐ Contribution

Feel free to fork and improve!
