# Simple Research Log

A minimalistic research log built with HTML, Tailwind CSS, JavaScript, and Supabase.

## Setup

1. Create a Supabase project at [supabase.com](https://supabase.com)

2. Create the required tables in your Supabase database:
   
   **Posts table:**
   ```sql
   CREATE TABLE posts (
     id SERIAL PRIMARY KEY,
     title TEXT NOT NULL,
     excerpt TEXT NOT NULL,
     content TEXT NOT NULL,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     slug TEXT UNIQUE NOT NULL,
     featured BOOLEAN DEFAULT FALSE
   );
   ```
   
   **Predictions table:**
   ```sql
   CREATE TABLE predictions_table (
     id SERIAL PRIMARY KEY,
     title TEXT NOT NULL,
     table_content TEXT NOT NULL,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );
   ```

3. Get your Supabase URL and anon key from your project settings

4. Update `app.js` with your Supabase credentials:
   ```javascript
   const SUPABASE_URL = 'your-project-url'
   const SUPABASE_ANON_KEY = 'your-anon-key'
   ```

5. Open `index.html` in your browser

## Features

- Clean, minimalistic design
- Posts loaded from Supabase
- Predictions page with confidence-colored tables
- Admin panel for content management
- Static site generation
- Responsive layout
- SEO optimized with sitemaps

## Adding Content

### Blog Posts
Use the admin panel at `/admin.html` to create and manage blog posts.

### Predictions Tables
1. Generate HTML table in R with confidence coloring
2. Use admin panel to upload as "Predictions Table"
3. Build script generates static `predictions.html` page

## Build Process

Run `npm run build` to generate static HTML files from Supabase data.
