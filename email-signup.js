// Email signup functionality using Supabase
class EmailSignup {
    constructor() {
        this.supabase = null;
        this.setupSupabase();
        this.setupEventListeners();
    }

    setupSupabase() {
        // Use the same Supabase config as your main app
        const SUPABASE_URL = 'https://xlglobsjkfpfpkxlivki.supabase.co'
        const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhsZ2xvYnNqa2ZwZnBreGxpdmtpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3NTg2NDYsImV4cCI6MjA3MjMzNDY0Nn0.6_zXfDYP8C23FBJZTGKz2ecK74-md4-t9ellPENGWCc'
        
        this.supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }

    setupEventListeners() {
        const form = document.getElementById('email-signup-form');
        if (form) {
            form.addEventListener('submit', (e) => this.handleSignup(e));
        }
    }

    async handleSignup(event) {
        event.preventDefault();
        
        const emailInput = document.getElementById('email-input');
        const signupBtn = document.getElementById('signup-btn');
        const messageDiv = document.getElementById('signup-message');
        
        const email = emailInput.value.trim();
        
        if (!email) {
            this.showMessage('Please enter a valid email address.', 'error');
            return;
        }

        // Show loading state
        signupBtn.disabled = true;
        signupBtn.textContent = 'Subscribing...';
        messageDiv.classList.add('hidden');

        try {
            // Insert email into subscribers table
            const { data, error } = await this.supabase
                .from('subscribers')
                .insert([
                    { email: email }
                ]);

            if (error) {
                if (error.code === '23505') { // Unique constraint violation
                    this.showMessage('This email is already subscribed!', 'info');
                } else {
                    console.error('Signup error:', error);
                    this.showMessage('Something went wrong. Please try again.', 'error');
                }
            } else {
                this.showMessage('You\'ll be notified of new posts!', 'success');
                emailInput.value = ''; // Clear the form
                
                // Track signup event in PostHog if available
                if (typeof posthog !== 'undefined') {
                    posthog.capture('email_signup', {
                        email: email,
                        page: 'about'
                    });
                }
            }
        } catch (err) {
            console.error('Unexpected error:', err);
            this.showMessage('Something went wrong. Please try again.', 'error');
        } finally {
            // Reset button state
            signupBtn.disabled = false;
            signupBtn.textContent = 'Subscribe';
        }
    }

    showMessage(text, type) {
        const messageDiv = document.getElementById('signup-message');
        if (!messageDiv) return;

        // Remove existing classes
        messageDiv.classList.remove('hidden', 'text-green-600', 'text-red-600', 'text-blue-600');
        
        // Add appropriate styling based on type
        switch (type) {
            case 'success':
                messageDiv.classList.add('text-black-600');
                break;
            case 'error':
                messageDiv.classList.add('text-red-600');
                break;
            case 'info':
                messageDiv.classList.add('text-blue-600');
                break;
        }
        
        messageDiv.textContent = text;
        messageDiv.classList.remove('hidden');
        
        // Auto-hide success messages after 5 seconds
        if (type === 'success') {
            setTimeout(() => {
                messageDiv.classList.add('hidden');
            }, 5000);
        }
    }
}

// Initialize email signup when DOM is loaded and Supabase is available
document.addEventListener('DOMContentLoaded', function() {
    // Wait for Supabase to be available
    function initEmailSignup() {
        if (typeof supabase !== 'undefined') {
            new EmailSignup();
        } else {
            // Retry after a short delay
            setTimeout(initEmailSignup, 100);
        }
    }
    
    initEmailSignup();
});
