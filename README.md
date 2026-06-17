# NWW Catalog - Next.js & Supabase Product Catalog

This is a production-grade, mobile-first product catalog web application built for **National Welding Works (Koppal, Karnataka)**. 
Salespersons use this application on mobile devices as a digital menu card to showcase steel furniture products to customers.

*Note: This is a product showcase catalog only. It has **no** shopping cart checkout, payments, or online order processing.*

---

## Technical Stack

- **Frontend**: Next.js 14 (App Router) + Tailwind CSS + Lucide Icons
- **Database & Image Storage**: Supabase (PostgreSQL Database & Storage Buckets)
- **Deployment**: Vercel

---

## Core Features

1. **Mobile-First UX**: Responsive touch-friendly card grid, pinch-to-zoom, and swipe gesture gallery navigation.
2. **Secure Admin Dashboard (`/admin`)**: Single password authentication verified server-side via `HttpOnly` cookie (expires in 24 hours).
3. **Bulk Image Upload**: Select and upload hundreds of furniture photos from mobile phone galleries. 
4. **Mobile-Safe Uploading**: Upload queue is automatically chunked into batches of **50** max to prevent browser tab crashes on mobile.
5. **Client-Side Image Compression**: Compresses photos client-side to `< 300KB` (target size) using `browser-image-compression` to ensure fast catalog loading on 4G connections.
6. **Lazy Categorization**: Uploaded bulk images start as `uncategorized`. The admin can browse them in a grid, open any image, and lazily assign them to a subcategory later.
7. **Cover Image Fallback**: Home page category cards dynamically display cover photos: custom category cover $\rightarrow$ first categorized product $\rightarrow$ first product $\rightarrow$ standard placeholder.
8. **Shortlisted Shares (Favorites)**: Salespersons can bookmark designs and share the shortlist with formatted text or links via WhatsApp.

---

## 1. Local Development Setup

### Prerequisites
- Node.js (v18.x or newer)
- npm or yarn

### Steps
1. Clone the repository and navigate to the directory:
   ```bash
   git clone https://github.com/Azam-aa/nww-catalog.git
   cd nww-catalog
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables. Create a `.env.local` file in the root directory and copy the contents from `.env.local.example`:
   ```bash
   cp .env.local.example .env.local
   ```
4. Fill in the keys in `.env.local` (see environment configuration details below).
5. Start the development server:
   ```bash
   npm run dev
   ```
6. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 2. Supabase Setup

### Database & Storage Schema
1. Log in to [Supabase Console](https://supabase.com) and create a **New Project**.
2. Navigate to the **SQL Editor** in the left sidebar.
3. Open the file [supabase_setup.sql](file:///e:/Delete%20this/NWW/supabase_setup.sql) located in the root of this repository.
4. Copy the entire content of `supabase_setup.sql` and paste it into the Supabase SQL Editor, then click **Run**.
   - This sets up the `categories`, `subcategories`, and `products` tables.
   - It configures Row Level Security (RLS) policies allowing public read access.
   - It seeds the core 10 categories and their 31 subcategories.
   - It creates the public Storage bucket named `product-images` and enables public read access.

---

## 3. Cloudinary to Supabase Image Migration

To migrate your existing data from Firebase and Cloudinary to Supabase:
1. Create a `.env.migration` file in the root directory (this file is git-ignored):
   ```bash
   cp .env.migration.example .env.migration
   ```
2. Open `.env.migration` and fill in:
   - Your existing Firebase client credentials (pre-filled from original app).
   - Your new Supabase project API URL and the **SUPABASE_SERVICE_ROLE_KEY** (required to bypass RLS policies and write images to storage and table rows).
3. Run the migration script:
   ```bash
   node src/scripts/migrate-images.js
   ```
4. Look at the console. The script will print a detailed success summary. If there is a checksum mismatch, it will abort. Do not deploy if there is a mismatch.

---

## 4. Environment Variables Configuration

Add the following environment variables to your `.env.local` file (for local dev) and your **Vercel Project Dashboard** (for production):

| Key | Description | Example |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | The API URL of your Supabase project | `https://xxttyyzz.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | The public API key of your Supabase project | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `SUPABASE_SERVICE_ROLE_KEY` | The secret service role key (keep safe, server-only) | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `ADMIN_PASSWORD` | The password used to access `/admin` | `your-secret-password-here` |

---

## 5. Vercel Deployment

1. Connect your Github repository to [Vercel](https://vercel.com).
2. Create a new project pointing to the repo.
3. In **Settings -> Environment Variables**, add the four variables listed in the table above.
4. Click **Deploy**. Vercel will automatically build the Next.js App and serve it globally at your domain.
