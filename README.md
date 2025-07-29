# HD Notes - Secure Note Taking App

A modern, full-stack note-taking application built with Next.js, TypeScript, and MongoDB.

## 🚀 Features

- **Authentication**: Email/OTP and Google OAuth signup
- **Note Management**: Create, edit, delete, and organize notes
- **Responsive Design**: Mobile-friendly interface
- **Real-time Updates**: Instant note synchronization
- **Secure**: JWT-based authentication with MongoDB

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Node.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT, Google OAuth 2.0
- **Email**: Gmail SMTP for OTP delivery
- **UI Components**: shadcn/ui

## 📦 Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd note-taking-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create `.env.local` with:
   ```env
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   EMAIL_USER=your_gmail_address
   EMAIL_PASSWORD=your_gmail_app_password
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🔧 API Endpoints

- `POST /api/auth/signup` - User registration
- `POST /api/auth/signin` - User login
- `GET /api/auth/google` - Google OAuth initiation
- `GET /api/user` - Get user profile
- `GET /api/notes` - Get user notes
- `POST /api/notes` - Create note
- `PUT /api/notes/[id]` - Update note
- `DELETE /api/notes/[id]` - Delete note

## 🎨 Design Features

- **Two-column layout** for desktop view
- **Mobile-optimized** responsive design
- **Modern UI** with smooth animations
- **Dark/Light theme** support
- **Loading states** and error handling

## 🔒 Security

- JWT token-based authentication
- HTTP-only cookies for token storage
- MongoDB data validation
- Input sanitization and validation
- CORS protection

## 📱 Mobile Support

- Responsive design for all screen sizes
- Touch-friendly interface
- Optimized for mobile browsers
- Fast loading on mobile networks

## 🚀 Performance

- Optimized Google OAuth flow (4-7 seconds)
- Efficient database queries
- Minimal bundle size
- Fast page loads
