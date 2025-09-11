// Supabase configuration
const SUPABASE_URL = 'https://xlglobsjkfpfpkxlivki.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhsZ2xvYnNqa2ZwZnBreGxpdmtpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3NTg2NDYsImV4cCI6MjA3MjMzNDY0Nn0.6_zXfDYP8C23FBJZTGKz2ecK74-md4-t9ellPENGWCc'

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// DOM elements
const postsContainer = document.getElementById('posts')
const featuredContainer = document.getElementById('featured-post')
const loadingElement = document.getElementById('loading')
const errorElement = document.getElementById('error')

// Load posts from Supabase
async function loadPosts() {
    try {
        loadingElement.classList.remove('hidden')
        errorElement.classList.add('hidden')
        
        // Load featured posts
        const { data: featuredData, error: featuredError } = await supabaseClient
            .from('posts')
            .select('id, title, excerpt, content, created_at, slug, featured')
            .eq('featured', true)
            .order('created_at', { ascending: false })
            .limit(1)
        
        if (featuredError) throw featuredError
        
        // Load regular posts (non-featured)
        const { data: regularData, error: regularError } = await supabaseClient
            .from('posts')
            .select('id, title, excerpt, content, created_at, slug, featured')
            .eq('featured', false)
            .order('created_at', { ascending: false })
        
        if (regularError) throw regularError
        
        displayFeaturedPost(featuredData || [])
        displayPosts(regularData || [])
    } catch (error) {
        console.error('Error loading posts:', error)
        showError()
    } finally {
        loadingElement.classList.add('hidden')
    }
}

// Display featured post in the DOM
function displayFeaturedPost(featuredPosts) {
    // Check if featured post content already exists (from static generation)
    if (featuredContainer.innerHTML.trim() !== '') {
        console.log('Featured post already exists in HTML, skipping JavaScript generation')
        return
    }
    
    if (featuredPosts.length === 0) {
        featuredContainer.innerHTML = ''
        return
    }
    
    const post = featuredPosts[0] // Show only the first featured post
    featuredContainer.innerHTML = `
        <div class="bg-gray-50 border border-gray-300 rounded-lg p-6 mb-8">
            <div class="flex items-center mb-3">
                <span class="text-xs font-medium text-gray-600 font-['Space_Mono'] uppercase tracking-wider">Featured</span>
            </div>
            <article>
                <h2 class="text-2xl font-normal text-black mb-3 font-['Space_Mono']">
                    <a href="post-${post.slug}.html" class="hover:underline" onclick="posthog.capture('post_clicked', {post_title: '${post.title}', post_slug: '${post.slug}', post_type: 'featured'})">${post.title}</a>
                </h2>
                <div class="text-black mb-4 font-['Space_Mono']">${formatDate(post.created_at)} • jed</div>
                <div class="text-black leading-relaxed font-['Inter'] text-sm">${cleanExcerpt(post.excerpt || post.content, 50)}</div>
            </article>
        </div>
    `
}

// Display posts in the DOM
function displayPosts(posts) {
    // Check if posts content already exists (from static generation)
    if (postsContainer.innerHTML.trim() !== '' && !postsContainer.innerHTML.includes('Loading...')) {
        console.log('Posts already exist in HTML, skipping JavaScript generation')
        return
    }
    
    if (posts.length === 0) {
        postsContainer.innerHTML = '<p class="text-black text-center py-8 font-[\'Space_Mono\']">No posts yet</p>'
        return
    }
    
    postsContainer.innerHTML = posts.map(post => `
        <article class="border-b border-black pb-8">
            <h2 class="text-xl font-normal text-black mb-2 font-['Space_Mono']">
                <a href="post-${post.slug}.html" class="hover:underline" onclick="posthog.capture('post_clicked', {post_title: '${post.title}', post_slug: '${post.slug}', post_type: 'regular'})">${post.title}</a>
            </h2>
            <div class="text-black mb-3 font-['Space_Mono']">${formatDate(post.created_at)} • jed</div>
            <div class="text-black leading-relaxed font-['Inter'] text-sm">${cleanExcerpt(post.excerpt || post.content)}</div>
        </article>
    `).join('')
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
function showError() {
    errorElement.classList.remove('hidden')
}

// Random letter resolution effect
function randomLetterEffect(text, element, duration = 3000) {
    // Clear initial blur from CSS since we're doing character-by-character
    element.style.filter = 'blur(0px)';
    element.style.opacity = '1';
    element.style.transition = 'none';
    
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()';
    const targetText = text;
    const totalSteps = Math.floor(duration / 50); // Update every 50ms
    let currentStep = 0;
    
    // Track which letters have been "solved"
    const solvedLetters = new Array(targetText.length).fill(false);
    const currentDisplay = new Array(targetText.length).fill('');
    
    function updateStep() {
        if (currentStep < totalSteps) {
            let allSolved = true;
            
            for (let i = 0; i < targetText.length; i++) {
                if (targetText[i] === ' ') {
                    // Spaces are always "solved"
                    currentDisplay[i] = ' ';
                    solvedLetters[i] = true;
                } else if (!solvedLetters[i]) {
                    // Calculate probability of solving this letter based on progress
                    const progressFactor = currentStep / totalSteps;
                    const positionFactor = (i + 1) / targetText.length;
                    
                    // Letters solve roughly left to right, but with some randomness
                    const solveProbability = Math.max(0, progressFactor - positionFactor * 0.3 + Math.random() * 0.2);
                    
                    if (solveProbability > 0.6) {
                        // Letter is solved!
                        currentDisplay[i] = targetText[i];
                        solvedLetters[i] = true;
                    } else {
                        // Show random character
                        currentDisplay[i] = characters[Math.floor(Math.random() * characters.length)];
                        allSolved = false;
                    }
                } else {
                    // Keep the solved letter
                    allSolved = allSolved && true;
                }
            }
            
            element.innerHTML = currentDisplay.join('');
            
            if (allSolved) {
                // All letters solved, ensure final text is correct
                element.innerHTML = targetText;
                return;
            }
            
            currentStep++;
            setTimeout(updateStep, 50);
        } else {
            // Time's up, show final text
            element.innerHTML = targetText;
        }
    }
    
    updateStep();
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    const titleElement = document.getElementById('title-text');
    
    // Check if user has seen the animation this session
    const hasSeenAnimation = sessionStorage.getItem('hasSeenAnimation');
    
    if (!hasSeenAnimation) {
        // First visit this session - show random letter resolution effect
        randomLetterEffect('Reasonable Machines', titleElement, 3000);
        sessionStorage.setItem('hasSeenAnimation', 'true');
    } else {
        // Return visit - show text immediately
        titleElement.textContent = 'Reasonable Machines';
    }
    
    // Load posts
    loadPosts();
})
