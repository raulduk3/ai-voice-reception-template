# Layer 7 AI Voice Receptionist 🤖

A sophisticated AI voice receptionist system with PII protection and automated workflows.

## 🚀 Build System

This project includes an automated build system that optimizes and minifies configuration files for production use.

### Quick Start

```bash
# Install dependencies
npm install

# Build optimized files
npm run build

# Clean build directory
npm run clean

# Format code
npm run format
```

### 📁 Project Structure

```
├── Layer 7 AI Voice Receptionist (POC) - Retell Agent.json  # Main agent config
├── Core Prompt.md                                          # Agent instructions
├── RAG Agent Prompt - answerQuestion.md                    # RAG security prompt
├── n8n/                                                    # N8N workflows
│   ├── answerQuestion.json
│   ├── bookAppointment.json
│   ├── cancelAppointment.json
│   ├── identifyAppointment.json
│   ├── logLead.json
│   └── modifyAppointment.json
├── dist/                                                   # Optimized build output
└── build.js                                              # Build system
```

## 🔧 Build Features

### ✨ Optimization
- **JSON Minification**: Removes whitespace and formatting from JSON files
- **Markdown Formatting**: Standardizes markdown formatting 
- **Size Reduction**: Typically achieves 30-40% size reduction
- **Build Analytics**: Detailed build statistics and file size reports

### 🔄 CI/CD Pipeline

The project includes GitHub Actions for automated builds:

1. **Build Stage**: 
   - Installs dependencies
   - Runs formatting checks
   - Builds optimized files
   - Uploads build artifacts

2. **Deploy Stage**: 
   - Deploys to GitHub Pages
   - Serves optimized files at: `https://raulduk3.github.io/layer7-ai-voice/`

3. **Notification Stage**: 
   - Provides build summaries
   - Reports deployment status

### 📊 Build Output

The build process generates:
- **Minified JSON files**: Production-ready configurations
- **Formatted Markdown**: Standardized documentation
- **Build info**: Detailed statistics in `dist/build-info.json`

Example build info:
```json
{
  "buildTime": "2025-10-01T14:08:14.051Z",
  "version": "1.0.0", 
  "stats": {
    "totalFiles": 9,
    "originalSize": "62.42 KB",
    "processedSize": "41.35 KB", 
    "totalReduction": "33.8%",
    "processingTime": "99ms"
  }
}
```

## 🛡️ Security Features

- **PII Protection**: Router-level filtering prevents exposure of personal data
- **Multi-factor Authentication**: Required for appointment access
- **Secure RAG**: Bulletproof prompts prevent data leakage
- **Secrets Management**: `.gitignore` configured to exclude sensitive files

## 🔗 Live URLs

- **GitHub Repository**: https://github.com/raulduk3/layer7-ai-voice
- **Optimized Files**: https://raulduk3.github.io/layer7-ai-voice/
- **Build Artifacts**: Available via GitHub Actions

## 🛠️ Development

### Adding New Layers

The build system is designed to be extensible. To add new processing layers:

1. Modify `build.js` to include new file types or processing steps
2. Update `.prettierrc` for formatting preferences  
3. Add new npm scripts in `package.json`
4. Update GitHub Actions workflow if needed

### Customization

- **Prettier Config**: Modify `.prettierrc` for formatting preferences
- **Build Script**: Extend `build.js` for additional optimizations
- **CI/CD**: Customize `.github/workflows/build-deploy.yml` for your needs

## 📝 License

ISC License - See repository for details.

---

Built with ❤️ for secure, efficient AI voice reception systems.