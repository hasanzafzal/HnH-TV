<img src="[your-image-url]([https://github.com/hasanzafzal/HnH-TV/blob/main/frontend/public/favicon.svg](https://github.com/user-attachments/assets/5d8f17ae-8ee3-485a-9751-d4e6f035fd75))" 

# HnH-TV

**Live at:** [https://www.hnh-tv.duckdns.org/](https://www.hnh-tv.duckdns.org/)

HnH-TV is a full-stack, comprehensive media streaming platform. It offers an advanced video player with universal format support (including on-the-fly FFmpeg transcoding for AVI, MKV, HEVC), intelligent AI recommendations, and robust user management.
<img width="959" height="599" alt="Screenshot 2026-05-08 140839" src="https://github.com/user-attachments/assets/01d02345-cb30-4b80-874d-2e3ce315e043" />
<img width="959" height="599" alt="Screenshot 2026-05-08 140855" src="https://github.com/user-attachments/assets/c1a52f8e-d42e-47a3-bb84-efd8c496f27b" />
<img width="959" height="598" alt="Screenshot 2026-05-08 140905" src="https://github.com/user-attachments/assets/3bc77138-3cda-4d44-b4f7-efe5b5f3bd9b" />
<img width="959" height="598" alt="Screenshot 2026-05-08 140944" src="https://github.com/user-attachments/assets/b3e34b28-198a-46d4-8619-3eb67a87f52c" />
<img width="844" height="567" alt="Screenshot 2026-05-08 141038" src="https://github.com/user-attachments/assets/c4d28462-2945-48e6-bf6d-318ab01d983c" />
<img width="850" height="599" alt="Screenshot 2026-05-08 141632" src="https://github.com/user-attachments/assets/dd54e4f9-3510-4883-bfc5-0d13a38b21f6" />
<img width="959" height="476" alt="image" src="https://github.com/user-attachments/assets/a3a4c8af-9976-4216-90f4-134ce07d80c6" />
<img width="948" height="473" alt="Screenshot 2026-05-08 141851" src="https://github.com/user-attachments/assets/50dff304-3f2c-45ab-b4e1-8b98dfff9522" />
<img width="226" height="308" alt="Screenshot 2026-05-08 141913" src="https://github.com/user-attachments/assets/af943da0-2477-4b44-a453-86adb62f7b2c" /><img width="219" height="307" alt="Screenshot 2026-05-08 141933" src="https://github.com/user-attachments/assets/f23315c8-99b8-43cf-aae7-0d066c15e450" />

## 🚀 Features

*   **MERN Stack Core**: Built on MongoDB, Express.js, React.js, and Node.js.
*   **Universal Video Streaming**: Seamless playback of diverse video formats (MKV, AVI, HEVC, MP4, WebM) with built-in FFmpeg transcoding on the server side. Handles complex remuxing and browser compatibility effortlessly.
*   **AI Recommendations Chatbot**: Integrated FastAPI backend powered by Python to deliver personalized content recommendations and conversational interactions.
*   **User Watch History & Resumes**: Tracks what users watch and resumes playback seamlessly from where they left off.
*   **User Subscriptions**: Manages user access to premium content.
*   **VidLink Pro Integration**: Aggregates premium external content.
*   **Containerized Production Deployment**: Full Docker Compose setup including Nginx reverse proxy and ZeroSSL certificates via acme.sh.

## 🛠️ Technology Stack

*   **Frontend**: React (React Router, Axios, Lucide React)
*   **Backend (Main API)**: Express.js, Node.js, Mongoose, JWT authentication
*   **Backend (AI)**: FastAPI, Python, Uvicorn
*   **Database**: MongoDB Atlas
*   **Video Processing**: FFmpeg (Server-side)
*   **Infrastructure**: Docker, Docker Compose, Nginx, ZeroSSL

## 📂 Project Structure

```
HnH-TV/
├── backend/            # Express.js REST API & FFmpeg streaming pipeline
├── frontend/           # React single-page application
├── Dockerfile          # Multi-stage build for frontend and Node backend
├── Dockerfile.ai       # Build for Python FastAPI AI Chatbot
├── docker-compose.yml  # Orchestration for backend, AI, Nginx, and acme.sh
├── init-ssl.sh         # Script to bootstrap ZeroSSL certificates
└── nginx.conf          # Nginx reverse proxy configuration
```

## 💻 Local Development

### Prerequisites
*   Node.js (v18+)
*   Python 3.8+
*   MongoDB
*   FFmpeg (installed locally for transcoding support)

### Setup

1.  **Clone the repository** (if not already local)
2.  **Install dependencies**
    ```bash
    npm run install-all
    ```
3.  **Environment Variables**
    Create a `.env` file in the root directory. You'll need values for `MONGODB_URI`, `JWT_SECRET`, etc.
4.  **Run Locally**
    We use `concurrently` to run everything together.
    ```bash
    npm run dev
    ```
    This single command spins up:
    *   React Frontend
    *   Express Backend (Port 5000)
    *   FastAPI Chatbot (Port 8000)

## 🐳 Production Deployment (Docker)

The platform is designed to be easily deployed to a cloud provider (e.g., Oracle Cloud) using Docker.

1.  **Environment Variables**: Ensure `.env` is configured properly for production.
2.  **SSL Setup**: 
    If deploying for the first time, run the SSL initialization script to bootstrap your certificates:
    ```bash
    chmod +x init-ssl.sh
    ./init-ssl.sh
    ```
3.  **Start Services**:
    ```bash
    docker-compose up -d --build
    ```
    This will bring up the Node backend, Python AI backend, Nginx proxy on ports 80/443, and acme.sh for automatic SSL renewal.

## 📝 License

This project is licensed under the [GPL-2.0 License](https://opensource.org/licenses/GPL-2.0).
