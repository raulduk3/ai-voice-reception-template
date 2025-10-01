# 📝 Prompt Engineering & Security

## Purpose
Use this prompt with GitHub Copilot to update AI prompts while maintaining security standards and preventing PII exposure.

## Prompt Template

```
@workspace Help me update the AI prompts while maintaining security standards:

PROMPT SECURITY RULES:
- NEVER allow PII disclosure in answerQuestion responses
- Always route appointment-specific queries through identifyAppointment
- Use specific response formats for structured data
- Include clear escalation paths for uncertain scenarios
- Maintain conversational tone while being security-conscious
- Reference dynamic variables with {{variable_name}} syntax

CURRENT TASK: [Describe prompt changes, e.g., "Add review request instructions to core prompt"]

Requirements:
- Update both Core Prompt (Retell agent) and RAG Prompt (n8n) if needed
- Maintain existing security constraints
- Use consistent formatting and structure
- Include clear instructions for new conversation flows
- Preserve existing {{dynamic_variable}} references
```

## Usage Instructions

1. Replace `[CURRENT TASK]` with your specific prompt modification
2. Specify whether changes affect Core Prompt, RAG Prompt, or both
3. Be clear about new conversation capabilities being added
4. Always maintain security-first approach in prompt modifications

## Security Principles

### PII Protection
- **Never expose** customer names, phone numbers, or appointment details in general responses
- **Always route** personal queries through `identifyAppointment` flow
- **Filter sensitive** information before responding

### Response Formats
- **Structured responses** for answerQuestion tool
- **Clear escalation** paths for uncertain scenarios
- **Consistent formatting** across all prompt responses

### Dynamic Variables
- Use `{{variable_name}}` syntax for runtime replacement
- Reference business-specific information through dynamic variables
- Maintain template compatibility across client configurations

## Prompt Types

### Core Prompt (`src/prompts/{{business_name}} Core Prompt.md`)
- Main agent personality and instructions
- Business-specific conversation guidelines
- Router logic and escalation rules
- Gets injected into Retell agent `global_prompt`

### RAG Prompt (`src/prompts/{{business_name}} Answer Question - RAG Agent Prompt.md`)
- Security-focused information retrieval guidelines
- PII protection rules for knowledge base queries
- Structured response formats for Q&A
- Gets injected into n8n Answer Agent `systemMessage`

## Files Modified

- `src/prompts/{{business_name}} Core Prompt.md` - Agent instructions
- `src/prompts/{{business_name}} Answer Question - RAG Agent Prompt.md` - Q&A security
- Build system automatically injects these into appropriate configurations