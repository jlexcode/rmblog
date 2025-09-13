# Simple Research Log

A minimalistic research log built with HTML, Tailwind CSS, JavaScript, and Supabase.

## Setup

1. Create a Supabase project at [supabase.com](https://supabase.com)

2. Create a `posts` table in your Supabase database:
   ```sql
   CREATE TABLE posts (
     id SERIAL PRIMARY KEY,
     title TEXT NOT NULL,
     excerpt TEXT NOT NULL,
     content TEXT NOT NULL,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     slug TEXT UNIQUE NOT NULL
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
- Responsive layout
- Simple and functional

## Adding Posts

You can add posts directly to your Supabase database or create an admin interface later.
