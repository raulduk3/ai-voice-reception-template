/**
 * Token Counter Module
 *
 * Provides token estimation for all LLM-facing content in the build system.
 * Uses character-based estimation (approximately 4 characters per token for English text).
 *
 * KEY RESPONSIBILITIES:
 * - Estimate tokens for conversation prompts (global_prompt, node instructions)
 * - Count tokens in tool schemas (descriptions, parameters, examples)
 * - Calculate tokens in knowledge base content
 * - Track dynamic variables that contribute to token usage
 * - Generate comprehensive token usage reports with accurate Retell AI cost estimates
 *
 * ESTIMATION METHOD:
 * - Uses ~4 characters per token (GPT-4/Claude average)
 * - Accounts for JSON structure overhead in schemas
 * - Tracks both static (build-time) and dynamic (runtime) token usage
 *
 * COST CALCULATION:
 * - Based on Retell AI per-minute pricing (not per-token)
 * - Source: https://www.retellai.com/pricing (as of 2025)
 * - Baseline: $0.135/min (ElevenLabs voice + GPT-4o + Retell telephony)
 * - Average call: 3.5 minutes (~$0.47 per conversation)
 * - Token counts inform optimization opportunities, not direct costs
 *
 * INTERFACE:
 * - estimateTokens(text): Estimate tokens for raw text
 * - countPromptTokens(promptContent): Count tokens in conversation prompts
 * - countToolSchemaTokens(toolSchema): Count tokens in tool definitions
 * - countKnowledgeBaseTokens(kbContent): Count tokens in knowledge bases
 * - generateReport(): Generate comprehensive token usage report with Retell AI costs
 */
class TokenCounter {
  constructor() {
    // Estimation constants (characters per token)
    this.CHARS_PER_TOKEN = 4; // Average for English text in GPT-4/Claude
    this.JSON_OVERHEAD_MULTIPLIER = 1.15; // Add 15% for JSON structure

    // Token tracking by category
    this.tokenCounts = {
      global_prompt: 0,
      node_instructions: 0,
      tool_schemas: 0,
      knowledge_bases: 0,
      dynamic_variables: 0,
      total: 0
    };

    // Detailed breakdown
    this.breakdown = {
      conversation_nodes: [],
      tools: [],
      knowledge_bases: [],
      prompts: []
    };
  }

  /**
   * Estimate tokens for raw text content
   *
   * @param {string} text - Text content to estimate
   * @returns {number} Estimated token count
   */
  estimateTokens(text) {
    if (!text || typeof text !== "string") return 0;

    // Remove excessive whitespace but preserve structure
    const normalizedText = text.trim().replace(/\s+/g, " ");
    const charCount = normalizedText.length;

    return Math.ceil(charCount / this.CHARS_PER_TOKEN);
  }

  /**
   * Count tokens in Retell agent global prompt
   *
   * @param {string} promptContent - Global prompt content
   * @returns {number} Token count
   */
  countGlobalPrompt(promptContent) {
    const tokens = this.estimateTokens(promptContent);
    this.tokenCounts.global_prompt += tokens;
    this.tokenCounts.total += tokens;

    this.breakdown.prompts.push({
      type: "global_prompt",
      tokens,
      size_kb: (promptContent.length / 1024).toFixed(2)
    });

    return tokens;
  }

  /**
   * Count tokens in conversation node instructions
   *
   * @param {Object} node - Conversation node object
   * @returns {number} Token count
   */
  countNodeInstruction(node) {
    if (!node.instruction?.text) return 0;

    const tokens = this.estimateTokens(node.instruction.text);
    this.tokenCounts.node_instructions += tokens;
    this.tokenCounts.total += tokens;

    this.breakdown.conversation_nodes.push({
      node_name: node.name || node.id || "unknown",
      node_type: node.type,
      tokens,
      size_kb: (node.instruction.text.length / 1024).toFixed(2)
    });

    return tokens;
  }

  /**
   * Count tokens in all conversation nodes
   *
   * @param {Array} nodes - Array of conversation nodes
   * @returns {number} Total token count
   */
  countAllNodeInstructions(nodes) {
    if (!Array.isArray(nodes)) return 0;

    let totalTokens = 0;

    nodes.forEach(node => {
      if (node.type === "conversation" && node.instruction?.text) {
        totalTokens += this.countNodeInstruction(node);
      }
    });

    return totalTokens;
  }

  /**
   * Count tokens in tool schema definitions
   *
   * @param {Object} tool - Tool definition object
   * @returns {number} Token count
   */
  countToolSchema(tool) {
    if (!tool) return 0;

    // Convert tool schema to JSON string to estimate complete size
    const toolJson = JSON.stringify(tool);
    const baseTokens = this.estimateTokens(toolJson);

    // Apply JSON overhead multiplier
    const tokens = Math.ceil(baseTokens * this.JSON_OVERHEAD_MULTIPLIER);

    this.tokenCounts.tool_schemas += tokens;
    this.tokenCounts.total += tokens;

    this.breakdown.tools.push({
      tool_name: tool.name || tool.tool_id || "unknown",
      description: tool.description?.substring(0, 50) || "",
      tokens,
      parameters: Object.keys(tool.parameters?.properties || {}).length
    });

    return tokens;
  }

  /**
   * Count tokens in all tool schemas
   *
   * @param {Array} tools - Array of tool definitions
   * @returns {number} Total token count
   */
  countAllToolSchemas(tools) {
    if (!Array.isArray(tools)) return 0;

    let totalTokens = 0;

    tools.forEach(tool => {
      totalTokens += this.countToolSchema(tool);
    });

    return totalTokens;
  }

  /**
   * Count tokens in knowledge base content
   *
   * @param {string} kbContent - Knowledge base markdown content
   * @param {string} kbName - Knowledge base name
   * @returns {number} Token count
   */
  countKnowledgeBase(kbContent, kbName = "unknown") {
    const tokens = this.estimateTokens(kbContent);
    this.tokenCounts.knowledge_bases += tokens;
    this.tokenCounts.total += tokens;

    this.breakdown.knowledge_bases.push({
      name: kbName,
      tokens,
      size_kb: (kbContent.length / 1024).toFixed(2)
    });

    return tokens;
  }

  /**
   * Count tokens in dynamic variables (runtime context)
   *
   * @param {Object} dynamicVariables - Dynamic variables object
   * @returns {number} Token count
   */
  countDynamicVariables(dynamicVariables) {
    if (!dynamicVariables || typeof dynamicVariables !== "object") return 0;

    // Convert to JSON and estimate
    const variablesJson = JSON.stringify(dynamicVariables);
    const tokens = this.estimateTokens(variablesJson);

    this.tokenCounts.dynamic_variables += tokens;
    this.tokenCounts.total += tokens;

    return tokens;
  }

  /**
   * Count tokens in complete Retell agent configuration
   *
   * @param {Object} agentConfig - Parsed Retell agent JSON
   * @returns {Object} Token breakdown by component
   */
  countRetellAgent(agentConfig) {
    const breakdown = {
      global_prompt: 0,
      node_instructions: 0,
      tools: 0,
      dynamic_variables: 0,
      total: 0
    };

    // Count global prompt
    if (agentConfig.conversationFlow?.global_prompt) {
      breakdown.global_prompt = this.countGlobalPrompt(
        agentConfig.conversationFlow.global_prompt
      );
    }

    // Count all node instructions
    if (agentConfig.conversationFlow?.nodes) {
      breakdown.node_instructions = this.countAllNodeInstructions(
        agentConfig.conversationFlow.nodes
      );
    }

    // Count all tool schemas
    if (agentConfig.conversationFlow?.tools) {
      breakdown.tools = this.countAllToolSchemas(
        agentConfig.conversationFlow.tools
      );
    }

    // Count dynamic variables
    if (agentConfig.conversationFlow?.default_dynamic_variables) {
      breakdown.dynamic_variables = this.countDynamicVariables(
        agentConfig.conversationFlow.default_dynamic_variables
      );
    }

    breakdown.total =
      breakdown.global_prompt +
      breakdown.node_instructions +
      breakdown.tools +
      breakdown.dynamic_variables;

    return breakdown;
  }

  /**
   * Generate comprehensive token usage report
   *
   * @returns {Object} Token usage report with statistics
   */
  generateReport() {
    // Calculate cost estimates using Retell AI pricing model
    // Source: https://www.retellai.com/pricing (as of 2025)

    // Retell AI charges per minute, not per token
    // Baseline costs per minute:
    const VOICE_ENGINE_COST = 0.07; // $0.07/min (ElevenLabs/Cartesia)
    const LLM_COST_GPT4O = 0.05; // $0.05/min (GPT-4o baseline)
    const TELEPHONY_COST = 0.015; // $0.015/min (Retell/Twilio)
    const TOTAL_COST_PER_MINUTE =
      VOICE_ENGINE_COST + LLM_COST_GPT4O + TELEPHONY_COST; // $0.135/min

    // Average conversation length estimate
    const AVG_CONVERSATION_MINUTES = 3.5; // Typical call center call length

    // Cost per conversation
    const COST_PER_CONVERSATION =
      TOTAL_COST_PER_MINUTE * AVG_CONVERSATION_MINUTES;

    // Token density analysis (for optimization insights)
    // More tokens = potentially longer processing time = slightly higher LLM cost
    const tokenDensityFactor = this.tokenCounts.total > 10000 ? 1.1 : 1.0;
    const adjustedCostPerConversation =
      COST_PER_CONVERSATION * tokenDensityFactor;

    return {
      summary: {
        total_tokens: this.tokenCounts.total,
        global_prompt_tokens: this.tokenCounts.global_prompt,
        node_instruction_tokens: this.tokenCounts.node_instructions,
        tool_schema_tokens: this.tokenCounts.tool_schemas,
        knowledge_base_tokens: this.tokenCounts.knowledge_bases,
        dynamic_variable_tokens: this.tokenCounts.dynamic_variables
      },
      breakdown: {
        conversation_nodes: this.breakdown.conversation_nodes,
        tools: this.breakdown.tools,
        knowledge_bases: this.breakdown.knowledge_bases,
        prompts: this.breakdown.prompts
      },
      statistics: {
        average_node_tokens:
          this.breakdown.conversation_nodes.length > 0
            ? Math.ceil(
                this.tokenCounts.node_instructions /
                  this.breakdown.conversation_nodes.length
              )
            : 0,
        average_tool_tokens:
          this.breakdown.tools.length > 0
            ? Math.ceil(
                this.tokenCounts.tool_schemas / this.breakdown.tools.length
              )
            : 0,
        total_nodes: this.breakdown.conversation_nodes.length,
        total_tools: this.breakdown.tools.length,
        total_knowledge_bases: this.breakdown.knowledge_bases.length
      },
      cost_estimates: {
        cost_per_conversation: adjustedCostPerConversation.toFixed(3),
        cost_per_1000_conversations: (
          adjustedCostPerConversation * 1000
        ).toFixed(2),
        cost_per_10000_conversations: (
          adjustedCostPerConversation * 10000
        ).toFixed(2),
        pricing_model: "Retell AI per-minute pricing",
        breakdown: {
          voice_engine_per_min: `$${VOICE_ENGINE_COST}`,
          llm_per_min: `$${LLM_COST_GPT4O} (GPT-4o)`,
          telephony_per_min: `$${TELEPHONY_COST}`,
          total_per_min: `$${TOTAL_COST_PER_MINUTE}`,
          avg_call_length_minutes: AVG_CONVERSATION_MINUTES
        },
        note: "Based on Retell AI pricing (ElevenLabs voices, GPT-4o, Retell telephony). Higher-end models (GPT-4.1, Claude 3.7) cost $0.045-0.06/min LLM."
      },
      metadata: {
        estimation_method: `~${this.CHARS_PER_TOKEN} chars/token`,
        generated_at: new Date().toISOString(),
        note: "Token counts are estimates. Actual token usage may vary by model tokenizer."
      }
    };
  }

  /**
   * Format token report for console output
   *
   * @param {Object} report - Token usage report
   * @returns {string} Formatted report string
   */
  formatReportForConsole(report) {
    const lines = [];

    lines.push("\n📊 Token Usage Analysis");
    lines.push("=".repeat(60));

    lines.push("\n📈 Summary:");
    lines.push(
      `   Total Tokens: ${report.summary.total_tokens.toLocaleString()}`
    );
    lines.push(
      `   • Global Prompt: ${report.summary.global_prompt_tokens.toLocaleString()} tokens`
    );
    lines.push(
      `   • Node Instructions: ${report.summary.node_instruction_tokens.toLocaleString()} tokens (${report.statistics.total_nodes} nodes)`
    );
    lines.push(
      `   • Tool Schemas: ${report.summary.tool_schema_tokens.toLocaleString()} tokens (${report.statistics.total_tools} tools)`
    );
    lines.push(
      `   • Knowledge Bases: ${report.summary.knowledge_base_tokens.toLocaleString()} tokens (${report.statistics.total_knowledge_bases} files)`
    );
    lines.push(
      `   • Dynamic Variables: ${report.summary.dynamic_variable_tokens.toLocaleString()} tokens`
    );

    lines.push("\n📊 Statistics:");
    lines.push(
      `   • Average per Node: ${report.statistics.average_node_tokens.toLocaleString()} tokens`
    );
    lines.push(
      `   • Average per Tool: ${report.statistics.average_tool_tokens.toLocaleString()} tokens`
    );

    lines.push("\n💰 Cost Estimates (Retell AI):");
    lines.push(
      `   • Per conversation (~${report.cost_estimates.breakdown.avg_call_length_minutes}min): $${report.cost_estimates.cost_per_conversation}`
    );
    lines.push(
      `   • Per 1K conversations: $${report.cost_estimates.cost_per_1000_conversations}`
    );
    lines.push(
      `   • Per 10K conversations: $${report.cost_estimates.cost_per_10000_conversations}`
    );
    lines.push("\n📞 Retell Pricing Breakdown:");
    lines.push(
      `   • Voice: ${report.cost_estimates.breakdown.voice_engine_per_min}/min`
    );
    lines.push(`   • LLM: ${report.cost_estimates.breakdown.llm_per_min}/min`);
    lines.push(
      `   • Telephony: ${report.cost_estimates.breakdown.telephony_per_min}/min`
    );
    lines.push(
      `   • Total: ${report.cost_estimates.breakdown.total_per_min}/min`
    );
    lines.push(`\n💡 ${report.cost_estimates.note}`);

    lines.push("\n" + "=".repeat(60));

    return lines.join("\n");
  }

  /**
   * Reset all token counts and breakdowns
   */
  reset() {
    this.tokenCounts = {
      global_prompt: 0,
      node_instructions: 0,
      tool_schemas: 0,
      knowledge_bases: 0,
      dynamic_variables: 0,
      total: 0
    };

    this.breakdown = {
      conversation_nodes: [],
      tools: [],
      knowledge_bases: [],
      prompts: []
    };
  }
}

module.exports = TokenCounter;
