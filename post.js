// Supabase configuration
const SUPABASE_URL = 'https://xlglobsjkfpfpkxlivki.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhsZ2xvYnNqa2ZwZnBreGxpdmtpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3NTg2NDYsImV4cCI6MjA3MjMzNDY0Nn0.6_zXfDYP8C23FBJZTGKz2ecK74-md4-t9ellPENGWCc'

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// DOM elements
const postContent = document.getElementById('post-content')
const errorElement = document.getElementById('error')

// Get slug from URL parameters
function getSlugFromURL() {
    const urlParams = new URLSearchParams(window.location.search)
    return urlParams.get('slug')
}

// Load post by slug
async function loadPost() {
    const slug = getSlugFromURL()
    
    if (!slug) {
        showError('No slug provided')
        return
    }
    
    try {
        const { data, error } = await supabaseClient
            .from('posts')
            .select('*')
            .eq('slug', slug)
            .single()
        
        if (error) throw error
        
        if (data) {
            displayPost(data)
            updatePageTitle(data.title)
            updateMetaTags(data)
            addStructuredData(data)
            trackPostView(data)
        } else {
            showError('Post not found')
        }
    } catch (error) {
        console.error('Error loading post:', error)
        showError('Error loading post')
    }
}

// Display post content
function displayPost(post) {
    postContent.innerHTML = `
        <header class="mb-8">
            <h1 class="text-3xl font-normal text-black mb-3 font-['Space_Mono']">${post.title}</h1>
            <div class="text-black mb-6 font-['Space_Mono']">${formatDate(post.created_at)} • jed</div>
        </header>
        
        <article class="prose prose-lg max-w-none">
            <div class="text-black leading-relaxed font-['Inter']">${formatPostContent(post.content)}</div>
        </article>
    `
}

// Format post content for display
function formatPostContent(content) {
    if (!content) return '';
    
    // Convert line breaks to HTML and reduce spacing around tables/figures
    let formattedContent = content
        .replace(/\n\n/g, '<br><br>')  // Convert double line breaks to HTML breaks
        .replace(/\n<div/g, '<div')     // Remove line breaks before tables (div elements)
        .replace(/\n<figure/g, '<figure') // Remove line breaks before figures
        .replace(/\n/g, '<br>')        // Convert remaining single line breaks to HTML breaks
        .replace(/class="my-6"/g, 'class="my-2"')  // Reduce large spacing around tables/figures
        .replace(/class="my-4"/g, 'class="my-2"')  // Reduce medium spacing around tables/figures  
        .replace(/class="my-2"/g, 'class="my-1"')  // Further reduce spacing for tighter integration
        .replace(/class="mt-2"/g, 'class="mt-1"')  // Reduce spacing for captions
    
    // Add post-link class to all links in the content
    formattedContent = formattedContent.replace(/<a\s+([^>]*?)>/g, (match, attributes) => {
        // Check if class is already present
        if (attributes.includes('class=')) {
            return match.replace(/class="([^"]*?)"/, 'class="$1 post-link"')
        } else {
            return `<a ${attributes} class="post-link">`
        }
    })
    
    return formattedContent
}

// Update page title
function updatePageTitle(title) {
    document.title = `${title} - Reasonable Machines`
}

// Update meta tags for SEO
function updateMetaTags(post) {
    // Update meta description
    const metaDescription = document.querySelector('meta[name="description"]')
    if (metaDescription) {
        metaDescription.content = post.excerpt || cleanExcerpt(post.content, 30)
    }
    
    // Update Open Graph tags
    const ogTitle = document.querySelector('meta[property="og:title"]')
    if (ogTitle) {
        ogTitle.content = `${post.title} - Reasonable Machines`
    }
    
    const ogDescription = document.querySelector('meta[property="og:description"]')
    if (ogDescription) {
        ogDescription.content = post.excerpt || cleanExcerpt(post.content, 30)
    }
    
    const ogUrl = document.querySelector('meta[property="og:url"]')
    if (ogUrl) {
        ogUrl.content = `https://reasonablemachines.io/post/${post.slug}`
    }
    
    // Update Twitter tags
    const twitterTitle = document.querySelector('meta[property="twitter:title"]')
    if (twitterTitle) {
        twitterTitle.content = `${post.title} - Reasonable Machines`
    }
    
    const twitterDescription = document.querySelector('meta[property="twitter:description"]')
    if (twitterDescription) {
        twitterDescription.content = post.excerpt || cleanExcerpt(post.content, 30)
    }
    
    const twitterUrl = document.querySelector('meta[property="twitter:url"]')
    if (twitterUrl) {
        twitterUrl.content = `https://reasonablemachines.io/post/${post.slug}`
    }
    
    // Update canonical URL
    const canonical = document.querySelector('link[rel="canonical"]')
    if (canonical) {
        canonical.href = `https://reasonablemachines.io/post/${post.slug}`
    }
}

// Add structured data for SEO
function addStructuredData(post) {
    const structuredData = {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": post.title,
        "description": post.excerpt || cleanExcerpt(post.content, 30),
        "author": {
            "@type": "Person",
            "name": "Jed Stiglitz",
            "url": "https://reasonablemachines.io/about.html"
        },
        "publisher": {
            "@type": "Organization",
            "name": "Reasonable Machines",
            "url": "https://reasonablemachines.io"
        },
        "datePublished": post.created_at,
        "dateModified": post.updated_at || post.created_at,
        "url": `https://reasonablemachines.io/post/${post.slug}`,
        "mainEntityOfPage": {
            "@type": "WebPage",
            "@id": `https://reasonablemachines.io/post/${post.slug}`
        }
    }
    
    // Remove existing structured data
    const existingScript = document.querySelector('script[type="application/ld+json"]')
    if (existingScript) {
        existingScript.remove()
    }
    
    // Add new structured data
    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.textContent = JSON.stringify(structuredData)
    document.head.appendChild(script)
}

// Track post view in analytics
function trackPostView(post) {
    if (window.posthog) {
        posthog.capture('post_viewed', {
            post_title: post.title,
            post_slug: post.slug,
            post_id: post.id,
            post_featured: post.featured,
            post_date: post.created_at
        })
    }
}

// Clean excerpt for display (remove HTML and ensure proper length)
function cleanExcerpt(text, maxWords = 30) {
    if (!text) return '';
    
    // Remove HTML tags and normalize whitespace
    const cleanText = text
        .replace(/<[^>]*>/g, ' ')  // Remove HTML tags
        .replace(/\s+/g, ' ')      // Normalize whitespace
        .trim();
    
    // Ensure proper length if not already truncated
    const words = cleanText.split(' ');
    if (words.length > maxWords) {
        return words.slice(0, maxWords).join(' ') + '...';
    }
    
    return cleanText;
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    })
}

// Show error message
function showError(message) {
    errorElement.textContent = message
    errorElement.classList.remove('hidden')
    postContent.innerHTML = ''
}

// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
    loadPost()
})
