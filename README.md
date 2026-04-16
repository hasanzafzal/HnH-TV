# HnH TV - MERN Stack Application

A full-stack web application built with MongoDB, Express.js, React, and Node.js (MERN).

## Project Structure

```
HnH-TV/
├── backend/                 # Node.js + Express backend
│   ├── config/             # Configuration files
│   ├── models/             # Mongoose schemas
│   ├── routes/             # API routes
│   ├── controllers/        # Route controllers
│   ├── middleware/         # Custom middleware
│   ├── utils/              # Utility functions
│   ├── server.js           # Express server
│   ├── package.json        # Backend dependencies
│   ├── .env.example        # Environment variables template
│   └── .gitignore          # Git ignore rules
│
├── frontend/               # React.js frontend
│   ├── public/             # Static assets
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── utils/          # Utility functions
│   │   ├── styles/         # CSS stylesheets
│   │   ├── App.js          # Main App component
│   │   └── index.js        # React entry point
│   ├── package.json        # Frontend dependencies
│   ├── .env.example        # Environment variables template
│   └── .gitignore          # Git ignore rules
│
└── README.md               # This file
```

## Prerequisites

- **Node.js** (v16 or higher)
- **MongoDB** (local or Atlas)
- **npm** or **yarn**

## Setup Instructions

### 1. Backend Setup

Navigate to the backend directory:

```bash
cd backend
```

Install dependencies:

```bash
npm install
```

Create a `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

Update the `.env` file with your configuration:

```
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/hnh-tv
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE=7d
FRONTEND_URL=http://localhost:3000
```

Start the backend server:

```bash
npm run dev
```

The server will run on `http://localhost:5000`

### 2. Frontend Setup

Navigate to the frontend directory:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Create a `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

Update the `.env` file (optional):

```
REACT_APP_API_URL=http://localhost:5000/api
```

Start the development server:

```bash
npm start
```

The app will open at `http://localhost:3000`

## Available Scripts

### Backend

- `npm start` - Start the production server
- `npm run dev` - Start the development server with nodemon

### Frontend

- `npm start` - Start the development server
- `npm run build` - Build for production
- `npm test` - Run tests

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (requires token)

### Health
- `GET /api/health` - API health check

## Technologies Used

### Backend
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **CORS** - Cross-Origin Resource Sharing
- **dotenv** - Environment variables

### Frontend
- **React** - UI library
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **CSS3** - Styling

## Folder Structure Explanation

### Backend Folders

- **config/** - Database and app configuration
- **models/** - Mongoose data models
- **routes/** - API route definitions
- **controllers/** - Business logic and request handlers
- **middleware/** - Custom middleware (auth, error handling)
- **utils/** - Helper functions and validators

### Frontend Folders

- **public/** - Static HTML and assets
- **src/components/** - Reusable React components
- **src/pages/** - Full page components
- **src/utils/** - API calls and utility functions
- **src/styles/** - CSS stylesheets

## Environment Variables

### Backend (.env)

```
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/hnh-tv
JWT_SECRET=your_secret_key
JWT_EXPIRE=7d
FRONTEND_URL=http://localhost:3000
```

### Frontend (.env)

```
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_NODE_ENV=development
```

## Running Both Servers

To run both backend and frontend simultaneously:

**Terminal 1 (Backend):**
```bash
cd backend
npm run dev
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm start
```

## Development Notes

1. The frontend is configured to proxy API calls to the backend via the `proxy` field in `package.json`
2. JWT tokens are stored in localStorage on the client side
3. Protected routes require a Bearer token in the Authorization header
4. CORS is enabled for frontend communication with the backend

## Troubleshooting

**MongoDB Connection Error:**
- Ensure MongoDB is running
- Check the MONGODB_URI in `.env`

**Port Already in Use:**
- Change the PORT in backend `.env`
- Or kill the process using the port

**CORS Issues:**
- Verify FRONTEND_URL in backend `.env`
- Ensure backend CORS middleware is properly configured

## Future Enhancements

- Add authentication UI (Login/Register pages)
- Implement video/content models
- Add user profile management
- Implement search functionality
- Add admin dashboard
- Deploy to production

## License

ISC

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request 
