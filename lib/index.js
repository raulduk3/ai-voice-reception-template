/**
 * Layer 7 AI Voice Receptionist Template Build System - Module Exports
 *
 * This file exports all modular components of the build system, providing
 * a clean interface for importing specific modules or the complete system.
 *
 * ARCHITECTURE:
 * Each module is independent and communicates through well-defined interfaces.
 * Modules can be tested in isolation and composed for complete builds.
 *
 * USAGE:
 * const { ConfigurationLoader, ServiceSchemaEngine } = require('./lib');
 * const modules = require('./lib'); // All modules
 */

module.exports = {
  ConfigurationLoader: require("./ConfigurationLoader"),
  ServiceSchemaEngine: require("./ServiceSchemaEngine"),
  WebhookGenerator: require("./WebhookGenerator"),
  PromptInjector: require("./PromptInjector"),
  RuntimeVariableBuilder: require("./RuntimeVariableBuilder"),
  N8nWorkflowProcessor: require("./N8nWorkflowProcessor"),
  RetellAgentProcessor: require("./RetellAgentProcessor"),
  TemplateProcessor: require("./TemplateProcessor"),
  TokenCounter: require("./TokenCounter")
};
