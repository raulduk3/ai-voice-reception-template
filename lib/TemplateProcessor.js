/**
 * Template Processor Module
 *
 * Orchestrates template processing across different file types, coordinating
 * specialized processors for Retell agents, n8n workflows, prompts, and content files.
 *
 * KEY RESPONSIBILITIES:
 * - Route files to appropriate processors based on type and path
 * - Coordinate dependencies between processors (prompts, variables, configs)
 * - Apply template variable replacement to content files
 * - Preserve {{variables}} in prompt files for Retell runtime processing
 * - Process filenames with template variables
 *
 * INTERFACE:
 * - processFile(filePath, content, context): Process file content
 * - processFilename(filename, variables): Process filename templates
 * - shouldPreserveVariables(filePath): Check if variables should be preserved
 */

class TemplateProcessor {
  constructor() {
    this.retellAgentProcessor = null;
    this.n8nWorkflowProcessor = null;
    this.allVariables = {};
  }

  /**
   * Initialize with processor dependencies
   *
   * @param {Object} processors - Object containing all specialized processors
   * @param {Object} allVariables - Merged template and client data variables
   */
  initialize(processors, allVariables) {
    this.retellAgentProcessor = processors.retellAgentProcessor;
    this.n8nWorkflowProcessor = processors.n8nWorkflowProcessor;
    this.allVariables = allVariables || {};
  }

  /**
   * Process file content using file-type specific strategies
   *
   * This is the central routing method for template processing. It determines
   * the appropriate processing strategy based on file type and path:
   *
   * FILE PROCESSING STRATEGIES:
   * - Retell Agent JSON: Complex multi-phase processing with prompt injection
   * - n8n Workflows: Template replacement + prompt injection + service config
   * - Prompt files: Preserve {{variables}} for Retell runtime processing
   * - Content files: Full template variable replacement (knowledge base, CSV, tests)
   *
   * @param {string} filePath - File path (determines processing strategy)
   * @param {string} content - File content to process
   * @param {Object} context - Processing context with all dependencies
   * @returns {string} Processed content
   */
  processFile(filePath, content, context) {
    const fileName = filePath.split(/[/\\]/).pop();
    const fileExt = fileName.split(".").pop();

    // Determine if this is a Retell agent file
    if (this._isRetellAgent(filePath, fileName)) {
      if (!this.retellAgentProcessor) {
        console.warn("⚠️  RetellAgentProcessor not initialized");
        return this._applyTemplateVariables(content);
      }
      return this.retellAgentProcessor.processAgent(content, context);
    }

    // Determine if this is an n8n workflow file
    if (this._isN8nWorkflow(filePath, fileName)) {
      if (!this.n8nWorkflowProcessor) {
        console.warn("⚠️  N8nWorkflowProcessor not initialized");
        return this._applyTemplateVariables(content);
      }

      const workflowName = fileName.replace(".json", "");
      return this.n8nWorkflowProcessor.processWorkflow(
        content,
        workflowName,
        context
      );
    }

    // Determine if this is a prompt file (preserve {{variables}})
    if (this._isPromptFile(filePath)) {
      // Prompt files: preserve most {{variables}} for Retell runtime processing
      // But inject SERVICE_PROPERTIES_GUIDE at build time since it's generated from config
      let processed = content;

      if (
        context.clientDataVariables &&
        context.clientDataVariables.SERVICE_PROPERTIES_GUIDE
      ) {
        const regex = new RegExp(`\\{\\{SERVICE_PROPERTIES_GUIDE\\}\\}`, "g");
        processed = processed.replace(
          regex,
          context.clientDataVariables.SERVICE_PROPERTIES_GUIDE
        );
      }

      return processed;
    }

    // All other files: apply template variable replacement
    return this._applyTemplateVariables(content);
  }

  /**
   * Check if file is a Retell agent configuration
   *
   * @param {string} filePath - Full file path
   * @param {string} fileName - File name only
   * @returns {boolean} True if Retell agent file
   */
  _isRetellAgent(filePath, fileName) {
    return (
      fileName.includes("Retell Agent.json") ||
      fileName.includes("- Retell Agent.json") ||
      filePath.includes("Retell Agent.json")
    );
  }

  /**
   * Check if file is an n8n workflow
   *
   * @param {string} filePath - Full file path
   * @param {string} fileName - File name only
   * @returns {boolean} True if n8n workflow file
   */
  _isN8nWorkflow(filePath, fileName) {
    return filePath.includes("workflows/") && fileName.endsWith(".json");
  }

  /**
   * Check if file is a prompt file that should preserve variables
   *
   * @param {string} filePath - Full file path
   * @returns {boolean} True if prompt file
   */
  _isPromptFile(filePath) {
    return filePath.includes("prompts/") && filePath.endsWith(".md");
  }

  /**
   * Apply template variable replacement to content
   *
   * Replaces all {{variable}} patterns with actual values from the combined
   * template and client data variables.
   *
   * @param {string} content - Content to process
   * @returns {string} Processed content with variables replaced
   */
  _applyTemplateVariables(content) {
    let processed = content;

    for (const [key, value] of Object.entries(this.allVariables)) {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, "g");
      processed = processed.replace(regex, String(value));
    }

    return processed;
  }

  /**
   * Process template variables in filenames
   *
   * Replaces {{variable}} placeholders in filenames with actual values from
   * template variables. This enables dynamic file naming based on business
   * configuration (e.g., "{{business_name}} Core Prompt.md").
   *
   * @param {string} filename - Filename with potential {{variable}} placeholders
   * @param {Object} variables - Template variables object (optional, uses allVariables if not provided)
   * @returns {string} Processed filename with variables replaced
   */
  processFilename(filename, variables = null) {
    let processedFilename = filename;
    const varsToUse = variables || this.allVariables;

    for (const [key, value] of Object.entries(varsToUse)) {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, "g");
      processedFilename = processedFilename.replace(regex, String(value));
    }

    return processedFilename;
  }

  /**
   * Check if a file should preserve {{variables}} in its content
   *
   * @param {string} filePath - Full file path
   * @returns {boolean} True if variables should be preserved
   */
  shouldPreserveVariables(filePath) {
    return this._isPromptFile(filePath);
  }

  /**
   * Get appropriate context for file processing
   *
   * Different file types need different context. This method builds the
   * appropriate context object for a given file type.
   *
   * @param {string} filePath - File path to determine context needs
   * @param {Object} fullContext - Complete context with all available data
   * @returns {Object} Filtered context appropriate for file type
   */
  getContextForFile(filePath, fullContext) {
    const fileName = filePath.split(/[/\\]/).pop();

    // Retell agent needs everything
    if (this._isRetellAgent(filePath, fileName)) {
      return fullContext;
    }

    // n8n workflows need specific context
    if (this._isN8nWorkflow(filePath, fileName)) {
      return {
        businessName: fullContext.businessName,
        templateVariables: fullContext.templateVariables,
        ragPrompt: fullContext.ragPrompt,
        services: fullContext.services,
        webhookConfig: fullContext.webhookConfig
      };
    }

    // Prompt files need minimal context (variables preserved)
    if (this._isPromptFile(filePath)) {
      return {
        templateVariables: fullContext.templateVariables
      };
    }

    // Content files need template and client data variables
    return {
      templateVariables: fullContext.templateVariables,
      clientDataVariables: fullContext.clientDataVariables
    };
  }
}

module.exports = TemplateProcessor;
