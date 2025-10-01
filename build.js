const fs = require('fs').promises;
const path = require('path');
const prettier = require('prettier');

class LayerBuilder {
  constructor() {
    this.sourceDir = '.';
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
      const ext = path.extname(filePath);
      
      let processedContent = content;
      let sizeReduction = 0;
      
      if (ext === '.json') {
        // Format with Prettier first
        const formatted = await prettier.format(content, {
          ...this.prettierConfig,
          parser: 'json'
        });
        
        // Then minify for production
        const minified = JSON.stringify(JSON.parse(formatted));
        processedContent = minified;
        
        sizeReduction = ((content.length - minified.length) / content.length * 100).toFixed(1);
        
      } else if (ext === '.md') {
        // Format Markdown with Prettier
        processedContent = await prettier.format(content, {
          ...this.prettierConfig,
          parser: 'markdown'
        });
        
        sizeReduction = ((content.length - processedContent.length) / content.length * 100).toFixed(1);
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

  async build() {
    console.log('🔧 Starting build process...');
    
    const stats = {
      totalFiles: 0,
      totalOriginalSize: 0,
      totalProcessedSize: 0,
      processingTime: Date.now()
    };

    // Process main configuration files
    const mainFiles = [
      'Layer 7 AI Voice Receptionist (POC) - Retell Agent.json',
      'Core Prompt.md',
      'RAG Agent Prompt - answerQuestion.md'
    ];

    for (const file of mainFiles) {
      try {
        const sourcePath = path.join(this.sourceDir, file);
        const outputPath = path.join(this.distDir, file);
        
        await fs.access(sourcePath);
        const result = await this.processFile(sourcePath, outputPath);
        
        stats.totalFiles++;
        stats.totalOriginalSize += result.original;
        stats.totalProcessedSize += result.processed;
        
        console.log(`✅ ${file} - ${result.reduction}% size reduction`);
        
      } catch (error) {
        if (error.code !== 'ENOENT') {
          console.error(`❌ Error with ${file}:`, error.message);
        }
      }
    }

    // Process n8n directory
    const n8nSourceDir = path.join(this.sourceDir, 'n8n');
    const n8nDistDir = path.join(this.distDir, 'n8n');
    
    try {
      await this.ensureDir(n8nDistDir);
      const n8nFiles = await fs.readdir(n8nSourceDir);
      
      for (const file of n8nFiles) {
        if (file.endsWith('.json')) {
          const sourcePath = path.join(n8nSourceDir, file);
          const outputPath = path.join(n8nDistDir, file);
          
          const result = await this.processFile(sourcePath, outputPath);
          
          stats.totalFiles++;
          stats.totalOriginalSize += result.original;
          stats.totalProcessedSize += result.processed;
          
          console.log(`✅ n8n/${file} - ${result.reduction}% size reduction`);
        }
      }
    } catch (error) {
      console.log('📝 No n8n directory found, skipping...');
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