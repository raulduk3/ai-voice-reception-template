# 🤖 Retell Agent Conversation Flow Editing

## Purpose
Use this prompt with GitHub Copilot to modify Retell agent conversation flows and conversation node instructions while maintaining consistency and best practices.

## Prompt Template

```
@workspace Help me modify the Retell agent conversation flow following these guidelines:

RETELL ARCHITECTURE BEST PRACTICES:
- Use conversation nodes for user interaction, function nodes for n8n tool calls
- Always include Success/Failure/Error edges for function nodes
- Keep prompts conversational and natural, avoid technical language
- Use global_node_setting for conditions that apply to multiple transitions
- Ensure proper routing back to main conversation after tool execution
- Include human escalation paths for complex scenarios

CONVERSATION NODE PROMPT ENGINEERING:
- Structure node instructions using sectional format when complex
- Be explicit about when to transition (use trigger words/phrases)
- Keep individual node instructions focused on ONE primary task
- Include clear success criteria for transitions
- Use natural, conversational language (avoid robotic instructions)
- Reference tools by exact function names when applicable
- Limit responses to 1-2 sentences unless complex explanation needed

NODE INSTRUCTION STRUCTURE (for complex nodes):
```
## Task
[What this node should accomplish]

## Conversation Approach  
- Ask one question at a time
- Acknowledge what the caller says naturally
- Confirm understanding of important details

## Required Information
- [List what must be collected in this node]

## Transition Triggers
- If [specific condition]: move to [next node]
- When [completion criteria met]: transition forward
- If caller says [trigger phrase]: handle appropriately

**Note:** Only include `{{dayAndTime}}` if this node calls a function that needs temporal context (e.g., booking, identifying appointments) or needs to reference current time (e.g., time-based greeting). Avoid adding it to general conversation nodes.
```

CURRENT TASK: [Describe what you want to modify, e.g., "Add a new review request flow"]

Requirements:
- Add appropriate router edge with transition condition
- Create conversation node with structured instruction prompt
- Add function node that calls the new n8n tool (if needed)
- Handle all response scenarios (success/failure/error)
- Maintain existing conversation flow patterns
- Update global prompt only if new cross-cutting instructions needed
```

## Usage Instructions

1. Replace `[CURRENT TASK]` with your specific modification description
2. Specify whether you're modifying flow structure OR node instructions (or both)
3. For node instruction updates, indicate which node(s) need changes
4. Be specific about conversation behavior and transition logic
5. Run in GitHub Copilot to get coordinated changes across configuration
6. Always test the generated flow for proper routing and error handling

## Common Use Cases

### Dynamic Variable Usage Guidelines

**When to include `{{dayAndTime}}` and `{{timezone}}`:**
- ✅ Nodes that call booking/scheduling functions (bookAppointment)
- ✅ Nodes that identify/search appointments (identifyAppointment)
- ✅ Nodes that modify appointment timing (modifyAppointment)
- ✅ Welcome/greeting nodes using time-based salutations
- ✅ Any node where date/time context affects conversation logic

**When NOT to include `{{dayAndTime}}` and `{{timezone}}`:**
- ❌ General routing/branching nodes
- ❌ Confirmation and acknowledgment nodes
- ❌ Error handling and escalation nodes
- ❌ Closing/goodbye nodes
- ❌ General Q&A nodes (unless specifically about time)
- ❌ Callback/lead collection nodes

The principle: Only hydrate temporal variables into prompts that actually need them for function calls or time-aware conversation logic. This reduces token usage and prompt complexity.

## Common Use Cases

### Flow Structure Changes
- Adding new appointment types or services
- Integrating new business workflows 
- Adding review/feedback collection flows
- Creating escalation paths for complex scenarios
- Implementing seasonal or promotional flows

### Node Instruction Optimization
- Improving clarity of conversation node prompts
- Adding explicit tool calling triggers
- Refining transition conditions for better routing
- Enhancing edge case handling within nodes
- Making responses more natural and conversational

## Prompt Engineering Patterns

### Pattern 1: Simple Conversation Node
**Use for**: Single-task nodes with clear purpose
```
Collect required appointment information. Transition to booking when complete.
```

**Note:** No `{{dayAndTime}}` needed for simple routing/conversation nodes.

### Pattern 2: Structured Conversation Node
**Use for**: Multi-step interactions or complex logic
```
## Task
Verify caller identity and retrieve appointment details.

## Approach
- Ask for phone number or name naturally
- Confirm understanding: "Just to confirm, I have [info]..."
- Keep responses under 2 sentences

## Transition Triggers
- When identity verified and appointment found: → move to modification options
- If no appointment found: → offer to book new appointment
- If caller wants to cancel during verification: → route to cancellation flow

{{dayAndTime}}
```

### Pattern 3: Explicit Tool Calling Node
```
## Task
Retrieve appointment details using identifyAppointment function.

## Information Needed
- Caller's phone number OR full name
- (Optional) Approximate appointment date

## Process
1. Collect identifying information naturally
2. Call function `identifyAppointment` with collected data
3. Wait for function response before proceeding

## After Function Call
- Success: Summarize appointment details found
- Failure: Offer alternative identification methods
- Error: Apologize and escalate to human

Current date/time: {{dayAndTime}}
Timezone: {{timezone}}
```

**Note:** Include `{{dayAndTime}}` in nodes that call date/time-dependent functions like booking, modifying, or identifying appointments.

## Files Typically Modified

- `src/{{agent_name}} - Retell Agent.json` - Main conversation flow and node instructions
- `src/prompts/{{business_name}} Core Prompt.md` - Agent global instructions
- Related n8n workflow files for new tool integrations

## Best Practices Checklist

When modifying conversation nodes, ensure:
- [ ] Node instruction has clear, singular purpose
- [ ] Transition conditions use specific trigger language
- [ ] Responses are kept concise (1-2 sentences default)
- [ ] Tool calls reference exact function names
- [ ] Edge cases have explicit handling paths
- [ ] Natural, conversational tone maintained
- [ ] `{{dayAndTime}}` and `{{timezone}}` ONLY included in nodes that:
  - Call functions requiring temporal context (booking, identifying, modifying appointments)
  - Need to reference current time for conversation logic (time-based greetings)
  - Do NOT include in general routing, confirmation, or conversation nodes
- [ ] Success and failure paths clearly defined