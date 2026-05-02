const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../..', '.env') });

// Import Models
const User = require('../models/User');
const Genre = require('../models/Genre');
const Content = require('../models/Content');
const Episode = require('../models/Episode');
const Subscription = require('../models/Subscription');
const Review = require('../models/Review');
const Watchlist = require('../models/Watchlist');
const WatchHistory = require('../models/WatchHistory');
const UserPreference = require('../models/UserPreference');
const Recommendation = require('../models/Recommendation');
const Download = require('../models/Download');
const Subtitle = require('../models/Subtitle');
const Notification = require('../models/Notification');
const AuditLog = require('../models/AuditLog');
const Analytics = require('../models/Analytics');
const Payment = require('../models/Payment');

const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected');

    // Clear existing data
    await User.deleteMany({});
    await Genre.deleteMany({});
    await Content.deleteMany({});
    await Episode.deleteMany({});
    await Subscription.deleteMany({});
    await Review.deleteMany({});
    await Watchlist.collection.drop().catch(() => {}); // Drop collection to clear unique indexes
    await WatchHistory.deleteMany({});
    await UserPreference.deleteMany({});
    await Recommendation.deleteMany({});
    await Download.deleteMany({});
    await Subtitle.deleteMany({});
    await Notification.deleteMany({});
    await AuditLog.deleteMany({});
    await Analytics.deleteMany({});
    await Payment.deleteMany({});

    console.log('Cleared existing data');

    // Create Genres
    const genres = await Genre.insertMany([
      {
        name: 'Action',
        description: 'High-octane action-packed content',
        image: 'https://via.placeholder.com/300x400?text=Action',
        isActive: true,
      },
      {
        name: 'Drama',
        description: 'Emotional and character-driven stories',
        image: 'https://via.placeholder.com/300x400?text=Drama',
        isActive: true,
      },
      {
        name: 'Comedy',
        description: 'Funny and entertaining content',
        image: 'https://via.placeholder.com/300x400?text=Comedy',
        isActive: true,
      },
      {
        name: 'Thriller',
        description: 'Suspenseful and gripping narratives',
        image: 'https://via.placeholder.com/300x400?text=Thriller',
        isActive: true,
      },
      {
        name: 'Romance',
        description: 'Love and relationships',
        image: 'https://via.placeholder.com/300x400?text=Romance',
        isActive: true,
      },
      {
        name: 'Science Fiction',
        description: 'Futuristic and sci-fi adventures',
        image: 'https://via.placeholder.com/300x400?text=SciFi',
        isActive: true,
      },
      {
        name: 'Horror',
        description: 'Scary and supernatural content',
        image: 'https://via.placeholder.com/300x400?text=Horror',
        isActive: true,
      },
      {
        name: 'Animation',
        description: 'Animated movies and series',
        image: 'https://via.placeholder.com/300x400?text=Animation',
        isActive: true,
      },
      {
        name: 'Adventure',
        description: 'Exciting journeys and explorations',
        image: 'https://via.placeholder.com/300x400?text=Adventure',
        isActive: true,
      },
      {
        name: 'Fantasy',
        description: 'Magical and supernatural worlds',
        image: 'https://via.placeholder.com/300x400?text=Fantasy',
        isActive: true,
      },
      {
        name: 'Mystery',
        description: 'Puzzles and crime solving',
        image: 'https://via.placeholder.com/300x400?text=Mystery',
        isActive: true,
      },
      {
        name: 'Documentary',
        description: 'Real-life stories and facts',
        image: 'https://via.placeholder.com/300x400?text=Documentary',
        isActive: true,
      },
      {
        name: 'Biography',
        description: 'Life stories of notable people',
        image: 'https://via.placeholder.com/300x400?text=Biography',
        isActive: true,
      },
      {
        name: 'History',
        description: 'Historical events and periods',
        image: 'https://via.placeholder.com/300x400?text=History',
        isActive: true,
      },
      {
        name: 'War',
        description: 'Military conflict and warfare',
        image: 'https://via.placeholder.com/300x400?text=War',
        isActive: true,
      },
      {
        name: 'Music',
        description: 'Musical performances and stories',
        image: 'https://via.placeholder.com/300x400?text=Music',
        isActive: true,
      },
      {
        name: 'Musical',
        description: 'Stories told through song and dance',
        image: 'https://via.placeholder.com/300x400?text=Musical',
        isActive: true,
      },
      {
        name: 'Family',
        description: 'Content suitable for all ages',
        image: 'https://via.placeholder.com/300x400?text=Family',
        isActive: true,
      },
      {
        name: 'Sport',
        description: 'Athletic competitions and athletes',
        image: 'https://via.placeholder.com/300x400?text=Sport',
        isActive: true,
      },
      {
        name: 'Western',
        description: 'Stories of the American Old West',
        image: 'https://via.placeholder.com/300x400?text=Western',
        isActive: true,
      },
      {
        name: 'Crime',
        description: 'Criminal activities and investigations',
        image: 'https://via.placeholder.com/300x400?text=Crime',
        isActive: true,
      },
      {
        name: 'Anime',
        description: 'Japanese animated content',
        image: 'https://via.placeholder.com/300x400?text=Anime',
        isActive: true,
      },
      {
        name: 'Reality-TV',
        description: 'Unscripted real-life situations',
        image: 'https://via.placeholder.com/300x400?text=RealityTV',
        isActive: true,
      },
      {
        name: 'Talk-Show',
        description: 'Interviews and discussions',
        image: 'https://via.placeholder.com/300x400?text=TalkShow',
        isActive: true,
      },
      {
        name: 'News',
        description: 'Current events and information',
        image: 'https://via.placeholder.com/300x400?text=News',
        isActive: true,
      },
    ]);

    console.log(`Created ${genres.length} genres`);

    // Create Users
    const users = await User.create([
      {
        name: 'Admin User',
        email: 'admin@hnh-tv.com',
        password: 'admin123',
        phone: '1234567890',
        role: 'admin',
        isActive: true,
      },
      {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        phone: '9876543210',
        role: 'user',
        isActive: true,
      },
      {
        name: 'Jane Smith',
        email: 'jane@example.com',
        password: 'password123',
        phone: '5555555555',
        role: 'user',
        isActive: true,
      },
      {
        name: 'Bob Johnson',
        email: 'bob@example.com',
        password: 'password123',
        phone: '4444444444',
        role: 'user',
        isActive: true,
      },
    ]);

    console.log(`Created ${users.length} users`);

    // Create Subscription Plans
    const subscriptions = await Subscription.insertMany([
      {
        userId: users[1]._id,
        planType: 'premium',
        price: 9.99,
        currency: 'USD',
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        isActive: true,
        autoRenew: true,
        paymentMethod: 'credit_card',
        deviceLimit: 4,
        videoQuality: '4K',
      },
      {
        userId: users[2]._id,
        planType: 'standard',
        price: 6.99,
        currency: 'USD',
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        isActive: true,
        autoRenew: true,
        paymentMethod: 'paypal',
        deviceLimit: 2,
        videoQuality: '1080p',
      },
      {
        userId: users[3]._id,
        planType: 'basic',
        price: 4.99,
        currency: 'USD',
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        isActive: true,
        autoRenew: true,
        paymentMethod: 'credit_card',
        deviceLimit: 1,
        videoQuality: '720p',
      },
    ]);

    console.log(`Created ${subscriptions.length} subscriptions`);

    // Update User with subscription
    await User.findByIdAndUpdate(users[1]._id, { subscription: subscriptions[0]._id });
    await User.findByIdAndUpdate(users[2]._id, { subscription: subscriptions[1]._id });
    await User.findByIdAndUpdate(users[3]._id, { subscription: subscriptions[2]._id });

    // Create Content (Movies & Series)
    const contents = await Content.insertMany([
      {
        title: 'The Matrix',
        description: 'A computer hacker learns from mysterious rebels about the true nature of his reality.',
        genres: [genres[4]._id, genres[5]._id],
        poster: 'https://via.placeholder.com/300x450?text=The+Matrix',
        thumbnail: 'https://via.placeholder.com/500x300?text=The+Matrix',
        banner: 'https://via.placeholder.com/1920x600?text=The+Matrix',
        releaseDate: new Date('1999-03-31'),
        duration: 136,
        rating: 8.7,
        totalReviews: 150,
        contentType: 'movie',
        videoUrl: 'https://example.com/videos/matrix.mp4',
        director: ['Lana Wachowski', 'Lilly Wachowski'],
        cast: ['Keanu Reeves', 'Laurence Fishburne', 'Carrie-Anne Moss'],
        language: ['English'],
        subtitle: ['English', 'Spanish', 'French'],
        ageRating: 'R',
        isActive: true,
        views: 50000,
      },
      {
        title: 'Breaking Bad',
        description: 'A high school chemistry teacher turns to cooking methamphetamine.',
        genres: [genres[1]._id, genres[3]._id],
        poster: 'https://via.placeholder.com/300x450?text=Breaking+Bad',
        thumbnail: 'https://via.placeholder.com/500x300?text=Breaking+Bad',
        banner: 'https://via.placeholder.com/1920x600?text=Breaking+Bad',
        releaseDate: new Date('2008-01-20'),
        duration: 47,
        rating: 9.5,
        totalReviews: 300,
        contentType: 'series',
        videoUrl: 'https://example.com/videos/breakingbad.mp4',
        director: ['Vince Gilligan'],
        cast: ['Bryan Cranston', 'Aaron Paul', 'Anna Gunn'],
        language: ['English'],
        subtitle: ['English', 'Spanish'],
        ageRating: 'R',
        isActive: true,
        views: 120000,
      },
      {
        title: 'The Hangover',
        description: 'Three buddies wake up from a bachelor party in Las Vegas with no memory of the night before.',
        genres: [genres[2]._id, genres[4]._id],
        poster: 'https://via.placeholder.com/300x450?text=The+Hangover',
        thumbnail: 'https://via.placeholder.com/500x300?text=The+Hangover',
        banner: 'https://via.placeholder.com/1920x600?text=The+Hangover',
        releaseDate: new Date('2009-06-05'),
        duration: 100,
        rating: 7.7,
        totalReviews: 120,
        contentType: 'movie',
        videoUrl: 'https://example.com/videos/hangover.mp4',
        director: ['Todd Phillips'],
        cast: ['Bradley Cooper', 'Zach Galifianakis', 'Ed Helms'],
        language: ['English'],
        subtitle: ['English', 'Spanish', 'German'],
        ageRating: 'R',
        isActive: true,
        views: 75000,
      },
      {
        title: 'Inception',
        description: 'A thief who steals corporate secrets through dream-sharing technology.',
        genres: [genres[0]._id, genres[5]._id, genres[3]._id],
        poster: 'https://via.placeholder.com/300x450?text=Inception',
        thumbnail: 'https://via.placeholder.com/500x300?text=Inception',
        banner: 'https://via.placeholder.com/1920x600?text=Inception',
        releaseDate: new Date('2010-07-16'),
        duration: 148,
        rating: 8.8,
        totalReviews: 200,
        contentType: 'movie',
        videoUrl: 'https://example.com/videos/inception.mp4',
        director: ['Christopher Nolan'],
        cast: ['Leonardo DiCaprio', 'Ellen Page', 'Joseph Gordon-Levitt'],
        language: ['English'],
        subtitle: ['English', 'Spanish', 'French', 'German'],
        ageRating: 'PG-13',
        isActive: true,
        views: 95000,
      },
      {
        title: 'Game of Thrones',
        description: 'Nine noble families fight for control of the Seven Kingdoms of Westeros.',
        genres: [genres[1]._id, genres[0]._id, genres[3]._id],
        poster: 'https://via.placeholder.com/300x450?text=Game+of+Thrones',
        thumbnail: 'https://via.placeholder.com/500x300?text=Game+of+Thrones',
        banner: 'https://via.placeholder.com/1920x600?text=Game+of+Thrones',
        releaseDate: new Date('2011-04-17'),
        duration: 58,
        rating: 9.2,
        totalReviews: 500,
        contentType: 'series',
        videoUrl: 'https://example.com/videos/got.mp4',
        director: ['David Benioff', 'D.B. Weiss'],
        cast: ['Emilia Clarke', 'Peter Dinklage', 'Lena Headey'],
        language: ['English'],
        subtitle: ['English', 'Spanish', 'French', 'German', 'Italian'],
        ageRating: 'R',
        isActive: true,
        views: 200000,
      },
    ]);

    console.log(`Created ${contents.length} content items`);

    // Create Episodes for Series
    const episodes = await Episode.insertMany([
      {
        seriesId: contents[1]._id, // Breaking Bad
        seasonNumber: 1,
        episodeNumber: 1,
        title: 'Pilot',
        description: 'A high school chemistry teacher is diagnosed with advanced lung cancer.',
        videoUrl: 'https://example.com/videos/breakingbad-s01e01.mp4',
        thumbnail: 'https://via.placeholder.com/500x300?text=BB+S01E01',
        duration: 58,
        releaseDate: new Date('2008-01-20'),
        isAvailable: true,
        views: 50000,
      },
      {
        seriesId: contents[1]._id,
        seasonNumber: 1,
        episodeNumber: 2,
        title: 'Cat\'s in the Bag...',
        description: 'Walter and Jesse dispose of evidence.',
        videoUrl: 'https://example.com/videos/breakingbad-s01e02.mp4',
        thumbnail: 'https://via.placeholder.com/500x300?text=BB+S01E02',
        duration: 49,
        releaseDate: new Date('2008-01-27'),
        isAvailable: true,
        views: 45000,
      },
      {
        seriesId: contents[4]._id, // Game of Thrones
        seasonNumber: 1,
        episodeNumber: 1,
        title: 'Winter is Coming',
        description: 'Lord Stark is asked to serve as the King\'s Hand.',
        videoUrl: 'https://example.com/videos/got-s01e01.mp4',
        thumbnail: 'https://via.placeholder.com/500x300?text=GOT+S01E01',
        duration: 56,
        releaseDate: new Date('2011-04-17'),
        isAvailable: true,
        views: 100000,
      },
    ]);

    console.log(`Created ${episodes.length} episodes`);

    // Create Reviews
    const reviews = await Review.insertMany([
      {
        contentId: contents[0]._id,
        userId: users[1]._id,
        rating: 9,
        title: 'Mind-bending masterpiece',
        review: 'The Matrix is a groundbreaking film that changed cinema forever.',
        helpful: 250,
        unhelpful: 10,
        verified: true,
      },
      {
        contentId: contents[1]._id,
        userId: users[2]._id,
        rating: 10,
        title: 'Best series ever',
        review: 'Breaking Bad is an absolutely incredible series with amazing character development.',
        helpful: 500,
        unhelpful: 5,
        verified: true,
      },
      {
        contentId: contents[2]._id,
        userId: users[3]._id,
        rating: 8,
        title: 'Very funny',
        review: 'The Hangover is a hilarious comedy that keeps you laughing throughout.',
        helpful: 180,
        unhelpful: 20,
        verified: true,
      },
    ]);

    console.log(`Created ${reviews.length} reviews`);

    // Create Watchlist
    const watchlists = await Watchlist.insertMany([
      {
        userId: users[1]._id,
        contentId: contents[1]._id,
        status: 'watching',
        priority: 1,
        notes: 'Currently on Season 3',
      },
      {
        userId: users[1]._id,
        contentId: contents[4]._id,
        status: 'plan_to_watch',
        priority: 2,
        notes: 'Want to binge this',
      },
      {
        userId: users[2]._id,
        contentId: contents[0]._id,
        status: 'completed',
        priority: 0,
        notes: 'Classic movie',
      },
    ]);

    console.log(`Created ${watchlists.length} watchlist items`);

    // Create Watch History
    const watchHistories = await WatchHistory.insertMany([
      {
        userId: users[1]._id,
        contentId: contents[1]._id,
        episodeId: episodes[0]._id,
        watchedDuration: 35,
        totalDuration: 58,
        percentageWatched: 60,
        lastWatchedAt: new Date(),
        device: 'web',
        videoQuality: '1080p',
        isCompleted: false,
      },
      {
        userId: users[1]._id,
        contentId: contents[0]._id,
        watchedDuration: 136,
        totalDuration: 136,
        percentageWatched: 100,
        lastWatchedAt: new Date(),
        device: 'web',
        videoQuality: '1080p',
        isCompleted: true,
      },
      {
        userId: users[2]._id,
        contentId: contents[2]._id,
        watchedDuration: 75,
        totalDuration: 100,
        percentageWatched: 75,
        lastWatchedAt: new Date(),
        device: 'web',
        videoQuality: '720p',
        isCompleted: false,
      },
    ]);

    console.log(`Created ${watchHistories.length} watch history records`);

    // Create User Preferences
    const userPreferences = await UserPreference.insertMany([
      {
        userId: users[1]._id,
        favoriteGenres: [genres[0]._id, genres[5]._id],
        currentMood: 'excited',
        watchingTime: 'evening',
        preferredLanguage: ['English'],
        contentPreference: 'both',
        ageRatingPreference: ['PG-13', 'R'],
        notificationPreference: {
          newReleases: true,
          recommendations: true,
          watchlistReminders: true,
        },
      },
      {
        userId: users[2]._id,
        favoriteGenres: [genres[1]._id, genres[2]._id],
        currentMood: 'relaxed',
        watchingTime: 'night',
        preferredLanguage: ['English', 'Spanish'],
        contentPreference: 'movies',
        ageRatingPreference: ['PG', 'PG-13'],
        notificationPreference: {
          newReleases: true,
          recommendations: false,
          watchlistReminders: false,
        },
      },
    ]);

    console.log(`Created ${userPreferences.length} user preferences`);

    // Create Recommendations
    const recommendations = await Recommendation.insertMany([
      {
        userId: users[1]._id,
        contentId: contents[3]._id,
        recommendationType: 'mood_based',
        score: 85,
        reason: 'Based on your excited mood and love for sci-fi',
        userMood: 'excited',
        watchingContext: 'evening',
        isClicked: false,
      },
      {
        userId: users[1]._id,
        contentId: contents[4]._id,
        recommendationType: 'watch_history',
        score: 90,
        reason: 'Similar to Breaking Bad which you enjoyed',
        userMood: 'neutral',
        watchingContext: 'evening',
        isClicked: true,
        clickedAt: new Date(),
      },
      {
        userId: users[2]._id,
        contentId: contents[2]._id,
        recommendationType: 'genre_based',
        score: 80,
        reason: 'You love comedy films',
        userMood: 'relaxed',
        watchingContext: 'night',
        isClicked: false,
      },
    ]);

    console.log(`Created ${recommendations.length} recommendations`);

    // Create Downloads
    const downloads = await Download.insertMany([
      {
        userId: users[1]._id,
        contentId: contents[0]._id,
        downloadedAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        videoQuality: '1080p',
        fileSize: 2500,
        status: 'completed',
        downloadProgress: 100,
        hasSubtitles: true,
        subtitleLanguage: ['English', 'Spanish'],
        deviceId: 'device-001',
      },
      {
        userId: users[2]._id,
        contentId: contents[2]._id,
        downloadedAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        videoQuality: '720p',
        fileSize: 1500,
        status: 'completed',
        downloadProgress: 100,
        hasSubtitles: false,
        deviceId: 'device-002',
      },
    ]);

    console.log(`Created ${downloads.length} downloads`);

    // Create Subtitles
    const subtitles = await Subtitle.insertMany([
      {
        contentId: contents[0]._id,
        language: 'English',
        languageCode: 'en',
        subtitleType: 'default',
        subtitleFile: 'https://example.com/subtitles/matrix-en.vtt',
        fileFormat: 'vtt',
        isVerified: true,
        downloads: 1200,
        rating: 4.5,
        accuracy: 98,
      },
      {
        contentId: contents[0]._id,
        language: 'Spanish',
        languageCode: 'es',
        subtitleType: 'default',
        subtitleFile: 'https://example.com/subtitles/matrix-es.vtt',
        fileFormat: 'vtt',
        isVerified: true,
        downloads: 800,
        rating: 4.3,
        accuracy: 96,
      },
      {
        contentId: contents[1]._id,
        language: 'English',
        languageCode: 'en',
        subtitleType: 'default',
        subtitleFile: 'https://example.com/subtitles/breakingbad-en.vtt',
        fileFormat: 'vtt',
        isVerified: true,
        downloads: 2000,
        rating: 4.8,
        accuracy: 99,
      },
    ]);

    console.log(`Created ${subtitles.length} subtitles`);

    // Create Notifications
    const notifications = await Notification.insertMany([
      {
        userId: users[1]._id,
        type: 'new_release',
        title: 'New Action Movie Released!',
        message: 'Check out the new action-packed thriller available now!',
        contentId: contents[3]._id,
        link: '/content/' + contents[3]._id,
        isRead: false,
        priority: 'high',
        imageUrl: 'https://via.placeholder.com/300x450?text=Inception',
      },
      {
        userId: users[2]._id,
        type: 'recommendation',
        title: 'Recommended for you',
        message: 'Based on your love for comedies, we recommend this new film',
        contentId: contents[2]._id,
        link: '/content/' + contents[2]._id,
        isRead: false,
        priority: 'medium',
        imageUrl: 'https://via.placeholder.com/300x450?text=Comedy',
      },
      {
        userId: users[1]._id,
        type: 'subscription_update',
        title: 'Subscription Renewed',
        message: 'Your Premium subscription has been successfully renewed for 30 days',
        isRead: true,
        readAt: new Date(),
        priority: 'medium',
      },
    ]);

    console.log(`Created ${notifications.length} notifications`);

    // Create Audit Logs
    const auditLogs = await AuditLog.insertMany([
      {
        adminId: users[0]._id,
        action: 'create',
        targetModel: 'Content',
        targetId: contents[0]._id,
        changes: {
          after: {
            title: 'The Matrix',
            contentType: 'movie',
          },
        },
        reason: 'Added new content to platform',
        ipAddress: '192.168.1.100',
        status: 'success',
      },
      {
        adminId: users[0]._id,
        action: 'approve',
        targetModel: 'Review',
        targetId: reviews[0]._id,
        reason: 'Review verified and approved',
        status: 'success',
      },
    ]);

    console.log(`Created ${auditLogs.length} audit logs`);

    // Create Analytics
    const analytics = await Analytics.insertMany([
      {
        date: new Date(),
        contentId: contents[0]._id,
        totalViews: 50000,
        totalWatches: 35000,
        totalDownloads: 5000,
        averageWatchDuration: 120,
        completionRate: 85,
        averageRating: 8.7,
        newUsers: 150,
        activeUsers: 2500,
        subscriptionConversion: 0.12,
        revenue: 2500,
        topGenres: [
          { genreId: genres[0]._id, views: 15000 },
          { genreId: genres[5]._id, views: 12000 },
        ],
        deviceBreakdown: {
          mobile: 25000,
          desktop: 20000,
          tablet: 5000,
        },
      },
      {
        date: new Date(),
        totalViews: 150000,
        totalWatches: 100000,
        totalDownloads: 15000,
        averageWatchDuration: 115,
        completionRate: 80,
        averageRating: 8.5,
        newUsers: 500,
        activeUsers: 8000,
        subscriptionConversion: 0.15,
        revenue: 8000,
        topGenres: [
          { genreId: genres[1]._id, views: 40000 },
          { genreId: genres[0]._id, views: 35000 },
        ],
        deviceBreakdown: {
          mobile: 80000,
          desktop: 50000,
          tablet: 20000,
        },
      },
    ]);

    console.log(`Created ${analytics.length} analytics records`);

    // Create Payments
    const payments = await Payment.insertMany([
      {
        userId: users[1]._id,
        subscriptionId: subscriptions[0]._id,
        amount: 9.99,
        currency: 'USD',
        paymentMethod: 'credit_card',
        transactionId: 'TXN-' + Date.now() + '-001',
        status: 'completed',
        paymentGateway: 'stripe',
        lastFourDigits: '4242',
        planType: 'premium',
        billingCycle: 'monthly',
        nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
      {
        userId: users[2]._id,
        subscriptionId: subscriptions[1]._id,
        amount: 6.99,
        currency: 'USD',
        paymentMethod: 'paypal',
        transactionId: 'TXN-' + Date.now() + '-002',
        status: 'completed',
        paymentGateway: 'paypal',
        planType: 'standard',
        billingCycle: 'monthly',
        nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
      {
        userId: users[3]._id,
        subscriptionId: subscriptions[2]._id,
        amount: 4.99,
        currency: 'USD',
        paymentMethod: 'credit_card',
        transactionId: 'TXN-' + Date.now() + '-003',
        status: 'completed',
        paymentGateway: 'stripe',
        lastFourDigits: '5555',
        planType: 'basic',
        billingCycle: 'monthly',
        nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    ]);

    console.log(`Created ${payments.length} payments`);

    console.log('\n✅ Database seeded successfully!');
    console.log(`
    Summary:
    - Genres: ${genres.length}
    - Users: ${users.length}
    - Subscriptions: ${subscriptions.length}
    - Content: ${contents.length}
    - Episodes: ${episodes.length}
    - Reviews: ${reviews.length}
    - Watchlist: ${watchlists.length}
    - Watch History: ${watchHistories.length}
    - User Preferences: ${userPreferences.length}
    - Recommendations: ${recommendations.length}
    - Downloads: ${downloads.length}
    - Subtitles: ${subtitles.length}
    - Notifications: ${notifications.length}
    - Audit Logs: ${auditLogs.length}
    - Analytics: ${analytics.length}
    - Payments: ${payments.length}
    `);

    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error.message);
    process.exit(1);
  }
};

seedDatabase();
