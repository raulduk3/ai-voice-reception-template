const fs = require("fs").promises;
const path = require("path");
const prettier = require("prettier");

/**
 * Layer 7 AI Voice Receptionist Template Build System
 * 
 * This build system transforms generic templates into client-specific deployments using a sophisticated
 * multi-phase configuration approach. It processes templates, injects prompts, manages webhooks, and
 * generates optimized files for deployment.
 * 
 * ARCHITECTURE OVERVIEW:
 * =====================
 * 1. Configuration Loading: Loads and processes client configuration from config.json
 * 2. Four-Phase Processing: Template vars → Build config → Runtime vars → Client data  
 * 3. File Processing: Different strategies for different file types (prompts, JSON, etc.)
 * 4. Prompt Injection: Markdown prompts automatically injected into agent and workflows
 * 5. Service Schema Injection: Business services automatically added to booking tools
 * 6. Webhook Templating: Dynamic URL generation per tool with environment support
 * 
 * CONFIGURATION PHASES:
 * ====================
 * Phase 1: Template Variables (build-time)
 *   - Basic metadata: build_date, version, repository_name
 *   - Business identity: business_name, agent_name
 *   - Used for: filenames, build timestamps
 * 
 * Phase 2: Build Configuration (direct agent settings)
 *   - Voice settings: voice_id, call duration, interruption sensitivity  
 *   - Infrastructure: transfer phone, webhook URLs
 *   - Applied to: Retell agent JSON directly
 * 
 * Phase 3: Runtime Variables (Retell dynamic variables)
 *   - Conversation variables: business hours, appointment types
 *   - Merged with Phase 1 for Retell's {{variable}} system
 *   - Applied to: default_dynamic_variables in Retell agent
 * 
 * Phase 4: Client Data Variables (content generation)
 *   - Structured business data: services, FAQ, policies
 *   - Applied to: knowledge base, CSV files, test scenarios
 * 
 * FILE PROCESSING STRATEGIES:
 * ===========================
 * - Retell Agent JSON: Complex multi-phase processing with prompt injection
 * - n8n Workflows: Template replacement + RAG prompt injection for answerQuestion
 * - Prompt Files: Preserve {{variables}} for Retell runtime processing
 * - Content Files: Full template variable replacement (knowledge base, CSV, tests)
 * - Other Files: Standard template processing with optimization
 */
class AIVoiceBuilder {
  constructor() {
    // Core directories for source and output files
    this.sourceDir = "src/";
    this.distDir = "dist";
    
    // Configuration objects populated during initialization
    this.prettierConfig = null;
    this.config = null;
    
    // Four-phase configuration variables (see architecture overview above)
    this.templateVariables = {};      // Phase 1: Build-time template vars
    this.buildConfig = {};            // Phase 2: Direct agent settings  
    this.runtimeVariables = {};       // Phase 3: Retell dynamic variables
    this.clientDataVariables = {};    // Phase 4: Content generation vars
    
    // Injected prompts (loaded after prompt files are processed)
    this.corePrompt = null;           // Global prompt for Retell agent
    this.ragPrompt = null;            // RAG prompt for answerQuestion workflow
  }

  /**
   * Initialize the build system
   * 
   * This method sets up the build environment by:
   * 1. Loading Prettier configuration for code formatting
   * 2. Loading and processing client configuration (4-phase system)
   * 3. Creating the output directory structure
   * 4. Displaying initialization summary
   */
  async init() {
    console.log("🚀 Layer 7 AI Voice Build System Initializing...");
    
    // Load Prettier configuration for consistent code formatting
    this.prettierConfig = await prettier.resolveConfig(".");
    
    // Load and process client configuration through 4-phase system
    await this.loadAndProcessConfiguration();
    
    // Ensure output directory exists
    await this.ensureDir(this.distDir);
    
    // Display initialization summary
    console.log("✅ Layer 7 AI Voice Build System Initialized");
    console.log(`📋 Business: ${this.templateVariables.business_name}`);
    console.log(`🎯 Agent: ${this.templateVariables.agent_name}`);
    console.log(`📦 Version: ${this.templateVariables.version}`);
  }

  /**
   * Ensure a directory exists, creating it if necessary
   * 
   * @param {string} dirPath - Absolute path to directory
   */
  async ensureDir(dirPath) {
    try {
      await fs.access(dirPath);
    } catch {
      await fs.mkdir(dirPath, { recursive: true });
      console.log(`📁 Created directory: ${dirPath}`);
    }
  }

  /**
   * Process a single file through the template system
   * 
   * This method handles file processing with:
   * 1. Template content processing (file-type specific)
   * 2. Code formatting and optimization (JSON minification, Markdown formatting)
   * 3. Output generation with size reduction tracking
   * 
   * @param {string} filePath - Source file path
   * @param {string} outputPath - Destination file path
   * @returns {Object} Processing statistics (original size, processed size, reduction %)
   */
  async processFile(filePath, outputPath) {
    try {
      const content = await fs.readFile(filePath, "utf8");
      const ext = path.extname(filePath).toLowerCase();

      // Process content using file-type specific strategy
      let processedContent = this.processTemplateContent(content, filePath);
      let reduction = 0;
      let countsTowardReduction = false;

      // Apply file-type specific formatting and optimization
      if (ext === ".json") {
        try {
          // Format JSON with Prettier, then minify for production
          const formatted = await prettier.format(processedContent, {
            ...this.prettierConfig,
            parser: "json"
          });
          processedContent = JSON.stringify(JSON.parse(formatted));
          countsTowardReduction = true;
          reduction = (
            ((content.length - processedContent.length) / content.length) *
            100
          ).toFixed(1);
        } catch (err) {
          console.warn(`⚠️ JSON processing issue in ${filePath}: ${err.message}`);
          countsTowardReduction = false;
          reduction = 0;
        }
      } else if (ext === ".md") {
        try {
          // Format markdown with Prettier (no minification for readability)
          processedContent = await prettier.format(processedContent, {
            ...this.prettierConfig,
            parser: "markdown"
          });
          reduction = 0;
          countsTowardReduction = false;
        } catch (err) {
          reduction = 0;
          countsTowardReduction = false;
        }
      } else {
        // CSV and other files: template processing only
        reduction = 0;
        countsTowardReduction = false;
      }

      // Write processed content to output file
      await fs.writeFile(outputPath, processedContent, "utf8");

      return {
        original: content.length,
        processed: processedContent.length,
        reduction,
        countsTowardReduction
      };
    } catch (error) {
      console.error(`❌ Error processing ${filePath}:`, error.message);
      throw error;
    }
  }

  /**
   * Copy a file from source to destination (utility method)
   * 
   * @param {string} source - Source file path  
   * @param {string} destination - Destination file path
   */
  async copyFile(source, destination) {
    await fs.copyFile(source, destination);
  }

  // ============================================================================
  // CONFIGURATION LOADING AND PROCESSING (Four-Phase System)
  // ============================================================================

  /**
   * Load and process client configuration using the four-phase system
   * 
   * PHASE 1: Template Variables (build-time)
   * PHASE 2: Build Configuration (direct agent settings)
   * PHASE 3: Runtime Variables (Retell dynamic variables)
   * PHASE 4: Client Data Variables (content generation)
   * 
   * This method orchestrates the entire configuration loading process and sets up
   * all four phases of variables used throughout the build system.
   */
  async loadAndProcessConfiguration() {
    try {
      console.log("📖 Loading client configuration...");
      
      // Load raw configuration from config.json
      const raw = await fs.readFile(path.join(process.cwd(), "config.json"), "utf8");
      this.config = JSON.parse(raw);
      
      // Load package.json for build metadata
      const packageJson = require("./package.json");
      const repoName = (packageJson.name || "ai-voice-receptionist").replace(/@.*\//, "");
      
      // PHASE 1: Template Variables (build-time metadata and basic templating)
      this.templateVariables = this.buildTemplateVariables(packageJson, repoName);
      
      // PHASE 2: Build Configuration (direct Retell agent settings)
      this.buildConfig = this.buildConfigurationSettings();
      
      // PHASE 3: Runtime Variables (Retell dynamic variables for conversations)
      this.runtimeVariables = this.buildRuntimeVariables();
      
      // PHASE 4: Client Data Variables (structured business data for content generation)
      this.clientDataVariables = this.processClientData(this.config.client_data || {});
      
      console.log("✅ Configuration processed successfully");
      console.log(`📋 Template Variables: ${Object.keys(this.templateVariables).join(", ")}`);
      
    } catch (error) {
      console.warn("⚠️ Could not load configuration, using defaults:", error.message);
      this.setDefaultConfiguration();
    }
    
    // Load prompts after template variables are established
    await this.loadPrompts();
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
   * @returns {Object} Template variables object
   */
  buildTemplateVariables(packageJson, repoName) {
    const businessName = this.generateBusinessName(repoName);
    
    return {
      build_date: new Date().toISOString(),
      repository_name: repoName,
      version: packageJson.version || "1.0.0",
      ...(this.config.templating?.variables || {
        business_name: businessName,
        agent_name: "Your Business AI Voice Receptionist"
      })
    };
  }

  /**
   * PHASE 2: Build Configuration Settings (direct Retell agent settings)
   * 
   * These settings are applied directly to the Retell agent JSON:
   * - Voice settings (voice_id, call duration, interruption sensitivity)
   * - Infrastructure (transfer phone numbers, webhook URLs)
   * - Version settings (title suffix for agent versions)
   * 
   * @returns {Object} Build configuration object
   */
  buildConfigurationSettings() {
    return {
      version_settings: this.config.build_config?.version_settings || {
        version_title_suffix: "Demo"
      },
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
   * @returns {Object} Runtime variables object
   */
  buildRuntimeVariables() {
    const defaultRuntimeVars = {
      build_date: this.templateVariables.build_date,
      repository_name: this.templateVariables.repository_name,
      version: this.templateVariables.version,
      business_name: this.templateVariables.business_name,
      agent_name: this.templateVariables.agent_name,
      ai_support_hours: "24/7",
      transfer_phone_number: this.buildConfig.infrastructure.transfer_phone_number,
      business_description: this.config.client_data?.business_info?.description || "Professional services"
    };
    
    return {
      ...defaultRuntimeVars,
      ...(this.config.runtime_variables || {})
    };
  }

  /**
   * Set default configuration when config.json cannot be loaded
   * 
   * Provides sensible defaults for all four configuration phases to ensure
   * the build system can function even without a configuration file.
   */
  setDefaultConfiguration() {
    const buildDate = new Date().toISOString();
    
    // PHASE 1: Default template variables
    this.templateVariables = {
      build_date: buildDate,
      repository_name: "ai-voice-receptionist",
      version: "1.0.0",
      business_name: "Your Business",
      agent_name: "Your Business AI Voice Receptionist"
    };
    
    // PHASE 2: Default build configuration
    this.buildConfig = {
      version_settings: { version_title_suffix: "Demo" },
      voice_settings: {
        voice_id: "11labs-Cimo",
        max_call_duration_ms: 600000,
        interruption_sensitivity: 0.9
      },
      infrastructure: { transfer_phone_number: "+1234567890" },
      webhooks: {
        base_url: "https://n8n.srv836523.hstgr.cloud/webhook",
        tools: {}
      }
    };
    
    // PHASE 3: Default runtime variables
    this.runtimeVariables = {
      build_date: buildDate,
      repository_name: "ai-voice-receptionist",
      version: "1.0.0",
      business_name: "Your Business",
      agent_name: "Your Business AI Voice Receptionist",
      ai_support_hours: "24/7",
      transfer_phone_number: "+1234567890"
    };
    
    // PHASE 4: Default client data variables
    this.clientDataVariables = {};
    this.config = {};
  }

  // ============================================================================
  // PROMPT LOADING AND INJECTION SYSTEM
  // ============================================================================

  /**
   * Load processed prompts from dist directory for injection into configurations
   * 
   * This method loads the already-processed prompt files from the dist directory
   * after they have been templated and writes to inject them into:
   * - Core Prompt: Injected into Retell agent's global_prompt
   * - RAG Prompt: Injected into answerQuestion n8n workflow's system message
   * 
   * Note: Prompts are loaded from dist (not src) because they need to be processed
   * with template variables before injection into other configurations.
   */
  async loadPrompts() {
    try {
      // Load core prompt (for Retell agent global_prompt) from dist directory
      const corePromptPath = this.processTemplateFilename(
        "dist/prompts/{{business_name}} Core Prompt.md"
      );
      this.corePrompt = await fs.readFile(corePromptPath, "utf8");

      // Load RAG prompt (for answerQuestion n8n workflow) from dist directory  
      const ragPromptPath = this.processTemplateFilename(
        "dist/prompts/{{business_name}} Answer Question - RAG Agent Prompt.md"
      );
      this.ragPrompt = await fs.readFile(ragPromptPath, "utf8");

      console.log("📝 Prompts loaded successfully for injection");
    } catch (error) {
      console.warn("⚠️ Could not load prompts:", error.message);
      this.corePrompt = null;
      this.ragPrompt = null;
    }
  }

  // ============================================================================
  // BUSINESS NAME GENERATION AND CLIENT DATA PROCESSING  
  // ============================================================================

  /**
   * Generate a human-readable business name from repository name
   * 
   * Transforms technical repository names into proper business names by:
   * 1. Replacing hyphens/underscores with spaces
   * 2. Removing technical terms (ai, voice, receptionist, etc.)
   * 3. Converting to proper title case
   * 4. Providing fallback for edge cases
   * 
   * @param {string} repoName - Repository name from package.json
   * @returns {string} Formatted business name
   */
  generateBusinessName(repoName) {
    return (
      repoName
        .replace(/[-_]/g, " ") // Replace hyphens and underscores with spaces
        .replace(/\b(ai|voice|receptionist|agent|bot|assistant)\b/gi, "") // Remove technical terms
        .replace(/\s+/g, " ") // Clean up multiple spaces
        .trim()
        .split(" ")
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()) // Title case
        .join(" ") || "Your Business" // Fallback
    );
  }

  /**
   * PHASE 4: Process Client Data into Template Variables (content generation)
   * 
   * Transforms structured client data from config.json into template variables
   * used for generating knowledge base content, CSV files, and test scenarios.
   * 
   * This method processes:
   * - Business information (email, phone, website, address, description)
   * - Services list (formatted for markdown and CSV)
   * - Business hours (formatted for display)
   * - Booking information (policies, payment methods, instructions)
   * - FAQ entries (formatted for knowledge base)
   * - Business policies (cancellation, refund, etc.)
   * 
   * @param {Object} clientData - Raw client data from config.json
   * @returns {Object} Processed template variables for content generation
   */
  processClientData(clientData) {
    // Transform client_data from config into template variables for knowledge base & sheets
    const variables = {};

    // Business Info
    if (clientData.business_info) {
      const info = clientData.business_info;
      variables.client_email = info.email || "";
      variables.client_phone = info.phone || "";
      variables.client_website = info.website || "";
      variables.client_timezone = info.timezone || "America/Chicago";
      variables.client_description = info.description || "";

      // Address formatting
      if (info.address) {
        const addr = info.address;
        if (addr.street) {
          variables.client_location =
            `${addr.street}, ${addr.city}, ${addr.state} ${addr.zip}`.trim();
        } else {
          variables.client_location = addr.city || "Remote";
        }
      } else {
        variables.client_location = "Remote";
      }
    }

    // Services List (formatted for markdown with service properties)
    if (clientData.services && clientData.services.length > 0) {
      // Generate appointment_types as a comma-separated list of service names
      variables.appointment_types = clientData.services
        .map(service => service.name)
        .join(', ');
        
      variables.services_list = clientData.services
        .map(service => {
          let line = `- **${service.name}** (${service.duration_minutes} minutes)`;
          if (service.description) {
            line += `\n  ${service.description}`;
          }
          if (service.price) {
            line += ` - ${service.price}`;
          }
          
          // Add service properties information
          if (service.properties) {
            line += `\n  **Required Information:**`;
            
            // Required properties
            if (service.properties.required && service.properties.required.length > 0) {
              const requiredProps = service.properties.required
                .map(prop => prop.prompt)
                .join(', ');
              line += ` ${requiredProps}`;
            }
            
            // Optional properties
            if (service.properties.optional && service.properties.optional.length > 0) {
              const optionalProps = service.properties.optional
                .map(prop => prop.prompt)
                .join(', ');
              line += `\n  **Optional Information:** ${optionalProps}`;
            }
          }
          
          return line;
        })
        .join("\n");

      // Services as CSV rows (enhanced with individual property columns)
      const allPropertyColumns = new Set();
      
      // First pass: collect all unique property names across all services
      clientData.services.forEach(service => {
        const required = service.properties?.required || [];
        const optional = service.properties?.optional || [];
        [...required, ...optional].forEach(prop => {
          const displayName = prop.name
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
          allPropertyColumns.add(displayName);
        });
      });
      
      const sortedPropertyColumns = Array.from(allPropertyColumns).sort();
      
      // Generate CSV header for services with property columns
      const serviceHeaders = ['Service Type', 'Duration (minutes)', 'Price', ...sortedPropertyColumns];
      variables.services_csv_headers = serviceHeaders.join(',');
      
      // Second pass: generate rows with data for each service
      const servicesWithPropertyData = clientData.services.map(service => {
        const baseData = [service.name, service.duration_minutes, service.price || ''];
        
        // Create property lookup for this service
        const serviceProps = new Map();
        const required = service.properties?.required || [];
        const optional = service.properties?.optional || [];
        [...required, ...optional].forEach(prop => {
          const displayName = prop.name
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
          // Store property info for this service
          serviceProps.set(displayName, {
            type: prop.type,
            prompt: prop.prompt,
            required: required.includes(prop)
          });
        });
        
        // Add data for each property column
        const propertyData = sortedPropertyColumns.map(columnName => {
          if (serviceProps.has(columnName)) {
            const prop = serviceProps.get(columnName);
            const requiredFlag = prop.required ? ' (Required)' : ' (Optional)';
            return `${prop.type}${requiredFlag}`;
          } else {
            return ''; // Empty for properties this service doesn't have
          }
        });
        
        return [...baseData, ...propertyData].join(',');
      });
      
      variables.services_csv = servicesWithPropertyData.join('\n');
      
      // Generate detailed service properties documentation
      const servicePropertiesRows = [];
      clientData.services.forEach(service => {
        const required = service.properties?.required || [];
        const optional = service.properties?.optional || [];
        
        [...required, ...optional].forEach(prop => {
          const isRequired = required.includes(prop);
          servicePropertiesRows.push([
            service.name,
            service.slug,
            prop.name,
            prop.type,
            isRequired ? 'Required' : 'Optional',
            `"${prop.prompt}"`
          ].join(','));
        });
      });
      
      variables.service_properties_csv = servicePropertiesRows.length > 0 
        ? servicePropertiesRows.join('\n')
        : '';

      // Dynamic CSV columns for appointments based on service properties
      const appointmentColumns = this.generateAppointmentCSVColumns(clientData.services);
      variables.appointment_csv_headers = appointmentColumns.join(",");
      
      // Generate service properties guide for agent awareness
      variables.SERVICE_PROPERTIES_GUIDE = this.generateServicePropertiesGuide(clientData.services);
      
      console.log(`✅ Generated dynamic CSV schema with ${appointmentColumns.length} columns`);
    } else {
      variables.appointment_types = "General Services";
      variables.services_list = "No services configured.";
      variables.services_csv_headers = "Service Type,Duration (minutes),Price";
      variables.services_csv = "";
      variables.appointment_csv_headers = "Name,Phone,Email,Date,Time,Service,Duration,Status,Notes,Created,Modified";
      variables.service_properties_csv = "";
      variables.SERVICE_PROPERTIES_GUIDE = "No service-specific properties configured.";
    }

    // Business Hours
    if (clientData.business_hours) {
      const hours = clientData.business_hours;
      variables.business_hours_display =
        hours.display || this.formatBusinessHours(hours);
      variables.business_hours_notes = hours.notes || "";
    } else {
      variables.business_hours_display = "Please contact us for hours.";
      variables.business_hours_notes = "";
    }

    // Booking Info
    if (clientData.booking) {
      variables.booking_advance_notice =
        clientData.booking.advance_notice_required || "24 hours";
      variables.cancellation_policy =
        clientData.booking.cancellation_policy ||
        "Please contact us for our cancellation policy.";
      variables.booking_instructions =
        clientData.booking.booking_instructions ||
        "Contact us to schedule an appointment.";

      if (
        clientData.booking.payment_methods &&
        clientData.booking.payment_methods.length > 0
      ) {
        variables.payment_methods =
          clientData.booking.payment_methods.join(", ");
      } else {
        variables.payment_methods = "";
      }
    }

    // FAQ List
    if (clientData.faq && clientData.faq.length > 0) {
      variables.faq_list = clientData.faq
        .map(item => `**Q: ${item.question}**\nA: ${item.answer}`)
        .join("\n\n");
    } else {
      variables.faq_list = "Please contact us with any questions.";
    }

    // Policies
    if (clientData.policies) {
      const policySections = [];
      if (clientData.policies.no_show_policy) {
        policySections.push(
          `**No-Show Policy:** ${clientData.policies.no_show_policy}`
        );
      }
      if (clientData.policies.late_arrival_policy) {
        policySections.push(
          `**Late Arrival:** ${clientData.policies.late_arrival_policy}`
        );
      }
      if (clientData.policies.refund_policy) {
        policySections.push(
          `**Refunds:** ${clientData.policies.refund_policy}`
        );
      }
      variables.policies_section =
        policySections.length > 0
          ? policySections.join("\n\n")
          : "No additional policies at this time.";
    } else {
      variables.policies_section = "No additional policies at this time.";
    }

    return variables;
  }

  /**
   * Format business hours from individual day entries into display format
   * 
   * Converts structured business hours object into formatted markdown display
   * suitable for knowledge base and customer-facing materials.
   * 
   * @param {Object} hours - Business hours object with day names as keys
   * @returns {string} Formatted business hours display
   */
  formatBusinessHours(hours) {
    // Generate a formatted display of business hours from individual day entries
    const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
    const formatted = days
      .map(day => {
        const dayName = day.charAt(0).toUpperCase() + day.slice(1);
        const dayHours = hours[day] || "Closed";
        return `**${dayName}:** ${dayHours}`;
      })
      .join("\n");
    return formatted;
  }

  // ============================================================================
  // DYNAMIC SERVICE PROPERTY SYSTEM (Schema Generation and Validation)
  // ============================================================================

  /**
   * Validate service configuration against constraints
   * 
   * Ensures the service configuration doesn't exceed system limits for:
   * - Maximum number of services
   * - Maximum required properties per service  
   * - Maximum optional properties per service
   * - Maximum total dynamic columns across all services
   * 
   * @param {Array} services - Services array from config.json
   * @param {Object} constraints - Service constraints from config.json
   * @throws {Error} If constraints are violated
   */
  validateServiceConstraints(services, constraints) {
    const defaults = {
      max_services: 8,
      max_required_properties_per_service: 3,
      max_optional_properties_per_service: 2,
      max_total_dynamic_columns: 40
    };
    
    const limits = { ...defaults, ...constraints };
    
    if (services.length > limits.max_services) {
      throw new Error(`Too many services: ${services.length} (max: ${limits.max_services})`);
    }
    
    let totalColumns = 0;
    
    for (const service of services) {
      const required = service.properties?.required || [];
      const optional = service.properties?.optional || [];
      
      if (required.length > limits.max_required_properties_per_service) {
        throw new Error(`Service "${service.name}" has too many required properties: ${required.length} (max: ${limits.max_required_properties_per_service})`);
      }
      
      if (optional.length > limits.max_optional_properties_per_service) {
        throw new Error(`Service "${service.name}" has too many optional properties: ${optional.length} (max: ${limits.max_optional_properties_per_service})`);
      }
      
      totalColumns += required.length + optional.length;
    }
    
    if (totalColumns > limits.max_total_dynamic_columns) {
      throw new Error(`Total dynamic properties exceed limit: ${totalColumns} (max: ${limits.max_total_dynamic_columns})`);
    }
  }

  /**
   * Generate service-specific properties schema for function tools
   * 
   * Creates a nested object schema where each service has its own properties
   * section with required and optional fields. Used for bookAppointment and
   * modifyAppointment function schemas.
   * 
   * @param {Array} services - Services array from config.json
   * @returns {Object} Service properties schema object
   */
  generateServicePropertiesSchema(services) {
    const schema = {};
    
    for (const service of services) {
      const serviceSchema = {
        type: "object",
        properties: {},
        required: []
      };
      
      // Add required properties
      const required = service.properties?.required || [];
      for (const prop of required) {
        serviceSchema.properties[prop.name] = {
          type: prop.type,
          description: `${service.name}: ${prop.prompt}`
        };
        serviceSchema.required.push(prop.name);
      }
      
      // Add optional properties
      const optional = service.properties?.optional || [];
      for (const prop of optional) {
        serviceSchema.properties[prop.name] = {
          type: prop.type,
          description: `${service.name}: ${prop.prompt}`
        };
      }
      
      // Only add service schema if it has properties
      if (required.length > 0 || optional.length > 0) {
        schema[service.slug] = serviceSchema;
      }
    }
    
    return schema;
  }

  /**
   * Generate service selection boolean flags schema
   * 
   * Creates boolean flags for each service to determine which service-specific
   * properties should be collected. Uses service slugs as boolean property names.
   * 
   * @param {Array} services - Services array from config.json
   * @returns {Object} Service selection schema object
   */
  generateServiceSelectionSchema(services) {
    const schema = {
      type: "object",
      properties: {},
      description: "Service selection flags for conditional property collection"
    };
    
    for (const service of services) {
      schema.properties[service.slug] = {
        type: "boolean",
        description: `True if appointment is for ${service.name}`
      };
    }
    
    return schema;
  }

  /**
   * Build specialized modifyAppointment function schema
   * 
   * Creates a schema where only the fields being updated are included,
   * rather than requiring all base appointment fields. The agent infers
   * existing appointment details from identifyAppointment output.
   * 
   * @param {Array} services - Services array from config.json
   * @returns {Object} Complete modifyAppointment function schema
   */
  buildModifyAppointmentFunctionSchema(services) {
    // For modify appointment, only include fields that can be updated
    // The agent will have existing appointment context from identifyAppointment
    const updatesSchema = {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Customer's full name"
        },
        phone: {
          type: "string", 
          description: "Customer's phone number"
        },
        email: {
          type: "string",
          description: "Customer's email address"
        },
        preferred_contact_method: {
          type: "string",
          description: "Customer's preferred contact method (phone, email, text)"
        },
        date: {
          type: "string",
          description: "Appointment date in YYYY-MM-DD format"
        },
        time: {
          type: "string",
          description: "Appointment time in HH:MM 24-hour format"
        },
        timezone: {
          type: "string",
          description: "Timezone for the appointment"
        },
        notes: {
          type: "string",
          description: "Additional notes or comments"
        }
      },
      // Service is ALWAYS required for modifications to ensure proper validation
      required: ["service"],
      description: "Fields to update in the appointment"
    };

    // Add service selection flags (optional for modifications)
    const serviceSelection = this.generateServiceSelectionSchema(services);
    updatesSchema.properties.service = serviceSelection;

    // Add service-specific properties (optional for modifications)
    const serviceProperties = this.generateServicePropertiesSchema(services);
    if (Object.keys(serviceProperties).length > 0) {
      updatesSchema.properties.service_properties = {
        type: "object",
        properties: serviceProperties,
        description: "Service-specific properties based on selected service type"
      };
    }

    return updatesSchema;
  }
  /**
   * Build complete appointment function schema with dynamic service properties
   * 
   * Combines base appointment fields (name, phone, email, date, time, etc.) with
   * dynamic service-specific properties and service selection flags.
   * 
   * @param {Array} services - Services array from config.json
   * @returns {Object} Complete function schema for bookAppointment
   */
  buildAppointmentFunctionSchema(services) {
    // Base appointment fields
    const baseSchema = {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Customer's full name"
        },
        phone: {
          type: "string", 
          description: "Customer's phone number"
        },
        email: {
          type: "string",
          description: "Customer's email address"
        },
        preferred_contact_method: {
          type: "string",
          description: "Customer's preferred contact method (phone, email, text)"
        },
        date: {
          type: "string",
          description: "Appointment date in YYYY-MM-DD format"
        },
        time: {
          type: "string",
          description: "Appointment time in HH:MM 24-hour format"
        },
        timezone: {
          type: "string",
          description: "Timezone for the appointment"
        },
        notes: {
          type: "string",
          description: "Additional notes or comments"
        }
      },
      required: ["name", "phone", "email", "preferred_contact_method", "date", "time", "timezone"]
    };

    // Add service selection flags (renamed to 'service' and made required)
    const serviceSelection = this.generateServiceSelectionSchema(services);
    baseSchema.properties.service = serviceSelection;
    baseSchema.required.push("service");

    // Add service-specific properties
    const serviceProperties = this.generateServicePropertiesSchema(services);
    if (Object.keys(serviceProperties).length > 0) {
      baseSchema.properties.service_properties = {
        type: "object",
        properties: serviceProperties,
        description: "Service-specific properties based on selected service type"
      };
    }

    return baseSchema;
  }

  /**
   * Generate dynamic CSV columns for appointments based on service properties
   * 
   * Creates CSV column headers that include base appointment fields plus
   * all service-specific properties with service attribution. Uses display names for human-readable
   * headers while maintaining consistent field naming and clear service association.
   * 
   * @param {Array} services - Services array from config.json
   * @returns {Array} Array of CSV column header strings
   */
  generateAppointmentCSVColumns(services) {
    // Base appointment columns (including Google Calendar Event ID which maps to appointment_id)
    const baseColumns = [
      "Name",
      "Phone",
      "Email", 
      "Preferred Contact Method",
      "Date",
      "Time",
      "Service",
      "Duration",
      "Status",
      "Notes",
      "Google Calendar Event ID",
      "Created",
      "Modified"
    ];

    // Collect all unique property names with service attribution
    const dynamicColumns = new Map();
    
    for (const service of services) {
      const required = service.properties?.required || [];
      const optional = service.properties?.optional || [];
      
      for (const prop of [...required, ...optional]) {
        // Create service-attributed column name
        const serviceName = service.name; // Use service name directly with proper capitalization
        const propDisplayName = prop.name
          .split('_')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
        
        const columnName = `${serviceName}: ${propDisplayName}`;
        
        // Use the column name as key to avoid duplicates
        dynamicColumns.set(columnName, {
          service: service.name,
          property: prop.name,
          type: prop.type,
          displayName: propDisplayName
        });
      }
    }

    // Return combined columns with service-attributed dynamic columns
    const sortedDynamicColumns = Array.from(dynamicColumns.keys()).sort();
    return [...baseColumns, ...sortedDynamicColumns];
  }

  /**
   * Generate token-optimized service properties guide for agent awareness
   * 
   * Creates a condensed guide listing required properties for each service type
   * using conversational language. Designed to minimize token usage while providing
   * clear guidance on what data to collect for appointments.
   * 
   * @param {Array} services - Services array from config.json
   * @returns {string} Formatted service properties guide
   */
  generateServicePropertiesGuide(services) {
    if (!services || services.length === 0) {
      return "No service-specific properties configured.";
    }

    const serviceGuides = [];
    
    for (const service of services) {
      const required = service.properties?.required || [];
      const optional = service.properties?.optional || [];
      
      if (required.length === 0 && optional.length === 0) {
        continue; // Skip services with no properties
      }

      let guide = `**${service.name}**:`;
      
      // Required properties (conversational format)
      if (required.length > 0) {
        const requiredList = required.map(prop => {
          // Convert property prompt to conversational format
          return this.formatPropertyForGuide(prop);
        }).join(', ');
        guide += ` ${requiredList}`;
      }
      
      // Optional properties (if any)
      if (optional.length > 0) {
        const optionalList = optional.map(prop => {
          return this.formatPropertyForGuide(prop);
        }).join(', ');
        guide += required.length > 0 ? `. Optional: ${optionalList}` : ` ${optionalList} (optional)`;
      }
      
      serviceGuides.push(guide);
    }
    
    if (serviceGuides.length === 0) {
      return "No service-specific properties configured.";
    }
    
    return serviceGuides.join('\n\n');
  }

  /**
   * Format a property for the conversational service guide
   * 
   * Converts property definitions into natural, conversational language
   * suitable for agent guidance while maintaining clarity about data requirements.
   * 
   * @param {Object} prop - Property object with name, type, and prompt
   * @returns {string} Formatted property description
   */
  formatPropertyForGuide(prop) {
    // Use the prompt if it's conversational, otherwise format the name
    if (prop.prompt && prop.prompt.length < 50) {
      return prop.prompt;
    }
    
    // Fallback: convert property name to readable format
    return prop.name
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
      .toLowerCase();
  }

  // ============================================================================
  // TEMPLATE CONTENT PROCESSING (File-Type Specific Strategies)
  // ============================================================================

  /**
   * Process template content using file-type specific strategies
   * 
   * This is the central routing method for template processing. It determines
   * the appropriate processing strategy based on file type and path:
   * 
   * FILE PROCESSING STRATEGIES:
   * - Filename templating: Replace {{variables}} in filenames only
   * - Retell Agent JSON: Complex multi-phase processing with prompt injection
   * - n8n answerQuestion: Template replacement + RAG prompt injection  
   * - Prompt files: Preserve {{variables}} for Retell runtime processing
   * - Content files: Full template variable replacement (knowledge base, CSV, tests)
   * 
   * @param {string} content - File content to process
   * @param {string} filePath - File path (determines processing strategy)
   * @returns {string} Processed content
   */
  processTemplateContent(content, filePath = "") {
    const ext = path.extname(filePath).toLowerCase();

    // SPECIAL CASE 1: Filename templating (filePath === "")
    if (filePath === "") {
      let processedContent = content;
      for (const [key, value] of Object.entries(this.templateVariables)) {
        const regex = new RegExp(`\\{\\{${key}\\}\\}`, "g");
        processedContent = processedContent.replace(regex, value);
      }
      return processedContent;
    }

    // SPECIAL CASE 2: Retell Agent JSON (complex multi-phase processing)
    if (filePath.includes("Retell Agent.json")) {
      return this.processRetellAgentTemplate(content);
    }

    // SPECIAL CASE 3: n8n answerQuestion workflow (prompt injection)
    if (filePath.includes("n8n/") && filePath.includes("answerQuestion.json")) {
      return this.processN8nAnswerQuestionTemplate(content);
    }

    // SPECIAL CASE 4: Prompt files (preserve {{variables}} for Retell runtime)
    if (filePath.includes("prompts/") && ext === ".md") {
      // Process only specific build-time variables while preserving Retell runtime variables
      let processedContent = content;
      
      // Inject SERVICE_PROPERTIES_GUIDE at build time (not runtime)
      if (this.clientDataVariables && this.clientDataVariables.SERVICE_PROPERTIES_GUIDE) {
        const regex = new RegExp(`\\{\\{SERVICE_PROPERTIES_GUIDE\\}\\}`, "g");
        processedContent = processedContent.replace(regex, this.clientDataVariables.SERVICE_PROPERTIES_GUIDE);
      }
      
      return processedContent;
    }

    // DEFAULT CASE: All other files get template variable replacement
    // This includes: CSV files, knowledge base MD, test files, n8n workflows, etc.
    let processedContent = content;

    // First, replace template variables (build-time variables)
    for (const [key, value] of Object.entries(this.templateVariables)) {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, "g");
      processedContent = processedContent.replace(regex, value);
    }

    // Then, replace client data variables (for knowledge base and sheets)
    if (this.clientDataVariables) {
      for (const [key, value] of Object.entries(this.clientDataVariables)) {
        const regex = new RegExp(`\\{\\{${key}\\}\\}`, "g");
        processedContent = processedContent.replace(regex, value);
      }
    }

    return processedContent;
  }

  // ============================================================================
  // RETELL AGENT TEMPLATE PROCESSING (Complex Multi-Phase Processing)
  // ============================================================================

  /**
   * Process Retell Agent JSON with complex multi-phase template processing
   * 
   * This method handles the most complex file processing in the build system,
   * applying all four configuration phases to the Retell agent JSON:
   * 
   * PHASE 1: Apply Build Config (direct agent settings)
   * - Agent name, voice settings, call duration, interruption sensitivity
   * - Version synchronization (semantic version → integer + title)
   * 
   * PHASE 2: Inject Prompts (with {{variables}} preserved)
   * - Core prompt → global_prompt field
   * - Preserves Retell's {{variable}} syntax for runtime replacement
   * 
   * PHASE 3: Hydrate Runtime Variables (for Retell dynamic_variables)
   * - Business info, hours, contact details
   * - Merged with template variables for complete context
   * 
   * PHASE 4: Update Infrastructure (webhooks, transfer numbers, services)
   * - Webhook URL templating per tool
   * - Transfer phone number updates
   * - Service schema injection for booking tools
   * 
   * @param {string} content - Raw Retell agent JSON content
   * @returns {string} Processed and formatted JSON
   */
  processRetellAgentTemplate(content) {
    try {
      const jsonData = JSON.parse(content);

      // PHASE 1: Apply Build Config (direct agent settings)
      if (jsonData.agent_name !== undefined) {
        jsonData.agent_name = this.templateVariables.agent_name;
      }

      // Inject project version from package.json into Retell agent version and version_title fields
      if (jsonData.version !== undefined || jsonData.version_title !== undefined) {
        const versionStr = this.templateVariables.version || "1.0.0";
        
        // Update version field (convert semantic version to integer for Retell compatibility)
        if (jsonData.version !== undefined) {
          // e.g., "1.2.3" -> 123, "2.0.1" -> 201
          const versionParts = versionStr.split('.').map(n => parseInt(n, 10) || 0);
          const versionInt = versionParts[0] * 100 + versionParts[1] * 10 + versionParts[2];
          jsonData.version = versionInt;
        }
        
        // Update version_title field (keep semantic version format with v prefix)
        if (jsonData.version_title !== undefined) {
          // Use configured version title suffix from build_config, with backward compatibility
          const configuredSuffix = this.buildConfig.version_settings?.version_title_suffix;
          let titleSuffix = configuredSuffix;
          
          // Backward compatibility: if no config suffix, extract from existing title
          if (!titleSuffix) {
            const currentTitle = jsonData.version_title || "v0 Demo";
            titleSuffix = currentTitle.replace(/^v[\d.]+\s*/, '') || "Demo";
          }
          
          jsonData.version_title = `v${versionStr} ${titleSuffix}`;
        }
        
        console.log(`📦 Version injection: ${versionStr} -> version: ${jsonData.version || 'unchanged'}, version_title: "${jsonData.version_title || 'unchanged'}"`);
      }

      // Apply voice settings from build_config
      if (jsonData.voice_id !== undefined) {
        jsonData.voice_id = this.buildConfig.voice_settings.voice_id;
      }
      if (jsonData.max_call_duration_ms !== undefined) {
        jsonData.max_call_duration_ms =
          this.buildConfig.voice_settings.max_call_duration_ms;
      }
      if (jsonData.interruption_sensitivity !== undefined) {
        jsonData.interruption_sensitivity =
          this.buildConfig.voice_settings.interruption_sensitivity;
      }

      // PHASE 2: Inject Prompts (with {{variables}} preserved)
      if (
        this.corePrompt &&
        jsonData.conversationFlow?.global_prompt !== undefined
      ) {
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

      // PHASE 5: Inject service types from config into bookAppointment tool
      this.updateBookAppointmentServices(jsonData.conversationFlow?.tools);

      return JSON.stringify(jsonData, null, 2);
    } catch (error) {
      console.warn(
        "⚠️ Could not parse JSON for template processing:",
        error.message
      );
      return content;
    }
  }

  // ============================================================================
  // N8N WORKFLOW TEMPLATE PROCESSING (RAG Prompt Injection)
  // ============================================================================

  /**
   * Process n8n answerQuestion workflow with RAG prompt injection
   * 
   * This method handles the specialized processing for the answerQuestion n8n workflow:
   * 1. Injects the processed RAG prompt into the Answer Agent node's system message
   * 2. Applies template variable replacement to the RAG prompt content
   * 3. Locates the specific LangChain agent node and updates its configuration
   * 
   * The RAG prompt is loaded from the processed prompts directory and contains
   * business-specific instructions for answering customer questions while
   * maintaining security and PII protection guidelines.
   * 
   * @param {string} content - Raw n8n workflow JSON content
   * @returns {string} Processed workflow with injected RAG prompt
   */
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

        // Find and update the Answer Agent node
        jsonData.nodes.forEach(node => {
          if (
            node.name === "Answer Agent" &&
            node.type === "@n8n/n8n-nodes-langchain.agent" &&
            node.parameters?.options?.systemMessage !== undefined
          ) {
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

  // ============================================================================
  // INFRASTRUCTURE UPDATE METHODS (Webhooks, Transfer Numbers, Service Schemas)
  // ============================================================================

  /**
   * Update transfer call destination numbers in conversation nodes
   * 
   * Scans through Retell conversation flow nodes and updates any transfer_call
   * nodes with the configured transfer phone number from build configuration.
   * 
   * @param {Array} nodes - Retell conversation flow nodes array
   */
  updateTransferNodes(nodes) {
    if (!nodes) return;

    nodes.forEach(node => {
      if (node.type === "transfer_call" && node.transfer_destination?.number) {
        node.transfer_destination.number = this.buildConfig.infrastructure.transfer_phone_number;
        console.log(`📞 Updated transfer number: ${this.buildConfig.infrastructure.transfer_phone_number}`);
      }
    });
  }

  /**
   * Update webhook URLs for all custom tools in Retell agent
   * 
   * Templates webhook URLs for each tool using the configured base URL and
   * tool-specific endpoint mappings. This enables environment-specific
   * webhook configuration (dev, staging, production).
   * 
   * @param {Array} tools - Retell agent tools array
   */
  updateToolWebhookUrls(tools) {
    if (!tools || !this.buildConfig.webhooks.tools) return;

    const webhooks = this.buildConfig.webhooks;
    const baseUrl = webhooks.base_url;
    
    tools.forEach(tool => {
      if (tool.type === "custom" && tool.name) {
        // Get webhook ID for this tool from config
        const webhookId = webhooks.tools[tool.name];
        if (webhookId) {
          tool.url = `${baseUrl}/${webhookId}`;
          console.log(`🔗 Updated webhook URL for tool ${tool.name}: ${tool.url}`);
        }
      }
    });
  }

  /**
   * Inject dynamic service schemas into booking and modification tools
   * 
   * Automatically generates comprehensive service-specific schemas for bookAppointment and
   * modifyAppointment tools based on configured services with dynamic properties. This ensures:
   * 1. Service selection schemas match available business services
   * 2. Service-specific properties are dynamically generated from config
   * 3. Service descriptions and property prompts are included
   * 4. Required fields are properly configured
   * 5. Validation constraints are enforced
   * 
   * SCHEMA GENERATION:
   * - Base appointment fields (name, phone, date, time, etc.)
   * - Service selection boolean flags for each service
   * - Service-specific properties nested by service slug
   * - Required and optional property validation
   * 
   * @param {Array} tools - Retell agent tools array
   */
  updateBookAppointmentServices(tools) {
    if (!tools || !this.config.client_data?.services) return;

    const services = this.config.client_data.services;
    if (!Array.isArray(services) || services.length === 0) return;

    // Validate service constraints before processing
    try {
      this.validateServiceConstraints(services, this.config.client_data.service_constraints);
    } catch (error) {
      console.error(`❌ Service configuration validation failed: ${error.message}`);
      return;
    }

    let updatedCount = 0;

    // Find and update bookAppointment tool with dynamic schema
    const bookAppointmentTool = tools.find(
      tool => tool.name === "bookAppointment"
    );
    
    if (bookAppointmentTool?.parameters) {
      const dynamicSchema = this.buildAppointmentFunctionSchema(services);
      
      // Replace the entire parameters object with the dynamic schema
      bookAppointmentTool.parameters = dynamicSchema;
      updatedCount++;
      
      console.log(`✅ Generated dynamic schema for bookAppointment with ${services.length} services`);
    }

    // Find and update modifyAppointment tool with dynamic schema
    const modifyAppointmentTool = tools.find(
      tool => tool.name === "modifyAppointment"
    );
    
    if (modifyAppointmentTool?.parameters) {
      // Use specialized modify schema that only requires fields being updated
      const updatesSchema = this.buildModifyAppointmentFunctionSchema(services);
      
      // Wrap in the modifyAppointment structure
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
      
      console.log(`✅ Generated dynamic schema for modifyAppointment with ${services.length} services`);
    }

    if (updatedCount > 0) {
      // Count total dynamic properties across all services
      const totalProperties = services.reduce((count, service) => {
        const required = service.properties?.required || [];
        const optional = service.properties?.optional || [];
        return count + required.length + optional.length;
      }, 0);
      
      console.log(
        `✅ Injected ${services.length} service types with ${totalProperties} dynamic properties into ${updatedCount} tool(s)`
      );
      console.log(`✅ Service-specific schemas: ${services.map(s => s.slug).join(', ')}`);
    }
  }

  // ============================================================================
  // FILE SCANNING AND PROCESSING UTILITIES
  // ============================================================================

  /**
   * Process template variables in filenames
   * 
   * Replaces {{variable}} placeholders in filenames with actual values from
   * template variables. This enables dynamic file naming based on business
   * configuration (e.g., "{{business_name}} Core Prompt.md").
   * 
   * @param {string} filename - Filename with potential {{variable}} placeholders
   * @returns {string} Processed filename with variables replaced
   */
  processTemplateFilename(filename) {
    let processedFilename = filename;

    // Replace template variables in filename
    for (const [key, value] of Object.entries(this.templateVariables)) {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, "g");
      processedFilename = processedFilename.replace(regex, value);
    }

    return processedFilename;
  }

  /**
   * Recursively scan directory for processable files
   * 
   * Scans the source directory tree and identifies files that should be
   * processed by the build system. Includes filtering logic to:
   * 1. Skip system directories (node_modules, .git, dist, etc.)
   * 2. Include processable file types (.json, .md, .csv)
   * 3. Exclude build system files and lock files
   * 4. Return structured file information for processing
   * 
   * @param {string} dir - Directory to scan
   * @param {string} baseDir - Base directory for relative path calculation
   * @returns {Array} Array of file information objects
   */
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
          const isProcessable = [".json", ".md", ".csv"].includes(ext);
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

  /**
   * Process a single file entry with template processing and statistics tracking
   * 
   * Handles the complete processing pipeline for a single file:
   * 1. Process template variables in filename (e.g., {{business_name}})
   * 2. Create output directory structure
   * 3. Apply appropriate content processing strategy
   * 4. Track processing statistics (file count, size reduction)
   * 5. Log processing results
   * 
   * @param {Object} fileInfo - File information object from scanDirectory
   * @param {Object} stats - Build statistics object for tracking metrics
   */
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
        const result = await this.processFile(fileInfo.sourcePath, outputPath);

        stats.totalFiles++;
        stats.totalOriginalSize += result.original;
        stats.totalProcessedSize += result.processed;
        if (!stats.totalOriginalSizeForReduction) {
          stats.totalOriginalSizeForReduction = 0;
          stats.totalProcessedSizeForReduction = 0;
        }
        if (result.countsTowardReduction) {
          stats.totalOriginalSizeForReduction += result.original;
          stats.totalProcessedSizeForReduction += result.processed;
        }

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
        stats.totalProcessedSize += Buffer.byteLength(processedContent, "utf8");

        console.log(`📄 ${processedRelativePath} - template processed`);
      }
    } catch (error) {
      console.error(
        `❌ Error processing ${fileInfo.relativePath}:`,
        error.message
      );
    }
  }

  // ============================================================================
  // MAIN BUILD ORCHESTRATION
  // ============================================================================

  /**
   * Execute the complete build process
   * 
   * This is the main orchestration method that coordinates the entire build process:
   * 
   * BUILD PROCESS FLOW:
   * 1. Initialize build statistics and timing
   * 2. Scan source directory for processable files
   * 3. PHASE 1: Process prompt files first (required for injection)
   * 4. Load processed prompts for injection into other files
   * 5. PHASE 2: Process all remaining files with prompt injection
   * 6. Generate build statistics and metadata
   * 7. Output build summary and performance metrics
   * 
   * TWO-PHASE PROCESSING:
   * The build uses a two-phase approach because prompts must be processed
   * and loaded before they can be injected into other files (Retell agent,
   * n8n workflows). This ensures proper dependency resolution.
   * 
   * @returns {Object} Build information with statistics and metadata
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
        // Reduction is calculated only for truly minified artifact types (e.g., JSON)
        totalReduction: stats.totalOriginalSizeForReduction
          ? `${(
              ((stats.totalOriginalSizeForReduction -
                stats.totalProcessedSizeForReduction) /
                stats.totalOriginalSizeForReduction) *
              100
            ).toFixed(1)}%`
          : "0.0%",
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

  /**
   * Clean the output directory
   * 
   * Removes the entire dist directory and all generated files. This is useful
   * for ensuring clean builds and removing any stale generated content.
   */
  async clean() {
    try {
      await fs.rm(this.distDir, { recursive: true, force: true });
      console.log("🧹 Cleaned dist directory");
    } catch (error) {
      console.log("🧹 No dist directory to clean");
    }
  }
}

// ============================================================================
// COMMAND LINE INTERFACE
// ============================================================================

/**
 * Main CLI entry point for the build system
 * 
 * Provides command-line interface for common build operations:
 * - build: Process all files and generate dist directory
 * - clean: Remove dist directory and all generated files  
 * - rebuild: Clean and build in sequence for fresh builds
 * 
 * USAGE:
 * node build.js build    # Build optimized files
 * node build.js clean    # Clean dist directory  
 * node build.js rebuild  # Clean and build
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
    default:
      console.log("Available commands:");
      console.log("  npm run build     - Build optimized files");
      console.log("  npm run clean     - Clean dist directory");
      console.log("  npm run rebuild   - Clean and build");
  }
}

// Entry point: run main function if this file is executed directly
if (require.main === module) {
  main().catch(console.error);
}

// Export the builder class for programmatic usage
module.exports = AIVoiceBuilder;
