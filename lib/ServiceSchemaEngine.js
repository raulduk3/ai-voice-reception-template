/**
 * Service Schema Engine Module
 *
 * Responsible for generating JSON schemas for service-specific properties,
 * validating service configurations against constraints, and creating
 * service-related data structures for appointments.
 *
 * KEY RESPONSIBILITIES:
 * - Validate service configurations against system constraints
 * - Generate service properties schema for function tools
 * - Generate service selection boolean flags
 * - Build complete appointment function schemas
 * - Generate CSV column headers with service properties
 * - Create service properties guides for agent awareness
 *
 * INTERFACE:
 * - validateServiceConstraints(services, constraints): Validate service config
 * - generateServicePropertiesSchema(services): Generate properties schema
 * - generateServiceSelectionSchema(services): Generate selection flags
 * - buildAppointmentFunctionSchema(services): Build bookAppointment schema
 * - buildModifyAppointmentFunctionSchema(services): Build modifyAppointment schema
 * - generateAppointmentCSVColumns(services): Generate CSV headers
 * - generateServicePropertiesGuide(services): Generate agent guide
 */
class ServiceSchemaEngine {
  constructor() {
    this.services = [];
    this.constraints = null;
  }

  /**
   * Initialize with service configuration
   *
   * @param {Array} services - Services array from config.json
   * @param {Object} constraints - Service constraints from config.json
   */
  initialize(services, constraints) {
    this.services = services || [];
    this.constraints = constraints || this._getDefaultConstraints();
    this.validateServiceConstraints(this.services, this.constraints);
  }

  /**
   * Get default service constraints
   *
   * @returns {Object} Default constraints
   */
  _getDefaultConstraints() {
    return {
      max_services: 8,
      max_required_properties_per_service: 3,
      max_optional_properties_per_service: 2,
      max_total_dynamic_columns: 40
    };
  }

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
    if (!Array.isArray(services)) {
      throw new Error("Services must be an array");
    }

    // Check max services
    if (services.length > constraints.max_services) {
      throw new Error(
        `Service count (${services.length}) exceeds maximum allowed (${constraints.max_services})`
      );
    }

    let totalColumns = 0;

    for (const service of services) {
      if (!service.properties) continue;

      const requiredCount = service.properties.required?.length || 0;
      const optionalCount = service.properties.optional?.length || 0;

      // Check required properties limit
      if (requiredCount > constraints.max_required_properties_per_service) {
        throw new Error(
          `Service "${service.name}" has ${requiredCount} required properties, ` +
            `exceeds maximum of ${constraints.max_required_properties_per_service}`
        );
      }

      // Check optional properties limit
      if (optionalCount > constraints.max_optional_properties_per_service) {
        throw new Error(
          `Service "${service.name}" has ${optionalCount} optional properties, ` +
            `exceeds maximum of ${constraints.max_optional_properties_per_service}`
        );
      }

      totalColumns += requiredCount + optionalCount;
    }

    // Check total columns limit
    if (totalColumns > constraints.max_total_dynamic_columns) {
      throw new Error(
        `Total dynamic columns (${totalColumns}) exceeds maximum allowed (${constraints.max_total_dynamic_columns})`
      );
    }
  }

  /**
   * Generate service-specific properties schema for function tools
   *
   * Creates a nested object schema where each service has its own properties
   * section with required and optional fields. Each service schema includes a
   * "required" array to enforce which properties must be collected.
   *
   * @param {Array} services - Services array from config.json
   * @returns {Object} Service properties schema object
   */
  generateServicePropertiesSchema(services = this.services) {
    const schema = {
      type: "object",
      properties: {},
      additionalProperties: false
    };

    for (const service of services) {
      if (!service.properties) continue;

      const serviceSchema = {
        type: "object",
        properties: {},
        additionalProperties: false
      };

      // Track required property names for this service
      const requiredProps = [];

      // Add required properties
      if (service.properties.required) {
        for (const prop of service.properties.required) {
          serviceSchema.properties[prop.name] = {
            type: prop.type,
            description: prop.prompt
          };
          requiredProps.push(prop.name);
        }
      }

      // Add optional properties
      if (service.properties.optional) {
        for (const prop of service.properties.optional) {
          serviceSchema.properties[prop.name] = {
            type: prop.type,
            description: prop.prompt
          };
        }
      }

      // Add required array to service schema if there are required properties
      if (requiredProps.length > 0) {
        serviceSchema.required = requiredProps;
      }

      schema.properties[service.slug] = serviceSchema;
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
  generateServiceSelectionSchema(services = this.services) {
    const schema = {
      type: "object",
      properties: {},
      additionalProperties: false
    };

    for (const service of services) {
      schema.properties[service.slug] = {
        type: "boolean",
        description: `Set to true if appointment is for ${service.name}`
      };
    }

    return schema;
  }

  /**
   * Build complete appointment function schema with dynamic service properties
   *
   * Combines base appointment fields (name, phone, email, date, time, etc.) with
   * dynamic service-specific properties and service selection flags.
   * Consolidates service selection using object with boolean flags only (no redundant service_type).
   *
   * @param {Array} services - Services array from config.json
   * @returns {Object} Complete function schema for bookAppointment
   */
  buildAppointmentFunctionSchema(services = this.services) {
    const serviceSelectionSchema =
      this.generateServiceSelectionSchema(services);
    const servicePropertiesSchema =
      this.generateServicePropertiesSchema(services);

    return {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Full name of the caller"
        },
        phone: {
          type: "string",
          description:
            "10-digit phone number, optional extension (e.g., 1234567890x123)"
        },
        email: {
          type: "string",
          description: "Customer email address"
        },
        preferred_contact_method: {
          type: "string",
          description: "Preferred method of contact",
          enum: ["phone", "email", "text"]
        },
        date: {
          type: "string",
          description: "Appointment date in YYYY-MM-DD format"
        },
        time: {
          type: "string",
          description: "Appointment time in 24-hour format HH:MM (local time)"
        },
        timezone: {
          type: "string",
          description:
            "Timezone for the appointment (e.g., America/Chicago). Use value from dayAndTime tool."
        },
        service: serviceSelectionSchema,
        service_properties: servicePropertiesSchema,
        notes: {
          type: "string",
          description: "Any additional notes as plain language."
        }
      },
      required: [
        "name",
        "phone",
        "email",
        "preferred_contact_method",
        "date",
        "time",
        "timezone",
        "service",
        "service_properties"
      ]
    };
  }

  /**
   * Build specialized modifyAppointment function schema
   *
   * Creates an "updates" object schema where only the fields being updated are included,
   * rather than requiring all base appointment fields. The agent infers
   * existing appointment details from identifyAppointment output.
   * Uses consolidated service object (no redundant service_type).
   *
   * @param {Array} services - Services array from config.json
   * @returns {Object} Updates object schema for modifyAppointment
   */
  buildModifyAppointmentFunctionSchema(services = this.services) {
    const serviceSelectionSchema =
      this.generateServiceSelectionSchema(services);
    const servicePropertiesSchema =
      this.generateServicePropertiesSchema(services);

    return {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Updated customer name"
        },
        phone: {
          type: "string",
          description: "Updated phone number"
        },
        email: {
          type: "string",
          description: "Updated email address"
        },
        preferred_contact_method: {
          type: "string",
          description: "Updated preferred contact method",
          enum: ["phone", "email", "text"]
        },
        date: {
          type: "string",
          description: "Updated appointment date in YYYY-MM-DD format"
        },
        time: {
          type: "string",
          description: "Updated appointment time in HH:MM 24-hour format"
        },
        timezone: {
          type: "string",
          description:
            "Updated IANA timezone (e.g., 'America/Chicago'). Use {{timezone}} variable."
        },
        service: serviceSelectionSchema,
        service_properties: servicePropertiesSchema,
        notes: {
          type: "string",
          description: "Updated appointment notes"
        }
      }
    };
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
  generateAppointmentCSVColumns(services = this.services) {
    // Base columns that always exist
    const baseColumns = [
      "Appointment ID",
      "Customer Name",
      "Customer Phone",
      "Customer Email",
      "Appointment Date",
      "Appointment Time",
      "Service Type",
      "Status",
      "Notes",
      "Created At",
      "Updated At"
    ];

    // Generate dynamic columns for each service's properties
    const dynamicColumns = [];

    for (const service of services) {
      if (!service.properties) continue;

      // Add required properties
      if (service.properties.required) {
        for (const prop of service.properties.required) {
          const columnName = this._formatPropertyColumnName(
            service.name,
            prop.name
          );
          dynamicColumns.push(columnName);
        }
      }

      // Add optional properties
      if (service.properties.optional) {
        for (const prop of service.properties.optional) {
          const columnName = this._formatPropertyColumnName(
            service.name,
            prop.name
          );
          dynamicColumns.push(columnName);
        }
      }
    }

    return [...baseColumns, ...dynamicColumns];
  }

  /**
   * Format a property as a CSV column name with service attribution
   *
   * @param {string} serviceName - Service name
   * @param {string} propertyName - Property name
   * @returns {string} Formatted column name
   */
  _formatPropertyColumnName(serviceName, propertyName) {
    // Convert property_name to Property Name
    const formattedProp = propertyName
      .split("_")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

    return `${serviceName} - ${formattedProp}`;
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
  generateServicePropertiesGuide(services = this.services) {
    if (!services || services.length === 0) {
      return "No service-specific properties required.";
    }

    const servicesWithProps = services.filter(
      s =>
        s.properties &&
        (s.properties.required?.length > 0 || s.properties.optional?.length > 0)
    );

    if (servicesWithProps.length === 0) {
      return "No service-specific properties required.";
    }

    let guide = "Service-Specific Information to Collect:\n\n";

    for (const service of servicesWithProps) {
      guide += `${service.name}:\n`;

      if (
        service.properties.required &&
        service.properties.required.length > 0
      ) {
        guide += "  Required:\n";
        for (const prop of service.properties.required) {
          guide += `    - ${this._formatPropertyForGuide(prop)}\n`;
        }
      }

      if (
        service.properties.optional &&
        service.properties.optional.length > 0
      ) {
        guide += "  Optional:\n";
        for (const prop of service.properties.optional) {
          guide += `    - ${this._formatPropertyForGuide(prop)}\n`;
        }
      }

      guide += "\n";
    }

    return guide.trim();
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
  _formatPropertyForGuide(prop) {
    return prop.prompt || prop.name;
  }
}

module.exports = ServiceSchemaEngine;
