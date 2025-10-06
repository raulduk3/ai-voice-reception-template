# 🤖 Retell Agent Conversation Flow Editing

## Purpose
Use this prompt with GitHub Copilot to modify Retell agent conversation flows while maintaining consistency and best practices.

## Prompt Template

```
@workspace Help me modify the Retell agent conversation flow following these guidelines:

RETELL BEST PRACTICES:
- Use conversation nodes for user interaction, function nodes for n8n tool calls
- Always include Success/Failure/Error edges for function nodes
- Keep prompts conversational and natural, avoid technical language
- Use global_node_setting for conditions that apply to multiple transitions
- Ensure proper routing back to main conversation after tool execution
- Include human escalation paths for complex scenarios

CURRENT TASK: [Describe what you want to modify, e.g., "Add a new review request flow"]

Requirements:
- Add appropriate router edge with transition condition
- Create conversation node to gather required information  
- Add function node that calls the new n8n tool
- Handle all response scenarios (success/failure/error)
- Maintain existing conversation flow patterns
- Update global prompt if new instructions needed
```

## Usage Instructions

1. Replace `[CURRENT TASK]` with your specific modification description
2. Be specific about what conversation flow you want to add or modify
3. Run in GitHub Copilot to get coordinated changes across the Retell agent configuration
4. Always test the generated flow for proper routing and error handling

## Common Use Cases

- Adding new appointment types or services
- Integrating new business workflows 
- Adding review/feedback collection flows
- Creating escalation paths for complex scenarios
- Implementing seasonal or promotional flows

## Files Typically Modified

- `src/{{agent_name}} - Retell Agent.json` - Main conversation flow
- `src/prompts/{{business_name}} Core Prompt.md` - Agent instructions
- Related n8n workflow files for new tool integrations