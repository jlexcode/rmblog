#!/usr/bin/env node

/**
 * Quick sitemap update script
 * Run this after adding new posts to update just the sitemap
 * Usage: node update-sitemap.js
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')

// Supabase configuration
const SUPABASE_URL = 'https://xlglobsjkfpfpkxlivki.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhsZ2xvYnNqa2ZwZnBreGxpdmtpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3NTg2NDYsImV4cCI6MjA3MjMzNDY0Nn0.6_zXfDYP8C23FBJZTGKz2ecK74-md4-t9ellPENGWCc'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Generate sitemap.xml
function generateSitemap(posts) {
  console.log('🔄 Updating sitemap.xml...')
  
  const baseUrl = 'https://reasonablemachines.io'
  const currentDate = new Date().toISOString().split('T')[0] // YYYY-MM-DD format
  
  // Start sitemap XML
  let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <url>
        <loc>${baseUrl}/</loc>
        <lastmod>${currentDate}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>1.0</priority>
    </url>
    <url>
        <loc>${baseUrl}/about.html</loc>
        <lastmod>${currentDate}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.8</priority>
    </url>`
  
  // Add each blog post to sitemap
  for (const post of posts) {
    const postDate = new Date(post.created_at).toISOString().split('T')[0]
    const postUrl = `${baseUrl}/posts/post-${post.slug}.html`
    
    sitemap += `
    <url>
        <loc>${postUrl}</loc>
        <lastmod>${postDate}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.6</priority>
    </url>`
  }
  
  // Close sitemap
  sitemap += `
</urlset>`
  
  fs.writeFileSync('sitemap.xml', sitemap)
  console.log(`✅ Updated sitemap.xml with ${posts.length} posts`)
}

// Main function
async function updateSitemap() {
  try {
    console.log('📡 Fetching posts from Supabase...')
    
    const { data: posts, error } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('❌ Error fetching posts:', error)
      process.exit(1)
    }
    
    generateSitemap(posts)
    console.log('🎉 Sitemap update complete!')
    
  } catch (error) {
    console.error('❌ Error updating sitemap:', error)
    process.exit(1)
  }
}

// Run the update
updateSitemap()
