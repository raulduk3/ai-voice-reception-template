# n8n Workflow Development

## Purpose

Use this prompt with GitHub Copilot to create or modify n8n workflows following established patterns
and best practices.

## Prompt Template

```
@workspace Help me create/modify an n8n workflow following these patterns:

N8N BEST PRACTICES:
- Start with Webhook node using POST method
- Use proper error handling with multiple output paths
- Include data validation and transformation nodes
- End with Respond to Webhook node with structured JSON
- Use consistent parameter naming across workflows
- Include timeout handling for external API calls
- Follow the existing node naming conventions

CURRENT TASK: [Describe the workflow, e.g., "Create review request workflow that sends SMS and filters positive responses"]

Requirements:
- Match existing workflow structure and naming
- Include proper webhook response format: {"status": "success/failure/error", "data": {}, "message": ""}
- Add appropriate data validation and error handling
- Use environment variables for sensitive credentials
- Follow the same authentication patterns as other workflows
```

## Usage Instructions

1. Replace `[CURRENT TASK]` with your specific workflow description
2. Be clear about the data flow and external integrations needed
3. Specify any new external services or APIs to integrate
4. Run in GitHub Copilot to generate the complete n8n workflow JSON

## Standard Workflow Structure

All n8n workflows should follow this pattern:

1. **Webhook In** - Receives data from Retell agent
2. **Data Validation** - Validates required parameters
3. **Business Logic** - Processes the request (API calls, transformations)
4. **Error Handling** - Catches and handles errors appropriately
5. **Respond to Webhook** - Returns structured response to Retell

## Response Format

Always return this structured JSON response format (see `.github/docs/ERROR_HANDLING.md` for
complete standards):

```json
{
  "status": "success" | "failure" | "error",
  "message": "Human-readable description",
  "data": {}
}
```

**Status Types:**

- **success**: Operation completed successfully
- **failure**: Business logic validation failed (missing fields, conflicts, not found, etc.)
- **error**: System/technical error (API failures, timeouts, unexpected exceptions)

**All workflows MUST:**

- Include timestamp in error responses
- Categorize error types for monitoring
- Specify retry_possible flag
- Provide actionable messages
- Include technical_details for debugging

## Common Integrations

- **Google Calendar** - Appointment booking/management
- **CRM Systems** - Lead capture and customer data
- **SMS Providers** - Text message notifications
- **Email Services** - Confirmation and follow-up emails
- **Knowledge Bases** - Information retrieval for Q&A

## Files Created/Modified

- `src/n8n/[workflow-name].json` - New workflow configuration
- `config.json` - Add webhook URL configuration
- Potentially update Retell agent tools section
