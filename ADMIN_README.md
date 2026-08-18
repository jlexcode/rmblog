# Admin Panel for Reasonable Machines Research Log

## Overview
A simple, password-protected admin interface for creating research log posts with CSV table uploads and PNG image uploads.

## Features
- **Secure Authentication**: Supabase email/password authentication
- **CSV to Table**: Upload CSV files and convert to styled HTML tables
- **Image Upload**: Drag & drop PNG/JPEG images with captions
- **Live Preview**: See how your post will look before publishing
- **Auto-slug Generation**: Automatically creates URL-friendly slugs from titles
- **Auto-excerpt Generation**: Automatically creates excerpts from the first 30 words of content

## How to Use

### 1. Access Admin Panel
Navigate to `admin.html` in your browser

### 2. Login
- Enter your Supabase admin email and password
- Click Login or press Enter

### 3. Create a Post
1. **Title**: Enter your post title
2. **Slug**: Auto-generated from title (can be edited if needed)
3. **Post type**: Essay or Docket Report — auto-suggested when the title starts with "Docket Report"; your manual choice wins. Essays appear as cards on the homepage (most recent 8); docket reports appear in the compact per-term list. Everything is also indexed on `archive.html`, grouped by term.
4. **Term**: integer year (2025 = OT25) — auto-filled from today's date using a September 1 cutoff (Sep 1 of year N through Aug 31 of year N+1 → OT N). Override only when posting for a different term than the current date implies.
5. **Content**: Write your post in the main text area
6. **Excerpt**: Auto-generated from first 30 words of content

Note: the `post_type` and `term` fields require a one-time schema addition in the Supabase dashboard SQL editor:
```sql
ALTER TABLE posts ADD COLUMN post_type text;
ALTER TABLE posts ADD COLUMN term integer;
```
Older posts with NULL values are handled by fallbacks in `build-posts.js`: post type via heuristic (title starting with "Docket Report" in any punctuation, or slug starting with `docket-report-`), term derived from the post date with the same September 1 cutoff. No backfill is needed.

### 4. Add Tables from CSV
1. **Upload CSV**: Drag & drop or click to browse
2. **Preview**: See how the table will look
3. **Add Caption**: Optional table description
4. **Insert**: Click "Insert Table into Post" to add to content

### 5. Add Images
1. **Upload Images**: Drag & drop or click to browse (supports multiple)
2. **Add Captions**: Optional image descriptions
3. **Insert**: Click "Insert" on each image to add to content

### 6. Preview & Publish
- **Live Preview**: See your post as it will appear
- **Publish**: Click "Publish Post" when ready

## File Structure
- `admin.html` - Main admin interface
- `auth.js` - Authentication logic
- `admin.js` - Post creation, CSV parsing, image handling

## Customization

### Change Admin Credentials
Create an admin user in your Supabase dashboard:
1. Go to Authentication > Users in Supabase
2. Create a new user with admin privileges
3. Use those credentials to log into the admin panel

### Modify Table Styling
Edit `admin.js`, `generateTableHTML()` function

### Modify Image Styling
Edit `admin.js`, `generateImageHTML()` function

## Security Notes
- Uses Supabase's built-in authentication system
- Secure email/password authentication
- Session management handled by Supabase
- No passwords stored in client-side code

## Prediction Snapshots
Prediction charts are structured data in the `prediction_snapshots` table, managed from the "Prediction Snapshots" section of the admin panel. To post an update: fill in term (auto-filled, Sep 1 cutoff), date (auto-filled), model name, optional note, choose the R-generated chart PNG, and click "Add Snapshot". The chart uploads to the `blog-images` storage bucket.

The build renders `predictions.html` from this data automatically:
- The newest snapshot shows as the current chart.
- Earlier snapshots from the same term collapse into an "Earlier this term" section.
- Older terms collapse into their own sections. **Term rollover is automatic** — the first snapshot with a new term value rolls the page over; there is no manual archive procedure.
- `predictions-ot25.html` is the frozen, hand-made archive of the pre-snapshot era (OT25), linked from the page footer via `PREDICTION_ARCHIVES` in `build-posts.js`; it should never need new entries.

One-time schema setup in the Supabase dashboard SQL editor (then enable RLS and copy the `posts` table's policies):
```sql
CREATE TABLE prediction_snapshots (
  id serial primary key,
  term integer not null,
  snapshot_date date not null default current_date,
  model text,
  image_url text not null,
  note text,
  created_at timestamptz not null default now()
);
```

## Predictions Intro & Methods Content
The editor form also manages two special content blobs, selected via checkboxes:
- **"Save as Predictions Intro"** writes to `predictions_table` row id=1 — optional text rendered on `predictions.html` between the hardcoded "Methods in brief" section and the current chart. Keep it short; charts come from snapshots.
- **"Save as Methods Page"** writes to `methods_table` row id=1 — the body of `methods.html`.

Each save also inserts a version-history row (id ≠ 1), so old content is recoverable from the database.

Publishing from the admin panel alone does not update the live site: a Netlify build (`npm run build`) must run — trigger it with a git push or a manual redeploy.

## Term Rollover
Nothing to do. Blog posts group by their `term` column (falling back to date, Sep 1 cutoff) on the homepage and `archive.html`; predictions roll over with the first new-term snapshot.

## Dependencies
- Tailwind CSS (CDN)
- Supabase JS client
- PapaParse (CSV parsing)
- Custom fonts (Space Mono, Inter)
