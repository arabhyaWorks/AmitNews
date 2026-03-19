# Samachar Group - Product Requirements Document

## Project Overview
**Name:** Samachar Group  
**Type:** News Portal with Reporter Community  
**Last Updated:** March 19, 2026

## Original Problem Statement
Build a news website named "Samachar Group" - a community of news reporters who can signup/login and write/publish news. Public section where anyone can view news with filtering, search, featured section. Categories include Sports, Crime, Politics, Entertainment, Business, Technology. Rich text editor for articles, admin moderation, save drafts, bilingual UI.

## User Personas

### 1. Reporter
- Can sign up via email/password or Google OAuth
- Write articles with rich text editor (bold, italic, etc.)
- Save articles as drafts or publish directly
- Manage their own articles
- View article statistics (views)

### 2. Admin
- All reporter capabilities
- View all articles across the platform
- Revoke/remove any published article
- Access admin dashboard with platform stats
- Moderate content

### 3. Public Reader
- Browse all published articles
- Filter by categories
- Search articles
- Read individual articles
- Toggle language (Hindi/English)

## Core Features Implemented ✅

### Authentication
- [x] JWT-based email/password login
- [x] Google OAuth via Emergent Auth
- [x] Session management with cookies
- [x] Protected routes for reporters/admin

### Article Management
- [x] Rich text editor (Quill) for content creation
- [x] Bilingual support (English + Hindi titles/content)
- [x] Category selection (6 categories)
- [x] Featured article marking
- [x] Image URL support
- [x] Draft/Publish workflow
- [x] Edit existing articles
- [x] Delete articles

### Public Interface
- [x] Bento Grid featured news layout
- [x] Category-wise article sections
- [x] Individual article view with related articles
- [x] Search functionality
- [x] Category pages
- [x] Language toggle (Hindi/English)
- [x] Responsive design

### Admin Features
- [x] Admin dashboard with stats
- [x] View all articles
- [x] Revoke published articles
- [x] Delete articles
- [x] Filter by status (published/draft/revoked)

## Tech Stack
- **Frontend:** React 19, Tailwind CSS, Shadcn UI
- **Backend:** FastAPI, MongoDB, Motor
- **Auth:** JWT + Emergent Google OAuth
- **Editor:** Quill.js (custom wrapper)
- **Fonts:** Playfair Display, Public Sans, Mukta, Rozha One

## API Endpoints

### Auth
- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/google-session
- GET /api/auth/me
- POST /api/auth/logout

### Articles
- POST /api/articles
- GET /api/articles
- GET /api/articles/{id}
- PUT /api/articles/{id}
- DELETE /api/articles/{id}

### Public
- GET /api/public/articles
- GET /api/public/categories

### Admin
- GET /api/admin/articles
- PUT /api/admin/articles/{id}/revoke
- GET /api/admin/stats

## Demo Credentials
- **Admin:** admin@samachar.com / admin123
- **Reporter:** reporter@samachar.com / reporter123

## Prioritized Backlog

### P0 - Critical (Done)
- [x] User authentication
- [x] Article CRUD
- [x] Public news viewing
- [x] Admin moderation

### P1 - Important
- [ ] Image upload (currently using URL)
- [ ] Comments on articles
- [ ] Reporter profile pages
- [ ] Article sharing to social media

### P2 - Nice to Have
- [ ] Email notifications
- [ ] Push notifications for breaking news
- [ ] Analytics dashboard
- [ ] Article bookmarks for readers
- [ ] Newsletter subscription
- [ ] SEO optimization

## Next Tasks
1. Add image upload functionality (S3/Cloudinary)
2. Implement comments system
3. Add reporter public profile pages
4. Social sharing buttons
5. Breaking news banner feature
