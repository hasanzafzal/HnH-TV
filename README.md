# HnH TV - OTT Streaming Platform

A professional OTT (Over-The-Top) streaming platform built with the MERN stack (MongoDB, Express.js, React, Node.js). Stream movies, TV shows, manage watchlists, write reviews, and subscribe to different plans.

## 🚀 Features

### Core Features
- **Content Management**: Browse movies and TV series with detailed information
- **Search & Discovery**: Full-text search across content library
- **Watchlist Management**: Add/remove content to personal watchlist
- **Review System**: Rate and review content with automatic rating aggregation
- **Watch History**: Track viewing progress and continue where you left off
- **User Profiles**: Personalized user profiles with watch statistics
- **Subscription Plans**: Multiple subscription tiers (Free, Basic, Premium, VIP)
- **Video Player**: Built-in video player with quality and volume controls

### Advanced Features
- Trending content recommendations
- Genre-based content filtering
- Progress tracking for incomplete content
- User authentication with JWT
- Responsive design for all devices

## 📁 Project Structure

```
HnH-TV/
├── backend/
│   ├── config/
│   │   └── database.js           # MongoDB connection
│   ├── models/
│   │   ├── User.js               # User schema
│   │   ├── Content.js            # Movie/TV series schema
│   │   ├── Genre.js              # Genre schema
│   │   ├── Subscription.js       # Subscription schema
│   │   ├── Watchlist.js          # Watchlist schema
│   │   ├── Review.js             # Review/rating schema
│   │   ├── WatchHistory.js       # Watch history schema
│   │   └── Episode.js            # TV episode schema
│   ├── controllers/
│   │   ├── authController.js     # Auth logic
│   │   ├── contentController.js  # Content CRUD
│   │   ├── genreController.js    # Genre CRUD
│   │   ├── watchlistController.js
│   │   ├── reviewController.js   # Review management
│   │   ├── watchHistoryController.js
│   │   └── subscriptionController.js
│   ├── routes/
│   │   ├── auth.js               # Auth endpoints
│   │   ├── content.js            # Content endpoints
│   │   ├── genre.js              # Genre endpoints
│   │   ├── watchlist.js          # Watchlist endpoints
│   │   ├── review.js             # Review endpoints
│   │   ├── watchHistory.js       # History endpoints
│   │   └── subscription.js       # Subscription endpoints
│   ├── middleware/
│   │   ├── auth.js               # JWT verification
│   │   └── errorHandler.js       # Error handling
│   ├── utils/
│   │   └── validators.js         # Input validation
│   ├── constants/
│   │   └── ott.js                # OTT constants
│   ├── server.js                 # Express server
│   ├── package.json
│   └── .env.example
│
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.js         # Navigation header
│   │   │   ├── VideoCard.js      # Content card component
│   │   │   ├── CategorySlider.js # Horizontal content slider
│   │   │   ├── RatingComponent.js # Star rating widget
│   │   │   └── VideoPlayer.js    # Video player
│   │   ├── pages/
│   │   │   ├── Home.js           # Home/dashboard
│   │   │   ├── ContentDetail.js  # Content details & reviews
│   │   │   ├── Watch.js          # Video player page
│   │   │   ├── Watchlist.js      # User's watchlist
│   │   │   ├── Search.js         # Search results
│   │   │   ├── Profile.js        # User profile
│   │   │   ├── Subscription.js   # Subscription management
│   │   │   └── NotFound.js       # 404 page
│   │   ├── utils/
│   │   │   ├── api.js            # Axios API client
│   │   │   └── storage.js        # LocalStorage helpers
│   │   ├── styles/
│   │   │   ├── index.css         # Global styles
│   │   │   ├── components.css    # Component styles
│   │   │   └── pages.css         # Page styles
│   │   ├── App.js                # Main component
│   │   └── index.js              # Entry point
│   ├── package.json
│   └── .env.example
│
└── README.md
```

## 🔌 API Endpoints

### Authentication
```
POST   /api/auth/register         # Register new user
POST   /api/auth/login            # Login user
GET    /api/auth/me               # Get current user (protected)
```

### Content
```
GET    /api/content               # Get all content (with filters)
GET    /api/content/:id           # Get content by ID
GET    /api/content/trending      # Get trending content
GET    /api/content/genre/:genreId # Get content by genre
GET    /api/content/search/:query  # Search content
POST   /api/content               # Create content (admin)
PUT    /api/content/:id           # Update content (admin)
DELETE /api/content/:id           # Delete content (admin)
```

### Genres
```
GET    /api/genres                # Get all genres
GET    /api/genres/:id            # Get genre by ID
POST   /api/genres                # Create genre (admin)
PUT    /api/genres/:id            # Update genre (admin)
DELETE /api/genres/:id            # Delete genre (admin)
```

### Watchlist
```
GET    /api/watchlist             # Get user's watchlist (protected)
POST   /api/watchlist/:contentId  # Add to watchlist (protected)
DELETE /api/watchlist/:contentId  # Remove from watchlist (protected)
GET    /api/watchlist/check/:contentId # Check if in watchlist (protected)
```

### Reviews
```
GET    /api/reviews/:contentId    # Get reviews for content
POST   /api/reviews/:contentId    # Create review (protected)
PUT    /api/reviews/:reviewId     # Update review (protected)
DELETE /api/reviews/:reviewId     # Delete review (protected)
```

### Watch History
```
GET    /api/watch-history         # Get user's history (protected)
GET    /api/watch-history/:contentId # Get progress for content (protected)
POST   /api/watch-history/:contentId # Update watch progress (protected)
GET    /api/watch-history/continue-watching # Get resume list (protected)
```

### Subscription
```
GET    /api/subscription          # Get user's subscription (protected)
GET    /api/subscription/plans    # Get all plans
POST   /api/subscription          # Create/update subscription (protected)
DELETE /api/subscription          # Cancel subscription (protected)
```

## 🔑 Database Models

### User
- name, email, password (hashed)
- createdAt, updatedAt

### Content
- title, description, contentType (movie/tv_series)
- genre (array of ObjectIds), releaseDate
- duration (minutes), rating, views
- directors [], cast [], posterUrl, thumbnailUrl, bannerUrl, videoUrl
- ageRating, language [], subtitles [], quality
- isActive, createdAt, updatedAt

### Genre
- name (unique), description, iconUrl, isActive

### Subscription
- user (ObjectId), plan (free/basic/premium/vip)
- monthlyPrice, startDate, endDate, isActive
- billingCycle (monthly/yearly), autoRenew
- maxScreens, maxQuality

### Watchlist
- user (ObjectId), content (ObjectId)
- addedAt, unique constraint on (user, content)

### Review
- user (ObjectId), content (ObjectId)
- rating (1-10), title, comment
- helpful (count), createdAt, updatedAt

### WatchHistory
- user (ObjectId), content (ObjectId)
- watchedAt, duration (seconds), progress (0-100%), isCompleted

### Episode
- tvSeries (ObjectId), season, episodeNumber (unique per series)
- title, description, duration, releaseDate
- videoUrl, thumbnailUrl, rating

## 🛠️ Tech Stack

### Backend
- **Express.js** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - ODM
- **JWT** - Authentication token
- **bcryptjs** - Password hashing
- **CORS** - Cross-origin requests
- **dotenv** - Environment variables

### Frontend
- **React** - UI library
- **React Router DOM** - Client-side routing
- **Axios** - HTTP client
- **CSS3** - Styling

## 📋 Prerequisites

- Node.js (v16 or higher)
- MongoDB (v4.0 or higher)
- npm or yarn package manager

## ⚙️ Setup Instructions

### 1. Clone Repository
```bash
git clone https://github.com/hasanzafzal/HnH-TV.git
cd HnH-TV
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env with your configuration
nano .env
```

**Backend .env variables:**
```
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/hnh-tv
JWT_SECRET=your_super_secret_key_here
JWT_EXPIRE=7d
FRONTEND_URL=http://localhost:3000
```

**Start backend:**
```bash
npm run dev  # Development with nodemon
npm start    # Production
```

Backend will run on `http://localhost:5000`

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env (optional)
nano .env
```

**Frontend .env variables:**
```
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_NODE_ENV=development
```

**Start frontend:**
```bash
npm start  # Development
npm run build  # Production build
```

Frontend will open at `http://localhost:3000`

### 4. Run Both Servers Simultaneously

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

## 📊 Subscription Plans

| Plan | Price | Screens | Quality | Features |
|------|-------|---------|---------|----------|
| Free | ₹0/mo | 1 | 480p | Limited content, Ads |
| Basic | ₹99/mo | 1 | 720p | Full library, No ads |
| Premium | ₹199/mo | 4 | 1080p | Full library, Full HD |
| VIP | ₹299/mo | 6 | 4K | Everything + Priority support |

## 🔒 Authentication Flow

1. User registers with email/password
2. Password is hashed using bcryptjs
3. JWT token is generated and returned
4. Token is stored in browser localStorage
5. Token is sent in Authorization header for protected routes
6. Backend verifies token before allowing access

## 📱 Responsive Design

The platform is fully responsive with breakpoints for:
- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

## 🚀 Performance Features

- Lazy loading for content
- Image optimization with poster/thumbnail/banner URLs
- Pagination for reviews and watch history
- Indexed MongoDB queries for fast searches
- Minified production builds

## 🔐 Security Features

- JWT token-based authentication
- Password hashing with bcryptjs
- CORS configuration
- Input validation on backend
- Protected routes requiring authentication
- Secure token storage (localStorage)

## 🐛 Troubleshooting

### MongoDB Connection Failed
```
Error: connect ECONNREFUSED
```
**Solution:** Ensure MongoDB is running
```bash
# macOS with Homebrew
brew services start mongodb-community

# Linux
sudo systemctl start mongod

# Or use MongoDB Atlas (Cloud)
```

### Port Already in Use
**Solution:** Change PORT in .env or kill the process
```bash
# Find process on port 5000
lsof -i :5000

# Kill process
kill -9 <PID>
```

### CORS Issues
**Solution:** Verify FRONTEND_URL in backend .env matches actual URL

### Module Not Found
**Solution:** Reinstall dependencies
```bash
rm -rf node_modules package-lock.json
npm install
```

## 📈 Future Enhancements

- [ ] User authentication UI (Login/Register pages)
- [ ] Payment integration (Stripe/PayPal)
- [ ] Email notifications
- [ ] Social sharing features
- [ ] Admin dashboard
- [ ] Analytics and metrics
- [ ] Multi-language support
- [ ] Dark/Light theme toggle
- [ ] Mobile app (React Native)
- [ ] Live streaming support
- [ ] Comments and discussions
- [ ] Personalized recommendations (ML based)

## 📝 Environment Variables

### Backend (.env)
```
# Server
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/hnh-tv

# JWT
JWT_SECRET=your_secret_key
JWT_EXPIRE=7d

# URLs
FRONTEND_URL=http://localhost:3000
API_URL=http://localhost:5000
```

### Frontend (.env)
```
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_NODE_ENV=development
```

## 📄 Available Scripts

### Backend
- `npm start` - Production server
- `npm run dev` - Development with nodemon
- `npm test` - Run tests

### Frontend
- `npm start` - Development server
- `npm run build` - Production build
- `npm test` - Run tests

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License - see LICENSE file for details

## 👨‍💻 Author

**Hasan Zafzal**
- GitHub: [@hasanzafzal](https://github.com/hasanzafzal)

## 🙏 Acknowledgments

- MERN Stack community
- MongoDB documentation
- React documentation
- Express.js documentation

## 📧 Support

For support, email support@hnhtv.com or open an issue on GitHub

---

**Last Updated:** April 2026
**Version:** 1.0.0 
