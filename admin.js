// Admin functionality for research log post creation
class AdminPanel {
    constructor() {
        this.currentTableData = null;
        this.uploadedImages = [];
        this.editingPostId = null; // Track if we're editing an existing post
        this.setupEventListeners();
        this.setupDragAndDrop();
    }

    setupEventListeners() {
        // CSV upload
        const csvUpload = document.getElementById('csv-upload');
        if (csvUpload) {
            csvUpload.addEventListener('change', (e) => this.handleCSVUpload(e));
        }

        // Image upload
        const imageUpload = document.getElementById('image-upload');
        if (imageUpload) {
            imageUpload.addEventListener('change', (e) => this.handleImageUpload(e));
        }


        // Publish button
        const publishBtn = document.getElementById('publish-btn');
        if (publishBtn) {
            publishBtn.addEventListener('click', () => this.publishPost());
        }

        // Auto-generate slug from title
        const titleInput = document.getElementById('post-title');
        if (titleInput) {
            titleInput.addEventListener('input', () => this.generateSlug());
        }

        // Auto-generate excerpt from content
        const contentInput = document.getElementById('post-content');
        if (contentInput) {
            contentInput.addEventListener('input', () => this.generateExcerpt());
        }

        // Load posts button
        const loadPostsBtn = document.getElementById('load-posts-btn');
        if (loadPostsBtn) {
            loadPostsBtn.addEventListener('click', () => this.loadPostsList());
        }

        // Load current predictions button
        const loadCurrentPredictionsBtn = document.getElementById('load-current-predictions-btn');
        if (loadCurrentPredictionsBtn) {
            loadCurrentPredictionsBtn.addEventListener('click', () => this.loadCurrentPredictions());
        }

        // Load current methods button
        const loadCurrentMethodsBtn = document.getElementById('load-current-methods-btn');
        if (loadCurrentMethodsBtn) {
            loadCurrentMethodsBtn.addEventListener('click', () => this.loadCurrentMethods());
        }

        // New post button
        const newPostBtn = document.getElementById('new-post-btn');
        if (newPostBtn) {
            newPostBtn.addEventListener('click', () => this.clearForm());
        }

        // Link insertion
        // Formatting buttons
        const boldBtn = document.getElementById('bold-btn');
        const italicBtn = document.getElementById('italic-btn');
        const underlineBtn = document.getElementById('underline-btn');
        const h1Btn = document.getElementById('h1-btn');
        const h2Btn = document.getElementById('h2-btn');
        const h3Btn = document.getElementById('h3-btn');
        
        if (boldBtn) {
            boldBtn.addEventListener('click', () => this.insertFormatting('bold'));
        }
        if (italicBtn) {
            italicBtn.addEventListener('click', () => this.insertFormatting('italic'));
        }
        if (underlineBtn) {
            underlineBtn.addEventListener('click', () => this.insertFormatting('underline'));
        }
        if (h1Btn) {
            h1Btn.addEventListener('click', () => this.insertFormatting('h1'));
        }
        if (h2Btn) {
            h2Btn.addEventListener('click', () => this.insertFormatting('h2'));
        }
        if (h3Btn) {
            h3Btn.addEventListener('click', () => this.insertFormatting('h3'));
        }

        // Link insertion button
        const insertLinkBtn = document.getElementById('insert-link-btn');
        if (insertLinkBtn) {
            insertLinkBtn.addEventListener('click', () => this.showLinkModal());
        }
        
        // Table insertion button
        const insertTableBtn = document.getElementById('insert-table-btn');
        if (insertTableBtn) {
            insertTableBtn.addEventListener('click', () => this.insertTable());
        }

        // Link modal buttons
        const cancelLinkBtn = document.getElementById('cancel-link-btn');
        const insertLinkModalBtn = document.getElementById('insert-link-modal-btn');
        if (cancelLinkBtn) {
            cancelLinkBtn.addEventListener('click', () => this.hideLinkModal());
        }
        if (insertLinkModalBtn) {
            insertLinkModalBtn.addEventListener('click', () => this.insertLinkFromModal());
        }



    }

    setupDragAndDrop() {
        // CSV drag and drop
        const csvZone = document.querySelector('#csv-upload').parentElement.parentElement;
        this.setupDragZone(csvZone, (files) => this.handleCSVFiles(files));

        // Image drag and drop
        const imageZone = document.querySelector('#image-upload').parentElement.parentElement;
        this.setupDragZone(imageZone, (files) => this.handleImageFiles(files));
    }

    setupDragZone(zone, fileHandler) {
        zone.addEventListener('dragover', (e) => {
            e.preventDefault();
            zone.classList.add('border-blue-500', 'bg-blue-50');
        });

        zone.addEventListener('dragleave', (e) => {
            e.preventDefault();
            zone.classList.remove('border-blue-500', 'bg-blue-50');
        });

        zone.addEventListener('drop', (e) => {
            e.preventDefault();
            zone.classList.remove('border-blue-500', 'bg-blue-50');
            const files = Array.from(e.dataTransfer.files);
            fileHandler(files);
        });
    }

    handleCSVUpload(event) {
        const file = event.target.files[0];
        if (file) this.processCSVFile(file);
    }

    handleCSVFiles(files) {
        const csvFile = files.find(f => f.name.endsWith('.csv'));
        if (csvFile) this.processCSVFile(csvFile);
    }

    async processCSVFile(file) {
        try {
            const text = await file.text();
            const result = Papa.parse(text, { header: true });
            
            if (result.data && result.data.length > 0) {
                this.currentTableData = result.data;
                this.previewTable(result.data);
                document.getElementById('csv-preview').classList.remove('hidden');
                window.adminAuth.showStatus('CSV loaded successfully', 'success');
            } else {
                throw new Error('No data found in CSV');
            }
        } catch (error) {
            console.error('CSV parsing error:', error);
            window.adminAuth.showStatus('Error parsing CSV file', 'error');
        }
    }

    previewTable(data) {
        const preview = document.getElementById('table-preview');
        if (!preview || !data.length) return;

        const headers = Object.keys(data[0]);
        const tableHTML = `
            <table class="w-full border-collapse border border-gray-300">
                <thead>
                    <tr class="bg-gray-100">
                        ${headers.map(h => `<th class="border border-gray-300 px-3 py-2 text-left font-['Space_Mono']">${h}</th>`).join('')}
                    </tr>
                </thead>
                <tbody>
                    ${data.slice(0, 5).map(row => `
                        <tr>
                            ${headers.map(h => `<td class="border border-gray-300 px-3 py-2 font-['Inter']">${row[h] || ''}</td>`).join('')}
                        </tr>
                    `).join('')}
                    ${data.length > 5 ? `<tr><td colspan="${headers.length}" class="text-center text-gray-500 font-['Inter']">... and ${data.length - 5} more rows</td></tr>` : ''}
                </tbody>
            </table>
        `;
        
        preview.innerHTML = tableHTML;
    }

    insertTableIntoPost() {
        if (!this.currentTableData) {
            window.adminAuth.showStatus('No table data available. Please create or upload a table first.', 'error');
            return;
        }

        const caption = document.getElementById('table-caption').value.trim();
        const tableHTML = this.generateTableHTML(this.currentTableData, caption);
        
        // Insert into textarea
        const contentArea = document.getElementById('post-content');
        const cursorPos = contentArea.selectionStart;
        const textBefore = contentArea.value.substring(0, cursorPos);
        const textAfter = contentArea.value.substring(cursorPos);
        
        contentArea.value = textBefore + '\n' + tableHTML + '\n' + textAfter;
        
        // Update preview
        this.updatePostPreview();
        
        window.adminAuth.showStatus('Table inserted into post', 'success');
    }




    generateTableHTML(data, caption) {
        const headers = Object.keys(data[0]);
        const tableHTML = `<div class="overflow-x-auto my-2"><table class="w-full border-collapse border border-gray-300"><thead><tr class="bg-gray-100">${headers.map(h => `<th class="border border-gray-300 px-3 py-2 text-left font-['Space_Mono'] font-medium">${h}</th>`).join('')}</tr></thead><tbody>${data.map(row => `<tr class="hover:bg-gray-50">${headers.map(h => `<td class="border border-gray-300 px-3 py-2 font-['Inter']">${row[h] || ''}</td>`).join('')}</tr>`).join('')}</tbody></table>${caption ? `<p class="text-sm text-gray-600 mt-1 text-center font-['Inter'] italic">${caption}</p>` : ''}</div>`;
        
        return tableHTML;
    }

    // Link Modal Methods
    showLinkModal() {
        const modal = document.getElementById('link-modal');
        modal.classList.remove('hidden');
        
        // Focus on the link text input
        document.getElementById('modal-link-text').focus();
    }

    hideLinkModal() {
        const modal = document.getElementById('link-modal');
        modal.classList.add('hidden');
        
        // Clear the form
        document.getElementById('modal-link-url').value = '';
        document.getElementById('modal-link-new-tab').checked = false;
    }

    insertLinkFromModal() {
        const url = document.getElementById('modal-link-url').value.trim();
        const newTab = document.getElementById('modal-link-new-tab').checked;

        if (!url) {
            window.adminAuth.showStatus('Please enter a URL', 'error');
            return;
        }

        // Validate and normalize URL
        let normalizedUrl = url;
        if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('mailto:')) {
            normalizedUrl = 'https://' + url;
        }
        
        try {
            new URL(normalizedUrl);
        } catch {
            window.adminAuth.showStatus('Please enter a valid URL', 'error');
            return;
        }

        // Get selected text from textarea
        const contentArea = document.getElementById('post-content');
        const start = contentArea.selectionStart;
        const end = contentArea.selectionEnd;
        const selectedText = contentArea.value.substring(start, end);
        
        if (!selectedText.trim()) {
            window.adminAuth.showStatus('Please select text to link', 'error');
            return;
        }

        // Generate link HTML
        const linkHTML = this.generateLinkHTML(normalizedUrl, selectedText, newTab);
        
        // Insert into textarea
        const textBefore = contentArea.value.substring(0, start);
        const textAfter = contentArea.value.substring(end);
        
        contentArea.value = textBefore + linkHTML + textAfter;
        
        // Update preview
        this.updatePostPreview();
        
        // Hide modal and clear form
        this.hideLinkModal();
        
        window.adminAuth.showStatus('Link inserted', 'success');
    }
    
    insertTable() {
        const contentArea = document.getElementById('post-content');
        const start = contentArea.selectionStart;
        const end = contentArea.selectionEnd;
        
        const tableHtml = `<table>
  <thead>
    <tr>
      <th>Header 1</th>
      <th>Header 2</th>
      <th>Header 3</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Row 1, Cell 1</td>
      <td>Row 1, Cell 2</td>
      <td>Row 1, Cell 3</td>
    </tr>
    <tr>
      <td>Row 2, Cell 1</td>
      <td>Row 2, Cell 2</td>
      <td>Row 2, Cell 3</td>
    </tr>
  </tbody>
</table>`;
        
        const textBefore = contentArea.value.substring(0, start);
        const textAfter = contentArea.value.substring(end);
        contentArea.value = textBefore + tableHtml + textAfter;
        
        // Update preview
        this.updatePostPreview();
        
        window.adminAuth.showStatus('Table template inserted', 'success');
    }

    // Formatting Methods
    insertFormatting(type) {
        const contentArea = document.getElementById('post-content');
        const start = contentArea.selectionStart;
        const end = contentArea.selectionEnd;
        const selectedText = contentArea.value.substring(start, end);
        
        let formattedText;
        switch (type) {
            case 'bold':
                formattedText = `<strong>${selectedText || 'bold text'}</strong>`;
                break;
            case 'italic':
                formattedText = `<em>${selectedText || 'italic text'}</em>`;
                break;
            case 'underline':
                formattedText = `<u>${selectedText || 'underlined text'}</u>`;
                break;
            case 'h1':
                formattedText = `<h1>${selectedText || 'Header 1'}</h1>`;
                break;
            case 'h2':
                formattedText = `<h2>${selectedText || 'Header 2'}</h2>`;
                break;
            case 'h3':
                formattedText = `<h3>${selectedText || 'Header 3'}</h3>`;
                break;
        }
        
        // Insert formatted text
        const textBefore = contentArea.value.substring(0, start);
        const textAfter = contentArea.value.substring(end);
        
        contentArea.value = textBefore + formattedText + textAfter;
        
        // Update preview
        this.updatePostPreview();
        
        // Show success message
        window.adminAuth.showStatus(`${type.charAt(0).toUpperCase() + type.slice(1)} formatting applied`, 'success');
    }


    handleImageUpload(event) {
        const files = Array.from(event.target.files);
        this.processImageFiles(files);
    }

    handleImageFiles(files) {
        const imageFiles = files.filter(f => f.type.startsWith('image/'));
        if (imageFiles.length > 0) {
            this.processImageFiles(imageFiles);
        }
    }

    async processImageFiles(files) {
        for (const file of files) {
            try {
                window.adminAuth.showStatus(`Processing ${file.name}...`, 'info');
                
                // Create preview data URL for admin interface
                const previewData = await this.readImageFile(file);
                
                let imageUrl;
                try {
                    // Try to upload to Supabase storage
                    imageUrl = await this.uploadImageToSupabase(file);
                    window.adminAuth.showStatus(`Uploaded ${file.name} to Supabase`, 'success');
                } catch (uploadError) {
                    console.warn('Supabase upload failed, using base64 fallback:', uploadError);
                    // Fallback to base64 if Supabase fails
                    imageUrl = previewData;
                    window.adminAuth.showStatus(`Using ${file.name} as base64 (Supabase unavailable)`, 'info');
                }
                
                this.uploadedImages.push({
                    file: file,
                    url: imageUrl,        // Supabase URL or base64 fallback
                    previewData: previewData,  // Base64 for admin preview
                    name: file.name
                });
            } catch (error) {
                console.error('Error processing image:', error);
                window.adminAuth.showStatus(`Error processing ${file.name}: ${error.message}`, 'error');
            }
        }
        
        this.previewImages();
        document.getElementById('image-preview').classList.remove('hidden');
        window.adminAuth.showStatus(`${files.length} image(s) processed successfully`, 'success');
    }

    async uploadImageToSupabase(file) {
        try {
            console.log('Starting Supabase upload for:', file.name, 'Type:', file.type, 'Size:', file.size);
            
            // Create Supabase client
            const SUPABASE_URL = 'https://xlglobsjkfpfpkxlivki.supabase.co'
            const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhsZ2xvYnNqa2ZwZnBreGxpdmtpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3NTg2NDYsImV4cCI6MjA3MjMzNDY0Nn0.6_zXfDYP8C23FBJZTGKz2ecK74-md4-t9ellPENGWCc'
            const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            
            console.log('Supabase client created');
            
            // Test if we can access storage
            try {
                const { data: buckets, error: listError } = await supabaseClient.storage.listBuckets();
                console.log('Available buckets:', buckets);
                if (listError) console.error('Bucket list error:', listError);
            } catch (e) {
                console.error('Cannot list buckets:', e);
            }
            
            // Generate unique filename
            const timestamp = new Date().getTime();
            const randomString = Math.random().toString(36).substring(2, 8);
            const fileExtension = file.name.split('.').pop();
            const fileName = `${timestamp}-${randomString}.${fileExtension}`;
            
            console.log('Generated filename:', fileName);
            
            // Check if user is authenticated
            const { data: { user } } = await supabaseClient.auth.getUser();
            console.log('Current user:', user);
            
            // Upload file to Supabase storage
            console.log('Attempting upload to blog-images bucket...');
            const { data, error } = await supabaseClient.storage
                .from('blog-images')
                .upload(fileName, file, {
                    cacheControl: '3600',
                    upsert: false
                });
            
            if (error) {
                console.error('Upload error details:', error);
                throw new Error(`Upload failed: ${error.message} (Code: ${error.statusCode})`);
            }
            
            console.log('Upload successful:', data);
            
            // Get public URL
            const { data: urlData } = supabaseClient.storage
                .from('blog-images')
                .getPublicUrl(fileName);
            
            console.log('Public URL generated:', urlData.publicUrl);
            return urlData.publicUrl;
            
        } catch (error) {
            console.error('Supabase upload error:', error);
            throw error;
        }
    }

    readImageFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    previewImages() {
        const imageList = document.getElementById('image-list');
        if (!imageList) return;

        imageList.innerHTML = this.uploadedImages.map((img, index) => `
            <div class="flex items-center space-x-4 p-3 border border-gray-300 rounded">
                <img src="${img.previewData}" alt="${img.name}" class="w-20 h-20 object-cover rounded">
                <div class="flex-1">
                    <p class="font-['Inter'] font-medium">${img.name}</p>
                    <p class="text-xs text-gray-500 font-['Inter'] mb-2">Uploaded to: ${img.url}</p>
                    <input type="text" placeholder="Image caption (optional)" 
                           class="w-full p-2 border border-gray-300 rounded font-['Inter']"
                           onchange="window.adminPanel.updateImageCaption(${index}, this.value)">
                </div>
                <button onclick="window.adminPanel.insertImageIntoPost(${index})" 
                        class="bg-black text-white px-3 py-2 rounded font-['Space_Mono'] hover:bg-gray-800">
                    Insert
                </button>
            </div>
        `).join('');
    }

    updateImageCaption(index, caption) {
        if (this.uploadedImages[index]) {
            this.uploadedImages[index].caption = caption;
        }
    }

    insertImageIntoPost(index) {
        const image = this.uploadedImages[index];
        if (!image) return;

        const imageHTML = this.generateImageHTML(image);
        
        // Insert into textarea
        const contentArea = document.getElementById('post-content');
        const cursorPos = contentArea.selectionStart;
        const textBefore = contentArea.value.substring(0, cursorPos);
        const textAfter = contentArea.value.substring(cursorPos);
        
        contentArea.value = textBefore + '\n' + imageHTML + '\n' + textAfter;
        
        // Update preview
        this.updatePostPreview();
        
        window.adminAuth.showStatus('Image inserted into post', 'success');
    }

    generateImageHTML(image) {
        const caption = image.caption || '';
        return `<figure class="my-2"><img src="${image.url}" alt="${caption || image.name}" class="w-full rounded-lg shadow-sm">${caption ? `<figcaption class="text-sm text-gray-600 mt-1 text-center font-['Inter']">${caption}</figcaption>` : ''}</figure>`;
    }


    generateLinkHTML(url, text, newTab = false) {
        const target = newTab ? ' target="_blank" rel="noopener noreferrer"' : '';
        return `<a href="${url}"${target}>${text}</a>`;
    }


    generateSlug() {
        const title = document.getElementById('post-title').value;
        const slugInput = document.getElementById('post-slug');
        
        if (title && slugInput) {
            const slug = title
                .toLowerCase()
                .replace(/[^a-z0-9\s-]/g, '')
                .replace(/\s+/g, '-')
                .replace(/-+/g, '-')
                .trim();
            slugInput.value = slug;
        }
    }

    generateExcerpt() {
        const content = this.getContent();
        const excerptInput = document.getElementById('post-excerpt');
        
        if (content && excerptInput) {
            // Extract text content (remove HTML tags and extra whitespace)
            const textContent = content
                .replace(/<[^>]*>/g, ' ')  // Remove HTML tags
                .replace(/\s+/g, ' ')      // Normalize whitespace
                .trim();
            
            // Take first 30 words
            const words = textContent.split(' ');
            const excerptWords = words.slice(0, 30);
            const excerpt = excerptWords.join(' ');
            
            // Add ellipsis if content was truncated
            const finalExcerpt = words.length > 30 ? excerpt + '...' : excerpt;
            
            excerptInput.value = finalExcerpt;
        }
    }

    updatePostPreview() {
        const content = this.getContent();
        const preview = document.getElementById('preview-content');
        
        if (preview && content) {
            // Render HTML directly with proper styling
            preview.innerHTML = content
                // Style tables (only if they don't already have classes)
                .replace(/<table(?!\s+class)/g, '<table class="w-full border-collapse border border-gray-300"')
                .replace(/<th(?!\s+class)/g, '<th class="border border-gray-300 px-3 py-2 text-left font-[\'Space_Mono\'] font-medium"')
                .replace(/<td(?!\s+class)/g, '<td class="border border-gray-300 px-3 py-2 font-[\'Inter\']"')
                .replace(/<tr(?!\s+class)/g, '<tr class="hover:bg-gray-50"')
                // Style images (only if they don't already have classes)
                .replace(/<img(?!\s+class)/g, '<img class="w-full rounded-lg shadow-sm"')
                // Style links
                .replace(/<a\s+([^>]*?)>/g, (match, attributes) => {
                    if (attributes.includes('class=')) {
                        return match.replace(/class="([^"]*?)"/, 'class="$1 post-link"')
                    } else {
                        return `<a ${attributes} class="post-link">`
                    }
                });
        }
    }

    async loadPostsList() {
        try {
            window.adminAuth.showStatus('Loading posts...', 'info');
            
            const SUPABASE_URL = 'https://xlglobsjkfpfpkxlivki.supabase.co'
            const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhsZ2xvYnNqa2ZwZnBreGxpdmtpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3NTg2NDYsImV4cCI6MjA3MjMzNDY0Nn0.6_zXfDYP8C23FBJZTGKz2ecK74-md4-t9ellPENGWCc'
            const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            
            const { data, error } = await supabaseClient
                .from('posts')
                .select('id, title, slug, created_at, featured')
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            
            this.displayPostsList(data || []);
            document.getElementById('posts-list').classList.remove('hidden');
            window.adminAuth.showStatus(`Loaded ${data.length} posts`, 'success');
            
        } catch (error) {
            console.error('Error loading posts:', error);
            window.adminAuth.showStatus(`Error loading posts: ${error.message}`, 'error');
        }
    }

    displayPostsList(posts) {
        const postsTable = document.getElementById('posts-table');
        
        if (posts.length === 0) {
            postsTable.innerHTML = '<p class="text-center py-4 font-[\'Inter\']">No posts found</p>';
            return;
        }
        
        postsTable.innerHTML = `
            <table class="w-full border-collapse border border-gray-300">
                <thead>
                    <tr class="bg-gray-100">
                        <th class="border border-gray-300 px-3 py-2 text-left font-['Space_Mono'] font-medium">Title</th>
                        <th class="border border-gray-300 px-3 py-2 text-left font-['Space_Mono'] font-medium">Slug</th>
                        <th class="border border-gray-300 px-3 py-2 text-left font-['Space_Mono'] font-medium">Date</th>
                        <th class="border border-gray-300 px-3 py-2 text-left font-['Space_Mono'] font-medium">Featured</th>
                        <th class="border border-gray-300 px-3 py-2 text-left font-['Space_Mono'] font-medium">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${posts.map(post => `
                        <tr class="hover:bg-gray-50">
                            <td class="border border-gray-300 px-3 py-2 font-['Inter']">${post.title}</td>
                            <td class="border border-gray-300 px-3 py-2 font-['Inter'] text-sm">${post.slug}</td>
                            <td class="border border-gray-300 px-3 py-2 font-['Inter'] text-sm">${this.formatDate(post.created_at)}</td>
                            <td class="border border-gray-300 px-3 py-2 font-['Inter'] text-center">
                                ${post.featured ? '<span class="text-green-600 font-medium">✓</span>' : ''}
                            </td>
                            <td class="border border-gray-300 px-3 py-2">
                                <div class="flex space-x-2">
                                    <button onclick="window.adminPanel.editPost('${post.id}')" 
                                            class="bg-blue-600 text-white px-2 py-1 rounded text-xs font-['Space_Mono'] hover:bg-blue-700">
                                        Edit
                                    </button>
                                    <button onclick="window.adminPanel.deletePost('${post.id}', '${post.title}')" 
                                            class="bg-red-600 text-white px-2 py-1 rounded text-xs font-['Space_Mono'] hover:bg-red-700">
                                        Delete
                                    </button>
                                </div>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
    }

    async loadCurrentPredictions() {
        try {
            window.adminAuth.showStatus('Loading current predictions...', 'info');
            
            const SUPABASE_URL = 'https://xlglobsjkfpfpkxlivki.supabase.co'
            const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhsZ2xvYnNqa2ZwZnBreGxpdmtpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3NTg2NDYsImV4cCI6MjA3MjMzNDY0Nn0.6_zXfDYP8C23FBJZTGKz2ecK74-md4-t9ellPENGWCc'
            const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            
            const { data, error } = await supabaseClient
                .from('predictions_table')
                .select('*')
                .eq('id', 1)
                .single();
            
            if (error) {
                if (error.code === 'PGRST116') {
                    window.adminAuth.showStatus('No current predictions found', 'error');
                    return;
                }
                throw error;
            }
            
            // Populate the form with current prediction data
            document.getElementById('post-title').value = data.title;
            this.setContent(data.table_content);
            document.getElementById('save-as-predictions').checked = true;
            
            // Update form title
            document.getElementById('form-title').textContent = 'Edit Current Predictions';
            
            // Update preview
            this.updatePostPreview();
            
            window.adminAuth.showStatus('Current predictions loaded for editing', 'success');
            
        } catch (error) {
            console.error('Error loading current predictions:', error);
            window.adminAuth.showStatus(`Error loading predictions: ${error.message}`, 'error');
        }
    }

    async loadCurrentMethods() {
        try {
            window.adminAuth.showStatus('Loading current methods...', 'info');
            
            const SUPABASE_URL = 'https://xlglobsjkfpfpkxlivki.supabase.co'
            const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhsZ2xvYnNqa2ZwZnBreGxpdmtpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3NTg2NDYsImV4cCI6MjA3MjMzNDY0Nn0.6_zXfDYP8C23FBJZTGKz2ecK74-md4-t9ellPENGWCc'
            const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            
            const { data, error } = await supabaseClient
                .from('methods_table')
                .select('*')
                .eq('id', 1)
                .single();
            
            if (error) {
                if (error.code === 'PGRST116') {
                    window.adminAuth.showStatus('No current methods found', 'error');
                    return;
                }
                throw error;
            }
            
            // Populate the form with current methods data
            document.getElementById('post-title').value = data.title;
            this.setContent(data.content);
            document.getElementById('save-as-methods').checked = true;
            
            // Update form title
            document.getElementById('form-title').textContent = 'Edit Current Methods';
            
            // Update preview
            this.updatePostPreview();
            
            window.adminAuth.showStatus('Current methods loaded for editing', 'success');
            
        } catch (error) {
            console.error('Error loading current methods:', error);
            window.adminAuth.showStatus(`Error loading methods: ${error.message}`, 'error');
        }
    }

    async editPost(postId) {
        try {
            window.adminAuth.showStatus('Loading post for editing...', 'info');
            
            const SUPABASE_URL = 'https://xlglobsjkfpfpkxlivki.supabase.co'
            const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhsZ2xvYnNqa2ZwZnBreGxpdmtpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3NTg2NDYsImV4cCI6MjA3MjMzNDY0Nn0.6_zXfDYP8C23FBJZTGKz2ecK74-md4-t9ellPENGWCc'
            const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            
            const { data, error } = await supabaseClient
                .from('posts')
                .select('*')
                .eq('id', postId)
                .single();
            
            if (error) throw error;
            
            // Populate the form with existing data
            document.getElementById('post-title').value = data.title || '';
            document.getElementById('post-slug').value = data.slug || '';
            document.getElementById('post-excerpt').value = data.excerpt || '';
            this.setContent(data.content || '');
            document.getElementById('post-featured').checked = data.featured || false;
            
            // Set editing mode
            this.editingPostId = postId;
            document.getElementById('form-title').textContent = 'Edit Post';
            
            // Update preview
            this.updatePostPreview();
            
            // Scroll to form
            document.getElementById('form-title').scrollIntoView({ behavior: 'smooth' });
            
            window.adminAuth.showStatus('Post loaded for editing', 'success');
            
        } catch (error) {
            console.error('Error loading post for edit:', error);
            window.adminAuth.showStatus(`Error loading post: ${error.message}`, 'error');
        }
    }

    async deletePost(postId, postTitle) {
        if (!confirm(`Are you sure you want to delete "${postTitle}"? This cannot be undone.`)) {
            return;
        }
        
        try {
            window.adminAuth.showStatus('Deleting post...', 'info');
            
            const SUPABASE_URL = 'https://xlglobsjkfpfpkxlivki.supabase.co'
            const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhsZ2xvYnNqa2ZwZnBreGxpdmtpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3NTg2NDYsImV4cCI6MjA3MjMzNDY0Nn0.6_zXfDYP8C23FBJZTGKz2ecK74-md4-t9ellPENGWCc'
            const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            
            const { error } = await supabaseClient
                .from('posts')
                .delete()
                .eq('id', postId);
            
            if (error) throw error;
            
            window.adminAuth.showStatus('Post deleted successfully', 'success');
            
            // Reload the posts list
            this.loadPostsList();
            
        } catch (error) {
            console.error('Error deleting post:', error);
            window.adminAuth.showStatus(`Error deleting post: ${error.message}`, 'error');
        }
    }

    clearForm() {
        document.getElementById('post-form').reset();
        this.setContent('');
        document.getElementById('post-featured').checked = false;
        document.getElementById('save-as-predictions').checked = false; // Reset to default (post)
        this.editingPostId = null;
        document.getElementById('form-title').textContent = 'Create New Post';
        
        
        this.updatePostPreview();
    }

    async publishPost() {
        const title = document.getElementById('post-title').value.trim();
        const slug = document.getElementById('post-slug').value.trim();
        const excerpt = document.getElementById('post-excerpt').value.trim();
        const content = this.getContent().trim();
        const featured = document.getElementById('post-featured').checked;
        const saveAsPredictions = document.getElementById('save-as-predictions').checked;
        const saveAsMethods = document.getElementById('save-as-methods').checked;

        if (!title || !content) {
            window.adminAuth.showStatus('Please fill in title and content', 'error');
            return;
        }

        // For regular posts, slug is required
        if (!saveAsPredictions && !saveAsMethods && !slug) {
            window.adminAuth.showStatus('Please fill in slug for blog post', 'error');
            return;
        }

        // Check if user is authenticated
        const user = window.adminAuth.getCurrentUser();
        if (!user) {
            window.adminAuth.showStatus('Please log in to publish', 'error');
            return;
        }

        try {
            // Use the same Supabase config as your main app
            const SUPABASE_URL = 'https://xlglobsjkfpfpkxlivki.supabase.co'
            const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhsZ2xvYnNqa2ZwZnBreGxpdmtpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3NTg2NDYsImV4cCI6MjA3MjMzNDY0Nn0.6_zXfDYP8C23FBJZTGKz2ecK74-md4-t9ellPENGWCc'
            
            const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            
            if (saveAsPredictions) {
                // Save as predictions table (always creates new version)
                await this.savePredictionsTable(content, title, supabaseClient);
                window.adminAuth.showStatus('Predictions table updated successfully!', 'success');
            } else if (saveAsMethods) {
                // Save as methods page (always creates new version)
                await this.saveMethodsTable(content, title, supabaseClient);
                window.adminAuth.showStatus('Methods page updated successfully!', 'success');
            } else {
                // Save as regular blog post (existing logic)
                // If featuring this post, unfeatured all other posts first
                if (featured) {
                    await supabaseClient
                        .from('posts')
                        .update({ featured: false })
                        .eq('featured', true);
                }
                
                let data, error;
                
                if (this.editingPostId) {
                    // Update existing post
                    const result = await supabaseClient
                        .from('posts')
                        .update({ 
                            title, 
                            slug, 
                            excerpt, 
                            content,
                            featured
                        })
                        .eq('id', this.editingPostId);
                    
                    data = result.data;
                    error = result.error;
                } else {
                    // Create new post
                    const result = await supabaseClient
                        .from('posts')
                        .insert([{ 
                            title, 
                            slug, 
                            excerpt, 
                            content,
                            featured,
                            created_at: new Date().toISOString()
                        }]);
                    
                    data = result.data;
                    error = result.error;
                }
                
                if (error) throw error;
                
                const action = this.editingPostId ? 'updated' : 'published';
                const statusMessage = featured ? 
                    `Featured post ${action} successfully!` : 
                    `Post ${action} successfully!`;
                window.adminAuth.showStatus(statusMessage, 'success');
                
                // Track post publication
                if (window.posthog) {
                    posthog.capture('admin_post_published', {
                        post_title: title,
                        post_slug: slug,
                        is_featured: featured,
                        is_edit: !!this.editingPostId
                    });
                }
            }
            
            // Clear the form and reset editing state
            this.clearForm();
            
            // Reload posts list if it's visible
            if (!document.getElementById('posts-list').classList.contains('hidden')) {
                this.loadPostsList();
            }
            
        } catch (error) {
            console.error('Publish error:', error);
            window.adminAuth.showStatus(`Error publishing: ${error.message}`, 'error');
        }
    }

    async savePredictionsTable(content, title, supabaseClient) {
        // Save to Supabase for versioning (create new entry each time)
        const { error } = await supabaseClient
            .from('predictions_table')
            .insert([{ 
                title: title,
                table_content: content, // Just save the table content
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }]);
        
        if (error) throw error;
        
        // Also update the "current" record (id=1) for the build script
        const { error: updateError } = await supabaseClient
            .from('predictions_table')
            .upsert([{ 
                id: 1, // Current record for build script
                title: title,
                table_content: content, // Just the table content
                updated_at: new Date().toISOString()
            }]);
        
        if (updateError) throw updateError;
    }

    async saveMethodsTable(content, title, supabaseClient) {
        // Save to Supabase for versioning (create new entry each time)
        const { error } = await supabaseClient
            .from('methods_table')
            .insert([{ 
                title: title,
                content: content,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }]);
        
        if (error) throw error;
        
        // Also update the "current" record (id=1) for the build script
        const { error: updateError } = await supabaseClient
            .from('methods_table')
            .upsert([{ 
                id: 1, // Current record for build script
                title: title,
                content: content,
                updated_at: new Date().toISOString()
            }]);
        
        if (updateError) throw updateError;
    }


    // Override getContent method to work with all modes
    getContent() {
        return document.getElementById('post-content').value;
    }

    // Override setContent method to work with all modes
    setContent(content) {
        document.getElementById('post-content').value = content;
    }


}

// Initialize admin panel when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.adminPanel = new AdminPanel();
    
    // Update preview when content changes
    const contentArea = document.getElementById('post-content');
    if (contentArea) {
        contentArea.addEventListener('input', () => window.adminPanel.updatePostPreview());
    }
    
    // Back to basics - no rich text editor needed
});
