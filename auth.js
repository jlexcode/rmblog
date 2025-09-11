// Supabase authentication for admin panel
class AdminAuth {
    constructor() {
        this.isAuthenticated = false;
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
        const loginBtn = document.getElementById('login-btn');
        const emailInput = document.getElementById('admin-email');
        const passwordInput = document.getElementById('admin-password');
        const logoutBtn = document.getElementById('logout-btn');
        
        if (loginBtn && emailInput && passwordInput) {
            loginBtn.addEventListener('click', () => this.handleLogin());
            passwordInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.handleLogin();
            });
        }
        
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.logout());
        }
    }

    async handleLogin() {
        const emailInput = document.getElementById('admin-email');
        const passwordInput = document.getElementById('admin-password');
        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();
        
        if (!email || !password) {
            this.showStatus('Please enter both email and password', 'error');
            return;
        }

        try {
            const { data, error } = await this.supabase.auth.signInWithPassword({
                email: email,
                password: password
            });
            
            if (error) throw error;
            
            if (data.user) {
                this.authenticate(data.user);
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showStatus(error.message || 'Login failed', 'error');
        }
    }

    authenticate(user) {
        this.isAuthenticated = true;
        
        // Hide login, show admin interface
        document.getElementById('login-section').classList.add('hidden');
        document.getElementById('admin-interface').classList.remove('hidden');
        
        // Clear form fields
        document.getElementById('admin-email').value = '';
        document.getElementById('admin-password').value = '';
        
        this.showStatus(`Welcome, ${user.email}`, 'success');
        
        // Store auth state
        sessionStorage.setItem('adminAuthenticated', 'true');
        sessionStorage.setItem('adminUser', JSON.stringify(user));
    }

    async checkAuthState() {
        try {
            const { data: { session }, error } = await this.supabase.auth.getSession();
            
            if (error) throw error;
            
            if (session && session.user) {
                this.authenticate(session.user);
            }
        } catch (error) {
            console.error('Auth check error:', error);
        }
    }

    async logout() {
        try {
            await this.supabase.auth.signOut();
        } catch (error) {
            console.error('Logout error:', error);
        }
        
        this.isAuthenticated = false;
        sessionStorage.removeItem('adminAuthenticated');
        sessionStorage.removeItem('adminUser');
        
        // Show login, hide admin interface
        document.getElementById('login-section').classList.remove('hidden');
        document.getElementById('admin-interface').classList.add('hidden');
        
        this.showStatus('Logged out', 'info');
    }

    showStatus(message, type = 'info') {
        const statusEl = document.getElementById('status-message');
        if (!statusEl) return;

        // Set message and styling based on type
        statusEl.textContent = message;
        statusEl.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg font-['Inter']`;
        
        switch (type) {
            case 'success':
                statusEl.classList.add('bg-green-500', 'text-white');
                break;
            case 'error':
                statusEl.classList.add('bg-red-500', 'text-white');
                break;
            case 'info':
                statusEl.classList.add('bg-blue-500', 'text-white');
                break;
        }

        // Show status
        statusEl.classList.remove('hidden');
        
        // Hide after 3 seconds
        setTimeout(() => {
            statusEl.classList.add('hidden');
        }, 3000);
    }

    // Get current user for API calls
    getCurrentUser() {
        if (this.isAuthenticated) {
            const userStr = sessionStorage.getItem('adminUser');
            return userStr ? JSON.parse(userStr) : null;
        }
        return null;
    }
}

// Initialize auth when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.adminAuth = new AdminAuth();
    window.adminAuth.checkAuthState();
});
