# Admin Panel for Reasonable Machines Blog

## Overview
A simple, password-protected admin interface for creating blog posts with CSV table uploads and PNG image uploads.

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
3. **Content**: Write your post in the main text area
4. **Excerpt**: Auto-generated from first 30 words of content

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

## Next Steps
- Implement Supabase post creation in `publishPost()`
- Add image upload to Supabase storage
- Add post editing functionality
- Implement post deletion
- Add user management if needed

## Dependencies
- Tailwind CSS (CDN)
- Supabase JS client
- PapaParse (CSV parsing)
- Custom fonts (Space Mono, Inter)
