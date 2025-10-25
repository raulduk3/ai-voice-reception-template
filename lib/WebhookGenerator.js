const crypto = require("crypto");

/**
 * Webhook Generator Module
 *
 * Responsible for generating unique webhook URLs with hash identifiers
 * for n8n workflow deployment. Creates consistent, collision-resistant
 * endpoint names based on business name and tool name.
 *
 * KEY RESPONSIBILITIES:
 * - Generate unique hash identifiers for webhook endpoints
 * - Build complete webhook URLs with base URL and hash
 * - Manage webhook configuration for multiple tools
 * - Ensure deployment uniqueness across multiple instances
 *
 * INTERFACE:
 * - generateWebhookHashes(businessName, tools): Generate hashes for all tools
 * - buildWebhookUrls(baseUrl, tools, hashes): Build complete URLs
 * - generateSingleHash(businessName, toolName): Generate hash for one tool
 * - getWebhookConfig(toolName): Get config for specific tool
 */
class WebhookGenerator {
  constructor(config = {}) {
    this.config = config;
    this.baseWebhookUrl = config.base_webhook_url || "https://example.com";
    this.hashAlgorithm = config.hash_algorithm || "sha256";
    this.hashLength = config.hash_length || 8;
    this.tools = config.tools || {};
    this.businessName = config.business_name || "Default Business";

    this.generatedHashes = {};
    this.generatedUrls = {};
  }

  /**
   * Initialize with configuration
   *
   * @param {Object} config - Webhook configuration from build config
   */
  initialize(config) {
    this.config = config || {};
    this.baseWebhookUrl = config.base_webhook_url || this.baseWebhookUrl;
    this.hashAlgorithm = config.hash_algorithm || this.hashAlgorithm;
    this.hashLength = config.hash_length || this.hashLength;
    this.tools = config.tools || this.tools;
    this.businessName = config.business_name || this.businessName;
  }

  /**
   * Generate unique hash identifiers for webhook endpoints
   *
   * Creates unique hash suffixes for each tool to ensure n8n can deploy multiple
   * workflows with unique webhook endpoints. Hash is based on business name + tool name
   * for consistent generation across builds while maintaining uniqueness.
   *
   * @param {string} businessName - Business name for hash uniqueness
   * @param {Object} tools - Tools configuration object
   * @returns {Object} Object mapping tool names to their hash identifiers
   */
  generateWebhookHashes(businessName = this.businessName, tools = this.tools) {
    const hashes = {};

    for (const [toolName, toolConfig] of Object.entries(tools)) {
      hashes[toolName] = this.generateSingleHash(businessName, toolName);
    }

    this.generatedHashes = hashes;
    return hashes;
  }

  /**
   * Generate hash for a single tool
   *
   * @param {string} businessName - Business name for uniqueness
   * @param {string} toolName - Tool name
   * @returns {string} Generated hash identifier
   */
  generateSingleHash(businessName, toolName) {
    // Create hash based on business name + tool name for uniqueness
    const hashInput = `${businessName}-${toolName}`;
    const hash = crypto
      .createHash(this.hashAlgorithm)
      .update(hashInput)
      .digest("hex")
      .substring(0, this.hashLength);

    return hash;
  }

  /**
   * Build webhook URLs for tools with hash generation
   *
   * Creates the final webhook URLs that will be used in Retell agent tool schemas
   * and n8n webhook nodes. URLs include unique hash suffixes for deployment uniqueness.
   *
   * @param {string} baseUrl - Base webhook URL
   * @param {Object} tools - Tools configuration
   * @param {Object} hashes - Pre-generated hashes (optional)
   * @returns {Object} Object mapping tool names to their complete webhook URLs
   */
  buildWebhookUrls(
    baseUrl = this.baseWebhookUrl,
    tools = this.tools,
    hashes = null
  ) {
    // Generate hashes if not provided
    if (!hashes) {
      hashes = this.generateWebhookHashes(this.businessName, tools);
    }

    const urls = {};

    for (const [toolName, toolConfig] of Object.entries(tools)) {
      const endpointBase = toolConfig.endpoint_base || toolName.toLowerCase();
      const hash = hashes[toolName];

      // Build URL: https://base-url/webhook/endpoint-base-hash
      urls[toolName] = `${baseUrl}/webhook/${endpointBase}-${hash}`;
    }

    this.generatedUrls = urls;
    return urls;
  }

  /**
   * Get webhook configuration for a specific tool
   *
   * @param {string} toolName - Name of the tool
   * @returns {Object} Webhook configuration object
   */
  getWebhookConfig(toolName) {
    return {
      url: this.generatedUrls[toolName] || null,
      hash: this.generatedHashes[toolName] || null,
      endpoint_base:
        this.tools[toolName]?.endpoint_base || toolName.toLowerCase(),
      description: this.tools[toolName]?.description || ""
    };
  }

  /**
   * Get all generated webhook URLs
   *
   * @returns {Object} Object mapping tool names to URLs
   */
  getAllUrls() {
    return { ...this.generatedUrls };
  }

  /**
   * Get all generated hashes
   *
   * @returns {Object} Object mapping tool names to hashes
   */
  getAllHashes() {
    return { ...this.generatedHashes };
  }

  /**
   * Generate complete webhook configuration for deployment
   *
   * @returns {Object} Complete webhook configuration
   */
  getDeploymentConfig() {
    return {
      base_url: this.baseWebhookUrl,
      hash_algorithm: this.hashAlgorithm,
      hash_length: this.hashLength,
      business_name: this.businessName,
      tools: Object.keys(this.tools).reduce((acc, toolName) => {
        acc[toolName] = this.getWebhookConfig(toolName);
        return acc;
      }, {})
    };
  }
}

module.exports = WebhookGenerator;
