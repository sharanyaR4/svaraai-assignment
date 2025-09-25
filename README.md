# Svaraai Assignment

A full-stack web application developed as part of the Svaraai assignment, featuring a modern frontend interface and a robust backend API.

## 🚀 Features

- RESTful APIs for CRUD operations
- Input validation & error handling
- Structured project architecture
- Frontend-backend integration
- Responsive user interface
- Modern development practices

## 🛠️ Tech Stack

**Frontend:**
- React.js
- HTML5/CSS3
- JavaScript (ES6+)

**Backend:**
- Node.js
- Express.js
- RESTful API design

**Tools:**
- npm/yarn
- Git version control

## 📋 Prerequisites

Before running this application, make sure you have the following installed:

- Node.js (v14 or higher)
- npm or yarn
- Git

## ⚡ Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/sharanyaR4/svaraai-assignment.git
   cd svaraai-assignment
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

4. **Start the backend server**
   ```bash
   cd ../backend
   npm start
   ```
   The backend server will run on `http://localhost:5000`

5. **Start the frontend application**
   ```bash
   cd ../frontend
   npm start
   ```
   The frontend will run on `http://localhost:3000`

## 📁 Project Structure

```
svaraai-assignment/
├── backend/                 # Backend API server
│   ├── routes/             # API routes
│   ├── models/             # Data models
│   ├── middleware/         # Custom middleware
│   ├── config/             # Configuration files
│   └── server.js           # Entry point
├── frontend/               # Frontend React app
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   └── App.js          # Main App component
│   └── public/             # Static files
└── README.md
```

## 🔗 API Endpoints

The backend provides the following API endpoints:

- `GET /api/` - Get all items
- `POST /api/` - Create new item
- `PUT /api/:id` - Update item by ID
- `DELETE /api/:id` - Delete item by ID

## 🌟 Usage

1. Open your browser and navigate to `http://localhost:3000`
2. Use the interface to interact with the application
3. All data operations are handled through the backend API

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is created for assignment purposes.

## 👤 Author

**Sharanya R**
- GitHub: [@sharanyaR4](https://github.com/sharanyaR4)

---

*This project was developed as part of the Svaraai technical assignment.*
