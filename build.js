const fs = require("fs").promises;
const path = require("path");
const prettier = require("prettier");

class LayerBuilder {
  constructor() {
    this.sourceDir = "src/";
    this.distDir = "dist";
    this.prettierConfig = null;
    this.templateConfig = null;
    this.templateVariables = {};
  }

  async init() {
    // Load Prettier configuration
    this.prettierConfig = await prettier.resolveConfig(".");

    // Load template configuration and variables
    await this.loadTemplateVariables();

    // Ensure dist directory exists
    await this.ensureDir(this.distDir);

    console.log("🚀 Layer 7 AI Voice Build System Initialized");
    console.log(
      `📋 Template Variables: ${Object.keys(this.templateVariables).join(", ")}`
    );
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
      const content = await fs.readFile(filePath, "utf8");
      const ext = path.extname(filePath).toLowerCase();

      // First apply template variable replacement
      let processedContent = this.processTemplateContent(content, filePath);
      let sizeReduction = 0;

      if (ext === ".json") {
        try {
          // Validate JSON after template processing
          JSON.parse(processedContent);

          // Format with Prettier first
          const formatted = await prettier.format(processedContent, {
            ...this.prettierConfig,
            parser: "json"
          });

          // Then minify for production
          const minified = JSON.stringify(JSON.parse(formatted));
          processedContent = minified;

          sizeReduction = (
            ((content.length - processedContent.length) / content.length) *
            100
          ).toFixed(1);
        } catch (jsonError) {
          console.warn(
            `⚠️ Invalid JSON in ${filePath}, copying as-is: ${jsonError.message}`
          );
          // Keep the template-processed content even if JSON is invalid
          sizeReduction = 0;
        }
      } else if (ext === ".md") {
        try {
          // Format Markdown with Prettier after template processing
          const formatted = await prettier.format(processedContent, {
            ...this.prettierConfig,
            parser: "markdown"
          });
          processedContent = formatted;

          sizeReduction = (
            ((content.length - processedContent.length) / content.length) *
            100
          ).toFixed(1);
        } catch (mdError) {
          console.warn(
            `⚠️ Could not format markdown ${filePath}, copying as-is: ${mdError.message}`
          );
          // Keep the template-processed content even if formatting fails
          sizeReduction = 0;
        }
      } else {
        // For other file types, copy as-is
        processedContent = content;
        sizeReduction = 0;
      }

      await fs.writeFile(outputPath, processedContent, "utf8");

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

  async loadTemplateVariables() {
    try {
      // Load configuration
      try {
        this.config = JSON.parse(await fs.readFile("config.json", "utf8"));
      } catch {
        console.log("📋 No config.json found, using defaults");
        this.config = { templating: { auto_generate_from_repo: true } };
      }

      const packageJson = JSON.parse(await fs.readFile("package.json", "utf8"));
      const buildDate = new Date().toISOString();

      // PHASE 1: Template Variables (for filenames and general templating)
      if (this.config.templating?.auto_generate_from_repo !== false) {
        const repoName = packageJson.name || "ai-voice-receptionist";
        const businessName = this.config.templating?.variables?.business_name || 
                           this.generateBusinessName(repoName);
        
        this.templateVariables = {
          build_date: buildDate,
          repository_name: repoName,
          version: packageJson.version || "1.0.0",
          business_name: businessName,
          agent_display_name: this.config.templating?.variables?.agent_display_name || 
                            `${businessName} AI Voice Receptionist`,
          agent_human_name: this.config.templating?.variables?.agent_human_name || 
                          businessName.split(" ")[0]
        };
      } else {
        // Use explicit config values
        this.templateVariables = {
          build_date: buildDate,
          repository_name: packageJson.name || "ai-voice-receptionist",
          version: packageJson.version || "1.0.0",
          ...this.config.templating?.variables || {
            business_name: "Your Business",
            agent_display_name: "Your Business AI Voice Receptionist",
            agent_human_name: "Assistant"
          }
        };
      }

      // PHASE 2: Build Config (for direct agent JSON modification)
      this.buildConfig = {
        voice_settings: this.config.build_config?.voice_settings || {
          voice_id: "11labs-Cimo",
          max_call_duration_ms: 600000,
          interruption_sensitivity: 0.9
        },
        infrastructure: this.config.build_config?.infrastructure || {
          transfer_phone_number: "+1234567890"
        },
        webhooks: this.config.build_config?.webhooks || {
          base_url: "https://n8n.srv836523.hstgr.cloud/webhook",
          tools: {}
        }
      };

      // PHASE 3: Runtime Variables (for Retell dynamic_variables)
      // Merge template variables with explicit runtime_variables from config
      const defaultRuntimeVars = {
        build_date: this.templateVariables.build_date,
        repository_name: this.templateVariables.repository_name,
        version: this.templateVariables.version,
        business_name: this.templateVariables.business_name,
        agent_display_name: this.templateVariables.agent_display_name,
        agent_name: this.templateVariables.agent_human_name,
        agent_human_name: this.templateVariables.agent_human_name,
        ai_support_hours: "24/7",
        transfer_phone_number: this.buildConfig.infrastructure.transfer_phone_number
      };
      
      // Override/extend with explicit runtime_variables from config
      this.runtimeVariables = {
        ...defaultRuntimeVars,
        ...(this.config.runtime_variables || {})
      };

      console.log("✅ Configuration loaded successfully");
      console.log(`📋 Template Variables: ${Object.keys(this.templateVariables).join(", ")}`);
    } catch (error) {
      console.warn("⚠️ Could not load configuration, using defaults:", error.message);
      this.setDefaults();
    }
    
    // Load prompts after template variables are set
    await this.loadPrompts();
  }

  setDefaults() {
    const buildDate = new Date().toISOString();
    this.templateVariables = {
      build_date: buildDate,
      repository_name: "ai-voice-receptionist",
      version: "1.0.0",
      business_name: "Your Business",
      agent_display_name: "Your Business AI Voice Receptionist",
      agent_human_name: "Assistant"
    };
    this.buildConfig = {
      voice_settings: {
        voice_id: "11labs-Cimo",
        max_call_duration_ms: 600000,
        interruption_sensitivity: 0.9
      },
      infrastructure: { transfer_phone_number: "+1234567890" },
      webhooks: { base_url: "https://n8n.srv836523.hstgr.cloud/webhook", tools: {} }
    };
    this.runtimeVariables = {
      build_date: buildDate,
      repository_name: "ai-voice-receptionist",
      version: "1.0.0",
      business_name: "Your Business",
      agent_display_name: "Your Business AI Voice Receptionist",
      agent_name: "Assistant",
      agent_human_name: "Assistant",
      ai_support_hours: "24/7",
      transfer_phone_number: "+1234567890"
    };
    this.config = {};
  }

  async loadPrompts() {
    try {
      // Load core prompt (for Retell agent global_prompt) from dist directory
      const corePromptPath = this.processTemplateFilename('dist/prompts/{{business_name}} Core Prompt.md');
      this.corePrompt = await fs.readFile(corePromptPath, 'utf8');
      
      // Load RAG prompt (for answerQuestion n8n workflow) from dist directory
      const ragPromptPath = this.processTemplateFilename('dist/prompts/{{business_name}} Answer Question - RAG Agent Prompt.md');
      this.ragPrompt = await fs.readFile(ragPromptPath, 'utf8');
      
      console.log('📝 Prompts loaded successfully');
    } catch (error) {
      console.warn('⚠️ Could not load prompts:', error.message);
      this.corePrompt = null;
      this.ragPrompt = null;
    }
  }

  generateBusinessName(repoName) {
    // Convert repository name to business name
    return (
      repoName
        .replace(/[-_]/g, " ") // Replace hyphens and underscores with spaces
        .replace(/\b(ai|voice|receptionist|agent|bot|assistant)\b/gi, "") // Remove technical terms
        .replace(/\s+/g, " ") // Clean up multiple spaces
        .trim()
        .split(" ")
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()) // Title case
        .join(" ") || "Your Business"
    ); // Fallback
  }

  processTemplateContent(content, filePath = "") {
    const ext = path.extname(filePath).toLowerCase();

    // Only process template variables in specific files and contexts
    if (filePath.includes("Retell Agent.json")) {
      return this.processRetellAgentTemplate(content);
    }
    
    // Process n8n files for prompt injection
    if (filePath.includes("n8n/") && filePath.includes("answerQuestion.json")) {
      return this.processN8nAnswerQuestionTemplate(content);
    }

    // For filenames, always process templates
    if (filePath === "") {
      let processedContent = content;
      for (const [key, value] of Object.entries(this.templateVariables)) {
        const regex = new RegExp(`\\{\\{${key}\\}\\}`, "g");
        processedContent = processedContent.replace(regex, value);
      }
      return processedContent;
    }

    // For other files, return as-is (no templating in prompts/markdown)
    // Prompts need to keep {{variables}} for Retell runtime replacement
    return content;
  }

  processRetellAgentTemplate(content) {
    try {
      const jsonData = JSON.parse(content);

      // PHASE 1: Apply Build Config (direct agent settings)
      if (jsonData.agent_name !== undefined) {
        jsonData.agent_name = this.templateVariables.agent_display_name;
      }

      // Apply voice settings from build_config
      if (jsonData.voice_id !== undefined) {
        jsonData.voice_id = this.buildConfig.voice_settings.voice_id;
      }
      if (jsonData.max_call_duration_ms !== undefined) {
        jsonData.max_call_duration_ms = this.buildConfig.voice_settings.max_call_duration_ms;
      }
      if (jsonData.interruption_sensitivity !== undefined) {
        jsonData.interruption_sensitivity = this.buildConfig.voice_settings.interruption_sensitivity;
      }

      // PHASE 2: Inject Prompts (with {{variables}} preserved)
      if (this.corePrompt && jsonData.conversationFlow?.global_prompt !== undefined) {
        jsonData.conversationFlow.global_prompt = this.corePrompt;
      }

      // PHASE 3: Hydrate Runtime Variables (for Retell dynamic_variables)
      if (jsonData.conversationFlow?.default_dynamic_variables !== undefined) {
        jsonData.conversationFlow.default_dynamic_variables = {
          ...this.runtimeVariables
        };
      }

      // PHASE 4: Update infrastructure (webhooks, transfer numbers)
      this.updateToolWebhookUrls(jsonData.conversationFlow?.tools);
      this.updateTransferNodes(jsonData.conversationFlow?.nodes);

      return JSON.stringify(jsonData, null, 2);
    } catch (error) {
      console.warn(
        "⚠️ Could not parse JSON for template processing:",
        error.message
      );
      return content;
    }
  }

  processN8nAnswerQuestionTemplate(content) {
    try {
      const jsonData = JSON.parse(content);

      // Update systemMessage in the Answer Agent node if RAG prompt is loaded
      if (this.ragPrompt && jsonData.nodes) {
        // Apply template variables to the RAG prompt content
        let processedPrompt = this.ragPrompt;
        for (const [key, value] of Object.entries(this.templateVariables)) {
          const regex = new RegExp(`\\{\\{${key}\\}\\}`, "g");
          processedPrompt = processedPrompt.replace(regex, value);
        }
        // Also handle legacy {{agent_name}} -> use agent_display_name
        processedPrompt = processedPrompt.replace(
          /\{\{agent_name\}\}/g,
          this.templateVariables.agent_display_name
        );

        // Find and update the Answer Agent node
        jsonData.nodes.forEach(node => {
          if (node.name === "Answer Agent" && 
              node.type === "@n8n/n8n-nodes-langchain.agent" &&
              node.parameters?.options?.systemMessage !== undefined) {
            node.parameters.options.systemMessage = processedPrompt;
          }
        });
      }

      return JSON.stringify(jsonData, null, 2);
    } catch (error) {
      console.warn(
        "⚠️ Could not parse n8n JSON for template processing:",
        error.message
      );
      return content;
    }
  }

  updateTransferNodes(nodes) {
    if (!nodes) return;

    nodes.forEach(node => {
      if (node.type === "transfer_call" && node.transfer_destination?.number) {
        node.transfer_destination.number = this.buildConfig.infrastructure.transfer_phone_number;
      }
    });
  }

  updateToolWebhookUrls(tools) {
    if (!tools || !this.buildConfig.webhooks.tools) return;

    const webhooks = this.buildConfig.webhooks;
    const baseUrl = webhooks.base_url;

    tools.forEach(tool => {
      if (tool.type === "custom" && tool.url && tool.name) {
        // Get webhook ID for this tool from config
        const webhookId = webhooks.tools[tool.name];
        if (webhookId) {
          tool.url = `${baseUrl}/${webhookId}`;
        }
      }
    });
  }

  processTemplateFilename(filename) {
    let processedFilename = filename;

    // Replace template variables in filename
    for (const [key, value] of Object.entries(this.templateVariables)) {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, "g");
      processedFilename = processedFilename.replace(regex, value);
    }

    // Also handle legacy {{agent_name}} in filenames -> use agent_display_name
    processedFilename = processedFilename.replace(
      /\{\{agent_name\}\}/g,
      this.templateVariables.agent_display_name
    );

    return processedFilename;
  }

  async scanDirectory(dir, baseDir = "") {
    const files = [];
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        const relativePath = path.join(baseDir, entry.name);

        if (entry.isDirectory()) {
          // Skip certain directories
          if (
            ["node_modules", ".git", "dist", "secrets", ".github"].includes(
              entry.name
            )
          ) {
            continue;
          }
          // Recursively scan subdirectories
          const subFiles = await this.scanDirectory(fullPath, relativePath);
          files.push(...subFiles);
        } else if (entry.isFile()) {
          // Include files we can process or important config files
          const ext = path.extname(entry.name).toLowerCase();
          const isProcessable = [".json", ".md"].includes(ext);
          const isImportant = [
            "package.json",
            "README.md",
            ".prettierrc",
            ".gitignore"
          ].includes(entry.name);

          // Skip certain files
          const isExcluded =
            [
              "package-lock.json",
              "build.js",
              ".DS_Store",
              "README.md",
              "package.json"
            ].includes(entry.name) || entry.name.startsWith(".");

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

  async processFileEntry(fileInfo, stats) {
    try {
      // Process template filename
      const processedRelativePath = fileInfo.relativePath
        .split(path.sep)
        .map(segment => this.processTemplateFilename(segment))
        .join(path.sep);

      // Create directory structure in dist
      const outputDir = path.join(
        this.distDir,
        path.dirname(processedRelativePath)
      );
      await this.ensureDir(outputDir);

      const outputPath = path.join(this.distDir, processedRelativePath);

      if (fileInfo.isProcessable) {
        // Process and optimize the file
        const result = await this.processFile(
          fileInfo.sourcePath,
          outputPath
        );

        stats.totalFiles++;
        stats.totalOriginalSize += result.original;
        stats.totalProcessedSize += result.processed;

        console.log(
          `✅ ${processedRelativePath} - ${result.reduction}% size reduction`
        );
      } else {
        // Copy file with template processing for content
        const content = await fs.readFile(fileInfo.sourcePath, "utf8");
        const processedContent = this.processTemplateContent(
          content,
          fileInfo.sourcePath
        );
        await fs.writeFile(outputPath, processedContent, "utf8");

        const stat = await fs.stat(fileInfo.sourcePath);

        stats.totalFiles++;
        stats.totalOriginalSize += stat.size;
        stats.totalProcessedSize += Buffer.byteLength(
          processedContent,
          "utf8"
        );

        console.log(`📄 ${processedRelativePath} - template processed`);
      }
    } catch (error) {
      console.error(
        `❌ Error processing ${fileInfo.relativePath}:`,
        error.message
      );
    }
  }

  async build() {
    console.log("🔧 Starting build process...");

    const stats = {
      totalFiles: 0,
      totalOriginalSize: 0,
      totalProcessedSize: 0,
      processingTime: Date.now()
    };

    // Scan all directories for processable files
    console.log("🔍 Scanning for files to process...");
    const allFiles = await this.scanDirectory(this.sourceDir);

    console.log(`📋 Found ${allFiles.length} files to process`);

    // First phase: Process prompt files first
    const promptFiles = allFiles.filter(f => f.relativePath.includes('prompts/'));
    const otherFiles = allFiles.filter(f => !f.relativePath.includes('prompts/'));

    // Process prompt files first
    for (const fileInfo of promptFiles) {
      await this.processFileEntry(fileInfo, stats);
    }

    // Load prompts from the processed files in dist
    if (promptFiles.length > 0) {
      await this.loadPrompts();
    }

    // Second phase: Process all other files (now that prompts are loaded)
    for (const fileInfo of otherFiles) {
      await this.processFileEntry(fileInfo, stats);
    }

    // Create build info
    const buildInfo = {
      buildTime: new Date().toISOString(),
      version: require("./package.json").version || "1.0.0",
      stats: {
        totalFiles: stats.totalFiles,
        originalSize: `${(stats.totalOriginalSize / 1024).toFixed(2)} KB`,
        processedSize: `${(stats.totalProcessedSize / 1024).toFixed(2)} KB`,
        totalReduction: `${(((stats.totalOriginalSize - stats.totalProcessedSize) / stats.totalOriginalSize) * 100).toFixed(1)}%`,
        processingTime: `${Date.now() - stats.processingTime}ms`
      }
    };

    await fs.writeFile(
      path.join(this.distDir, "build-info.json"),
      JSON.stringify(buildInfo, null, 2)
    );

    stats.processingTime = Date.now() - stats.processingTime;

    console.log("\n🎉 Build completed successfully!");
    console.log(`📊 Processed ${stats.totalFiles} files`);
    console.log(`📦 Size reduction: ${buildInfo.stats.totalReduction}`);
    console.log(`⚡ Build time: ${stats.processingTime}ms`);

    return buildInfo;
  }

  async clean() {
    try {
      await fs.rm(this.distDir, { recursive: true, force: true });
      console.log("🧹 Cleaned dist directory");
    } catch (error) {
      console.log("🧹 No dist directory to clean");
    }
  }
}

// CLI Interface
async function main() {
  const builder = new LayerBuilder();
  await builder.init();

  const command = process.argv[2];

  switch (command) {
    case "clean":
      await builder.clean();
      break;
    case "build":
      await builder.build();
      break;
    case "rebuild":
      await builder.clean();
      await builder.build();
      break;
    default:
      console.log("Available commands:");
      console.log("  npm run build     - Build optimized files");
      console.log("  npm run clean     - Clean dist directory");
      console.log("  npm run rebuild   - Clean and build");
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = LayerBuilder;
