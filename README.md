# National Welding Works Catalog

A complete, mobile-first catalog web application for browsing steel furniture products. Features include full-screen image viewer with pinch-to-zoom, dark mode, offline capabilities via Firebase, and a hidden 'Shop Mode' toggle for pricing data.

## Features

- **Mobile First**: Built specifically for mobile touch devices.
- **Shop Mode**: Hidden toggle to show Selling Price, Cost Price, and Margin privately.
- **Gestures**: Swipe to navigate images, pinch to zoom double-tap to zoom.
- **Admin Panel**: Password protected panel to upload local images directly to Firebase, compress images on the fly, and auto-calculate margin.
- **Infinite Scrolling**: Paginated data fetching using Firestore and Intersection Observer.

## Tech Stack
- React 18 + Vite
- Tailwind CSS v3
- Firebase v10 SDK
- React Router v6
- lucide-react & @use-gesture/react

## Local Setup Instructions

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Variables**
   Copy `.env.example` to `.env` and fill in your Firebase credentials and Admin password:
   ```bash
   cp .env.example .env
   ```

3. **Firebase Setup**
   - Create a Firebase Project
   - Enable Firestore Database (production mode, add security rules)
   - Enable Storage (production mode, add security rules)
   - Add the necessary Indexes: 
     - Collection: `products`
     - Fields: `category` (Ascending), `subCategory` (Ascending), `isActive` (Ascending), `createdAt` (Descending)

4. **Start Development Server**
   ```bash
   npm run dev
   ```

## Vercel Deployment

1. Build the project
   ```bash
   npm run build
   ```
2. Deploy using Vercel CLI (or via Git Integration)
   ```bash
   vercel
   ```
3. Set your Environment Variables in the Vercel Dashboard before production.
