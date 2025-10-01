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
      // Load business configuration
      let config;
      try {
        config = JSON.parse(await fs.readFile("config.json", "utf8"));
      } catch {
        console.log(
          "📋 No config.json found, using auto-generation from repository"
        );
        config = {
          business: {},
          templating: { auto_generate_from_repo: true }
        };
      }

      // Load package.json for repository information
      const packageJson = JSON.parse(await fs.readFile("package.json", "utf8"));

      // Set up template variables based on config or auto-generation
      if (config.templating?.auto_generate_from_repo !== false) {
        const repoName = packageJson.name || "ai-voice-receptionist";
        const businessName =
          config.business?.name || this.generateBusinessName(repoName);

        this.templateVariables = {
          repository_name: repoName,
          version: packageJson.version || "1.0.0",
          business_name: config.business?.name || businessName,
          agent_display_name:
            config.business?.agent_display_name ||
            `${businessName} AI Voice Receptionist`,
          agent_human_name:
            config.business?.agent_human_name || businessName.split(" ")[0],
          ai_support_hours: config.business?.ai_support_hours || "24/7",
          transfer_phone_number:
            config.infrastructure?.transfer_phone_number || "+1234567890",
          voice_id: config.voice_settings?.voice_id || "11labs-Cimo",
          max_call_duration_ms:
            config.voice_settings?.max_call_duration_ms || 600000,
          interruption_sensitivity:
            config.voice_settings?.interruption_sensitivity || 0.9,
          // Add any custom dynamic variables from config
          ...(config.dynamic_variables || {})
        };
      } else {
        // Use explicit config values only
        this.templateVariables = {
          repository_name: packageJson.name || "ai-voice-receptionist",
          version: packageJson.version || "1.0.0",
          business_name: config.business?.name || "Your Business",
          agent_display_name:
            config.business?.agent_display_name ||
            "Your Business AI Voice Receptionist",
          agent_human_name: config.business?.agent_human_name || "Assistant",
          ai_support_hours: config.business?.ai_support_hours || "24/7",
          transfer_phone_number:
            config.infrastructure?.transfer_phone_number || "+1234567890",
          voice_id: config.voice_settings?.voice_id || "11labs-Cimo",
          max_call_duration_ms:
            config.voice_settings?.max_call_duration_ms || 600000,
          interruption_sensitivity:
            config.voice_settings?.interruption_sensitivity || 0.9,
          // Add any custom dynamic variables from config
          ...(config.dynamic_variables || {})
        };
      }

      // Store config for later use
      this.businessConfig = config;

      console.log("✅ Template variables loaded successfully");
    } catch (error) {
      console.warn(
        "⚠️ Could not load configuration, using defaults:",
        error.message
      );
      // Fallback defaults
      this.templateVariables = {
        repository_name: "ai-voice-receptionist",
        version: "1.0.0",
        business_name: "Your Business",
        agent_display_name: "Your Business AI Voice Receptionist",
        agent_human_name: "Assistant",
        ai_support_hours: "24/7",
        transfer_phone_number: "+1234567890",
        voice_id: "11labs-Cimo",
        max_call_duration_ms: 600000,
        interruption_sensitivity: 0.9
      };
      this.businessConfig = {};
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
    return content;
  }

  processRetellAgentTemplate(content) {
    try {
      const jsonData = JSON.parse(content);

      // Update main agent configuration fields
      if (jsonData.agent_name !== undefined) {
        jsonData.agent_name = this.templateVariables.agent_display_name;
      }

      // Update voice and call settings
      if (jsonData.voice_id !== undefined) {
        jsonData.voice_id = this.templateVariables.voice_id;
      }
      if (jsonData.max_call_duration_ms !== undefined) {
        jsonData.max_call_duration_ms =
          this.templateVariables.max_call_duration_ms;
      }
      if (jsonData.interruption_sensitivity !== undefined) {
        jsonData.interruption_sensitivity =
          this.templateVariables.interruption_sensitivity;
      }

      // Update dynamic variables if they exist
      if (jsonData.conversationFlow?.default_dynamic_variables) {
        const dynVars = jsonData.conversationFlow.default_dynamic_variables;

        // Update standard dynamic variables
        if (dynVars.agent_name !== undefined) {
          dynVars.agent_name = this.templateVariables.agent_human_name;
        }
        if (dynVars.business_name !== undefined) {
          dynVars.business_name = this.templateVariables.business_name;
        }
        if (dynVars.ai_support_hours !== undefined) {
          dynVars.ai_support_hours = this.templateVariables.ai_support_hours;
        }

        // Update any custom dynamic variables from config
        for (const [key, value] of Object.entries(this.templateVariables)) {
          // Skip system/infrastructure variables, only add dynamic variables
          const systemVars = [
            "repository_name",
            "version",
            "agent_display_name",
            "transfer_phone_number",
            "voice_id",
            "max_call_duration_ms",
            "interruption_sensitivity"
          ];
          if (!systemVars.includes(key)) {
            // Add custom dynamic variables (even if they don't exist in template)
            dynVars[key] = value;
          }
        }
      }

      // Keep webhook URLs as-is - don't template them
      // Webhooks are environment/deployment specific, not business specific

      // Update transfer phone number in transfer nodes
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

  updateTransferNodes(nodes) {
    if (!nodes) return;

    nodes.forEach(node => {
      if (node.type === "transfer_call" && node.transfer_destination?.number) {
        node.transfer_destination.number =
          this.templateVariables.transfer_phone_number;
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

    for (const fileInfo of allFiles) {
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
