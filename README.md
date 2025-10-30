# 💬 Chatting App Socket Backend

This is the **backend server** for the **Chatting App**, built with **Node.js**, **TypeScript**, **Express**, **Socket.IO**, and **MongoDB**.  
It handles real-time communication, message storage, user authentication, and room management for the chat frontend.

---

## 🚀 Features

- 🔐 **User Authentication** (JWT-based)
- 💬 **Real-time Messaging** with Socket.IO
- 👥 **Chat Rooms / Private Chats**
- 📦 **MongoDB Integration** with Mongoose
- ⚙️ **TypeScript** for type safety
- 📁 **Modular Controller-Service Architecture**
- 🔄 **RESTful APIs** for users, messages, and chatrooms
- 🧾 **Error Handling & Validation**

---

## 🛠️ Tech Stack

| Technology | Purpose |
|-------------|----------|
| **Node.js + Express** | Backend server and REST API |
| **TypeScript** | Type safety and maintainability |
| **Socket.IO** | Real-time communication |
| **MongoDB + Mongoose** | Database and ORM |
| **JWT (JSON Web Token)** | Authentication and authorization |
| **dotenv** | Environment configuration |

---

## 📂 Folder Structure

```
chat-backend/
├── src/
│   ├── controllers/
│   ├── services/
│   ├── models/
│   ├── middleware/
│   ├── sockets/
│   ├── utils/
│   ├── app.ts
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
npm run dev
```

For production:
```bash
npm run build
npm start
```

---

## 🔌 Socket Events

| Event | Description |
|--------|--------------|
| `connection` | Triggered when a user connects |
| `sendMessage` | Emit message to a room or user |
| `receiveMessage` | Listen for incoming messages |
| `disconnect` | Triggered when user disconnects |

---

## 🧠 Example API Routes

| Method | Endpoint | Description |
|---------|-----------|-------------|
| `POST` | `/api/auth/register` | Register new user |
| `POST` | `/api/auth/login` | User login |
| `GET` | `/api/users` | Get all users |
| `GET` | `/api/messages/:roomId` | Fetch messages of a chatroom |

---

## 🧪 Postman API Examples

### 🧍 Register User

**POST** `/api/auth/register`
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "123456"
}
```

### 🔑 Login User

**POST** `/api/auth/login`
```json
{
  "email": "john@example.com",
  "password": "123456"
}
```

### 💬 Send Message

**POST** `/api/messages/send`
```json
{
  "senderId": "user123",
  "receiverId": "user456",
  "content": "Hello 👋"
}
```

---

## 🤝 Contributing

Pull requests are welcome!  
For major changes, please open an issue first to discuss what you would like to change.

---

## 🧾 License

This project is licensed under the **MIT License** — feel free to use and modify it.

---

## 💡 Author

**Sujalsingh Rathod**  
🚀 Full Stack Developer | 💬 Real-time Apps Enthusiast  
📧 [Email](mailto:sujalsinhrathod@gmail.com)  
🌐 [GitHub](https://github.com/HACKEERSUJAL)

---
