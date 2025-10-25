# Template System Extension

## Purpose

Use this prompt with GitHub Copilot to extend the template system with new features, configuration
options, or client customizations.

## Prompt Template

```
@workspace Help me extend the template system functionality:

TEMPLATE SYSTEM ARCHITECTURE:
- config.json drives all template variables and behavior
- build.js processes templates with LayerBuilder class
- Two-phase build: prompts first, then configuration injection
- Selective templating preserves infrastructure while customizing business details
- Dynamic webhook URL generation per tool
- Runtime variable support for Retell agent

EXTENSION REQUEST: [Describe new functionality, e.g., "Add SMS integration with Twilio templating"]

Requirements:
- Update config.json schema with new configuration section
- Extend LayerBuilder with new processing methods
- Template appropriate files (Retell agent, n8n workflows, etc.)
- Add dynamic variable support if needed
- Update README with configuration instructions
- Maintain backward compatibility with existing clients

TEMPLATE PROCESSING TARGETS:
- Retell Agent JSON: Business info, prompts, voice settings
- n8n Workflows: Webhook URLs, system messages, credentials
- Prompt Files: Business-specific instructions and variables
- Configuration Files: Infrastructure and deployment settings
```

## Usage Instructions

1. Replace `[EXTENSION REQUEST]` with your specific functionality addition
2. Consider which configuration files need templating
3. Plan backward compatibility for existing client deployments
4. Include proper documentation updates in your request, opt to add to existing README before
   creating a new

## Extension Patterns

### Adding New Tool Integration

```javascript
// config.json addition
{
  "webhooks": {
    "existing_tools": "...",
    "newTool": "https://{{base_webhook_url}}/webhook/newTool"
  },
  "integrations": {
    "newService": {
      "api_key": "{{new_service_api_key}}",
      "endpoint": "{{new_service_endpoint}}",
      "enabled": true
    }
  }
}

// LayerBuilder method
processNewServiceTemplate(config) {
  // Template processing logic
  // Update webhook URLs
  // Configure service integration
}
```

### Adding Dynamic Variables

```javascript
// config.json addition
{
  "dynamic_variables": {
    "existing_vars": "...",
    "new_business_var": "value that changes at runtime"
  }
}

// Usage in prompts
"Instructions with {{new_business_var}} replacement"
```

### Configuration Schema Extensions

Follow these patterns when extending config.json:

- **Business Section**: Customer-facing information
- **Infrastructure Section**: Technical deployment details
- **Webhooks Section**: Tool-specific endpoint configurations
- **Voice Settings Section**: Retell agent voice configuration
- **Dynamic Variables Section**: Runtime template replacement
- **Integrations Section**: Third-party service configurations

## Template Processing Flow

1. **Prompt Processing**: Load and template prompt markdown files
2. **Configuration Injection**: Inject processed prompts into agent configs
3. **Webhook Templating**: Update tool webhook URLs across all files
4. **Dynamic Variable Replacement**: Replace runtime variables in templates
5. **File Generation**: Output templated configurations to appropriate locations

## Files Modified

### Core System Files

- `config.json` - Configuration schema extensions
- `build.js` - LayerBuilder processing methods
- `README.md` - Documentation updates

### Template Target Files

- `src/{{agent_name}}.json` - Retell agent configuration
- `src/{{tool}}-n8n.json` - n8n workflow configurations
- `src/prompts/{{business_name}}*.md` - Prompt templates

## Testing Extensions

1. **Configuration Validation**: Ensure config.json schema is valid
2. **Template Processing**: Verify all variables are replaced correctly
3. **Build System**: Run build process and check output files
4. **Client Testing**: Test with sample client configuration
5. **Documentation**: Verify README instructions are accurate

## Backward Compatibility

- Always provide default values for new configuration options
- Use optional chaining for new config sections
- Maintain existing template variable names
- Test with legacy configuration files
