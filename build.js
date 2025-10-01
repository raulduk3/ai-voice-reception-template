const fs = require('fs').promises;
const path = require('path');
const prettier = require('prettier');

class LayerBuilder {
    constructor() {
        this.sourceDir = 'src/';
        this.distDir = 'dist';
        this.prettierConfig = null;
    }

    async init() {
        // Load Prettier configuration
        this.prettierConfig = await prettier.resolveConfig('.');

        // Ensure dist directory exists
        await this.ensureDir(this.distDir);

        console.log('🚀 Layer 7 AI Voice Build System Initialized');
    }

    async ensureDir(dirPath) {
        try {
            await fs.access(dirPath);
        } catch {
            await fs.mkdir(dirPath, { recursive: true });
            console.log(`📁 Created directory: ${dirPath}`);
        }
    }

    async processFile(filePath, outputPath) {
        try {
            const content = await fs.readFile(filePath, 'utf8');
            const ext = path.extname(filePath).toLowerCase();

            let processedContent = content;
            let sizeReduction = 0;

            if (ext === '.json') {
                try {
                    // Validate JSON first
                    JSON.parse(content);
                    
                    // Format with Prettier first
                    const formatted = await prettier.format(content, {
                        ...this.prettierConfig,
                        parser: 'json'
                    });

                    // Then minify for production
                    const minified = JSON.stringify(JSON.parse(formatted));
                    processedContent = minified;

                    sizeReduction = ((content.length - minified.length) / content.length * 100).toFixed(1);
                    
                } catch (jsonError) {
                    console.warn(`⚠️ Invalid JSON in ${filePath}, copying as-is: ${jsonError.message}`);
                    processedContent = content;
                    sizeReduction = 0;
                }

            } else if (ext === '.md') {
                try {
                    // Format Markdown with Prettier
                    processedContent = await prettier.format(content, {
                        ...this.prettierConfig,
                        parser: 'markdown'
                    });

                    sizeReduction = ((content.length - processedContent.length) / content.length * 100).toFixed(1);
                } catch (mdError) {
                    console.warn(`⚠️ Could not format markdown ${filePath}, copying as-is: ${mdError.message}`);
                    processedContent = content;
                    sizeReduction = 0;
                }
            } else {
                // For other file types, copy as-is
                processedContent = content;
                sizeReduction = 0;
            }

            await fs.writeFile(outputPath, processedContent, 'utf8');

            return {
                original: content.length,
                processed: processedContent.length,
                reduction: sizeReduction
            };

        } catch (error) {
            console.error(`❌ Error processing ${filePath}:`, error.message);
            throw error;
        }
    }

    async copyFile(source, destination) {
        await fs.copyFile(source, destination);
    }

    async scanDirectory(dir, baseDir = '') {
        const files = [];
        try {
            const entries = await fs.readdir(dir, { withFileTypes: true });
            
            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);
                const relativePath = path.join(baseDir, entry.name);
                
                if (entry.isDirectory()) {
                    // Skip certain directories
                    if (['node_modules', '.git', 'dist', 'secrets', '.github'].includes(entry.name)) {
                        continue;
                    }
                    // Recursively scan subdirectories
                    const subFiles = await this.scanDirectory(fullPath, relativePath);
                    files.push(...subFiles);
                } else if (entry.isFile()) {
                    // Include files we can process or important config files
                    const ext = path.extname(entry.name).toLowerCase();
                    const isProcessable = ['.json', '.md'].includes(ext);
                    const isImportant = [
                        'package.json',
                        'README.md',
                        '.prettierrc',
                        '.gitignore'
                    ].includes(entry.name);
                    
                    // Skip certain files
                    const isExcluded = [
                        'package-lock.json',
                        'build.js',
                        '.DS_Store',
                        'README.md',
                        "package.json"
                    ].includes(entry.name) || entry.name.startsWith('.');
                    
                    if ((isProcessable || isImportant) && !isExcluded) {
                        files.push({
                            sourcePath: fullPath,
                            relativePath: relativePath,
                            name: entry.name,
                            extension: ext,
                            isProcessable: isProcessable
                        });
                    }
                }
            }
        } catch (error) {
            console.log(`📝 Could not scan directory ${dir}: ${error.message}`);
        }
        
        return files;
    }

    async build() {
        console.log('🔧 Starting build process...');

        const stats = {
            totalFiles: 0,
            totalOriginalSize: 0,
            totalProcessedSize: 0,
            processingTime: Date.now()
        };

        // Scan all directories for processable files
        console.log('🔍 Scanning for files to process...');
        const allFiles = await this.scanDirectory(this.sourceDir);
        
        console.log(`📋 Found ${allFiles.length} files to process`);

        for (const fileInfo of allFiles) {
            try {
                // Create directory structure in dist
                const outputDir = path.join(this.distDir, path.dirname(fileInfo.relativePath));
                await this.ensureDir(outputDir);
                
                const outputPath = path.join(this.distDir, fileInfo.relativePath);
                
                if (fileInfo.isProcessable) {
                    // Process and optimize the file
                    const result = await this.processFile(fileInfo.sourcePath, outputPath);
                    
                    stats.totalFiles++;
                    stats.totalOriginalSize += result.original;
                    stats.totalProcessedSize += result.processed;

                    console.log(`✅ ${fileInfo.relativePath} - ${result.reduction}% size reduction`);
                } else {
                    // Just copy the file
                    await fs.copyFile(fileInfo.sourcePath, outputPath);
                    const stat = await fs.stat(fileInfo.sourcePath);
                    
                    stats.totalFiles++;
                    stats.totalOriginalSize += stat.size;
                    stats.totalProcessedSize += stat.size;
                    
                    console.log(`📄 ${fileInfo.relativePath} - copied`);
                }

            } catch (error) {
                console.error(`❌ Error processing ${fileInfo.relativePath}:`, error.message);
            }
        }

        // Create build info
        const buildInfo = {
            buildTime: new Date().toISOString(),
            version: require('./package.json').version || '1.0.0',
            stats: {
                totalFiles: stats.totalFiles,
                originalSize: `${(stats.totalOriginalSize / 1024).toFixed(2)} KB`,
                processedSize: `${(stats.totalProcessedSize / 1024).toFixed(2)} KB`,
                totalReduction: `${((stats.totalOriginalSize - stats.totalProcessedSize) / stats.totalOriginalSize * 100).toFixed(1)}%`,
                processingTime: `${Date.now() - stats.processingTime}ms`
            }
        };

        await fs.writeFile(
            path.join(this.distDir, 'build-info.json'),
            JSON.stringify(buildInfo, null, 2)
        );

        stats.processingTime = Date.now() - stats.processingTime;

        console.log('\n🎉 Build completed successfully!');
        console.log(`📊 Processed ${stats.totalFiles} files`);
        console.log(`📦 Size reduction: ${buildInfo.stats.totalReduction}`);
        console.log(`⚡ Build time: ${stats.processingTime}ms`);

        return buildInfo;
    }

    async clean() {
        try {
            await fs.rm(this.distDir, { recursive: true, force: true });
            console.log('🧹 Cleaned dist directory');
        } catch (error) {
            console.log('🧹 No dist directory to clean');
        }
    }
}

// CLI Interface
async function main() {
    const builder = new LayerBuilder();
    await builder.init();

    const command = process.argv[2];

    switch (command) {
        case 'clean':
            await builder.clean();
            break;
        case 'build':
            await builder.build();
            break;
        case 'rebuild':
            await builder.clean();
            await builder.build();
            break;
        default:
            console.log('Available commands:');
            console.log('  npm run build     - Build optimized files');
            console.log('  npm run clean     - Clean dist directory');
            console.log('  npm run rebuild   - Clean and build');
    }
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = LayerBuilder;