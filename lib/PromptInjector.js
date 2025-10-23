const fs = require("fs").promises;
const path = require("path");

/**
 * Prompt Injector Module
 *
 * Responsible for loading, processing, and injecting markdown prompts
 * into Retell agent configurations and n8n workflow nodes.
 *
 * KEY RESPONSIBILITIES:
 * - Load prompt files from dist directory (after templating)
 * - Preserve {{variables}} syntax for Retell runtime processing
 * - Inject core prompt into Retell agent's global_prompt field
 * - Inject RAG prompt into answerQuestion workflow's system message
 * - Validate prompt content and structure
 *
 * INTERFACE:
 * - loadPrompts(distDir): Load all processed prompts from dist
 * - getCorePrompt(): Get core prompt content
 * - getRAGPrompt(): Get RAG prompt content
 * - injectIntoRetellAgent(agentJson): Inject core prompt into agent
 * - injectIntoN8nWorkflow(workflowJson): Inject RAG prompt into workflow
 */
class PromptInjector {
  constructor(distDir = "dist") {
    this.distDir = distDir;
    this.corePrompt = null;
    this.ragPrompt = null;
    this.businessName = "Business"; // Updated during initialization
  }

  /**
   * Initialize with business name for prompt file discovery
   *
   * @param {string} businessName - Business name from config
   * @param {string} distDir - Distribution directory path
   */
  initialize(businessName, distDir = this.distDir) {
    this.businessName = businessName;
    this.distDir = distDir;
  }

  /**
   * Load processed prompts from dist directory for injection into configurations
   *
   * This method loads the already-processed prompt files from the dist directory
   * after they have been templated and prepared for injection into:
   * - Core Prompt: Injected into Retell agent's global_prompt
   * - RAG Prompt: Injected into answerQuestion n8n workflow's system message
   *
   * Note: Prompts are loaded from dist (not src) because they need to be processed
   * with template variables before injection into other configurations.
   *
   * @param {string} distDir - Distribution directory path
   * @returns {Object} Object with corePrompt and ragPrompt properties
   */
  async loadPrompts(distDir = this.distDir) {
    try {
      // Core prompt file pattern: "{business_name} Core Prompt.md"
      const corePromptPath = path.join(
        distDir,
        "prompts",
        `${this.businessName} Core Prompt.md`
      );

      // RAG prompt file pattern: "{business_name} Answer Question - RAG Agent Prompt.md"
      const ragPromptPath = path.join(
        distDir,
        "prompts",
        `${this.businessName} Answer Question - RAG Agent Prompt.md`
      );

      // Load prompts
      this.corePrompt = await this._loadPromptFile(
        corePromptPath,
        "Core Prompt"
      );
      this.ragPrompt = await this._loadPromptFile(ragPromptPath, "RAG Prompt");

      console.log("✅ Prompts loaded successfully");
      console.log(`   Core Prompt: ${this.corePrompt.length} characters`);
      console.log(`   RAG Prompt: ${this.ragPrompt.length} characters`);

      return {
        corePrompt: this.corePrompt,
        ragPrompt: this.ragPrompt
      };
    } catch (error) {
      console.warn(`⚠️  Failed to load prompts: ${error.message}`);
      console.warn("   Continuing without prompt injection...");
      return {
        corePrompt: null,
        ragPrompt: null
      };
    }
  }

  /**
   * Load a single prompt file with error handling
   *
   * @param {string} filePath - Path to prompt file
   * @param {string} promptName - Name for logging
   * @returns {string} Prompt content
   */
  async _loadPromptFile(filePath, promptName) {
    try {
      const content = await fs.readFile(filePath, "utf-8");

      if (!content || content.trim().length === 0) {
        throw new Error(`${promptName} file is empty`);
      }

      return content.trim();
    } catch (error) {
      throw new Error(
        `Failed to load ${promptName} from ${filePath}: ${error.message}`
      );
    }
  }

  /**
   * Get loaded core prompt content
   *
   * @returns {string|null} Core prompt content or null if not loaded
   */
  getCorePrompt() {
    return this.corePrompt;
  }

  /**
   * Get loaded RAG prompt content
   *
   * @returns {string|null} RAG prompt content or null if not loaded
   */
  getRAGPrompt() {
    return this.ragPrompt;
  }

  /**
   * Inject core prompt into Retell agent JSON
   *
   * Updates the global_prompt field in the Retell agent configuration.
   * Preserves {{variables}} syntax for Retell runtime processing.
   *
   * @param {Object} agentJson - Parsed Retell agent JSON
   * @returns {Object} Updated agent JSON
   */
  injectIntoRetellAgent(agentJson) {
    if (!this.corePrompt) {
      console.warn(
        "⚠️  No core prompt loaded, skipping injection into Retell agent"
      );
      return agentJson;
    }

    if (!agentJson) {
      throw new Error("Agent JSON is null or undefined");
    }

    // Inject core prompt into global_prompt field
    agentJson.global_prompt = this.corePrompt;

    console.log("✅ Core prompt injected into Retell agent");

    return agentJson;
  }

  /**
   * Inject RAG prompt into answerQuestion n8n workflow
   *
   * Finds the "Answer Agent" node and updates its system message field.
   * This is specific to the answerQuestion workflow structure.
   *
   * @param {Object} workflowJson - Parsed n8n workflow JSON
   * @returns {Object} Updated workflow JSON
   */
  injectIntoN8nWorkflow(workflowJson) {
    if (!this.ragPrompt) {
      console.warn(
        "⚠️  No RAG prompt loaded, skipping injection into n8n workflow"
      );
      return workflowJson;
    }

    if (!workflowJson || !workflowJson.nodes) {
      throw new Error("Invalid n8n workflow JSON structure");
    }

    // Find Answer Agent node
    const answerAgentNode = workflowJson.nodes.find(
      node =>
        node.name === "Answer Agent" || node.type === "n8n-nodes-base.openAi"
    );

    if (!answerAgentNode) {
      console.warn(
        "⚠️  Answer Agent node not found in workflow, skipping RAG prompt injection"
      );
      return workflowJson;
    }

    // Inject RAG prompt into system message
    if (!answerAgentNode.parameters) {
      answerAgentNode.parameters = {};
    }
    if (!answerAgentNode.parameters.options) {
      answerAgentNode.parameters.options = {};
    }

    answerAgentNode.parameters.options.systemMessage = this.ragPrompt;

    console.log("✅ RAG prompt injected into answerQuestion workflow");

    return workflowJson;
  }

  /**
   * Check if prompts have been loaded
   *
   * @returns {boolean} True if both prompts are loaded
   */
  hasLoadedPrompts() {
    return this.corePrompt !== null && this.ragPrompt !== null;
  }

  /**
   * Validate that prompts meet minimum requirements
   *
   * @returns {Object} Validation result with status and messages
   */
  validatePrompts() {
    const issues = [];

    if (!this.corePrompt) {
      issues.push("Core prompt not loaded");
    } else if (this.corePrompt.length < 100) {
      issues.push("Core prompt is suspiciously short (< 100 characters)");
    }

    if (!this.ragPrompt) {
      issues.push("RAG prompt not loaded");
    } else if (this.ragPrompt.length < 100) {
      issues.push("RAG prompt is suspiciously short (< 100 characters)");
    }

    return {
      valid: issues.length === 0,
      issues: issues
    };
  }
}

module.exports = PromptInjector;
