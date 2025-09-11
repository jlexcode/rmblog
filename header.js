// Header component
function createHeader() {
    return `
        <nav class="mb-8 border-b border-black pb-4">
            <div class="flex space-x-6">
                <a href="/" class="text-black font-['Space_Mono'] hover:underline">Home</a>
                <a href="/about.html" class="text-black font-['Space_Mono'] hover:underline">About</a>
            </div>
        </nav>
    `;
}

// Insert header into the page
document.addEventListener('DOMContentLoaded', function() {
    const headerContainer = document.getElementById('header');
    if (headerContainer) {
        headerContainer.innerHTML = createHeader();
    }
});
