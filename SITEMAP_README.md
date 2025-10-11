# Sitemap Management

Your sitemap is now automatically generated and updated! Here's how it works:

## Automatic Updates

The sitemap (`sitemap.xml`) is automatically updated every time you run:

```bash
npm run build
```

This will:
- Fetch all posts from Supabase
- Generate static HTML files for each post
- Update the sitemap with all current posts
- Update the homepage with latest posts

## Quick Sitemap Updates

If you only want to update the sitemap (without regenerating all posts), run:

```bash
npm run sitemap
```

This is useful when you just want to update the sitemap after adding new posts.

## What's Included in the Sitemap

The sitemap automatically includes:
- Homepage (`/`) - Priority 1.0, updated weekly
- About page (`/about.html`) - Priority 0.8, updated monthly  
- All blog posts (`/posts/post-*.html`) - Priority 0.6, updated monthly

Each post includes:
- Correct URL
- Last modified date (from post creation date)
- Appropriate change frequency
- SEO-friendly priority

## SEO Benefits

- **Search engines** can easily discover all your content
- **Fresh content** is properly indexed with correct dates
- **Priority signals** help search engines understand your most important pages
- **Automatic updates** ensure the sitemap is always current

## No Manual Work Required

Once you add a new post to Supabase, just run `npm run build` and your sitemap will be automatically updated with the new post. No manual editing needed!
