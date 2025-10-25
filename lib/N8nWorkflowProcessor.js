/**
 * N8n Workflow Processor Module
 *
 * Responsible for processing n8n workflow JSON files with specialized handling
 * for different workflow types. Manages prompt injection, service configuration,
 * webhook hash updates, and template variable replacement.
 *
 * KEY RESPONSIBILITIES:
 * - Process answerQuestion workflow with RAG prompt injection
 * - Inject service configurations into service-dependent workflows
 * - Update webhook nodes with unique hash identifiers
 * - Apply template variable replacement throughout workflows
 * - Update service mappings and validation rules
 *
 * INTERFACE:
 * - processWorkflow(content, workflowName, context): Process workflow JSON
 * - injectServiceConfiguration(workflow, workflowName): Inject service config
 * - updateWebhookNodes(workflow, workflowName, webhookConfig): Update webhooks
 * - applyTemplateVariables(content, variables): Replace template vars
 */
class N8nWorkflowProcessor {
  constructor() {
    this.serviceDependentWorkflows = [
      "bookAppointment",
      "modifyAppointment",
      "cancelAppointment",
      "identifyAppointment"
    ];
    this.workflowToToolMapping = {
      bookAppointment: "bookAppointment",
      answerQuestion: "answerQuestion",
      logLead: "logLead",
      identifyAppointment: "identifyAppointment",
      modifyAppointment: "modifyAppointment",
      cancelAppointment: "cancelAppointment",
      dayAndTime: "dayAndTime"
    };
  }

  /**
   * Process n8n workflow template with all required injections
   *
   * @param {string} content - Raw n8n workflow JSON content
   * @param {string} workflowName - Name of the workflow file (without extension)
   * @param {Object} context - Processing context with all dependencies
   * @returns {string} Processed workflow JSON
   */
  processWorkflow(content, workflowName, context) {
    try {
      const jsonData = JSON.parse(content);

      // Add workflow name if missing (required for n8n import)
      if (!jsonData.name) {
        const displayName = this._formatWorkflowName(workflowName);
        jsonData.name = `${context.businessName} - ${displayName}`;
      }

      // Add active status if missing (required for n8n import)
      if (jsonData.active === undefined) {
        jsonData.active = true;
      }

      // Handle answerQuestion workflow (RAG prompt injection)
      if (workflowName === "answerQuestion" && context.ragPrompt) {
        this._injectRAGPrompt(
          jsonData,
          context.ragPrompt,
          context.templateVariables
        );
      }

      // Handle service-dependent workflows (configuration injection)
      if (this._isServiceDependentWorkflow(workflowName) && context.services) {
        this.injectServiceConfiguration(
          jsonData,
          workflowName,
          context.services
        );
      }

      // Inject webhook hash identifiers into webhook nodes
      if (context.webhookConfig) {
        this.updateWebhookNodes(jsonData, workflowName, context.webhookConfig);
      }

      // Apply template variables to all workflow content
      let processedContent = JSON.stringify(jsonData, null, 2);
      if (context.templateVariables) {
        processedContent = this.applyTemplateVariables(
          processedContent,
          context.templateVariables
        );
      }

      return processedContent;
    } catch (error) {
      console.warn(
        `⚠️  Could not parse n8n workflow JSON for ${workflowName}:`,
        error.message
      );
      return content;
    }
  }

  /**
   * Format workflow name for display
   *
   * @param {string} workflowName - Camelcase workflow name
   * @returns {string} Formatted display name
   */
  _formatWorkflowName(workflowName) {
    return workflowName
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, str => str.toUpperCase())
      .trim();
  }

  /**
   * Check if a workflow depends on service configuration
   *
   * @param {string} workflowName - Name of the workflow
   * @returns {boolean} True if workflow needs service configuration injection
   */
  _isServiceDependentWorkflow(workflowName) {
    return this.serviceDependentWorkflows.includes(workflowName);
  }

  /**
   * Inject RAG prompt into answerQuestion workflow
   *
   * @param {Object} jsonData - Parsed workflow JSON
   * @param {string} ragPrompt - RAG prompt content
   * @param {Object} templateVariables - Template variables for replacement
   */
  _injectRAGPrompt(jsonData, ragPrompt, templateVariables) {
    if (!ragPrompt || !jsonData.nodes) return;

    // Apply template variables to the RAG prompt content
    let processedPrompt = ragPrompt;
    if (templateVariables) {
      processedPrompt = this.applyTemplateVariables(
        processedPrompt,
        templateVariables
      );
    }

    // Find and update the Answer Agent node
    jsonData.nodes.forEach(node => {
      if (
        node.name === "Answer Agent" &&
        node.type === "@n8n/n8n-nodes-langchain.agent" &&
        node.parameters?.options?.systemMessage !== undefined
      ) {
        node.parameters.options.systemMessage = processedPrompt;
        console.log("✅ RAG prompt injected into answerQuestion workflow");
      }
    });
  }

  /**
   * Inject service configuration into workflow nodes
   *
   * Replaces hardcoded service mappings and validation rules with
   * configuration derived from config.json services array.
   *
   * @param {Object} jsonData - Parsed workflow JSON
   * @param {string} workflowName - Name of the workflow
   * @param {Array} services - Services array from config
   */
  injectServiceConfiguration(jsonData, workflowName, services) {
    if (!jsonData.nodes || !services || services.length === 0) {
      console.warn(
        `⚠️  No services or nodes found for ${workflowName} service injection`
      );
      return;
    }

    // Generate service configuration from services array
    const serviceConfig = this._generateWorkflowServiceConfig(services);

    // Inject configuration into relevant nodes
    jsonData.nodes.forEach(node => {
      if (node.parameters?.jsCode) {
        node.parameters.jsCode = this._updateNodeServiceConfiguration(
          node.parameters.jsCode,
          serviceConfig,
          workflowName
        );
      }
    });

    console.log(
      `✅ Injected service configuration for ${workflowName} workflow`
    );
  }

  /**
   * Generate service configuration object for workflow injection
   *
   * @param {Array} services - Services array from config
   * @returns {Object} Service configuration including mappings and validation rules
   */
  _generateWorkflowServiceConfig(services) {
    if (!services || services.length === 0) {
      return { serviceMapping: {}, requiredProperties: {}, columnMapping: {} };
    }

    const serviceMapping = {};
    const requiredProperties = {};
    const columnMapping = {};

    services.forEach(service => {
      // Service slug to display name mapping
      serviceMapping[service.slug] = service.name;

      // Required properties for validation
      if (service.properties?.required) {
        requiredProperties[service.slug] = service.properties.required.map(
          prop => prop.name
        );
      }

      // CSV column mapping for service properties
      if (service.properties?.required || service.properties?.optional) {
        const allProps = [
          ...(service.properties.required || []),
          ...(service.properties.optional || [])
        ];

        columnMapping[service.slug] = {};
        allProps.forEach(prop => {
          const columnName = `${service.name} - ${this._formatPropertyName(prop.name)}`;
          columnMapping[service.slug][prop.name] = columnName;
        });
      }
    });

    return {
      serviceMapping,
      requiredProperties,
      columnMapping,
      reverseColumnMapping: this._generateReverseColumnMapping(columnMapping)
    };
  }

  /**
   * Format property name for display
   *
   * @param {string} propertyName - Snake_case property name
   * @returns {string} Formatted display name
   */
  _formatPropertyName(propertyName) {
    return propertyName
      .split("_")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  /**
   * Generate reverse column mapping for parsing service properties from CSV data
   *
   * @param {Object} columnMapping - Forward mapping from service -> properties -> column names
   * @returns {Object} Reverse mapping from column names -> service and property info
   */
  _generateReverseColumnMapping(columnMapping) {
    const reverseMapping = {};

    Object.entries(columnMapping).forEach(([serviceSlug, properties]) => {
      Object.entries(properties).forEach(([propertyKey, columnName]) => {
        reverseMapping[columnName] = {
          service: serviceSlug,
          property: propertyKey
        };
      });
    });

    return reverseMapping;
  }

  /**
   * Update JavaScript code in workflow nodes with service configuration
   *
   * @param {string} jsCode - Original JavaScript code from node
   * @param {Object} serviceConfig - Generated service configuration
   * @param {string} workflowName - Name of the workflow
   * @returns {string} Updated JavaScript code with injected configuration
   */
  _updateNodeServiceConfiguration(jsCode, serviceConfig, workflowName) {
    let updatedCode = jsCode;

    // Replace template placeholders with actual service configuration
    const replacements = {
      "{{SERVICE_MAPPING}}": serviceConfig.serviceMapping,
      "{{REQUIRED_PROPERTIES}}": serviceConfig.requiredProperties,
      "{{COLUMN_MAPPING}}": serviceConfig.columnMapping,
      "{{REVERSE_COLUMN_MAPPING}}": serviceConfig.reverseColumnMapping
    };

    for (const [placeholder, value] of Object.entries(replacements)) {
      const regex = new RegExp(placeholder.replace(/[{}]/g, "\\$&"), "g");
      updatedCode = updatedCode.replace(regex, JSON.stringify(value, null, 2));
    }

    // Legacy support: Replace hardcoded patterns
    updatedCode = this._replaceLegacyPatterns(updatedCode, serviceConfig);

    return updatedCode;
  }

  /**
   * Replace legacy hardcoded patterns in workflow code
   *
   * @param {string} code - JavaScript code
   * @param {Object} serviceConfig - Service configuration
   * @returns {string} Updated code
   */
  _replaceLegacyPatterns(code, serviceConfig) {
    let updatedCode = code;

    // Legacy patterns to replace
    const patterns = [
      {
        pattern: /const serviceMapping = \{[^}]+\};/s,
        replacement: `const serviceMapping = ${JSON.stringify(serviceConfig.serviceMapping, null, 2)};`
      },
      {
        pattern: /const requiredProperties = \{[^}]+\};/s,
        replacement: `const requiredProperties = ${JSON.stringify(serviceConfig.requiredProperties, null, 2)};`
      },
      {
        pattern: /const columnMapping = \{[^}]+\};/s,
        replacement: `const columnMapping = ${JSON.stringify(serviceConfig.columnMapping, null, 2)};`
      }
    ];

    patterns.forEach(({ pattern, replacement }) => {
      if (pattern.test(updatedCode)) {
        updatedCode = updatedCode.replace(pattern, replacement);
      }
    });

    return updatedCode;
  }

  /**
   * Update webhook nodes with unique hash identifiers
   *
   * @param {Object} jsonData - Parsed n8n workflow JSON
   * @param {string} workflowName - Name of the workflow being processed
   * @param {Object} webhookConfig - Webhook configuration with URLs and hashes
   */
  updateWebhookNodes(jsonData, workflowName, webhookConfig) {
    if (!jsonData.nodes || !webhookConfig) return;

    const toolName = this.workflowToToolMapping[workflowName];
    if (!toolName) return;

    const toolConfig = webhookConfig[toolName];
    if (!toolConfig) {
      console.warn(`⚠️  No webhook config found for workflow: ${workflowName}`);
      return;
    }

    // Find and update webhook node(s)
    jsonData.nodes.forEach(node => {
      if (node.type === "webhook" || node.type === "n8n-nodes-base.webhook") {
        if (node.parameters) {
          // Extract path from URL (everything after /webhook/)
          const urlPath = toolConfig.url.split("/webhook/")[1];
          if (urlPath) {
            node.parameters.path = urlPath;
            console.log(
              `🔗 Updated webhook path for ${workflowName}: ${urlPath}`
            );
          }
        }

        // Update webhook name for clarity and fix connections
        if (node.name && toolConfig.hash) {
          const hashPrefix = toolConfig.hash.substring(0, 4);
          if (!node.name.includes(hashPrefix)) {
            const oldName = node.name;
            const newName = `${node.name} (${hashPrefix})`;
            node.name = newName;
            
            // Update connections to reference the new node name
            if (jsonData.connections && jsonData.connections[oldName]) {
              jsonData.connections[newName] = jsonData.connections[oldName];
              delete jsonData.connections[oldName];
              console.log(
                `🔗 Updated connections for renamed node: ${oldName} → ${newName}`
              );
            }
          }
        }
      }
    });
  }

  /**
   * Apply template variable replacement to content
   *
   * @param {string} content - Content to process
   * @param {Object} variables - Template variables object
   * @returns {string} Processed content
   */
  applyTemplateVariables(content, variables) {
    let processed = content;
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, "g");
      processed = processed.replace(regex, String(value));
    }
    return processed;
  }
}

module.exports = N8nWorkflowProcessor;
