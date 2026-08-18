const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Supabase configuration
const SUPABASE_URL = 'https://xlglobsjkfpfpkxlivki.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhsZ2xvYnNqa2ZwZnBreGxpdmtpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3NTg2NDYsImV4cCI6MjA3MjMzNDY0Nn0.6_zXfDYP8C23FBJZTGKz2ecK74-md4-t9ellPENGWCc'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

const BASE_URL = 'https://reasonablemachines.io'

// Legacy pre-snapshot prediction archives: hand-made static pages committed to
// the repo, frozen. From OT26 on, snapshots live in the prediction_snapshots
// table and past terms render as collapsible sections on predictions.html —
// no new entries should ever be needed here.
const PREDICTION_ARCHIVES = [
  { label: 'OT25', href: 'predictions-ot25.html' },
]

// ---------------------------------------------------------------------------
// Term helpers
// ---------------------------------------------------------------------------

// Explicit term column (integer year, e.g. 2025 for OT25) wins when set;
// otherwise derive from the post date. The blog's cutoff is September 1 —
// posting for a term starts in September, ahead of the Court's October start —
// so Sep 1 of year N through Aug 31 of year N+1 → OT(N).
function termOf(post) {
  if (post.term != null) return Number(post.term)
  const d = new Date(post.created_at)
  return d.getMonth() >= 8 ? d.getFullYear() : d.getFullYear() - 1
}

const termLabel = (term) => `OT${String(term).slice(2)}`

// Explicit post_type ('essay' | 'docket') wins when set; otherwise fall back
// to a heuristic that tolerates title punctuation variants (colon, en dash).
const isDocketReport = (post) =>
  post.post_type
    ? post.post_type === 'docket'
    : (/^docket\s+report\b/i.test(post.title) || (post.slug || '').startsWith('docket-report'))

const caseName = (post) => post.title.replace(/^docket\s+report\s*[:–—-]\s*/i, '')

const longDate = (iso) => new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
const shortDate = (iso) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

// For date-only columns ("2026-11-12"): new Date() would parse that as UTC
// midnight and render a day early in US timezones, so pin it to midday.
const longDateOnly = (d) => new Date(`${String(d).slice(0, 10)}T12:00:00`).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

// ---------------------------------------------------------------------------
// Shared content styling (posts + methods)
// ---------------------------------------------------------------------------

// The (?![a-zA-Z]) guard stops <th from matching <thead, etc.
function styleContent(html) {
  return html
    // Style tables (only if they don't already have classes)
    .replace(/<table(?![a-zA-Z])(?!\s+class)/g, '<table class="w-full border-collapse border border-gray-300"')
    .replace(/<th(?![a-zA-Z])(?!\s+class)/g, '<th class="border border-gray-300 px-3 py-2 text-left font-[\'Space_Mono\'] font-medium"')
    .replace(/<td(?![a-zA-Z])(?!\s+class)/g, '<td class="border border-gray-300 px-3 py-2 font-[\'Inter\']"')
    .replace(/<tr(?![a-zA-Z])(?!\s+class)/g, '<tr class="hover:bg-gray-50"')
    // Style images (only if they don't already have classes)
    .replace(/<img(?![a-zA-Z])(?!\s+class)/g, '<img class="w-full rounded-lg shadow-sm"')
    // Style links
    .replace(/<a\s+([^>]*?)>/g, (match, attributes) => {
      if (attributes.includes('class=')) {
        return match.replace(/class="([^"]*?)"/, 'class="$1 post-link"')
      } else {
        return `<a ${attributes} class="post-link">`
      }
    })
}

// ---------------------------------------------------------------------------
// Shared page shell
// ---------------------------------------------------------------------------

const escapeAttr = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')

const POSTHOG_LIB = `!function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]);t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.async=!0,p.src=s.api_host+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="capture identify alias people.set people.set_once set_config register register_once unregister opt_out_capturing has_opted_out_capturing opt_in_capturing reset isFeatureEnabled onFeatureFlags getFeatureFlag getFeatureFlagPayload reloadFeatureFlags group updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures getActiveMatchingSurveys getSurveys".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);
        posthog.init('phc_wfVnnyCEXjwV0azeFP8TlojFUL83RJ3j9WWlSxMV9VQ', {api_host: 'https://app.posthog.com'})`

// captureProps is a raw JS object-literal string (it may reference window.location)
const posthogBlock = (eventName, captureProps) => `<!-- PostHog Analytics -->
    <script>
        ${POSTHOG_LIB}

        posthog.capture('${eventName}', ${captureProps})
    </script>`

function pageShell({ title, description, keywords, canonicalPath, ogType = 'website', extraHead = '', body, scripts = '', posthog }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeAttr(title)}</title>
    <meta name="description" content="${escapeAttr(description)}">
    <meta name="keywords" content="${keywords || 'law, AI, organizations, legal technology, social science, research'}">
    <meta name="author" content="Jed Stiglitz">

    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="${ogType}">
    <meta property="og:url" content="${BASE_URL}${canonicalPath}">
    <meta property="og:title" content="${escapeAttr(title)}">
    <meta property="og:description" content="${escapeAttr(description)}">
    <meta property="og:site_name" content="Reasonable Machines">

    <!-- Twitter -->
    <meta property="twitter:card" content="summary_large_image">
    <meta property="twitter:url" content="${BASE_URL}${canonicalPath}">
    <meta property="twitter:title" content="${escapeAttr(title)}">
    <meta property="twitter:description" content="${escapeAttr(description)}">

    <!-- Canonical URL -->
    <link rel="canonical" href="${BASE_URL}${canonicalPath}">

    <link href="/tailwind.css" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Inter:wght@400;500&display=swap" rel="stylesheet">
    <link href="/styles.css" rel="stylesheet">${extraHead}
</head>
<body class="bg-white text-black font-sans">
    <div class="max-w-2xl mx-auto px-4 py-8">
        <div id="header"></div>
        ${body}
    </div>

    <script src="/header.js"></script>${scripts}

    ${posthog}
</body>
</html>`
}

// ---------------------------------------------------------------------------
// Post pages
// ---------------------------------------------------------------------------

const postTemplate = (post) => pageShell({
  title: `${post.title} - Reasonable Machines`,
  description: post.excerpt || post.content.substring(0, 160),
  canonicalPath: `/posts/post-${post.slug}.html`,
  ogType: 'article',
  body: `<!-- Post content -->
        <div id="post-content">
            <header class="mb-8">
                <h1 class="text-3xl font-normal text-black mb-3 font-['Space_Mono']">${post.title}</h1>
                <div class="text-gray-500 mb-6 font-['Space_Mono']">${longDate(post.created_at)} • jed</div>
            </header>

            <article class="prose prose-lg max-w-none">
                <div class="text-black leading-relaxed font-['Inter'] whitespace-pre-wrap">${styleContent(post.content)}</div>
            </article>
        </div>`,
  posthog: posthogBlock('post_viewed', `{
            post_title: ${JSON.stringify(post.title)},
            post_slug: ${JSON.stringify(post.slug)},
            post_id: '${post.id}',
            post_featured: ${post.featured},
            post_date: '${post.created_at}'
        }`),
})

// ---------------------------------------------------------------------------
// Post list building blocks (index + archive pages)
// ---------------------------------------------------------------------------

const essayCard = (post) => `
      <article class="border-b border-gray-300 pb-8">
          <h2 class="text-xl font-normal text-black mb-2 font-['Space_Mono']">
              <a href="posts/post-${post.slug}.html" class="hover:underline">${post.title}</a>
          </h2>
          <div class="text-gray-500 mb-3 font-['Space_Mono'] text-sm">${longDate(post.created_at)} • jed</div>
          <div class="text-black leading-relaxed font-['Inter'] text-sm">${post.excerpt || post.content.substring(0, 150) + '...'}</div>
      </article>
  `

// Compact one-line entry list, shared by the homepage docket section and the
// archive page. Titles come pre-computed so essays and docket reports can
// label themselves differently (full title vs case name).
function compactList(posts, titleOf) {
  return posts.map(post => `
              <li class="font-['Inter'] text-sm leading-relaxed">
                  <span class="inline-block w-16 text-gray-500 font-['Space_Mono'] text-xs">${shortDate(post.created_at)}</span>
                  <a href="/posts/post-${post.slug}.html" class="hover:underline">${titleOf(post)}</a>
              </li>`).join('')
}

function docketSection(dockets, term) {
  if (dockets.length === 0) return ''
  return `
        <section class="mt-12">
            <h2 class="text-xl font-normal text-black mb-4 font-['Space_Mono']">Docket Reports (${termLabel(term)})</h2>
            <ul class="space-y-2">${compactList(dockets, caseName)}
            </ul>
        </section>`
}

const archiveFooter = `
        <section class="mt-12 border-t border-gray-300 pt-6">
            <div class="font-['Space_Mono'] text-sm text-gray-600"><a href="/archive.html" class="hover:underline">Archive</a></div>
        </section>`

// ---------------------------------------------------------------------------
// Index page
// ---------------------------------------------------------------------------

function generateIndexHtml(featuredPosts, regularPosts, currentTerm) {
  console.log('Generating index.html with posts...')

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
                  <a href="posts/post-${post.slug}.html" class="hover:underline">${post.title}</a>
              </h2>
              <div class="text-gray-500 mb-4 font-['Space_Mono'] text-sm">${longDate(post.created_at)} • jed</div>
              <div class="text-black leading-relaxed font-['Inter'] text-sm">${post.excerpt || post.content.substring(0, 200) + '...'}</div>
          </article>
      </div>`
  }

  // Essays: most recent 8 regardless of term, so evergreen pieces persist past
  // term rollover. Docket reports: current term only; the rest live in the archive.
  const essays = regularPosts.filter(post => !isDocketReport(post)).slice(0, 8)
  const dockets = regularPosts.filter(post => isDocketReport(post) && termOf(post) === currentTerm)

  const indexHtml = pageShell({
    title: 'Reasonable Machines',
    description: 'A research log about law, AI, organizations, and legal technology',
    canonicalPath: '/',
    extraHead: `
    <style>
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
    </style>`,
    body: `<header class="mb-12 text-center">
            <h1 class="text-3xl font-normal text-black font-['Space_Mono']">
                <span id="title-text"></span>
            </h1>
        </header>

        <div id="featured-post" class="mb-12">
            ${featuredHtml}
        </div>

        <!-- Email Signup -->
        <div class="bg-gray-50 border border-gray-300 rounded-lg p-4 mb-6">
            <form id="email-signup-form" class="flex items-center gap-3">
                <span class="text-sm font-normal text-black font-['Space_Mono'] whitespace-nowrap">Get notified w/ new posts</span>
                <input type="email" id="email-input" placeholder="Enter your email"
                       class="flex-1 p-2 border border-gray-300 rounded font-['Inter'] text-xs">
                <button type="submit" id="signup-btn"
                        class="bg-black text-white px-3 py-2 rounded font-['Space_Mono'] text-xs hover:bg-gray-800 whitespace-nowrap">
                    Subscribe
                </button>
            </form>
            <div id="signup-message" class="mt-2 text-xs hidden"></div>
        </div>

        <div id="posts" class="space-y-8">
            ${essays.map(essayCard).join('')}
        </div>
        ${docketSection(dockets, currentTerm)}
        ${archiveFooter}`,
    scripts: `
    <script src="/app.js"></script>
    <script src="https://unpkg.com/@supabase/supabase-js@2"></script>
    <script src="/email-signup.js"></script>`,
    posthog: posthogBlock('page_viewed', `{
            page_title: 'Reasonable Machines',
            page_type: 'home',
            page_url: window.location.href
        }`),
  })

  fs.writeFileSync('index.html', indexHtml)
  console.log('✅ Generated: index.html')
}

// ---------------------------------------------------------------------------
// Unified archive page — the complete record of all posts, grouped by term
// ---------------------------------------------------------------------------

function generateArchivePage(posts, currentTerm) {
  const terms = [...new Set(posts.map(termOf))].sort().reverse()

  const sections = terms.map(term => {
    const label = termLabel(term)
    const termPosts = posts.filter(post => termOf(post) === term)
    const essays = termPosts.filter(post => !isDocketReport(post))
    const dockets = termPosts.filter(isDocketReport)

    const counts = [
      essays.length > 0 ? `${essays.length} essay${essays.length === 1 ? '' : 's'}` : '',
      dockets.length > 0 ? `${dockets.length} docket report${dockets.length === 1 ? '' : 's'}` : '',
    ].filter(Boolean).join(' · ')

    const essaysHtml = essays.length === 0 ? '' : `
                <h3 class="text-base font-normal text-black mt-5 mb-2 font-['Space_Mono']">Essays</h3>
                <ul class="space-y-2">${compactList(essays, post => post.title)}
                </ul>`

    const docketsHtml = dockets.length === 0 ? '' : `
                <h3 class="text-base font-normal text-black mt-5 mb-2 font-['Space_Mono']">Docket Reports</h3>
                <ul class="space-y-2">${compactList(dockets, caseName)}
                </ul>`

    return `
            <details${term === currentTerm ? ' open' : ''} class="border-b border-gray-300 pb-6">
                <summary class="cursor-pointer font-['Space_Mono'] text-xl text-black">${label} <span class="text-gray-500 text-sm">— ${counts}</span></summary>
                ${essaysHtml}
                ${docketsHtml}
            </details>`
  }).join('')

  const html = pageShell({
    title: 'Archive - Reasonable Machines',
    description: 'The complete record of Reasonable Machines posts and docket reports, by Supreme Court term.',
    canonicalPath: '/archive.html',
    body: `<header class="mb-8">
            <h1 class="text-3xl font-normal text-black mb-3 font-['Space_Mono']">Archive</h1>
            <div class="text-gray-500 font-['Inter'] text-sm">The complete record, by term.</div>
        </header>

        <div class="space-y-6">${sections}
        </div>`,
    posthog: posthogBlock('page_viewed', `{
            page_title: 'Archive',
            page_type: 'archive',
            page_url: window.location.href
        }`),
  })

  fs.writeFileSync('archive.html', html)
  console.log('✅ Generated: archive.html')
}

// ---------------------------------------------------------------------------
// Predictions page
// ---------------------------------------------------------------------------

// One snapshot = header line (term · date · model), optional note, chart image.
// loading="lazy" keeps images inside collapsed <details> from fetching until opened.
function snapshotBlock(s, { updatedLabel = false } = {}) {
  const meta = [termLabel(Number(s.term)), `${updatedLabel ? 'Updated ' : ''}${longDateOnly(s.snapshot_date)}`, s.model]
    .filter(Boolean).join(' · ')
  return `
                <div class="mt-4 mb-2 font-['Space_Mono'] text-sm text-gray-600">${meta}</div>
                ${s.note ? `<div class="mb-2 text-black leading-relaxed font-['Inter']">${s.note}</div>` : ''}
                <figure class="my-2"><img src="${s.image_url}" alt="Prediction snapshot, ${termLabel(Number(s.term))}, ${String(s.snapshot_date).slice(0, 10)}" loading="lazy" class="w-full rounded-lg shadow-sm"></figure>`
}

function predictionsPageHtml(intro, snapshots) {
  const introHtml = `
            <section>
                <h2 class="text-xl font-normal text-black mb-3 font-['Space_Mono']">Predictions summary</h2>${!intro ? '' : `
                <article class="prose prose-lg max-w-none">
                    <div class="text-black leading-relaxed font-['Inter']">
                        ${intro}
                    </div>
                </article>`}
            </section>`

  let snapshotsHtml = ''
  if (snapshots.length === 0) {
    snapshotsHtml = `
            <section>
                <div class="text-gray-600 font-['Inter'] text-sm">Predictions for the new term will appear here in the fall.</div>
            </section>`
  } else {
    const currentTerm = Number(snapshots[0].term)
    const current = snapshots.filter(s => Number(s.term) === currentTerm)
    const latest = current[0]
    const earlier = current.slice(1)
    const pastTerms = [...new Set(snapshots.map(s => Number(s.term)))].filter(t => t !== currentTerm).sort().reverse()

    snapshotsHtml = `
            <section>${snapshotBlock(latest, { updatedLabel: true })}
            </section>`

    if (earlier.length > 0) {
      snapshotsHtml += `
            <details class="border-t border-gray-300 pt-4">
                <summary class="cursor-pointer font-['Space_Mono'] text-sm text-gray-600">Earlier this term (${earlier.length} snapshot${earlier.length === 1 ? '' : 's'})</summary>
                ${earlier.map(s => snapshotBlock(s)).join('')}
            </details>`
    }

    for (const term of pastTerms) {
      const termSnaps = snapshots.filter(s => Number(s.term) === term)
      snapshotsHtml += `
            <details class="border-t border-gray-300 pt-4">
                <summary class="cursor-pointer font-['Space_Mono'] text-sm text-gray-600">${termLabel(term)} (${termSnaps.length} snapshot${termSnaps.length === 1 ? '' : 's'})</summary>
                ${termSnaps.map(s => snapshotBlock(s)).join('')}
            </details>`
    }
  }

  const pastTermsHtml = PREDICTION_ARCHIVES.length === 0 ? '' : `
            <section class="border-t border-gray-300 pt-6">
                <div class="font-['Space_Mono'] text-sm text-gray-600">Past terms: ${PREDICTION_ARCHIVES.map(a => `<a href="/${a.href}" class="hover:underline">${a.label}</a>`).join(' · ')}</div>
            </section>`

  return pageShell({
    title: 'Predictions - Reasonable Machines',
    description: 'Current Supreme Court predictions with confidence levels, and a brief summary of the methods behind them',
    keywords: 'law, AI, Supreme Court, predictions, legal technology',
    canonicalPath: '/predictions.html',
    ogType: 'article',
    body: `<header class="mb-8">
            <h1 class="text-3xl font-normal text-black mb-3 font-['Space_Mono']">Predictions</h1>
        </header>

        <main class="space-y-8">
            <section>
                <h2 class="text-xl font-normal text-black mb-3 font-['Space_Mono']">Methods in brief</h2>
                <div class="text-black leading-relaxed font-['Inter']">
                    Predictions come from <span class="font-['Space_Mono']">experience-6</span>, an ensemble of customized transformer-based models trained to learn the justices' preferences from party filings, lower-court decisions, oral argument, and amicus briefs. The model uses only information available up to the day of oral argument. Validated against a held-out term (OT2025), it reached TBA percent vote-level and TBA percent case-level accuracy; its uncertainty intervals are calibrated to capture the correct outcome about 90 percent of the time. <a href="/methods.html" class="post-link hover:underline">Full methodology</a>
                </div>
            </section>
            ${introHtml}
            ${snapshotsHtml}
            ${pastTermsHtml}
        </main>`,
    posthog: posthogBlock('page_viewed', `{
            page_title: 'Predictions',
            page_type: 'predictions',
            page_url: window.location.href
        }`),
  })
}

async function generatePredictionsPage() {
  console.log('Fetching predictions from Supabase...')

  // Optional editable page intro — predictions_table id=1 (legacy blob, now
  // rendered between "Methods in brief" and the snapshots).
  let intro = ''
  const { data: predictions, error: introError } = await supabase
    .from('predictions_table')
    .select('*')
    .eq('id', 1)
    .single()

  if (introError) {
    console.log('No predictions intro found, continuing without it')
  } else if (predictions && predictions.table_content && predictions.table_content.trim()) {
    intro = predictions.table_content
  }

  // Snapshots — tolerate a missing table so the build works before the
  // prediction_snapshots migration has been run.
  let snapshots = []
  const { data: snapData, error: snapError } = await supabase
    .from('prediction_snapshots')
    .select('*')
    .order('snapshot_date', { ascending: false })
    .order('id', { ascending: false })

  if (snapError) {
    console.log(`No prediction snapshots available (${snapError.message}), continuing without them`)
  } else if (snapData) {
    snapshots = snapData
  }

  fs.writeFileSync('predictions.html', predictionsPageHtml(intro, snapshots))
  console.log(`✅ Generated: predictions.html (${snapshots.length} snapshot${snapshots.length === 1 ? '' : 's'})`)
  return true
}

// ---------------------------------------------------------------------------
// Methods page
// ---------------------------------------------------------------------------

const methodsTemplate = (methods) => pageShell({
  title: 'Methodology & Validation - Reasonable Machines',
  description: 'Methods behind the predictions: data sources, features, modeling choices, training, evaluation, and limitations.',
  keywords: 'Supreme Court predictions, methodology, validation, model evaluation, legal AI',
  canonicalPath: '/methods.html',
  body: `<header class="mb-8">
            <h1 class="text-3xl font-normal text-black mb-3 font-['Space_Mono']">Methodology & Validation</h1>
        </header>

        <main class="space-y-6">
            <article class="prose prose-lg max-w-none">
                <div class="text-black leading-relaxed font-['Inter'] whitespace-pre-wrap">${styleContent(methods.content)}</div>
            </article>
        </main>`,
  posthog: posthogBlock('page_viewed', `{
            page_title: 'Methodology & Validation',
            page_type: 'methods',
            page_url: window.location.href
        }`),
})

async function generateMethodsPage() {
  console.log('Fetching methods from Supabase...')

  const { data: methods, error } = await supabase
    .from('methods_table')
    .select('*')
    .eq('id', 1)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      console.log('No methods table found, skipping...')
      return false
    }
    console.error('Error fetching methods:', error)
    return false
  }

  if (!methods || !methods.content) {
    console.log('No methods content found, skipping...')
    return false
  }

  fs.writeFileSync('methods.html', methodsTemplate(methods))
  console.log('✅ Generated: methods.html')
  return true
}

// ---------------------------------------------------------------------------
// Sitemap
// ---------------------------------------------------------------------------

function generateSitemap(posts, hasPredictions = false, hasMethods = false) {
  console.log('Generating sitemap.xml...')

  const currentDate = new Date().toISOString().split('T')[0] // YYYY-MM-DD format

  let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <url>
        <loc>${BASE_URL}/</loc>
        <lastmod>${currentDate}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>1.0</priority>
    </url>
    <url>
        <loc>${BASE_URL}/about.html</loc>
        <lastmod>${currentDate}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.8</priority>
    </url>`

  if (hasPredictions) {
    sitemap += `
    <url>
        <loc>${BASE_URL}/predictions.html</loc>
        <lastmod>${currentDate}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>0.9</priority>
    </url>`
  }

  if (hasMethods) {
    sitemap += `
    <url>
        <loc>${BASE_URL}/methods.html</loc>
        <lastmod>${currentDate}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.8</priority>
    </url>`
  }

  // Prediction archive pages (static, committed to the repo)
  for (const archive of PREDICTION_ARCHIVES) {
    sitemap += `
    <url>
        <loc>${BASE_URL}/${archive.href}</loc>
        <lastmod>${currentDate}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.6</priority>
    </url>`
  }

  // Unified post archive page
  sitemap += `
    <url>
        <loc>${BASE_URL}/archive.html</loc>
        <lastmod>${currentDate}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.6</priority>
    </url>`

  for (const post of posts) {
    const postDate = new Date(post.created_at).toISOString().split('T')[0]

    sitemap += `
    <url>
        <loc>${BASE_URL}/posts/post-${post.slug}.html</loc>
        <lastmod>${postDate}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.6</priority>
    </url>`
  }

  sitemap += `
</urlset>`

  fs.writeFileSync('sitemap.xml', sitemap)
  console.log('✅ Generated: sitemap.xml')
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

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

  // Current term = term of the most recent post, so the site stays on the
  // just-finished term through the July–September intermission.
  const currentTerm = posts.length > 0 ? termOf(posts[0]) : new Date().getFullYear()

  console.log(`Found ${posts.length} posts (${featuredPosts.length} featured, ${regularPosts.length} regular); current term: ${termLabel(currentTerm)}`)

  const hasPredictions = await generatePredictionsPage()
  const hasMethods = await generateMethodsPage()

  generateArchivePage(posts, currentTerm)

  generateIndexHtml(featuredPosts, regularPosts, currentTerm)

  generateSitemap(posts, hasPredictions, hasMethods)

  // Create posts directory if it doesn't exist
  if (!fs.existsSync('posts')) {
    fs.mkdirSync('posts')
  }

  for (const post of posts) {
    const filename = `posts/post-${post.slug}.html`
    fs.writeFileSync(filename, postTemplate(post))
    console.log(`✅ Generated: ${filename}`)
  }

  console.log('🎉 Static generation complete!')
}

// Run the generation
generateStaticPosts()
