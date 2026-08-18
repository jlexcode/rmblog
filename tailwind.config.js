/** @type {import('tailwindcss').Config} */
// The build runs AFTER build-posts.js so the scan sees the freshly generated
// HTML — that's what picks up classes living in Supabase-stored content
// (e.g. font-['Space_Mono'] inside post bodies). header.js/app.js/email-signup.js
// are scanned because they inject classes at runtime.
module.exports = {
  content: [
    './*.html',
    './posts/*.html',
    './header.js',
    './app.js',
    './email-signup.js',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
