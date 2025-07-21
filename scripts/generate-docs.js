#!/usr/bin/env node

/**
 * Documentation Generator Script
 * Converts markdown documentation files to HTML for GitHub Pages
 */

const fs = require('fs');
const path = require('path');
const { marked } = require('marked');

// Configure marked for better code highlighting
marked.setOptions({
  highlight: function(code, lang) {
    return `<pre class="code-block"><code class="language-${lang || 'text'}">${code}</code></pre>`;
  },
  breaks: true,
  gfm: true
});

// HTML template for documentation pages
const htmlTemplate = (title, content, filename) => `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} - WayrApp API Documentation</title>
    <meta name="description" content="${title} documentation for WayrApp Backend API">
    
    <!-- Tailwind CSS -->
    <script src="https://cdn.tailwindcss.com"></script>
    
    <!-- Prism.js for syntax highlighting -->
    <link href="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism-tomorrow.min.css" rel="stylesheet">
    <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-core.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/plugins/autoloader/prism-autoloader.min.js"></script>
    
    <style>
        .gradient-bg {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        .code-block {
            background: #2d3748;
            border-radius: 0.5rem;
            padding: 1rem;
            margin: 1rem 0;
        }
        .prose h1 { @apply text-3xl font-bold mb-6 text-gray-800; }
        .prose h2 { @apply text-2xl font-semibold mb-4 mt-8 text-gray-800; }
        .prose h3 { @apply text-xl font-semibold mb-3 mt-6 text-gray-700; }
        .prose h4 { @apply text-lg font-medium mb-2 mt-4 text-gray-700; }
        .prose p { @apply mb-4 text-gray-600 leading-relaxed; }
        .prose ul { @apply mb-4 ml-6 list-disc; }
        .prose ol { @apply mb-4 ml-6 list-decimal; }
        .prose li { @apply mb-2 text-gray-600; }
        .prose table { @apply w-full border-collapse mb-6; }
        .prose th { @apply border border-gray-300 px-4 py-2 bg-gray-100 font-semibold text-left; }
        .prose td { @apply border border-gray-300 px-4 py-2; }
        .prose blockquote { @apply border-l-4 border-blue-500 pl-4 italic text-gray-600 mb-4; }
        .prose code:not(.language-json):not(.language-bash):not(.language-javascript) { 
            @apply bg-gray-100 px-2 py-1 rounded text-sm font-mono text-gray-800; 
        }
    </style>
</head>
<body class="bg-gray-50">
    <!-- Navigation -->
    <nav class="gradient-bg text-white shadow-lg">
        <div class="container mx-auto px-6 py-4">
            <div class="flex items-center justify-between">
                <div class="flex items-center space-x-4">
                    <a href="./index.html" class="text-2xl font-bold hover:text-gray-200 transition-colors">WayrApp API</a>
                    <span class="bg-white bg-opacity-20 px-3 py-1 rounded-full text-sm">v1.0.0</span>
                </div>
                <div class="hidden md:flex space-x-6">
                    <a href="./index.html" class="hover:text-gray-200 transition-colors">Home</a>
                    <a href="./API_OVERVIEW.html" class="hover:text-gray-200 transition-colors">API Overview</a>
                    <a href="./AUTHENTICATION.html" class="hover:text-gray-200 transition-colors">Authentication</a>
                    <a href="./CONTENT.html" class="hover:text-gray-200 transition-colors">Content</a>
                    <a href="./PROGRESS.html" class="hover:text-gray-200 transition-colors">Progress</a>
                    <a href="https://github.com/wayrapp/backend" target="_blank" class="hover:text-gray-200 transition-colors">GitHub</a>
                </div>
            </div>
        </div>
    </nav>

    <!-- Content -->
    <main class="container mx-auto px-6 py-12">
        <div class="max-w-4xl mx-auto">
            <!-- Breadcrumb -->
            <nav class="mb-8">
                <ol class="flex space-x-2 text-sm text-gray-500">
                    <li><a href="./index.html" class="hover:text-blue-600">Home</a></li>
                    <li>/</li>
                    <li class="text-gray-700">${title}</li>
                </ol>
            </nav>
            
            <!-- Documentation Content -->
            <article class="prose max-w-none bg-white rounded-lg shadow-md p-8">
                ${content}
            </article>
            
            <!-- Navigation Footer -->
            <div class="mt-12 flex justify-between items-center bg-white rounded-lg shadow-md p-6">
                <a href="./index.html" class="text-blue-600 hover:text-blue-800 transition-colors">
                    ← Back to Documentation Home
                </a>
                <a href="https://github.com/wayrapp/backend/blob/main/docs/${filename}" target="_blank" class="text-gray-600 hover:text-gray-800 transition-colors">
                    Edit on GitHub →
                </a>
            </div>
        </div>
    </main>

    <!-- Footer -->
    <footer class="gradient-bg text-white py-8 mt-16">
        <div class="container mx-auto px-6 text-center">
            <p>&copy; 2024 WayrApp. Built with ❤️ by Exequiel Trujillo. Licensed under MIT.</p>
        </div>
    </footer>

    <script>
        // Initialize Prism.js after page load
        document.addEventListener('DOMContentLoaded', function() {
            if (typeof Prism !== 'undefined') {
                Prism.highlightAll();
            }
        });
    </script>
</body>
</html>`;

// Documentation files to convert
const docFiles = [
    { file: 'API_OVERVIEW.md', title: 'API Overview' },
    { file: 'AUTHENTICATION.md', title: 'Authentication' },
    { file: 'USERS.md', title: 'User Management' },
    { file: 'CONTENT.md', title: 'Content Management' },
    { file: 'LESSONS_EXERCISES.md', title: 'Lessons & Exercises' },
    { file: 'PROGRESS.md', title: 'Progress Tracking' },
    { file: 'PACKAGED_CONTENT_API.md', title: 'Packaged Content API' },
    { file: 'DATABASE_SETUP.md', title: 'Database Setup' }
];

// Ensure output directory exists
const outputDir = '_site';
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

console.log('🔄 Generating HTML documentation from Markdown files...\n');

// Convert each markdown file to HTML
docFiles.forEach(({ file, title }) => {
    const inputPath = path.join('docs', file);
    const outputPath = path.join(outputDir, file.replace('.md', '.html'));
    
    try {
        if (fs.existsSync(inputPath)) {
            const markdown = fs.readFileSync(inputPath, 'utf8');
            const html = marked(markdown);
            const fullHtml = htmlTemplate(title, html, file);
            
            fs.writeFileSync(outputPath, fullHtml);
            console.log(`✅ Generated ${outputPath}`);
        } else {
            console.log(`⚠️  Skipped ${inputPath} (file not found)`);
        }
    } catch (error) {
        console.error(`❌ Error processing ${file}:`, error.message);
    }
});

// Copy the main index.html if it exists
const indexPath = path.join('docs', 'index.html');
const outputIndexPath = path.join(outputDir, 'index.html');

if (fs.existsSync(indexPath)) {
    fs.copyFileSync(indexPath, outputIndexPath);
    console.log(`✅ Copied ${outputIndexPath}`);
}

console.log('\n🎉 Documentation generation complete!');
console.log(`📁 Output directory: ${outputDir}`);
console.log('🌐 Ready for GitHub Pages deployment');