# 💬 Chatting App Socket Backend

This is the **backend server** for the **Chatting App**, built with **NestJS**, **TypeScript**, **Socket.IO**, and **MongoDB**.
It powers **real-time messaging**, **user presence tracking**, and **WebRTC voice calls** between users.

---

## 🚀 Features

- 🔐 **JWT Authentication** (for REST and Socket.IO)
- 💬 **Real-time Messaging**
- 👥 **Chat Rooms / Private Chats**
- 📞 **Peer-to-Peer Voice Calling (WebRTC)**
- 📦 **MongoDB Integration** with Mongoose
- ⚙️ **TypeScript** for clean, scalable code
- 📁 **Modular Controller-Service Architecture**
- 🔄 **RESTful APIs** for chat and user management
- 🧾 **Comprehensive Error Handling & DTO Validation**

---

## 🛠️ Tech Stack

| Technology | Purpose |
|-------------|----------|
| **NestJS (Express)** | Framework for modular backend architecture |
| **TypeScript** | Type safety and maintainability |
| **Socket.IO** | Real-time communication |
| **MongoDB + Mongoose** | Database and ODM |
| **JWT (JSON Web Token)** | Authentication and authorization |
| **dotenv** | Environment configuration |

---

## 📂 Folder Structure

```
chat-backend/
├── src/
│   ├── auth/
│   │   ├── dto
│   │   ├── auth.controller.ts
│   │   ├── auth.module.ts
│   │   ├── auth.services.ts
│   ├── chat/
│   │   ├── chat.controller.ts
│   │   ├── chat.gateway.ts
│   │   ├── chat.module.ts
│   │   ├── chat.service.ts
│   │   ├── dto/
│   │   ├── schemas/
│   │   └── utils/
│   ├── common/
│   │   ├── guard/
│   ├── user/
│   │   ├── dto
│   │   ├── enums
│   │   ├── schema
│   │   ├── user.controller.ts
│   │   ├── user.module.ts
│   │   ├── user.service.ts
│   │   └── utils/
│   ├── app.module.ts
│   └── main.ts
├── package.json
├── tsconfig.json
└── .env
```

---

## ⚙️ Setup & Installation

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/HACKEERSUJAL/chatting-app-socket-backend.git
cd chatting-app-socket-backend
```

### 2️⃣ Install Dependencies

```bash
npm install
```

### 3️⃣ Configure Environment Variables

Create a `.env` file in the project root:

```env
PORT=3000
MONGO_URI=mongodb+srv://<your-db-uri>
JWT_SECRET=your_jwt_secret
```

### 4️⃣ Start the Server

For development:
```bash
npm run start:dev
```

For production:
```bash
npm run build
npm run start:prod
```

---

## 🔌 Socket Events

| Event | Description |
|--------|--------------|
| `connection` | Triggered when a user connects |
| `send_message` | Emit message to a room or user |
| `receive_message` | Listen for incoming messages |
| `typing` | Notify when a user is typing |
| `mark_as_seen` | Mark message as seen |
| `chat_opened` | Mark conversation as opened |
| `user_online` | Notify when user is online |
| `user_offline` | Notify when user is offline |
| `call_user` | Initiate a voice call |
| `incoming_call` | Notify receiver of incoming call |
| `answer_call` | Accept or reject a call |
| `webrtc_offer` / `webrtc_answer` | WebRTC session exchange |
| `webrtc_ice_candidate` | ICE candidate exchange |
| `end_call` | End a voice call |

---

## 🧩 Services & Functionalities

| Service / Feature | Included | Description |
|--------------------|-----------|-------------|
| **Real-time messaging** | ✅ | Socket-based chat between users |
| **Message storage (MongoDB)** | ✅ | Stores messages with sender/receiver details |
| **Unread message tracking** | ✅ | Tracks unseen messages for users |
| **Typing indicators** | ✅ | Real-time typing updates |
| **Online/Offline presence** | ✅ | Broadcasts user connection status |
| **Seen status updates** | ✅ | Updates message visibility state |
| **User search** | ✅ | Query users to start chat |
| **WebRTC voice calling** | ✅ | Peer-to-peer calls with offer/answer/ICE |
| **JWT socket authentication** | ✅ | Token-based connection validation |
| **REST API for chats** | ✅ | Endpoints for fetching chat lists and messages |

---

## 🧠 Example API Routes

| Method | Endpoint | Description |
|---------|-----------|-------------|
| `POST` | `/chat` | Send a message |
| `GET` | `/chat` | Fetch chat thread list |
| `GET` | `/chat/messageList` | Get messages for a chatroom |
| `GET` | `/chat/search-users` | Search users to start chat |

---

## 🧪 Example Socket Event Flow (Voice Call)

```plaintext
Caller: emits "call_user" →
Receiver: receives "incoming_call" →
Receiver: emits "answer_call" →
Exchange: "webrtc_offer" ↔ "webrtc_answer" ↔ "webrtc_ice_candidate" →
Either side: emits "end_call"
```

---

## 🧾 Example .env

```env
PORT=3000
MONGO_URI=mongodb+srv://your-db-url
JWT_SECRET=your-secret-key
CORS_ORIGIN=http://localhost:5173
```

---

## 🤝 Contributing

Pull requests are welcome!
For major changes, open an issue first to discuss the proposed change.

---

## 🧾 License

This project is licensed under the **MIT License** — free to use and modify.

---

## 👨‍💻 Author

**Sujalsingh Rathod**
🚀 Full Stack Developer
📧 [Email](mailto:your-email@example.com)
🌐 [GitHub](https://github.com/HACKEERSUJAL)

---
