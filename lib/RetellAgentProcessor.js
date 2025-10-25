/**
 * Retell Agent Processor Module
 *
 * Responsible for processing Retell agent JSON configurations with complex
 * multi-phase template processing, prompt injection, and service schema updates.
 *
 * KEY RESPONSIBILITIES:
 * - Apply build configuration (voice settings, version synchronization)
 * - Inject core prompt into global_prompt field
 * - Hydrate runtime variables into default_dynamic_variables
 * - Update infrastructure (webhooks, transfer numbers)
 * - Inject service schemas into booking tools
 * - Version management (semantic version to integer conversion)
 *
 * INTERFACE:
 * - processAgent(content, context): Process Retell agent JSON
 * - updateToolWebhooks(agent, webhookUrls): Update tool webhook URLs
 * - updateTransferNodes(agent, transferNumber): Update transfer numbers
 * - injectServiceSchemas(agent, services, schemaEngine): Inject service types
 */
class RetellAgentProcessor {
  constructor() {
    this.serviceSchemaEngine = null;
  }

  /**
   * Initialize with service schema engine dependency
   *
   * @param {Object} serviceSchemaEngine - ServiceSchemaEngine instance
   */
  initialize(serviceSchemaEngine) {
    this.serviceSchemaEngine = serviceSchemaEngine;
  }

  /**
   * Process Retell Agent JSON with complex multi-phase template processing
   *
   * This method handles the most complex file processing in the build system,
   * applying all four configuration phases to the Retell agent JSON:
   *
   * PHASE 1: Apply Build Config (direct agent settings)
   * PHASE 2: Inject Prompts (with {{variables}} preserved)
   * PHASE 3: Hydrate Runtime Variables (for Retell dynamic_variables)
   * PHASE 4: Update Infrastructure (webhooks, transfer numbers, services)
   *
   * @param {string} content - Raw Retell agent JSON content
   * @param {Object} context - Processing context with all dependencies
   * @returns {string} Processed and formatted JSON
   */
  processAgent(content, context) {
    try {
      const jsonData = JSON.parse(content);

      // PHASE 1: Apply Build Config (direct agent settings)
      this._applyBuildConfig(
        jsonData,
        context.buildConfig,
        context.templateVariables
      );

      // PHASE 2: Inject Prompts (with {{variables}} preserved)
      this._injectCorePrompt(jsonData, context.corePrompt);

      // PHASE 3: Hydrate Runtime Variables (for Retell dynamic_variables)
      this._hydrateRuntimeVariables(jsonData, context.runtimeVariables);

      // PHASE 4: Update Infrastructure (webhooks, transfer numbers, services)
      this.updateToolWebhooks(
        jsonData,
        context.webhookUrls,
        context.webhookHashes
      );
      this.updateTransferNodes(jsonData, context.transferPhoneNumber);

      if (context.services && this.serviceSchemaEngine) {
        this.injectServiceSchemas(jsonData, context.services);
      }

      return JSON.stringify(jsonData, null, 2);
    } catch (error) {
      console.warn(
        "⚠️  Could not parse JSON for Retell agent processing:",
        error.message
      );
      return content;
    }
  }

  /**
   * PHASE 1: Apply Build Config (direct agent settings)
   *
   * @param {Object} jsonData - Parsed agent JSON
   * @param {Object} buildConfig - Build configuration settings
   * @param {Object} templateVariables - Template variables for version info
   */
  _applyBuildConfig(jsonData, buildConfig, templateVariables) {
    // Update agent name
    if (jsonData.agent_name !== undefined && templateVariables.agent_name) {
      jsonData.agent_name = templateVariables.agent_name;
    }

    // Inject project version from package.json
    this._updateVersion(
      jsonData,
      templateVariables.version,
      buildConfig.version_settings
    );

    // Apply voice settings from build_config
    if (buildConfig.voice_settings) {
      if (jsonData.voice_id !== undefined) {
        jsonData.voice_id = buildConfig.voice_settings.voice_id;
      }
      if (jsonData.max_call_duration_ms !== undefined) {
        jsonData.max_call_duration_ms =
          buildConfig.voice_settings.max_call_duration_ms;
      }
      if (jsonData.interruption_sensitivity !== undefined) {
        jsonData.interruption_sensitivity =
          buildConfig.voice_settings.interruption_sensitivity;
      }
    }
  }

  /**
   * Update version fields with semantic version conversion
   *
   * @param {Object} jsonData - Parsed agent JSON
   * @param {string} versionStr - Semantic version string (e.g., "1.2.3")
   * @param {Object} versionSettings - Version settings from build config
   */
  _updateVersion(jsonData, versionStr, versionSettings) {
    if (
      !versionStr ||
      (jsonData.version === undefined && jsonData.version_title === undefined)
    ) {
      return;
    }

    // Update version field (convert semantic version to integer for Retell compatibility)
    if (jsonData.version !== undefined) {
      // e.g., "1.2.3" -> 123, "2.0.1" -> 201
      const versionParts = versionStr.split(".").map(n => parseInt(n, 10) || 0);
      const versionInt =
        versionParts[0] * 100 + versionParts[1] * 10 + versionParts[2];
      jsonData.version = versionInt;
    }

    // Update version_title field (keep semantic version format with v prefix)
    if (jsonData.version_title !== undefined) {
      const titleSuffix =
        versionSettings?.version_title_suffix ||
        this._extractTitleSuffix(jsonData.version_title) ||
        "Demo";
      jsonData.version_title = `v${versionStr} ${titleSuffix}`;
    }

    console.log(
      `📦 Version injection: ${versionStr} -> ` +
        `version: ${jsonData.version || "unchanged"}, ` +
        `version_title: "${jsonData.version_title || "unchanged"}"`
    );
  }

  /**
   * Extract title suffix from existing version_title for backward compatibility
   *
   * @param {string} currentTitle - Current version title
   * @returns {string} Extracted suffix or empty string
   */
  _extractTitleSuffix(currentTitle) {
    if (!currentTitle) return "";
    return currentTitle.replace(/^v[\d.]+\s*/, "") || "";
  }

  /**
   * PHASE 2: Inject Core Prompt (with {{variables}} preserved)
   *
   * @param {Object} jsonData - Parsed agent JSON
   * @param {string} corePrompt - Core prompt content
   */
  _injectCorePrompt(jsonData, corePrompt) {
    if (!corePrompt) return;

    if (jsonData.conversationFlow?.global_prompt !== undefined) {
      jsonData.conversationFlow.global_prompt = corePrompt;
      console.log("✅ Core prompt injected into Retell agent");
    }
  }

  /**
   * PHASE 3: Hydrate Runtime Variables (for Retell dynamic_variables)
   *
   * @param {Object} jsonData - Parsed agent JSON
   * @param {Object} runtimeVariables - Runtime variables for conversation
   */
  _hydrateRuntimeVariables(jsonData, runtimeVariables) {
    if (!runtimeVariables) return;

    if (jsonData.conversationFlow?.default_dynamic_variables !== undefined) {
      jsonData.conversationFlow.default_dynamic_variables = {
        ...runtimeVariables
      };
      console.log("✅ Runtime variables hydrated into Retell agent");
    }
  }

  /**
   * Update webhook URLs for all custom tools in Retell agent
   *
   * @param {Object} jsonData - Parsed agent JSON
   * @param {Object} webhookUrls - Object mapping tool names to URLs
   * @param {Object} webhookHashes - Object mapping tool names to hash info
   */
  updateToolWebhooks(jsonData, webhookUrls, webhookHashes) {
    if (!jsonData.conversationFlow?.tools || !webhookUrls) return;

    const tools = jsonData.conversationFlow.tools;

    tools.forEach(tool => {
      if (tool.type === "custom" && tool.name) {
        const webhookUrl = webhookUrls[tool.name];
        if (webhookUrl) {
          tool.url = webhookUrl;
          console.log(
            `🔗 Updated webhook URL for tool ${tool.name}: ${tool.url}`
          );

          // Log hash info if available
          if (webhookHashes && webhookHashes[tool.name]) {
            console.log(`   Hash: ${webhookHashes[tool.name].hash}`);
          }
        } else {
          console.warn(`⚠️  No webhook URL found for tool: ${tool.name}`);
        }
      }
    });
  }

  /**
   * Update transfer call destination numbers in conversation nodes
   *
   * @param {Object} jsonData - Parsed agent JSON
   * @param {string} transferNumber - Transfer phone number
   */
  updateTransferNodes(jsonData, transferNumber) {
    if (!jsonData.conversationFlow?.nodes || !transferNumber) return;

    const nodes = jsonData.conversationFlow.nodes;

    nodes.forEach(node => {
      if (node.type === "transfer_call" && node.transfer_destination?.number) {
        node.transfer_destination.number = transferNumber;
        console.log(`📞 Updated transfer number: ${transferNumber}`);
      }
    });
  }

  /**
   * Inject dynamic service schemas into booking and modification tools
   *
   * Automatically generates comprehensive service-specific schemas for bookAppointment and
   * modifyAppointment tools based on configured services with dynamic properties.
   *
   * @param {Object} jsonData - Parsed agent JSON
   * @param {Array} services - Services array from config
   */
  injectServiceSchemas(jsonData, services) {
    if (
      !jsonData.conversationFlow?.tools ||
      !services ||
      services.length === 0
    ) {
      return;
    }

    if (!this.serviceSchemaEngine) {
      console.warn(
        "⚠️  ServiceSchemaEngine not initialized, skipping service schema injection"
      );
      return;
    }

    const tools = jsonData.conversationFlow.tools;
    let updatedCount = 0;

    // Update bookAppointment tool
    const bookAppointmentTool = tools.find(
      tool => tool.name === "bookAppointment"
    );
    if (bookAppointmentTool?.parameters) {
      const dynamicSchema =
        this.serviceSchemaEngine.buildAppointmentFunctionSchema(services);
      bookAppointmentTool.parameters = dynamicSchema;
      updatedCount++;
      console.log(
        `✅ Generated dynamic schema for bookAppointment with ${services.length} services`
      );
    }

    // Update modifyAppointment tool
    const modifyAppointmentTool = tools.find(
      tool => tool.name === "modifyAppointment"
    );
    if (modifyAppointmentTool?.parameters) {
      const updatesSchema =
        this.serviceSchemaEngine.buildModifyAppointmentFunctionSchema(services);

      // Wrap in modifyAppointment structure
      const modifySchema = {
        type: "object",
        properties: {
          appointment_id: {
            type: "string",
            description: "Unique identifier for the appointment to modify"
          },
          updates: updatesSchema
        },
        required: ["appointment_id", "updates"]
      };

      modifyAppointmentTool.parameters = modifySchema;
      updatedCount++;
      console.log(
        `✅ Generated dynamic schema for modifyAppointment with ${services.length} services`
      );
    }

    if (updatedCount > 0) {
      // Count total dynamic properties
      const totalProperties = services.reduce((count, service) => {
        const required = service.properties?.required || [];
        const optional = service.properties?.optional || [];
        return count + required.length + optional.length;
      }, 0);

      console.log(
        `✅ Injected ${services.length} service types with ${totalProperties} ` +
          `dynamic properties into ${updatedCount} tool(s)`
      );
      console.log(
        `✅ Service-specific schemas: ${services.map(s => s.slug).join(", ")}`
      );
    }
  }
}

module.exports = RetellAgentProcessor;
