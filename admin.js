// Admin functionality for blog post creation
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

        // Insert table button
        const insertTableBtn = document.getElementById('insert-table-btn');
        if (insertTableBtn) {
            insertTableBtn.addEventListener('click', () => this.insertTableIntoPost());
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

        // New post button
        const newPostBtn = document.getElementById('new-post-btn');
        if (newPostBtn) {
            newPostBtn.addEventListener('click', () => this.clearForm());
        }

        // Link insertion
        const insertLinkBtn = document.getElementById('insert-link-btn');
        if (insertLinkBtn) {
            insertLinkBtn.addEventListener('click', () => this.insertLinkIntoPost());
        }

        // Link URL and text inputs for preview
        const linkUrlInput = document.getElementById('link-url');
        const linkTextInput = document.getElementById('link-text');
        if (linkUrlInput && linkTextInput) {
            linkUrlInput.addEventListener('input', () => this.updateLinkPreview());
            linkTextInput.addEventListener('input', () => this.updateLinkPreview());
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
        if (!this.currentTableData) return;

        const caption = document.getElementById('table-caption').value.trim();
        const contentArea = document.getElementById('post-content');
        const tableHTML = this.generateTableHTML(this.currentTableData, caption);
        
        // Insert at cursor position or at end
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

        const contentArea = document.getElementById('post-content');
        const imageHTML = this.generateImageHTML(image);
        
        // Insert at cursor position or at end
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

    insertLinkIntoPost() {
        const urlInput = document.getElementById('link-url');
        const textInput = document.getElementById('link-text');
        const newTabCheckbox = document.getElementById('link-new-tab');
        const contentArea = document.getElementById('post-content');

        const url = urlInput.value.trim();
        const text = textInput.value.trim();

        if (!url || !text) {
            window.adminAuth.showStatus('Please enter both URL and link text', 'error');
            return;
        }

        // Validate URL
        try {
            new URL(url);
        } catch {
            window.adminAuth.showStatus('Please enter a valid URL', 'error');
            return;
        }

        const linkHTML = this.generateLinkHTML(url, text, newTabCheckbox.checked);
        
        // Insert at cursor position or at end
        const cursorPos = contentArea.selectionStart;
        const textBefore = contentArea.value.substring(0, cursorPos);
        const textAfter = contentArea.value.substring(cursorPos);
        
        contentArea.value = textBefore + linkHTML + textAfter;
        
        // Update preview
        this.updatePostPreview();
        
        // Clear the form
        urlInput.value = '';
        textInput.value = '';
        newTabCheckbox.checked = false;
        this.updateLinkPreview();
        
        window.adminAuth.showStatus('Link inserted into post', 'success');
        
        // Track link insertion
        if (window.posthog) {
            posthog.capture('admin_link_inserted', {
                url: url,
                text: text,
                new_tab: newTabCheckbox.checked
            });
        }
    }

    generateLinkHTML(url, text, newTab = false) {
        const target = newTab ? ' target="_blank" rel="noopener noreferrer"' : '';
        return `<a href="${url}"${target}>${text}</a>`;
    }

    updateLinkPreview() {
        const urlInput = document.getElementById('link-url');
        const textInput = document.getElementById('link-text');
        const newTabCheckbox = document.getElementById('link-new-tab');
        const previewDiv = document.getElementById('link-preview');
        const previewLink = document.getElementById('preview-link');

        const url = urlInput.value.trim();
        const text = textInput.value.trim();

        if (url && text) {
            try {
                new URL(url); // Validate URL
                previewLink.href = url;
                previewLink.textContent = text;
                previewLink.target = newTabCheckbox.checked ? '_blank' : '_self';
                previewDiv.classList.remove('hidden');
            } catch {
                previewDiv.classList.add('hidden');
            }
        } else {
            previewDiv.classList.add('hidden');
        }
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
        const content = document.getElementById('post-content').value;
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
        const content = document.getElementById('post-content').value;
        const preview = document.getElementById('preview-content');
        
        if (preview && content) {
            // More aggressive HTML rendering for preview with tight spacing
            preview.innerHTML = content
                // First, handle line breaks around HTML elements more aggressively
                .replace(/\n+<div/g, '<div')     // Remove any line breaks before tables
                .replace(/\n+<figure/g, '<figure') // Remove any line breaks before figures
                .replace(/\n\n/g, '<br><br>')    // Convert double line breaks to paragraphs
                .replace(/\n/g, '<br>')          // Convert remaining single line breaks
                // Remove top margins completely in preview
                .replace(/class="my-2"/g, 'class="mb-2"')  // Only bottom margin
                .replace(/class="my-1"/g, 'class="mb-1"')  // Only bottom margin
                .replace(/class="mt-0 mb-2"/g, 'class="mb-2"')  // Clean up if already processed
                .replace(/class="mt-0 mb-1"/g, 'class="mb-1"')  // Clean up if already processed
                // Style tables and images
                .replace(/<table/g, '<table class="w-full border-collapse border border-gray-300"')
                .replace(/<img/g, '<img class="w-full rounded-lg shadow-sm"');
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
            document.getElementById('post-content').value = data.content || '';
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
        document.getElementById('post-content').value = '';
        document.getElementById('post-featured').checked = false;
        this.editingPostId = null;
        document.getElementById('form-title').textContent = 'Create New Post';
        
        // Clear link inputs
        document.getElementById('link-url').value = '';
        document.getElementById('link-text').value = '';
        document.getElementById('link-new-tab').checked = false;
        this.updateLinkPreview();
        
        this.updatePostPreview();
    }

    async publishPost() {
        const title = document.getElementById('post-title').value.trim();
        const slug = document.getElementById('post-slug').value.trim();
        const excerpt = document.getElementById('post-excerpt').value.trim();
        const content = document.getElementById('post-content').value.trim();
        const featured = document.getElementById('post-featured').checked;

        if (!title || !slug || !content) {
            window.adminAuth.showStatus('Please fill in all required fields', 'error');
            return;
        }

        // Check if user is authenticated
        const user = window.adminAuth.getCurrentUser();
        if (!user) {
            window.adminAuth.showStatus('Please log in to publish posts', 'error');
            return;
        }

        try {
            // Use the same Supabase config as your main app
            const SUPABASE_URL = 'https://xlglobsjkfpfpkxlivki.supabase.co'
            const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhsZ2xvYnNqa2ZwZnBreGxpdmtpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3NTg2NDYsImV4cCI6MjA3MjMzNDY0Nn0.6_zXfDYP8C23FBJZTGKz2ecK74-md4-t9ellPENGWCc'
            
            const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            
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
            
            // Clear the form and reset editing state
            this.clearForm();
            
            // Track post publication
            if (window.posthog) {
                posthog.capture('admin_post_published', {
                    post_title: title,
                    post_slug: slug,
                    is_featured: featured,
                    is_edit: !!this.editingPostId
                });
            }
            
            // Reload posts list if it's visible
            if (!document.getElementById('posts-list').classList.contains('hidden')) {
                this.loadPostsList();
            }
            
        } catch (error) {
            console.error('Publish error:', error);
            window.adminAuth.showStatus(`Error publishing post: ${error.message}`, 'error');
        }
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
});
