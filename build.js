const fs = require("fs").promises;
const path = require("path");
const prettier = require("prettier");

// Load environment variables if .env file exists
try {
  const dotenv = require("dotenv");
  dotenv.config();
} catch (error) {
  console.log("Note: dotenv not found, using system environment variables");
}

// Import modular components
const {
  ConfigurationLoader,
  ServiceSchemaEngine,
  WebhookGenerator,
  PromptInjector,
  RuntimeVariableBuilder,
  N8nWorkflowProcessor,
  RetellAgentProcessor,
  TemplateProcessor,
  TokenCounter
} = require("./lib");

/**
 * Layer 7 AI Voice Receptionist Template Build System (Modular Architecture)
 *
 * This build system uses a modular architecture with independent components
 * that communicate through well-defined interfaces. Each module can be tested in isolation
 * and composed for complete builds.
 *
 * MODULAR ARCHITECTURE:
 * ===================
 * - ConfigurationLoader: Loads and validates config.json
 * - RuntimeVariableBuilder: Builds all four phases of template variables
 * - ServiceSchemaEngine: Generates service-specific JSON schemas
 * - WebhookGenerator: Creates unique webhook URLs with hashes
 * - PromptInjector: Loads and injects markdown prompts
 * - RetellAgentProcessor: Processes Retell agent JSON
 * - N8nWorkflowProcessor: Processes n8n workflow JSON
 * - TemplateProcessor: Orchestrates file-type routing
 *
 */
class AIVoiceBuilder {
  constructor() {
    // Core directories
    this.sourceDir = "src/";
    this.distDir = "dist";

    // Module instances
    this.configLoader = new ConfigurationLoader();
    this.variableBuilder = new RuntimeVariableBuilder();
    this.serviceEngine = new ServiceSchemaEngine();
    this.webhookGenerator = new WebhookGenerator();
    this.promptInjector = new PromptInjector(this.distDir);
    this.retellProcessor = new RetellAgentProcessor();
    this.workflowProcessor = new N8nWorkflowProcessor();
    this.templateProcessor = new TemplateProcessor();
    this.tokenCounter = new TokenCounter();

    // Configuration state (populated during init)
    this.config = null;
    this.prettierConfig = null;

    // Backward compatibility: expose traditional properties
    this.templateVariables = {};
    this.buildConfig = {};
    this.runtimeVariables = {};
    this.clientDataVariables = {};
    this.webhookUrls = {};
    this.webhookHashes = {};
  }

  /**
   * Initialize the build system
   *
   * This method:
   * 1. Loads Prettier configuration
   * 2. Loads and processes configuration
   * 3. Initializes all modules with their dependencies
   * 4. Creates output directory structure
   */
  async init() {
    console.log(
      "🚀 Layer 7 AI Voice Build System Initializing (Modular Architecture)..."
    );

    // Load Prettier configuration
    this.prettierConfig = await prettier.resolveConfig(".");

    // Load configuration
    this.config = await this.configLoader.loadConfiguration();

    // Build all variable phases
    const packageJson = require("./package.json");
    const repoName = packageJson.name || "ai-voice-reception";

    // Initialize service engine first (needed for Phase 4 variables)
    const clientData = this.config.client_data || {};
    if (clientData.services) {
      this.serviceEngine.initialize(
        clientData.services,
        clientData.service_constraints
      );
    }

    // Build all phases with service engine for advanced schema generation
    const allPhases = this.variableBuilder.buildAllPhases(
      this.config,
      packageJson,
      repoName,
      this.serviceEngine
    );

    // Store for backward compatibility
    this.templateVariables = allPhases.templateVariables;
    this.buildConfig = allPhases.buildConfig;
    this.runtimeVariables = allPhases.runtimeVariables;
    this.clientDataVariables = allPhases.clientDataVariables;

    // Initialize webhook generator
    const webhookConfig = {
      base_webhook_url: this.buildConfig.infrastructure.base_webhook_url,
      hash_algorithm: this.buildConfig.webhook_deployment.hash_algorithm,
      hash_length: this.buildConfig.webhook_deployment.hash_length,
      tools: this.buildConfig.webhook_deployment.tools,
      business_name: this.templateVariables.business_name
    };

    this.webhookGenerator.initialize(webhookConfig);
    this.webhookHashes = this.webhookGenerator.generateWebhookHashes();
    this.webhookUrls = this.webhookGenerator.buildWebhookUrls();

    // Initialize prompt injector
    this.promptInjector.initialize(
      this.templateVariables.business_name,
      this.distDir
    );

    // Initialize retell processor with service engine
    this.retellProcessor.initialize(this.serviceEngine);

    // Initialize template processor
    const allVariables = {
      ...this.templateVariables,
      ...this.clientDataVariables
    };

    this.templateProcessor.initialize(
      {
        retellAgentProcessor: this.retellProcessor,
        n8nWorkflowProcessor: this.workflowProcessor
      },
      allVariables
    );

    // Create output directory
    await this.ensureDir(this.distDir);

    console.log("✅ Build system initialized");
    console.log(`📦 Business: ${this.templateVariables.business_name}`);
    console.log(`🤖 Agent: ${this.templateVariables.agent_name}`);
    console.log(
      `🔗 Webhook base: ${this.buildConfig.infrastructure.base_webhook_url}`
    );

    if (clientData.services) {
      console.log(`📋 Services: ${clientData.services.length} configured`);
    }
  }

  /**
   * Ensure a directory exists, creating it if necessary
   *
   * @param {string} dirPath - Absolute path to directory
   */
  async ensureDir(dirPath) {
    try {
      await fs.mkdir(dirPath, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }
  }

  /**
   * Process a single file through the template system
   *
   * @param {string} filePath - Source file path
   * @param {string} outputPath - Destination file path
   * @returns {Object} Processing statistics
   */
  async processFile(filePath, outputPath) {
    try {
      // Read source file
      const content = await fs.readFile(filePath, "utf-8");
      const originalSize = Buffer.byteLength(content, "utf8");

      // Process content through template processor
      const context = this._buildProcessingContext();
      const processedContent = this.templateProcessor.processFile(
        filePath,
        content,
        context
      );

      // Format and optimize output
      const optimizedContent = await this._optimizeContent(
        processedContent,
        outputPath
      );

      const processedSize = Buffer.byteLength(optimizedContent, "utf8");

      // Ensure output directory exists
      await this.ensureDir(path.dirname(outputPath));

      // Write processed file
      await fs.writeFile(outputPath, optimizedContent, "utf-8");

      // Calculate size reduction
      const reduction =
        originalSize > 0
          ? (((originalSize - processedSize) / originalSize) * 100).toFixed(1)
          : 0;

      console.log(
        `  ✓ ${path.basename(filePath)} → ${path.basename(outputPath)} ` +
          `(${reduction}% reduction)`
      );

      return {
        originalSize,
        processedSize,
        reduction: parseFloat(reduction)
      };
    } catch (error) {
      console.error(`❌ Error processing ${filePath}:`, error.message);
      throw error;
    }
  }

  /**
   * Build complete processing context for template processor
   *
   * @returns {Object} Processing context with all dependencies
   */
  _buildProcessingContext() {
    return {
      businessName: this.templateVariables.business_name,
      templateVariables: this.templateVariables,
      buildConfig: this.buildConfig,
      runtimeVariables: this.runtimeVariables,
      clientDataVariables: this.clientDataVariables,
      corePrompt: this.promptInjector.getCorePrompt(),
      ragPrompt: this.promptInjector.getRAGPrompt(),
      services: this.config?.client_data?.services || [],
      webhookUrls: this.webhookUrls,
      webhookHashes: this.webhookHashes,
      webhookConfig: this.webhookGenerator.getDeploymentConfig().tools,
      transferPhoneNumber: this.buildConfig.infrastructure.transfer_phone_number
    };
  }

  /**
   * Optimize content based on file type
   *
   * @param {string} content - Processed content
   * @param {string} outputPath - Output file path
   * @returns {string} Optimized content
   */
  async _optimizeContent(content, outputPath) {
    const ext = path.extname(outputPath);

    try {
      // JSON files: minify for size reduction
      if (ext === ".json") {
        const parsed = JSON.parse(content);
        return JSON.stringify(parsed); // Minified JSON
      }

      // Markdown files: format with Prettier
      if (ext === ".md" && this.prettierConfig) {
        return await prettier.format(content, {
          ...this.prettierConfig,
          parser: "markdown"
        });
      }

      // CSV and other files: return as-is
      return content;
    } catch (error) {
      console.warn(
        `⚠️  Could not optimize ${path.basename(outputPath)}:`,
        error.message
      );
      return content;
    }
  }

  /**
   * Process template variables in filenames
   *
   * @param {string} filename - Filename with potential {{variable}} placeholders
   * @returns {string} Processed filename
   */
  processTemplateFilename(filename) {
    return this.templateProcessor.processFilename(
      filename,
      this.templateVariables
    );
  }

  /**
   * Recursively scan directory for processable files
   *
   * @param {string} dir - Directory to scan
   * @param {string} baseDir - Base directory for relative paths
   * @returns {Array} Array of file objects
   */
  async scanDirectory(dir, baseDir = "") {
    const files = [];

    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        const relativePath = path.join(baseDir, entry.name);

        if (entry.isDirectory()) {
          // Recursively scan subdirectories
          const subFiles = await this.scanDirectory(fullPath, relativePath);
          files.push(...subFiles);
        } else if (entry.isFile()) {
          // Process filename template variables
          const processedFilename = this.processTemplateFilename(entry.name);
          const processedRelativePath = path.join(
            path.dirname(relativePath),
            processedFilename
          );

          files.push({
            sourcePath: fullPath,
            relativePath: processedRelativePath,
            originalName: entry.name,
            processedName: processedFilename
          });
        }
      }
    } catch (error) {
      console.warn(`⚠️  Could not scan directory ${dir}:`, error.message);
    }

    return files;
  }

  /**
   * Process a single file entry with statistics tracking
   *
   * @param {Object} fileInfo - File information object
   * @param {Object} stats - Statistics object to update
   */
  async processFileEntry(fileInfo, stats) {
    const outputPath = path.join(this.distDir, fileInfo.relativePath);

    try {
      const result = await this.processFile(fileInfo.sourcePath, outputPath);

      stats.totalFiles++;
      stats.totalOriginalSize += result.originalSize;
      stats.totalProcessedSize += result.processedSize;

      // Track size reduction only for minified files
      if (result.reduction > 0) {
        stats.totalOriginalSizeForReduction =
          (stats.totalOriginalSizeForReduction || 0) + result.originalSize;
        stats.totalProcessedSizeForReduction =
          (stats.totalProcessedSizeForReduction || 0) + result.processedSize;
      }
    } catch (error) {
      console.error(`❌ Failed to process ${fileInfo.sourcePath}`);
      throw error;
    }
  }

  /**
   * Main build process
   *
   * Two-phase processing:
   * 1. Process prompt files first
   * 2. Load prompts from dist
   * 3. Process all other files with prompt injection
   *
   * @returns {Object} Build information with statistics
   */
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
    const promptFiles = allFiles.filter(f =>
      f.relativePath.includes("prompts/")
    );
    const otherFiles = allFiles.filter(
      f => !f.relativePath.includes("prompts/")
    );

    // Process prompt files
    for (const fileInfo of promptFiles) {
      await this.processFileEntry(fileInfo, stats);
    }

    // Load prompts from the processed files in dist
    if (promptFiles.length > 0) {
      await this.promptInjector.loadPrompts();
    }

    // Second phase: Process all other files with prompt injection
    for (const fileInfo of otherFiles) {
      await this.processFileEntry(fileInfo, stats);
    }

    // Token tracking phase: Analyze LLM-facing content
    const tokenTrackingEnabled =
      this.config?.build_config?.token_tracking?.enabled !== false;

    let tokenReport = null;
    if (tokenTrackingEnabled) {
      tokenReport = await this._analyzeTokenUsage();
    }

    // Create build info
    const buildInfo = {
      buildTime: new Date().toISOString(),
      version: require("./package.json").version || "1.0.0",
      stats: {
        totalFiles: stats.totalFiles,
        originalSize: `${(stats.totalOriginalSize / 1024).toFixed(2)} KB`,
        processedSize: `${(stats.totalProcessedSize / 1024).toFixed(2)} KB`,
        totalReduction: stats.totalOriginalSizeForReduction
          ? `${(
              ((stats.totalOriginalSizeForReduction -
                stats.totalProcessedSizeForReduction) /
                stats.totalOriginalSizeForReduction) *
              100
            ).toFixed(1)}%`
          : "0.0%",
        processingTime: `${Date.now() - stats.processingTime}ms`
      },
      token_usage: tokenReport
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

  /**
   * Analyze token usage across all LLM-facing content
   *
   * @returns {Promise<Object>} Token usage report
   */
  async _analyzeTokenUsage() {
    console.log("\n🔍 Analyzing token usage...");

    // Reset counter for fresh analysis
    this.tokenCounter.reset();

    try {
      // Find and analyze Retell agent
      const agentFiles = await this._findBuiltAgents();
      if (agentFiles.length > 0) {
        const agentPath = agentFiles[0].fullPath;
        const agentContent = await fs.readFile(agentPath, "utf-8");
        const agentConfig = JSON.parse(agentContent);

        // Count all agent components
        this.tokenCounter.countRetellAgent(agentConfig);
      }

      // Find and analyze knowledge bases
      const kbDir = path.join(this.distDir, "knowledge-base");
      try {
        const kbFiles = await fs.readdir(kbDir);
        for (const kbFile of kbFiles) {
          if (kbFile.endsWith(".md")) {
            const kbPath = path.join(kbDir, kbFile);
            const kbContent = await fs.readFile(kbPath, "utf-8");
            this.tokenCounter.countKnowledgeBase(kbContent, kbFile);
          }
        }
      } catch (error) {
        // Knowledge base directory might not exist
      }

      // Generate comprehensive report
      const report = this.tokenCounter.generateReport();

      // Display console summary
      const consoleSummary = this.tokenCounter.formatReportForConsole(report);
      console.log(consoleSummary);

      // Save detailed report to file
      await fs.writeFile(
        path.join(this.distDir, "token-usage-report.json"),
        JSON.stringify(report, null, 2)
      );

      console.log(
        `💾 Detailed token report saved to dist/token-usage-report.json`
      );

      return report;
    } catch (error) {
      console.warn("⚠️  Could not complete token analysis:", error.message);
      return null;
    }
  }

  /**
   * Find all built Retell agent JSON files
   *
   * @returns {Promise<Array>} Array of agent file objects
   */
  async _findBuiltAgents() {
    try {
      const files = await fs.readdir(this.distDir);
      return files
        .filter(f => f.includes("Retell Agent") && f.endsWith(".json"))
        .map(filename => ({
          filename,
          fullPath: path.join(this.distDir, filename)
        }));
    } catch (error) {
      return [];
    }
  }

  /**
   * Clean the output directory
   */
  async clean() {
    try {
      await fs.rm(this.distDir, { recursive: true, force: true });
      console.log("🧹 Cleaned dist directory");
    } catch (error) {
      console.log("🧹 No dist directory to clean");
    }
  }

  /**
   * Upload built workflows to n8n instance
   *
   * Note: This method contains the complete n8n integration logic from the original
   * implementation. Future refactoring could extract this to a separate N8nDeployer module.
   *
   * @param {Object} options - Upload configuration options
   * @returns {Promise<Object>} Upload results
   */
  async uploadWorkflowsToN8n(options = {}) {
    const webhookConfig = this.config?.build_config?.webhook_deployment;

    if (!webhookConfig?.enabled) {
      console.log("ℹ️  Webhook deployment disabled - skipping workflow upload");
      return { skipped: true, reason: "deployment_disabled" };
    }

    console.log(
      "🚀 Starting n8n workflow upload with unique webhook endpoints..."
    );

    try {
      // Validate configuration
      this._validateN8nConfiguration(webhookConfig);

      // Find built workflow files
      const workflowFiles = await this._findBuiltWorkflows();

      if (workflowFiles.length === 0) {
        console.log("⚠️  No workflow files found in dist directory");
        return {
          success: true,
          workflows: [],
          message: "No workflows to upload"
        };
      }

      // Process authentication
      const authConfig = await this._prepareN8nAuthentication(webhookConfig);

      // Validate credentials
      if (!authConfig.instanceUrl) {
        throw new Error("No n8n instance URL configured");
      }

      if (
        !authConfig.api_key &&
        !(authConfig.username && authConfig.password)
      ) {
        throw new Error("No n8n credentials configured");
      }

      console.log(`🎯 Targeting n8n instance: ${authConfig.instanceUrl}`);

      // Upload workflows with retry logic
      const uploadResults = await this._bulkUploadWorkflows(
        workflowFiles,
        webhookConfig,
        authConfig
      );

      console.log(
        `✅ Uploaded ${uploadResults.successful.length} workflows successfully`
      );
      if (uploadResults.failed.length > 0) {
        console.log(
          `❌ Failed to upload ${uploadResults.failed.length} workflows`
        );
        uploadResults.failed.forEach(failure => {
          console.log(`   ${failure.workflow}: ${failure.error}`);
        });
      }

      // Display webhook information
      if (this.webhookHashes && Object.keys(this.webhookHashes).length > 0) {
        console.log("\n🔗 Deployed webhook endpoints:");
        Object.entries(this.webhookUrls).forEach(([tool, url]) => {
          console.log(`   ${tool}: ${url}`);
        });
      }

      return {
        success: uploadResults.failed.length === 0,
        total: workflowFiles.length,
        successful: uploadResults.successful,
        failed: uploadResults.failed,
        webhookHashes: this.webhookHashes,
        message: `Uploaded ${uploadResults.successful.length}/${workflowFiles.length} workflows`
      };
    } catch (error) {
      console.error("❌ n8n workflow upload failed:", error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Validate n8n configuration
   *
   * @param {Object} webhookConfig - Webhook deployment configuration
   */
  _validateN8nConfiguration(webhookConfig) {
    if (!webhookConfig.instance_url) {
      throw new Error("n8n instance_url is required");
    }

    if (
      !webhookConfig.credentials?.api_key &&
      !webhookConfig.credentials?.email
    ) {
      throw new Error("n8n credentials are required");
    }

    // Validate URL format
    try {
      new URL(webhookConfig.instance_url);
    } catch {
      throw new Error("Invalid n8n instance_url format");
    }
  }

  /**
   * Find all built workflow JSON files
   *
   * @returns {Promise<Array>} Array of workflow file objects
   */
  async _findBuiltWorkflows() {
    const workflowsDir = path.join(this.distDir, "workflows");

    try {
      const files = await fs.readdir(workflowsDir);
      return files
        .filter(file => file.endsWith(".json"))
        .map(file => ({
          name: file,
          path: path.join(workflowsDir, file),
          workflowName: path.basename(file, ".json")
        }));
    } catch (error) {
      console.warn("⚠️  Could not read workflows directory:", error.message);
      return [];
    }
  }

  /**
   * Prepare authentication configuration for n8n CLI
   *
   * @param {Object} n8nConfig - n8n configuration
   * @returns {Promise<Object>} Processed authentication config
   */
  async _prepareN8nAuthentication(n8nConfig) {
    const authConfig = {
      instanceUrl: n8nConfig.instance_url,
      ...n8nConfig.credentials
    };

    // Process environment variable references
    Object.keys(authConfig).forEach(key => {
      if (typeof authConfig[key] === "string") {
        if (authConfig[key].startsWith("env:")) {
          const envVar = authConfig[key].replace("env:", "");
          const value = process.env[envVar];
          if (!value) {
            throw new Error(`Environment variable ${envVar} is required`);
          }
          authConfig[key] = value;
        }
      }
    });

    return authConfig;
  }

  /**
   * Upload multiple workflows with retry logic
   *
   * @param {Array} workflowFiles - Array of workflow file objects
   * @param {Object} n8nConfig - n8n configuration
   * @param {Object} authConfig - Authentication configuration
   * @returns {Promise<Object>} Upload results
   */
  async _bulkUploadWorkflows(workflowFiles, n8nConfig, authConfig) {
    const results = {
      successful: [],
      failed: []
    };

    const { spawn } = require("child_process");

    for (const workflow of workflowFiles) {
      let attempts = 0;
      const maxAttempts = n8nConfig.cli_options?.retry_attempts || 3;
      let success = false;

      while (attempts < maxAttempts && !success) {
        attempts++;

        try {
          console.log(
            `📤 Uploading ${workflow.name} (attempt ${attempts}/${maxAttempts})`
          );

          await this._uploadSingleWorkflow(workflow, n8nConfig, authConfig);

          results.successful.push({
            name: workflow.name,
            workflowName: workflow.workflowName,
            attempts: attempts
          });

          success = true;
        } catch (error) {
          console.warn(
            `⚠️  Upload attempt ${attempts} failed: ${error.message}`
          );

          if (attempts === maxAttempts) {
            results.failed.push({
              name: workflow.name,
              workflowName: workflow.workflowName,
              error: error.message,
              attempts: attempts
            });
          } else {
            await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
          }
        }
      }
    }

    return results;
  }

  /**
   * Upload a single workflow file to n8n
   *
   * @param {Object} workflow - Workflow file object
   * @param {Object} n8nConfig - n8n configuration
   * @param {Object} authConfig - Authentication configuration
   * @returns {Promise<void>}
   */
  async _uploadSingleWorkflow(workflow, n8nConfig, authConfig) {
    const { spawn } = require("child_process");

    return new Promise((resolve, reject) => {
      const n8nCmd = process.platform === "win32" ? "n8n.cmd" : "n8n";
      const args = ["import:workflow", "--input", workflow.path];

      // Add authentication
      if (authConfig.api_key) {
        args.push("--apiKey", authConfig.api_key);
      } else if (authConfig.username && authConfig.password) {
        args.push("--username", authConfig.username);
        args.push("--password", authConfig.password);
      }

      if (authConfig.instanceUrl) {
        args.push("--url", authConfig.instanceUrl);
      }

      if (n8nConfig.deployment?.overwrite_existing) {
        args.push("--overwrite");
      }

      if (n8nConfig.deployment?.activate_workflows) {
        args.push("--activate");
      }

      const timeout = n8nConfig.cli_options?.timeout || 30000;
      const childProcess = spawn(n8nCmd, args, {
        stdio: ["ignore", "pipe", "pipe"],
        timeout: timeout
      });

      let output = "";
      let errorOutput = "";

      if (childProcess.stdout) {
        childProcess.stdout.on("data", data => {
          output += data.toString();
        });
      }

      if (childProcess.stderr) {
        childProcess.stderr.on("data", data => {
          errorOutput += data.toString();
        });
      }

      childProcess.on("close", code => {
        if (code === 0) {
          console.log(`✅ Successfully uploaded ${workflow.workflowName}`);
          resolve();
        } else {
          reject(
            new Error(
              `n8n CLI failed with code ${code}: ${errorOutput || output}`
            )
          );
        }
      });

      childProcess.on("error", error => {
        reject(new Error(`Failed to start n8n CLI: ${error.message}`));
      });
    });
  }
}

// ============================================================================
// COMMAND LINE INTERFACE
// ============================================================================

/**
 * Main CLI entry point for the build system
 *
 * USAGE:
 * node build.js build    # Build optimized files
 * node build.js clean    # Clean dist directory
 * node build.js rebuild  # Clean and build
 * node build.js upload   # Upload workflows to n8n
 * node build.js deploy   # Build and upload
 */
async function main() {
  const builder = new AIVoiceBuilder();
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
    case "upload":
      const uploadResult = await builder.uploadWorkflowsToN8n();
      if (!uploadResult.success && !uploadResult.skipped) {
        process.exit(1);
      }
      break;
    case "deploy":
      await builder.clean();
      await builder.build();
      const deployResult = await builder.uploadWorkflowsToN8n();
      if (!deployResult.success && !deployResult.skipped) {
        process.exit(1);
      }
      break;
    default:
      console.log("Available commands:");
      console.log("  npm run build     - Build optimized files");
      console.log("  npm run clean     - Clean dist directory");
      console.log("  npm run rebuild   - Clean and build");
      console.log("  npm run upload    - Upload workflows to n8n");
      console.log("  npm run deploy    - Build and upload to n8n");
  }
}

// Entry point
if (require.main === module) {
  main().catch(console.error);
}

// Export for programmatic usage
module.exports = AIVoiceBuilder;
