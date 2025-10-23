/**
 * Runtime Variable Builder Module
 *
 * Responsible for building all four phases of template variables used
 * throughout the build system. Processes configuration into structured
 * variable sets for different purposes.
 *
 * KEY RESPONSIBILITIES:
 * - Build Phase 1: Template Variables (build-time metadata)
 * - Build Phase 2: Build Configuration (direct agent settings)
 * - Build Phase 3: Runtime Variables (Retell dynamic variables)
 * - Build Phase 4: Client Data Variables (content generation)
 * - Process business information into template-ready formats
 * - Generate formatted strings for display and documentation
 *
 * INTERFACE:
 * - buildTemplateVariables(packageJson, repoName): Build Phase 1 vars
 * - buildConfigurationSettings(config): Build Phase 2 settings
 * - buildRuntimeVariables(config, templateVars): Build Phase 3 vars
 * - buildClientDataVariables(clientData): Build Phase 4 vars
 * - processBusinessInfo(businessInfo): Format business information
 * - formatBusinessHours(hours): Format hours for display
 */
class RuntimeVariableBuilder {
  constructor() {
    this.templateVariables = {};
    this.buildConfig = {};
    this.runtimeVariables = {};
    this.clientDataVariables = {};
  }

  /**
   * Build all four phases of variables from configuration
   *
   * @param {Object} config - Complete configuration object
   * @param {Object} packageJson - Package.json contents
   * @param {string} repoName - Repository name
   * @param {Object} serviceEngine - ServiceSchemaEngine instance (optional)
   * @returns {Object} All four variable phases
   */
  buildAllPhases(config, packageJson, repoName, serviceEngine = null) {
    // Phase 1: Template Variables
    this.templateVariables = this.buildTemplateVariables(
      packageJson,
      repoName,
      config
    );

    // Phase 2: Build Configuration
    this.buildConfig = this.buildConfigurationSettings(config);

    // Phase 3: Runtime Variables
    this.runtimeVariables = this.buildRuntimeVariables(
      config,
      this.templateVariables
    );

    // Phase 4: Client Data Variables (with service engine for advanced schemas)
    this.clientDataVariables = this.buildClientDataVariables(
      config.client_data || {},
      serviceEngine
    );

    return {
      templateVariables: this.templateVariables,
      buildConfig: this.buildConfig,
      runtimeVariables: this.runtimeVariables,
      clientDataVariables: this.clientDataVariables
    };
  }

  /**
   * PHASE 1: Build Template Variables (build-time metadata and basic templating)
   *
   * These variables are used for:
   * - File naming ({{business_name}}, {{agent_name}})
   * - Build metadata (build_date, version, repository_name)
   * - Basic template replacement in content files
   *
   * @param {Object} packageJson - Package.json contents
   * @param {string} repoName - Repository name
   * @param {Object} config - Configuration object
   * @returns {Object} Template variables object
   */
  buildTemplateVariables(packageJson, repoName, config) {
    const templating = config.templating || {};
    const variables = templating.variables || {};

    return {
      build_date: new Date().toISOString().split("T")[0],
      version: packageJson.version || "1.0.0",
      repository_name: repoName,
      business_name:
        variables.business_name || this.generateBusinessName(repoName),
      agent_name:
        variables.agent_name || `${variables.business_name || "Business"} Agent`
    };
  }

  /**
   * PHASE 2: Build Configuration Settings (direct Retell agent settings)
   *
   * These settings are applied directly to the Retell agent JSON:
   * - Voice settings (voice_id, call duration, interruption sensitivity)
   * - Infrastructure (transfer phone numbers, webhook URLs)
   * - Version settings (title suffix for agent versions)
   * - Webhook deployment configuration
   *
   * @param {Object} config - Configuration object
   * @returns {Object} Build configuration object
   */
  buildConfigurationSettings(config) {
    const buildConfig = config.build_config || {};

    return {
      version_settings: buildConfig.version_settings || {
        version_title_suffix: "Demo"
      },
      voice_settings: buildConfig.voice_settings || {
        voice_id: "11labs-Ethan",
        max_call_duration_ms: 600000,
        interruption_sensitivity: 0.65
      },
      infrastructure: buildConfig.infrastructure || {
        transfer_phone_number: "1234567890",
        base_webhook_url: "https://example.com"
      },
      webhook_deployment: buildConfig.webhook_deployment || {
        enabled: false,
        hash_algorithm: "sha256",
        hash_length: 8,
        tools: {}
      }
    };
  }

  /**
   * PHASE 3: Build Runtime Variables (Retell dynamic variables for conversations)
   *
   * These variables are injected into the Retell agent's default_dynamic_variables
   * and are available for {{variable}} replacement during conversations:
   * - Business information (name, hours, phone)
   * - Agent settings (support hours, transfer numbers)
   * - Merged with template variables for complete context
   *
   * @param {Object} config - Configuration object
   * @param {Object} templateVars - Template variables from Phase 1
   * @returns {Object} Runtime variables object
   */
  buildRuntimeVariables(config, templateVars) {
    const runtimeConfig = config.runtime_variables || {};
    const clientData = config.client_data || {};
    const businessInfo = clientData.business_info || {};
    const businessHours = clientData.business_hours || {};

    // Start with template variables
    const variables = { ...templateVars };

    // Add business information
    variables.business_name =
      runtimeConfig.business_name ||
      businessInfo.name ||
      templateVars.business_name;

    variables.business_description =
      runtimeConfig.business_description ||
      businessInfo.tagline ||
      businessInfo.description ||
      "";

    variables.business_hours =
      runtimeConfig.business_hours ||
      businessHours.display ||
      this.formatBusinessHours(businessHours);

    variables.business_timezone =
      runtimeConfig.business_timezone ||
      businessInfo.timezone ||
      "America/New_York";

    variables.business_phone =
      runtimeConfig.business_phone || businessInfo.phone || "";

    // Add appointment types
    if (clientData.services && Array.isArray(clientData.services)) {
      variables.appointment_types =
        runtimeConfig.appointment_types ||
        clientData.services.map(s => s.name).join(", ");
    } else {
      variables.appointment_types = runtimeConfig.appointment_types || "";
    }

    // Add agent and support information
    variables.agent_name = runtimeConfig.agent_name || templateVars.agent_name;
    variables.ai_support_hours =
      runtimeConfig.ai_support_hours || variables.business_hours;

    // Add transfer phone number
    const infrastructure = config.build_config?.infrastructure || {};
    variables.transfer_phone_number =
      runtimeConfig.transfer_phone_number ||
      infrastructure.transfer_phone_number ||
      businessInfo.phone ||
      "";

    return variables;
  }

  /**
   * PHASE 4: Process Client Data into Template Variables (content generation)
   *
   * Transforms structured client data from config.json into template variables
   * used for generating knowledge base content, CSV files, and test scenarios.
   *
   * This method processes:
   * - Business information (email, phone, website, address, description)
   * - Services list with detailed property schemas (formatted for markdown and CSV)
   * - Business hours (formatted for display)
   * - Booking information (policies, payment methods, instructions)
   * - FAQ entries (formatted for knowledge base)
   * - Business policies (cancellation, refund, etc.)
   *
   * @param {Object} clientData - Raw client data from config.json
   * @param {Object} serviceEngine - ServiceSchemaEngine instance (optional)
   * @returns {Object} Processed template variables for content generation
   */
  buildClientDataVariables(clientData, serviceEngine = null) {
    const variables = {};
    const businessInfo = clientData.business_info || {};
    const services = clientData.services || [];
    const businessHours = clientData.business_hours || {};
    const booking = clientData.booking || {};
    const faq = clientData.faq || [];
    const policies = clientData.policies || {};

    // Business information
    variables.client_email = businessInfo.email || "";
    variables.client_phone = businessInfo.phone || "";
    variables.client_website = businessInfo.website || "";
    variables.client_timezone = businessInfo.timezone || "America/New_York";
    variables.client_description = businessInfo.description || "";
    variables.client_tagline = businessInfo.tagline || "";

    // Legacy variable names for backward compatibility
    variables.business_email = businessInfo.email || "";
    variables.business_phone = businessInfo.phone || "";
    variables.business_website = businessInfo.website || "";
    variables.business_timezone = businessInfo.timezone || "America/New_York";
    variables.business_description = businessInfo.description || "";
    variables.business_tagline = businessInfo.tagline || "";

    // Address information
    if (businessInfo.address) {
      const addr = businessInfo.address;
      variables.business_address_street = addr.street || "";
      variables.business_address_city = addr.city || "";
      variables.business_address_state = addr.state || "";
      variables.business_address_zip = addr.zip || "";
      variables.business_address_country = addr.country || "";
      variables.client_location = addr.city || "Remote";

      // Full formatted address
      if (addr.street) {
        variables.client_location =
          `${addr.street}, ${addr.city}, ${addr.state} ${addr.zip}`.trim();
      }

      const addressParts = [
        addr.street,
        addr.city,
        addr.state,
        addr.zip,
        addr.country
      ].filter(Boolean);
      variables.business_address_full = addressParts.join(", ");
    } else {
      variables.client_location = "Remote";
    }

    // Services information with detailed property schemas
    if (services && services.length > 0) {
      // Generate appointment_types as a comma-separated list
      variables.appointment_types = services.map(s => s.name).join(", ");

      // Detailed services list with property information
      variables.services_list = services
        .map(service => {
          let line = `- **${service.name}** (${service.duration_minutes} minutes)`;
          if (service.description) {
            line += `\n  ${service.description}`;
          }
          if (service.price) {
            line += ` - $${service.price}`;
          }

          // Add service properties information
          if (service.properties) {
            const requiredProps = service.properties.required || [];
            const optionalProps = service.properties.optional || [];

            if (requiredProps.length > 0) {
              const propsText = requiredProps.map(p => p.prompt).join(", ");
              line += `\n  **Required Information:** ${propsText}`;
            }

            if (optionalProps.length > 0) {
              const propsText = optionalProps.map(p => p.prompt).join(", ");
              line += `\n  **Optional Information:** ${propsText}`;
            }
          }

          return line;
        })
        .join("\n");

      variables.services_count = services.length.toString();
      variables.service_names = services.map(s => s.name).join(", ");

      // Generate CSV data with dynamic property columns
      if (serviceEngine) {
        const csvColumns = serviceEngine.generateAppointmentCSVColumns();
        variables.appointment_csv_headers = csvColumns.join(",");
        console.log(
          `✅ Generated dynamic CSV schema with ${csvColumns.length} columns`
        );

        // Service properties guide for agent
        variables.SERVICE_PROPERTIES_GUIDE =
          serviceEngine.generateServicePropertiesGuide();
      } else {
        // Fallback without service engine
        variables.appointment_csv_headers =
          "Name,Phone,Email,Date,Time,Service,Duration,Status,Notes,Created,Modified";
        variables.SERVICE_PROPERTIES_GUIDE =
          "No service-specific properties configured.";
      }
    } else {
      variables.appointment_types = "General Services";
      variables.services_list = "No services configured.";
      variables.services_count = "0";
      variables.service_names = "";
      variables.appointment_csv_headers =
        "Name,Phone,Email,Date,Time,Service,Duration,Status,Notes,Created,Modified";
      variables.SERVICE_PROPERTIES_GUIDE =
        "No service-specific properties configured.";
    }

    // Business hours
    variables.business_hours_display =
      businessHours.display || this.formatBusinessHours(businessHours);
    variables.business_hours_notes = businessHours.notes || "";

    // Booking information
    variables.booking_advance_notice =
      booking.advance_notice_required || "24 hours";
    variables.advance_notice_required =
      booking.advance_notice_required || "24 hours";
    variables.cancellation_policy =
      booking.cancellation_policy ||
      "Please contact us for our cancellation policy.";
    variables.booking_instructions =
      booking.booking_instructions || "Contact us to schedule an appointment.";

    if (booking.payment_methods && booking.payment_methods.length > 0) {
      variables.payment_methods = booking.payment_methods.join(", ");
    } else {
      variables.payment_methods = "";
    }

    // FAQ
    if (faq && faq.length > 0) {
      variables.faq_list = faq
        .map(item => `**Q: ${item.question}**\nA: ${item.answer}`)
        .join("\n\n");
      variables.faq_section = variables.faq_list;
      variables.faq_count = faq.length.toString();
    } else {
      variables.faq_list = "Please contact us with any questions.";
      variables.faq_section = "Please contact us with any questions.";
      variables.faq_count = "0";
    }

    // Policies
    if (policies) {
      const policySections = [];
      if (policies.no_show_policy) {
        policySections.push(`**No-Show Policy:** ${policies.no_show_policy}`);
      }
      if (policies.late_arrival_policy) {
        policySections.push(
          `**Late Arrival:** ${policies.late_arrival_policy}`
        );
      }
      if (policies.refund_policy) {
        policySections.push(`**Refunds:** ${policies.refund_policy}`);
      }

      variables.policies_section =
        policySections.length > 0
          ? policySections.join("\n\n")
          : "No additional policies at this time.";

      variables.no_show_policy = policies.no_show_policy || "";
      variables.late_arrival_policy = policies.late_arrival_policy || "";
      variables.refund_policy = policies.refund_policy || "";
    } else {
      variables.policies_section = "No additional policies at this time.";
      variables.no_show_policy = "";
      variables.late_arrival_policy = "";
      variables.refund_policy = "";
    }

    return variables;
  }

  /**
   * Format business hours from individual day entries into display format
   *
   * @param {Object} hours - Business hours object with day names as keys
   * @returns {string} Formatted business hours display
   */
  formatBusinessHours(hours) {
    if (!hours || typeof hours !== "object") {
      return "Please contact us for hours";
    }

    const days = [
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
      "sunday"
    ];
    const hoursDisplay = [];

    for (const day of days) {
      if (hours[day] && hours[day] !== "Closed") {
        const dayName = day.charAt(0).toUpperCase() + day.slice(1);
        hoursDisplay.push(`${dayName}: ${hours[day]}`);
      }
    }

    return hoursDisplay.length > 0
      ? hoursDisplay.join(", ")
      : "Please contact us for hours";
  }

  /**
   * Generate a human-readable business name from repository name
   *
   * @param {string} repoName - Repository name from package.json
   * @returns {string} Formatted business name
   */
  generateBusinessName(repoName) {
    return (
      repoName
        .replace(/-/g, " ")
        .replace(/_/g, " ")
        .replace(/\b(ai|voice|receptionist|template)\b/gi, "")
        .replace(/\s+/g, " ")
        .trim()
        .replace(/\b\w/g, l => l.toUpperCase()) || "Business"
    );
  }

  /**
   * Get all variables merged together (for general template processing)
   *
   * @returns {Object} All variables merged
   */
  getAllVariables() {
    return {
      ...this.templateVariables,
      ...this.clientDataVariables
    };
  }

  /**
   * Get template variables (Phase 1)
   *
   * @returns {Object} Template variables
   */
  getTemplateVariables() {
    return { ...this.templateVariables };
  }

  /**
   * Get build configuration (Phase 2)
   *
   * @returns {Object} Build configuration
   */
  getBuildConfig() {
    return { ...this.buildConfig };
  }

  /**
   * Get runtime variables (Phase 3)
   *
   * @returns {Object} Runtime variables
   */
  getRuntimeVariables() {
    return { ...this.runtimeVariables };
  }

  /**
   * Get client data variables (Phase 4)
   *
   * @returns {Object} Client data variables
   */
  getClientDataVariables() {
    return { ...this.clientDataVariables };
  }
}

module.exports = RuntimeVariableBuilder;
