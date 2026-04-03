
# 🚀 1-on-1 MentorShip Frontend

A production-grade real-time mentorship platform frontend built with **Next.js (App Router)**, enabling collaborative coding, live chat, and peer-to-peer video communication.

---

## 🌐 Live Deployment

* 🔗 Frontend: mentorship-platform-frontend-iota.vercel.app
* 🔗 Backend API: https://mentorship-platform-backend-hbm1.onrender.com

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

Samyak Bahade

---

## ⭐ Contribution

Feel free to fork and improve!
