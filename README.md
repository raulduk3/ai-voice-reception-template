# AI Voice Reception Template - Modular Architecture

![License: AGPL v3](https://img.shields.io/badge/license-AGPL--3.0-yellow.svg)
[![Node.js](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen)](https://nodejs.org/)
[![Retell.ai](https://img.shields.io/badge/retell.ai-Compatible-blue)](https://retell.ai/)
[![n8n](https://img.shields.io/badge/n8n-Workflows-orange)](https://n8n.io/)
![Architecture](https://img.shields.io/badge/architecture-modular-green)

Professional AI voice receptionist template with **modular architecture**. Clone once, customize for
unlimited clients with automated configuration management, prompt injection, and service schema
generation.

## 🎯 Key Features

- **Modular Architecture**: Independent, focused modules with clean interfaces
- **Four-Phase Configuration**: Template vars → Build config → Runtime vars → Client data
- **Automated Prompt Injection**: Markdown prompts auto-inject into Retell agent and n8n workflows
- **Dynamic Service Schemas**: Business services automatically generate booking tool schemas
- **Unique Webhook Endpoints**: Hash-based URLs for collision-free n8n deployments
- **PII Protection**: Security-first design with appointment identification routing

## 📋 Table of Contents

### Getting Started

- [Quick Start](#quick-start)
- [Modular Architecture](#modular-architecture-overview)
- [Core Modules](#core-modules)

### Configuration & Build

- [Configuration System](#configuration-system)
- [Build Process](#build-process)
- [Available Commands](#available-commands)
- [Token Usage Tracking](#-token-usage-tracking)

### Development

- [Extension Points](#extension-points)
- [File Structure](#file-structure)
- [Data Flow](#data-flow-diagram)
- [API Reference](#api-reference)

## 🚀 Quick Start

```bash
# Clone and setup
git clone https://github.com/raulduk3/ai-voice-reception-template.git client-voice-ai
cd client-voice-ai
npm install

# Configure client (edit config.json with client details)
nano config.json

# Build with modular system
npm run build

# Deploy to n8n (optional)
npm run deploy
```

## 🏗️ Modular Architecture Overview

The build system uses **8 independent modules**, each with a single responsibility:

```
┌─────────────────────────────────────────────────────────────┐
│                      AIVoiceBuilder                         │
│                   (Orchestration Layer)                      │
└────────────────────┬────────────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
┌───────▼────────┐       ┌────────▼─────────┐
│ Configuration  │       │   Template       │
│    Loader      │──────▶│   Processor      │
└───────┬────────┘       └────────┬─────────┘
        │                         │
        │                ┌────────┴─────────────┐
        │                │                      │
┌───────▼───────┐  ┌─────▼──────┐      ┌──────▼──────┐
│   Runtime     │  │   Retell   │      │     n8n     │
│   Variable    │  │   Agent    │      │  Workflow   │
│   Builder     │  │ Processor  │      │  Processor  │
└───────┬───────┘  └─────┬──────┘      └──────┬──────┘
        │                │                     │
        └────────┬───────┴─────────────────────┘
                 │
     ┌───────────┼───────────┬───────────┐
     │           │           │           │
┌────▼─────┐ ┌──▼───┐  ┌────▼────┐  ┌──▼─────┐
│ Service  │ │Webhook│ │ Prompt  │  │  More  │
│  Schema  │ │ Gen.  │ │Injector │  │Modules │
│  Engine  │ └───────┘ └─────────┘  └────────┘
└──────────┘
```

### Key Benefits

✅ **Clear Separation**: Each module has a single, well-defined responsibility  
✅ **Easy Maintenance**: Smaller, focused codebases per module  
✅ **Simple Extension**: Add new modules without modifying existing code  
✅ **Reduced Coupling**: Modules communicate through defined contracts

## 🧩 Core Modules

### 1. ConfigurationLoader (`lib/ConfigurationLoader.js`)

**Responsibility**: Load, validate, and process `config.json`

**Key Methods**:

- `loadConfiguration()`: Load and parse configuration file
- `processEnvironmentVariables()`: Resolve `env:` references to actual values
- `validateConfiguration()`: Ensure required fields exist and are valid

**Dependencies**: None (foundational module)

### 2. RuntimeVariableBuilder (`lib/RuntimeVariableBuilder.js`)

**Responsibility**: Build all four phases of template variables

**Key Methods**:

- `buildAllPhases()`: Generate all variable sets in correct order
- `buildTemplateVariables()`: Phase 1 - Build-time metadata
- `buildConfigurationSettings()`: Phase 2 - Direct agent settings
- `buildRuntimeVariables()`: Phase 3 - Retell dynamic variables
- `buildClientDataVariables()`: Phase 4 - Content generation variables

**Dependencies**: Configuration data from ConfigurationLoader

### 3. ServiceSchemaEngine (`lib/ServiceSchemaEngine.js`)

**Responsibility**: Generate JSON schemas for service-specific booking properties

**Key Methods**:

- `validateServiceConstraints()`: Enforce system limits on services
- `generateServicePropertiesSchema()`: Build dynamic property schemas
- `buildAppointmentFunctionSchema()`: Generate complete booking schemas
- `generateAppointmentCSVColumns()`: Create CSV headers with dynamic columns

**Dependencies**: Service configuration from config.json

### 4. WebhookGenerator (`lib/WebhookGenerator.js`)

**Responsibility**: Create unique webhook URLs with collision-resistant hashes

**Key Methods**:

- `generateWebhookHashes()`: Create SHA256-based hash identifiers
- `buildWebhookUrls()`: Construct complete webhook URLs
- `getDeploymentConfig()`: Get n8n deployment information

**Dependencies**: Business name and tool configuration

### 5. PromptInjector (`lib/PromptInjector.js`)

**Responsibility**: Load and inject markdown prompts into configurations

**Key Methods**:

- `loadPrompts()`: Load processed prompt files from dist
- `getCorePrompt()`: Retrieve core prompt content
- `getRAGPrompt()`: Retrieve RAG prompt content
- `injectIntoRetellAgent()`: Update agent global_prompt
- `injectIntoN8nWorkflow()`: Update workflow system messages

**Dependencies**: Processed prompt files from dist/ directory

### 6. RetellAgentProcessor (`lib/RetellAgentProcessor.js`)

**Responsibility**: Process Retell agent JSON with multi-phase configuration

**Key Methods**:

- `processAgent()`: Main agent processing pipeline
- `updateToolWebhooks()`: Update tool webhook URLs with hashes
- `updateTransferNodes()`: Update transfer phone numbers
- `injectServiceSchemas()`: Add service-specific booking schemas

**Dependencies**: Build config, prompts, services, webhooks

### 7. N8nWorkflowProcessor (`lib/N8nWorkflowProcessor.js`)

**Responsibility**: Process n8n workflow JSON files

**Key Methods**:

- `processWorkflow()`: Main workflow processing pipeline
- `injectServiceConfiguration()`: Add service type mappings
- `updateWebhookNodes()`: Update webhook paths with hashes
- `applyTemplateVariables()`: Replace {{template}} variables

**Dependencies**: Services, webhooks, prompts, template variables

### 8. TemplateProcessor (`lib/TemplateProcessor.js`)

**Responsibility**: Orchestrate file-type routing and content processing

**Key Methods**:

- `processFile()`: Route files to appropriate processors
- `processFilename()`: Handle {{variable}} replacement in filenames
- `shouldPreserveVariables()`: Check if variables should remain for runtime
- `getContextForFile()`: Build processing context per file type

**Dependencies**: All processors (orchestration layer)

## ⚙️ Configuration System

### Four-Phase Architecture

The system uses **four distinct phases** of configuration processing:

| Phase       | Config Section         | Purpose                  | Applied To                      |
| ----------- | ---------------------- | ------------------------ | ------------------------------- |
| **Phase 1** | `templating.variables` | Build-time metadata      | Filenames, build timestamps     |
| **Phase 2** | `build_config`         | Direct agent settings    | Voice, webhooks, infrastructure |
| **Phase 3** | `runtime_variables`    | Retell dynamic variables | `{{variable}}` in prompts       |
| **Phase 4** | `client_data`          | Business information     | Knowledge base, CSV files       |

### Example Configuration

```json
{
  "templating": {
    "variables": {
      "business_name": "Acme Dental",
      "agent_name": "Acme Receptionist"
    }
  },
  "build_config": {
    "voice_settings": {
      "voice_id": "11labs-Ethan",
      "max_call_duration_ms": 600000
    },
    "infrastructure": {
      "transfer_phone_number": "5551234567",
      "base_webhook_url": "https://n8n.example.com"
    },
    "webhook_deployment": {
      "enabled": true,
      "hash_algorithm": "sha256",
      "hash_length": 8
    }
  },
  "runtime_variables": {
    "business_hours": "Mon-Fri 9am-5pm",
    "appointment_types": "Cleaning, Consultation, Emergency"
  },
  "client_data": {
    "business_info": {
      "name": "Acme Dental",
      "phone": "+15551234567",
      "email": "hello@acmedental.com"
    },
    "services": [
      {
        "name": "Cleaning",
        "duration_minutes": 60,
        "properties": {
          "required": [
            {
              "name": "insurance_provider",
              "type": "string",
              "prompt": "insurance provider name"
            }
          ]
        }
      }
    ]
  }
}
```

## 🔨 Build Process

### Two-Phase Build Pipeline

The build system processes files in two phases to ensure prompts are available for injection:

**Phase 1: Process Prompt Files**

1. Template filenames with `{{variables}}`
2. Preserve `{{variables}}` in content for Retell runtime
3. Write to `dist/prompts/`

**Phase 2: Process All Other Files**

1. Load processed prompts from dist
2. Process Retell agent with prompt injection
3. Process n8n workflows with service schemas
4. Process knowledge base and CSV files
5. Apply template variables to content files

### Build Flow Diagram

```
┌─────────────┐
│ config.json │
└──────┬──────┘
       │
       ▼
┌─────────────────────┐
│ Configuration       │
│ Loader              │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ Runtime Variable    │
│ Builder (4 phases)  │
└──────┬──────────────┘
       │
       ├──────────────────────┐
       ▼                      ▼
┌──────────┐      ┌─────────────────┐
│ Prompt   │      │ Service Schema  │
│ Files    │      │ Engine          │
│ (Phase 1)│      └────────┬────────┘
└────┬─────┘               │
     │                     ▼
     ▼              ┌─────────────┐
┌─────────────┐    │  Webhook    │
│   Prompt    │    │  Generator  │
│  Injector   │    └──────┬──────┘
└──────┬──────┘           │
       │                  │
       ├──────────────────┤
       │                  │
       ▼                  ▼
┌──────────────┐  ┌─────────────┐
│   Retell     │  │     n8n     │
│   Agent      │  │  Workflows  │
│  Processor   │  │  Processor  │
└──────┬───────┘  └──────┬──────┘
       │                 │
       └────────┬────────┘
                │
                ▼
         ┌─────────────┐
         │ Optimized   │
         │ dist/ Files │
         └─────────────┘
```

## 📦 Available Commands

```bash
# Build optimized files
npm run build

# Clean dist directory
npm run clean

# Clean and build
npm run rebuild

# Upload workflows to n8n
npm run upload

# Build and upload
npm run deploy

# Format code
npm run format
```

## 🔌 Extension Points

### Adding a New Module

To extend the build system with a new module:

1. **Create module file**: `lib/YourModule.js`
2. **Implement module class** with your functionality
3. **Update lib/index.js**: Add module to exports
4. **Integrate in build.js**: Instantiate and use in build process

### Example: Adding a ValidationModule

```javascript
// lib/ValidationModule.js
class ValidationModule {
  constructor() {
    this.rules = [];
  }

  addRule(name, validator) {
    this.rules.push({ name, validator });
  }

  async validate(data) {
    const errors = [];
    for (const rule of this.rules) {
      try {
        await rule.validator(data);
      } catch (error) {
        errors.push({ rule: rule.name, error: error.message });
      }
    }
    return errors;
  }
}

module.exports = ValidationModule;
```

```javascript
// lib/index.js
module.exports = {
  ConfigurationLoader: require("./ConfigurationLoader"),
  ValidationModule: require("./ValidationModule") // Add new module
  // ... other modules
};
```

```javascript
// build.js
const { ConfigurationLoader, ValidationModule } = require("./lib");

class AIVoiceBuilder {
  constructor() {
    this.validator = new ValidationModule();
    // ... setup validation rules
  }
  // ... use validator in build process
}
```

## 📁 File Structure

```
ai-receptionist/
├── 📄 config.json                    # Client configuration
├── 🔧 build.js                       # Main build orchestrator
├── 📦 package.json                   # Dependencies and scripts
├── 📚 README.md                      # This file
│
├── 📁 lib/                           # Modular components
│   ├── ConfigurationLoader.js       # Config loading & validation
│   ├── RuntimeVariableBuilder.js    # Four-phase variable building
│   ├── ServiceSchemaEngine.js       # Dynamic schema generation
│   ├── WebhookGenerator.js          # Unique webhook URL creation
│   ├── PromptInjector.js            # Prompt loading & injection
│   ├── RetellAgentProcessor.js      # Retell agent processing
│   ├── N8nWorkflowProcessor.js      # n8n workflow processing
│   ├── TemplateProcessor.js         # File-type orchestration
│   └── index.js                     # Module exports
│
├── 📁 src/                           # Source templates
│   ├── 🤖 {{agent_name}} - Retell Agent.json
│   ├── prompts/
│   │   ├── {{business_name}} Core Prompt.md
│   │   └── {{business_name}} Answer Question - RAG Agent Prompt.md
│   ├── knowledge-base/
│   │   ├── Primary.md
│   │   └── Supplementary.md
│   ├── sheets/
│   │   ├── Appointments.csv
│   │   ├── Leads.csv
│   │   └── Service Types.csv
│   ├── tests/
│   │   └── ... (test scenario markdown files)
│   └── workflows/
│       ├── answerQuestion.json
│       ├── bookAppointment.json
│       ├── cancelAppointment.json
│       ├── dayAndTime.json
│       ├── identifyAppointment.json
│       ├── logLead.json
│       └── modifyAppointment.json
│
└── 📁 dist/                          # Generated output (deploy these)
    ├── Processed Retell Agent
    ├── prompts/
    ├── workflows/
    └── ... (all templated files)
```

## 🔄 Data Flow Diagram

```
config.json
    │
    ├─► templating.variables ────────────► Template Variables (Phase 1)
    │                                      │
    │                                      ├─► Filenames
    │                                      └─► Build metadata
    │
    ├─► build_config ────────────────────► Build Configuration (Phase 2)
    │                                      │
    │                                      ├─► Voice settings
    │                                      ├─► Webhook URLs
    │                                      └─► Infrastructure
    │
    ├─► runtime_variables ───────────────► Runtime Variables (Phase 3)
    │                                      │
    │                                      └─► Retell {{variables}}
    │
    └─► client_data ─────────────────────► Client Data (Phase 4)
                                           │
                                           ├─► Business info
                                           ├─► Services
                                           └─► FAQ/Policies

All Four Phases
    │
    ▼
src/prompts/*.md
    │
    ├─► Template Processor (preserve {{variables}})
    │
    └─► dist/prompts/*.md
            │
            ├─► Prompt Injector
            │
            ├─► Retell Agent Processor
            │   └─► dist/[Agent].json (with prompts + service schemas)
            │
            └─► N8n Workflow Processor
                └─► dist/workflows/*.json (with service mappings)
```

## 🛠️ API Reference

### ConfigurationLoader

```javascript
const loader = new ConfigurationLoader();
const config = await loader.loadConfiguration();
// Returns: { templating, build_config, runtime_variables, client_data }
```

### RuntimeVariableBuilder

```javascript
const builder = new RuntimeVariableBuilder();
const allPhases = builder.buildAllPhases(config, packageJson, repoName);
// Returns: { templateVariables, buildConfig, runtimeVariables, clientDataVariables }
```

### ServiceSchemaEngine

```javascript
const engine = new ServiceSchemaEngine();
engine.initialize(services, constraints);
const schema = engine.buildAppointmentFunctionSchema();
// Returns: Complete JSON schema for bookAppointment tool
```

### WebhookGenerator

```javascript
const generator = new WebhookGenerator();
generator.initialize(webhookConfig);
const urls = generator.buildWebhookUrls();
// Returns: { toolName: "https://base.url/webhook/endpoint-hash", ... }
```

### PromptInjector

```javascript
const injector = new PromptInjector(distDir);
injector.initialize(businessName, distDir);
await injector.loadPrompts();
const corePrompt = injector.getCorePrompt();
// Returns: Core prompt content as string
```

### RetellAgentProcessor

```javascript
const processor = new RetellAgentProcessor();
processor.initialize(serviceEngine);
const processedAgent = await processor.processAgent(agentJson, context);
// Returns: Fully processed Retell agent JSON
```

### N8nWorkflowProcessor

```javascript
const processor = new N8nWorkflowProcessor();
const processedWorkflow = await processor.processWorkflow(workflowJson, workflowName, context);
// Returns: Fully processed n8n workflow JSON
```

### TemplateProcessor

```javascript
const processor = new TemplateProcessor();
processor.initialize(processors, templateVariables);
const result = await processor.processFile(content, filePath, context);
// Returns: Processed file content
```

### TokenCounter

```javascript
const counter = new TokenCounter();
const agentBreakdown = counter.countRetellAgent(agentConfig);
counter.countKnowledgeBase(kbContent, kbName);
const report = counter.generateReport();
// Returns: Comprehensive token usage report with cost estimates
```

## 🎯 Token Usage Tracking

The build system automatically analyzes token usage across all LLM-facing content, providing cost
estimates and optimization insights.

### What Gets Tracked

- **Global Prompt**: Main conversation instructions (identity, purpose, style)
- **Node Instructions**: Individual conversation node prompts (12+ nodes typically)
- **Tool Schemas**: Function definitions with parameters and descriptions (7 tools)
- **Knowledge Bases**: Business information and FAQ content
- **Dynamic Variables**: Runtime context injected into conversations

### Token Analysis Example

```
📊 Token Usage Analysis
============================================================

📈 Summary:
   Total Tokens: 7,692
   • Global Prompt: 1,673 tokens
   • Node Instructions: 3,097 tokens (12 nodes)
   • Tool Schemas: 2,398 tokens (7 tools)
   • Knowledge Bases: 405 tokens (2 files)
   • Dynamic Variables: 119 tokens

📊 Statistics:
   • Average per Node: 259 tokens
   • Average per Tool: 343 tokens

💰 Cost Estimates (Retell AI):
   • Per conversation (~3.5min): $0.473
   • Per 1K conversations: $472.50
   • Per 10K conversations: $4,725.00

📞 Retell Pricing Breakdown:
   • Voice: $0.07/min
   • LLM: $0.05/min (GPT-4o)
   • Telephony: $0.015/min
   • Total: $0.135/min
```

### Configuration

Enable/disable token tracking in `config.json`:

```json
{
  "build_config": {
    "token_tracking": {
      "enabled": true,
      "include_in_build_info": true,
      "generate_detailed_report": true
    }
  }
}
```

### Build Artifacts

Token tracking generates two files in `dist/`:

1. **`build-info.json`**: Includes summary token counts
2. **`token-usage-report.json`**: Detailed breakdown by component

### Token Report Structure

```json
{
  "summary": {
    "total_tokens": 7692,
    "global_prompt_tokens": 1673,
    "node_instruction_tokens": 3097,
    "tool_schema_tokens": 2398,
    "knowledge_base_tokens": 405,
    "dynamic_variable_tokens": 119
  },
  "breakdown": {
    "conversation_nodes": [
      {
        "node_name": "Router",
        "node_type": "conversation",
        "tokens": 286,
        "size_kb": "1.12"
      }
    ],
    "tools": [
      {
        "tool_name": "bookAppointment",
        "tokens": 412,
        "parameters": 8
      }
    ]
  },
  "cost_estimates": {
    "cost_per_conversation": "0.473",
    "cost_per_1000_conversations": "472.50",
    "cost_per_10000_conversations": "4725.00",
    "pricing_model": "Retell AI per-minute pricing",
    "breakdown": {
      "voice_engine_per_min": "$0.07",
      "llm_per_min": "$0.05 (GPT-4o)",
      "telephony_per_min": "$0.015",
      "total_per_min": "$0.135",
      "avg_call_length_minutes": 3.5
    },
    "note": "Based on Retell AI pricing (ElevenLabs voices, GPT-4o, Retell telephony)."
  }
}
```

### Estimation Method

- **Token Counting**: ~4 chars/token (GPT-4/Claude average)
- **JSON Overhead**: +15% for schema structure
- **Cost Model**: Retell AI per-minute pricing (not per-token)
- **Pricing Source**: https://www.retellai.com/pricing
- **Baseline Stack**:
  - Voice: ElevenLabs/Cartesia ($0.07/min)
  - LLM: GPT-4o ($0.05/min)
  - Telephony: Retell/Twilio ($0.015/min)
  - **Total**: $0.135/min
- **Call Length**: 3.5 minutes average
- **Accuracy**: ±15% typical variance (call length dependent)

### Optimization Tips

**Reduce Token Usage:**

1. **Simplify Node Instructions**: Combine related steps, remove examples
2. **Streamline Tool Descriptions**: Be concise, avoid redundancy
3. **Optimize Knowledge Base**: Keep FAQ answers brief and focused
4. **Minimize Global Prompt**: Remove unnecessary context

**Impact Analysis:**

- **Token Usage Impact**: High token counts can increase processing time, slightly raising costs
- **Optimize high-frequency nodes**: Router and Q&A nodes are used most often
- **Tool schemas**: Loaded every function call - keep concise
- **Model Selection Impact**:
  - GPT-4o: $0.05/min (baseline)
  - GPT-4.1: $0.045/min (faster, cheaper)
  - Claude 3.7: $0.06/min (premium quality)
  - GPT-4o mini: $0.006/min (budget option)
- **Voice Engine Impact**:
  - ElevenLabs/Cartesia: $0.07/min
  - OpenAI Voices: $0.08/min

### CI/CD Integration

Token reports are automatically included in GitHub releases:

```yaml
## 🎯 Token Usage Analysis
- 🔢 Total Tokens: 7,692
- 💬 Conversation Nodes: 12
- 🛠️ Tools Configured: 7
- 💰 Cost per Conversation (~3.5min): $0.47
- 💰 Cost per 1K Calls: $473
- 📊 Retell Pricing: $0.135/min (voice + LLM + telephony)
```

## 📄 License

AGPL-3.0 - See [LICENSE.txt](LICENSE.txt) for details.

## 🤝 Contributing

Contributions are welcome! The modular architecture makes it easy to:

1. Add new modules without affecting existing code
2. Extend functionality through new processors
3. Improve individual modules independently

## 📞 Support

For issues, questions, or feature requests, please open an issue on GitHub.

---

**Built with ❤️ by the Layer 7 team**
