const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Supabase configuration
const SUPABASE_URL = 'https://xlglobsjkfpfpkxlivki.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhsZ2xvYnNqa2ZwZnBreGxpdmtpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3NTg2NDYsImV4cCI6MjA3MjMzNDY0Nn0.6_zXfDYP8C23FBJZTGKz2ecK74-md4-t9ellPENGWCc'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Template for static post HTML
const postTemplate = (post) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${post.title} - Reasonable Machines</title>
    <meta name="description" content="${post.excerpt || post.content.substring(0, 160)}">
    <meta name="keywords" content="law, AI, organizations, legal technology, social science, research">
    <meta name="author" content="Jed Stiglitz">
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="article">
    <meta property="og:url" content="https://reasonablemachines.io/post-${post.slug}.html">
    <meta property="og:title" content="${post.title} - Reasonable Machines">
    <meta property="og:description" content="${post.excerpt || post.content.substring(0, 160)}">
    <meta property="og:site_name" content="Reasonable Machines">
    
    <!-- Twitter -->
    <meta property="twitter:card" content="summary_large_image">
    <meta property="twitter:url" content="https://reasonablemachines.io/post-${post.slug}.html">
    <meta property="twitter:title" content="${post.title} - Reasonable Machines">
    <meta property="twitter:description" content="${post.excerpt || post.content.substring(0, 160)}">
    
    <!-- Canonical URL -->
    <link rel="canonical" href="https://reasonablemachines.io/post-${post.slug}.html">
    
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/@supabase/supabase-js@2"></script>
    <link href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Inter:wght@400;500&display=swap" rel="stylesheet">
    <link href="styles.css" rel="stylesheet">
    <style>
        .post-link {
            color: #3b82f6; /* same blue as about page */
        }
    </style>
</head>
<body class="bg-white text-black font-sans">
    <div class="max-w-2xl mx-auto px-4 py-8">
        <div id="header"></div>
        
        <!-- Breadcrumbs -->
        <nav class="mb-6 text-sm">
            <a href="index.html" class="text-black font-['Space_Mono'] hover:underline">← Back to Home</a>
        </nav>

        <!-- Post content -->
        <div id="post-content">
            <header class="mb-8">
                <h1 class="text-3xl font-normal text-black mb-3 font-['Space_Mono']">${post.title}</h1>
                <div class="text-black mb-6 font-['Space_Mono']">${new Date(post.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} • jed</div>
            </header>
            
            <article class="prose prose-lg max-w-none">
                <div class="text-black leading-relaxed font-['Inter']">${post.content.replace(/\n\n/g, '<br><br>').replace(/\n/g, '<br>').replace(/<a\s+([^>]*?)>/g, (match, attributes) => {
                    if (attributes.includes('class=')) {
                        return match.replace(/class="([^"]*?)"/, 'class="$1 post-link"')
                    } else {
                        return `<a ${attributes} class="post-link">`
                    }
                })}</div>
            </article>
        </div>
    </div>

    <script src="header.js"></script>
</body>
</html>`


// Generate index.html with posts included for SEO
function generateIndexHtml(featuredPosts, regularPosts) {
  console.log('Generating index.html with posts...')
  
  // Generate featured post HTML
  let featuredHtml = ''
  if (featuredPosts.length > 0) {
    const post = featuredPosts[0]
    featuredHtml = `
      <div class="bg-gray-50 border border-gray-300 rounded-lg p-6 mb-8">
          <div class="flex items-center mb-3">
              <span class="text-xs font-medium text-gray-600 font-['Space_Mono'] uppercase tracking-wider">Featured</span>
          </div>
          <article>
              <h2 class="text-2xl font-normal text-black mb-3 font-['Space_Mono']">
                  <a href="post-${post.slug}.html" class="hover:underline">${post.title}</a>
              </h2>
              <div class="text-black mb-4 font-['Space_Mono']">${new Date(post.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} • jed</div>
              <div class="text-black leading-relaxed font-['Inter'] text-sm">${post.excerpt || post.content.substring(0, 200) + '...'}</div>
          </article>
      </div>`
  }
  
  // Generate regular posts HTML
  const postsHtml = regularPosts.map(post => `
      <article class="border-b border-black pb-8">
          <h2 class="text-xl font-normal text-black mb-2 font-['Space_Mono']">
              <a href="post-${post.slug}.html" class="hover:underline">${post.title}</a>
          </h2>
          <div class="text-black mb-3 font-['Space_Mono']">${new Date(post.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} • jed</div>
          <div class="text-black leading-relaxed font-['Inter'] text-sm">${post.excerpt || post.content.substring(0, 150) + '...'}</div>
      </article>
  `).join('')
  
  // Generate complete index.html
  const indexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reasonable Machines</title>
    <meta name="description" content="A blog about law, AI, organizations, and legal technology">
    <meta name="keywords" content="law, AI, organizations, legal technology, social science, research">
    <meta name="author" content="Jed Stiglitz">
    
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Inter:wght@400;500&display=swap" rel="stylesheet">
    <link href="styles.css" rel="stylesheet">
    <style>
        .post-link {
            color: #3b82f6;
        }
        #cursor {
            display: inline-block;
            width: 0.5em;
            text-align: left;
            animation: blink 1s infinite;
        }
        @keyframes blink {
            0%, 50% { opacity: 1; }
            51%, 100% { opacity: 0; }
        }
    </style>
</head>
<body class="bg-white text-black font-sans">
    <div class="max-w-2xl mx-auto px-4 py-8">
        <div id="header"></div>
        
        <header class="mb-12 text-center">
            <h1 class="text-3xl font-normal text-black font-['Space_Mono']">
                <span id="title-text"></span>
            </h1>
        </header>

        <div id="featured-post" class="mb-12">
            ${featuredHtml}
        </div>

        <div id="posts" class="space-y-8">
            ${postsHtml}
        </div>
    </div>

    <script src="header.js"></script>
    <script src="app.js"></script>
</body>
</html>`
  
  fs.writeFileSync('index.html', indexHtml)
  console.log('✅ Generated: index.html')
}

// Generate static post files
async function generateStaticPosts() {
  console.log('Fetching posts from Supabase...')
  
  const { data: posts, error } = await supabase
    .from('posts')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching posts:', error)
    process.exit(1)
  }
  
  // Separate featured and regular posts
  const featuredPosts = posts.filter(post => post.featured === true)
  const regularPosts = posts.filter(post => post.featured === false)
  
  console.log(`Found ${posts.length} posts (${featuredPosts.length} featured, ${regularPosts.length} regular)`)
  
  // Generate index.html with posts included for SEO
  generateIndexHtml(featuredPosts, regularPosts)
  
  // Generate HTML file for each post
  for (const post of posts) {
    const filename = `post-${post.slug}.html`
    const html = postTemplate(post)
    
    fs.writeFileSync(filename, html)
    console.log(`✅ Generated: ${filename}`)
  }
  
  console.log('🎉 Static generation complete!')
}

// Run the generation
generateStaticPosts()
