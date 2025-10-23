const fs = require("fs").promises;
const path = require("path");

/**
 * Configuration Loader Module
 *
 * Responsible for loading, processing, and validating client configuration from config.json.
 * Handles environment variable resolution and provides default fallback configuration.
 *
 * KEY RESPONSIBILITIES:
 * - Load and parse config.json
 * - Process environment variable references (env:VARIABLE_NAME)
 * - Validate configuration structure
 * - Provide default configuration fallback
 * - Extract configuration sections for other modules
 *
 * INTERFACE:
 * - loadConfiguration(): Load and process complete configuration
 * - processEnvironmentVariables(config): Resolve env: references
 * - validateConfiguration(config): Validate structure and required fields
 * - getDefaultConfiguration(): Get fallback configuration
 */
class ConfigurationLoader {
  constructor() {
    this.configPath = "config.json";
    this.loadedConfig = null;
  }

  /**
   * Load and process complete configuration from config.json
   *
   * @returns {Object} Processed configuration object
   * @throws {Error} If configuration is invalid
   */
  async loadConfiguration() {
    try {
      const configContent = await fs.readFile(this.configPath, "utf-8");
      const config = JSON.parse(configContent);

      // Process environment variables
      this.loadedConfig = this.processEnvironmentVariables(config);

      // Validate configuration
      this.validateConfiguration(this.loadedConfig);

      return this.loadedConfig;
    } catch (error) {
      if (error.code === "ENOENT") {
        console.warn(`⚠️  Configuration file not found: ${this.configPath}`);
        console.warn("📋 Using default configuration...");
        this.loadedConfig = this.getDefaultConfiguration();
        return this.loadedConfig;
      }
      throw new Error(`Failed to load configuration: ${error.message}`);
    }
  }

  /**
   * Process environment variable references throughout configuration
   *
   * Recursively processes all string values looking for "env:VARIABLE_NAME" pattern
   * and replaces with actual environment variable values.
   *
   * @param {Object} config - Configuration object to process
   * @returns {Object} Processed configuration with resolved env vars
   */
  processEnvironmentVariables(config) {
    return this._recursiveEnvVarProcessing(config);
  }

  /**
   * Recursively process environment variables in nested objects
   *
   * @param {any} obj - Object to process (may be nested)
   * @param {string} context - Context path for error messages
   * @returns {any} Processed object with environment variables resolved
   */
  _recursiveEnvVarProcessing(obj, context = "") {
    if (typeof obj === "string") {
      return this._processEnvironmentVariable(obj, context);
    }

    if (Array.isArray(obj)) {
      return obj.map((item, index) =>
        this._recursiveEnvVarProcessing(item, `${context}[${index}]`)
      );
    }

    if (obj !== null && typeof obj === "object") {
      const processed = {};
      for (const [key, value] of Object.entries(obj)) {
        const newContext = context ? `${context}.${key}` : key;
        processed[key] = this._recursiveEnvVarProcessing(value, newContext);
      }
      return processed;
    }

    return obj;
  }

  /**
   * Process a single environment variable reference
   *
   * @param {string} value - Value that may contain env: reference
   * @param {string} context - Context for error messages
   * @returns {string} Resolved value or original if not env reference
   */
  _processEnvironmentVariable(value, context = "") {
    if (typeof value !== "string" || !value.startsWith("env:")) {
      return value;
    }

    const envVarName = value.substring(4); // Remove 'env:' prefix
    const envValue = process.env[envVarName];

    if (envValue === undefined) {
      console.warn(
        `⚠️  Environment variable not found: ${envVarName} (${context})`
      );
      console.warn(`   Using placeholder value: ${value}`);
      return value; // Keep the env: reference as placeholder
    }

    return envValue;
  }

  /**
   * Validate configuration structure and required fields
   *
   * @param {Object} config - Configuration to validate
   * @throws {Error} If configuration is invalid
   */
  validateConfiguration(config) {
    if (!config) {
      throw new Error("Configuration is null or undefined");
    }

    // Validate required top-level sections
    const requiredSections = ["templating", "client_data", "build_config"];
    for (const section of requiredSections) {
      if (!config[section]) {
        console.warn(`⚠️  Missing configuration section: ${section}`);
      }
    }

    // Validate templating section
    if (config.templating && !config.templating.variables) {
      throw new Error("templating.variables is required");
    }

    // Validate client_data section
    if (config.client_data) {
      if (!config.client_data.business_info) {
        console.warn("⚠️  Missing client_data.business_info");
      }
      if (!Array.isArray(config.client_data.services)) {
        console.warn("⚠️  client_data.services should be an array");
      }
    }

    // Validate build_config section
    if (config.build_config) {
      if (!config.build_config.infrastructure) {
        console.warn("⚠️  Missing build_config.infrastructure");
      }
    }
  }

  /**
   * Get default configuration when config.json cannot be loaded
   *
   * @returns {Object} Default configuration object
   */
  getDefaultConfiguration() {
    return {
      templating: {
        auto_generate_from_repo: false,
        variables: {
          business_name: "Default Business",
          agent_name: "Default Agent"
        }
      },
      client_data: {
        business_info: {
          name: "Default Business",
          tagline: "Your Business Tagline",
          email: "contact@business.com",
          phone: "+1234567890",
          website: "https://business.com",
          address: {
            street: "",
            city: "City",
            state: "State",
            zip: "",
            country: "USA"
          },
          timezone: "America/New_York",
          description: "Default business description"
        },
        services: [],
        service_constraints: {
          max_services: 8,
          max_required_properties_per_service: 3,
          max_optional_properties_per_service: 2,
          max_total_dynamic_columns: 40
        },
        business_hours: {
          monday: "9:00 AM - 5:00 PM",
          tuesday: "9:00 AM - 5:00 PM",
          wednesday: "9:00 AM - 5:00 PM",
          thursday: "9:00 AM - 5:00 PM",
          friday: "9:00 AM - 5:00 PM",
          saturday: "Closed",
          sunday: "Closed",
          display: "Mon-Fri 9am-5pm, Sat-Sun closed"
        },
        booking: {
          advance_notice_required: "24 hours",
          cancellation_policy: "24 hours notice required",
          payment_methods: [],
          booking_instructions: "Please call to schedule an appointment."
        },
        faq: [],
        policies: {
          no_show_policy: "",
          late_arrival_policy: "",
          refund_policy: ""
        }
      },
      build_config: {
        version_settings: {
          version_title_suffix: "Demo"
        },
        voice_settings: {
          voice_id: "11labs-Ethan",
          max_call_duration_ms: 600000,
          interruption_sensitivity: 0.65
        },
        infrastructure: {
          transfer_phone_number: "1234567890",
          base_webhook_url: "https://example.com"
        },
        webhook_deployment: {
          enabled: false,
          hash_algorithm: "sha256",
          hash_length: 8,
          tools: {}
        }
      },
      runtime_variables: {
        business_name: "Default Business",
        business_hours: "Mon-Fri 9am-5pm",
        transfer_phone_number: "+1234567890"
      }
    };
  }

  /**
   * Get specific configuration section
   *
   * @param {string} section - Section name (e.g., 'templating', 'client_data')
   * @returns {Object} Configuration section
   */
  getSection(section) {
    if (!this.loadedConfig) {
      throw new Error(
        "Configuration not loaded. Call loadConfiguration() first."
      );
    }
    return this.loadedConfig[section] || {};
  }

  /**
   * Get complete loaded configuration
   *
   * @returns {Object} Complete configuration object
   */
  getConfig() {
    if (!this.loadedConfig) {
      throw new Error(
        "Configuration not loaded. Call loadConfiguration() first."
      );
    }
    return this.loadedConfig;
  }
}

module.exports = ConfigurationLoader;
