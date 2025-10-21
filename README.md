# AI Voice Reception Template

![License: AGPL v3](https://img.shields.io/badge/license-AGPL--3.0-yellow.svg)
[![Node.js](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen)](https://nodejs.org/)
[![Retell.ai](https://img.shields.io/badge/retell.ai-Compatible-blue)](https://retell.ai/)
[![n8n](https://img.shields.io/badge/n8n-Workflows-orange)](https://n8n.io/)

Professional AI voice receptionist template with intelligent four-phase configuration system, PII
protection, and seamless Retell.ai + n8n integration. Template-first approach: clone once, customize
for unlimited clients with automated configuration management and prompt injection.

## Table of Contents

### Getting Started

- [Quick Start](#quick-start)
- [Template Architecture](#template-architecture)
- [Configuration](#configuration)

### Core Architecture

- [Action Schemas & Integration](#action-schemas--integration)
- [GitHub Copilot Commands](#github-copilot-commands)
- [Security Features](#security)

### Deployment & Operations

- [Available Commands](#available-commands)
- [Release Management](#release-management)
- [Real-World Examples](#real-world-examples)

### Development & Extension

- [File Structure](#file-structure)
- [Development](#development)
- [Resources](#resources)

## Quick Start

```bash
# Clone and setup
git clone https://github.com/raulduk3/ai-voice-reception-template.git client-voice-ai
cd client-voice-ai
npm install

# Configure client (edit config.json with client details)
# See CONFIG.md for detailed configuration guide

# Build
npm run build
```

## Features

### Core Capabilities

- **Single Config**: `config.json` drives all customization through four-phase processing
- **Prompt Injection**: Markdown prompts auto-inject into Retell agent and n8n workflows
- **Webhook Templating**: Dynamic URL generation per tool with environment support
- **Service Type Injection**: Automatically injects business services into booking schemas
- **PII Protection**: Security-first design with appointment identification routing

### Development & Testing

- **GitHub Copilot**: Custom slash commands for rapid development (`/retell-flow`, `/n8n-workflow`,
  `/secure-prompt`)
- **Comprehensive Testing**: Built-in test scenarios with business context and persona-based testing
- **Client Data Processing**: Structured business information for automated knowledge base
  generation
- **Build Optimization**: Intelligent file processing with size reduction and validation

### Integration Architecture

- **Multi-Phase Build**: Template variables → Build config → Runtime variables → Client data
- **File Type Intelligence**: Different processing for prompts, workflows, knowledge base, and test
  files
- **Business Context**: Automatic injection of services, hours, policies into all relevant
  components

## Template Architecture

### Smart Configuration System

- **Single Source of Truth**: `config.json` drives all template variables
- **Automatic Templating**: Filenames, content, and configurations update automatically
- **Prompt Injection**: Markdown prompts auto-inject into Retell agent and n8n workflows
- **Webhook Management**: Per-tool webhook URL configuration with environment support
- **Service Type Injection**: Automatically injects service types from config into booking tools
- **Multi-Phase Processing**: Four distinct configuration phases for maximum flexibility

### Project Structure

```
📁 Template Repository
├── 📄 config.json                 # Client configuration & template variables
├── 🔧 build.js                    # Smart templating engine with prompt injection
├── 📁 src/                        # Source templates (edit these)
│   ├── 🤖 {{agent_name}} - Retell Agent.json
│   ├── 📝 prompts/
│   │   ├── {{business_name}} Core Prompt.md
│   │   └── {{business_name}} Answer Question - RAG Agent Prompt.md
│   ├── 📚 knowledge-base/
│   │   ├── Primary.md
│   │   └── Supplementary.md
│   ├── 📊 sheets/
│   │   ├── {{business_name}} Appointments.csv
│   │   ├── {{business_name}} Leads.csv
│   │   └── {{business_name}} Service Types.csv
│   ├── 🧪 tests/                  # Test scenarios and personas
│   └── ⚙️ n8n/                    # Workflow templates
│       ├── answerQuestion.json
│       ├── bookAppointment.json
│       ├── cancelAppointment.json
│       ├── identifyAppointment.json
│       ├── logLead.json
│       ├── modifyAppointment.json
│       └── timeAndDay.json
└── 📁 dist/                       # Generated files (deploy these)
    ├── 🤖 [Business Name] - Retell Agent.json
    ├── 📝 prompts/[Business Name] Core Prompt.md
    ├── 📚 knowledge-base/[templated content]
    ├── 📊 sheets/[business-specific CSV files]
    ├── 🧪 tests/[templated test scenarios]
    └── ⚙️ n8n/[all workflows with templated webhooks].json
```

## Configuration

Edit `config.json` with your client details. The configuration file has four main sections:

```json
{
  "templating": {
    "variables": {
      "business_name": "Your Business Name",
      "agent_name": "Your Business AI Voice Receptionist"
    }
  },
  "client_data": {
    "business_info": {
      "name": "Your Business Name",
      "email": "hello@yourbusiness.com",
      "phone": "+1234567890",
      "website": "https://yourbusiness.com",
      "address": { "city": "Your City", "state": "State" },
      "timezone": "America/New_York"
    },
    "services": [
      {
        "name": "Consultation",
        "duration_minutes": 60,
        "description": "Initial consultation"
      }
    ],
    "business_hours": {
      "monday": "9:00 AM - 5:00 PM",
      "display": "Mon-Fri 9am-5pm"
    }
  },
  "build_config": {
    "voice_settings": {
      "voice_id": "11labs-Cimo",
      "max_call_duration_ms": 600000,
      "interruption_sensitivity": 0.9
    },
    "infrastructure": {
      "transfer_phone_number": "+1234567890"
    },
    "webhooks": {
      "base_url": "https://your-n8n-instance.com",
      "tools": {
        "bookAppointment": "webhook/bookAppointment",
        "answerQuestion": "webhook/answerQuestion"
      }
    }
  },
  "runtime_variables": {
    "business_name": "Your Business Name",
    "appointment_types": "Consultations, Services",
    "transfer_phone_number": "+1234567890"
  }
}
```

See [CONFIG.md](CONFIG.md) for detailed configuration documentation.

### Configuration Architecture

The system uses a **four-phase configuration approach** for maximum flexibility:

| Phase                      | Config Section         | Purpose                                   | Applied To                                  |
| -------------------------- | ---------------------- | ----------------------------------------- | ------------------------------------------- |
| **1. Template Variables**  | `templating.variables` | Build-time filename & content replacement | File names, build metadata                  |
| **2. Build Configuration** | `build_config`         | Direct Retell agent settings              | Voice settings, webhooks, infrastructure    |
| **3. Runtime Variables**   | `runtime_variables`    | Retell dynamic variables for prompts      | `{{variable}}` replacement in conversations |
| **4. Client Data**         | `client_data`          | Business information for knowledge base   | Knowledge base, sheets, structured data     |

### Key Configuration Sections

| Section               | Variables                                                      | Purpose                               |
| --------------------- | -------------------------------------------------------------- | ------------------------------------- |
| **Business Identity** | `business_name`, `agent_name`                                  | Client branding and agent naming      |
| **Infrastructure**    | `transfer_phone_number`, `webhooks.tools.*`                    | Technical endpoints and phone routing |
| **Voice Settings**    | `voice_id`, `max_call_duration_ms`, `interruption_sensitivity` | Call behavior and voice configuration |
| **Runtime Data**      | Custom fields in `runtime_variables`                           | Dynamic content in conversations      |

## Action Schemas & Integration

### The Flexible Joint: How Retell.ai Connects to n8n

The system's power lies in its **action schemas** - standardized JSON contracts that define how the
Retell.ai agent communicates with n8n workflows. Each action schema serves as a flexible joint,
allowing client-specific customization while maintaining consistent data flow.

#### Action Schema Architecture

```json
// Example: bookAppointment action schema in Retell agent
{
  "name": "bookAppointment",
  "url": "{{webhook_base_url}}/webhook/{{webhooks.bookAppointment}}",
  "description": "Book a new appointment for the client",
  "parameters": {
    "type": "object",
    "properties": {
      "customerName": { "type": "string", "description": "Full customer name" },
      "phoneNumber": { "type": "string", "description": "Customer phone number" },
      "serviceType": { "type": "string", "description": "Type of service requested" },
      "preferredDate": { "type": "string", "description": "Preferred appointment date" },
      "preferredTime": { "type": "string", "description": "Preferred time slot" }
    },
    "required": ["customerName", "phoneNumber", "serviceType"]
  }
}
```

#### How the Retell Agent Ensures Proper Execution

1. **Schema Validation**: The agent validates all required parameters before making webhook calls
2. **Data Collection**: Conversation flows guide users to provide all necessary information
3. **Error Handling**: Missing or invalid data triggers clarification requests
4. **Retry Logic**: Failed webhook calls are handled gracefully with user-friendly messages

#### Client Customization Points

- **Webhook URLs**: Each client gets unique n8n webhook endpoints
- **Parameter Schema**: Business-specific fields can be added to action schemas
- **Validation Rules**: Custom validation logic for business requirements
- **Response Handling**: Client-specific success/failure message customization

#### Template System Benefits

```json
// Before templating (in src/{{agent_name}} - Retell Agent.json)
{
  "name": "bookAppointment",
  "url": "placeholder-will-be-replaced"
}

// After templating (in dist/[Business Name] - Retell Agent.json)
{
  "name": "bookAppointment",
  "url": "https://your-n8n-instance.com/webhook/bookAppointment"
}
```

The build system automatically:

- ✅ **Templates webhook URLs** using `build_config.webhooks` configuration
- ✅ **Injects service types** from `client_data.services` into booking tools
- ✅ **Applies voice settings** from `build_config.voice_settings`
- ✅ **Hydrates runtime variables** for Retell's `{{variable}}` system
- ✅ **Injects prompts** from markdown files into agent configuration

## GitHub Copilot Commands

| Command            | Purpose                        |
| ------------------ | ------------------------------ |
| `/retell-flow`     | Modify conversation flows      |
| `/n8n-workflow`    | Create/modify workflows        |
| `/secure-prompt`   | Update prompts with security   |
| `/extend-template` | Update build templating system |

## Security

- **PII Protection**: No personal info in general responses
- **Appointment Routing**: Sensitive queries go through identification
- **Secure Prompts**: Built-in security constraints
- **Dynamic Variables**: Runtime template replacement

## Available Commands

| Category    | Command                 | Purpose                          |
| ----------- | ----------------------- | -------------------------------- |
| **Build**   | `npm run build`         | Generate production files        |
| **Build**   | `npm run clean`         | Clear build artifacts            |
| **Build**   | `npm run rebuild`       | Clean + build (recommended)      |
| **Code**    | `npm run format`        | Format all files with Prettier   |
| **Release** | `npm run release:patch` | Bug fixes (1.0.0 → 1.0.1)        |
| **Release** | `npm run release:minor` | New features (1.0.0 → 1.1.0)     |
| **Release** | `npm run release:major` | Breaking changes (1.0.0 → 2.0.0) |

### Release Management

The template uses **semantic versioning** (SemVer) for clear version management:

```bash
# For bug fixes and small improvements
npm run release:patch

# For new features and enhancements
npm run release:minor

# For breaking changes or major updates
npm run release:major
```

#### Automatic Release Process

1. **Validates** working directory is clean
2. **Pulls** latest changes from main branch
3. **Runs** build to ensure everything works
4. **Bumps** version in package.json
5. **Updates** build-info.json with new version
6. **Commits** version changes
7. **Creates** and pushes git tag
8. **Triggers** GitHub Actions to create release

### Build Performance

The build system is highly optimized for speed and efficiency:

- **Fast Processing**: Typical build time under 200ms for full project
- **Smart Optimization**: JSON files get ~25% size reduction through minification
- **Intelligent Caching**: Prompts processed first, then loaded for injection into other files
- **Selective Processing**: Different file types get appropriate processing (templating vs.
  injection vs. copying)
- **Comprehensive Output**: 27 files processed including agent config, prompts, workflows, knowledge
  base, sheets, and tests

## Real-World Examples

### Example 1: Dental Office Setup

```json
// config.json for Downtown Dental Care
{
  "templating": {
    "variables": {
      "business_name": "Downtown Dental Care",
      "agent_name": "Downtown Dental Care AI Receptionist"
    }
  },
  "client_data": {
    "business_info": {
      "name": "Downtown Dental Care",
      "phone": "+1234567890"
    },
    "services": [
      { "name": "Cleaning", "duration_minutes": 60 },
      { "name": "Filling", "duration_minutes": 45 },
      { "name": "Root Canal", "duration_minutes": 90 }
    ]
  },
  "runtime_variables": {
    "business_name": "Downtown Dental Care",
    "business_description": "Family dental practice serving downtown for over 20 years",
    "appointment_types": "Cleanings, Fillings, Root Canals",
    "transfer_phone_number": "+1234567890"
  }
}
```

**Generated Files:**

- `Downtown Dental Care AI Receptionist - Retell Agent.json`
- `Downtown Dental Care Core Prompt.md`
- `Downtown Dental Care Answer Question - RAG Agent Prompt.md`
- All n8n workflows with templated webhook URLs
- Knowledge base with dental office information
- Test scenarios with dental office context

### Example 2: Multi-Location Salon Chain

```json
// config.json for Bella's Beauty Network
{
  "templating": {
    "variables": {
      "business_name": "Bella's Beauty Network",
      "agent_name": "Bella Beauty AI Concierge"
    }
  },
  "client_data": {
    "business_info": {
      "name": "Bella's Beauty Network",
      "description": "Multi-location beauty salon chain"
    },
    "services": [
      { "name": "Hair Styling", "duration_minutes": 90 },
      { "name": "Nail Service", "duration_minutes": 60 },
      { "name": "Massage Therapy", "duration_minutes": 60 }
    ]
  },
  "runtime_variables": {
    "business_name": "Bella's Beauty Network",
    "business_description": "Multi-location beauty salon chain specializing in hair, nails, and wellness",
    "appointment_types": "Hair Styling, Nail Services, Massage Therapy",
    "ai_support_hours": "Daily 7AM-10PM"
  }
}
```

### Example 3: Adding Review Request Feature

#### Step 1: Update config.json

```json
{
  "build_config": {
    "webhooks": {
      "tools": {
        "bookAppointment": "webhook/bookAppointment",
        "answerQuestion": "webhook/answerQuestion",
        "requestReview": "webhook/requestReview"
      }
    }
  }
}
```

#### Step 2: Add Router Edge (using Copilot)

Use `/retell-flow Add review request flow` to automatically generate the conversation logic that:

- Triggers when caller mentions reviews, feedback, or rating
- Collects phone number for SMS
- Calls requestReview tool with proper data validation
- Handles success/failure responses appropriately
- Routes back to main conversation seamlessly

#### Step 3: Create n8n Workflow

Use `/n8n-workflow Create review request system` to build a workflow that:

- Receives structured data from Retell agent
- Sends SMS with personalized review link
- Tracks review requests in database
- Returns standardized response format to Retell
- Includes comprehensive error handling

## File Structure

```
├── config.json              # Client configuration & template variables
├── build.js                 # Smart templating engine with prompt injection
├── CONFIG.md                # Detailed configuration documentation
├── src/                     # Source templates (edit these)
│   ├── {{agent_name}} - Retell Agent.json  # Main agent configuration
│   ├── prompts/             # Business-specific prompts (templated)
│   │   ├── {{business_name}} Core Prompt.md
│   │   └── {{business_name}} Answer Question - RAG Agent Prompt.md
│   ├── knowledge-base/      # RAG knowledge files (templated)
│   │   ├── Primary.md
│   │   └── Supplementary.md
│   ├── sheets/              # CSV templates for data management
│   │   ├── {{business_name}} Appointments.csv
│   │   ├── {{business_name}} Leads.csv
│   │   └── {{business_name}} Service Types.csv
│   ├── tests/               # Test scenarios with business context
│   └── n8n/                # n8n workflow templates
│       ├── answerQuestion.json
│       ├── bookAppointment.json
│       ├── cancelAppointment.json
│       ├── identifyAppointment.json
│       ├── logLead.json
│       ├── modifyAppointment.json
│       └── timeAndDay.json
└── dist/                    # Generated client files (deploy these)
    ├── [Agent Name] - Retell Agent.json  # Ready for Retell.ai import
    ├── prompts/             # Processed prompts with injected content
    ├── knowledge-base/      # Client-specific knowledge base
    ├── sheets/              # Business-specific CSV files
    ├── tests/               # Templated test scenarios
    ├── n8n/                # Workflows with templated webhooks
    └── build-info.json     # Build statistics and optimization metrics
```

## Development

### Core Architecture Principles

#### Conversation Flow Design

- **Router-Based**: Central routing logic with intelligent intent detection
- **Context Preservation**: Conversation state maintained throughout call
- **Error Recovery**: Graceful fallbacks for failed operations
- **Human Escalation**: Smart transfer logic based on business hours

#### Security-First Approach

- **PII Protection**: Multi-layer filtering prevents data exposure
- **Two-Factor Auth**: Appointment access requires multiple verification factors
- **Prompt Injection Prevention**: Bulletproof RAG security guidelines
- **Audit Trail**: Complete conversation logging for compliance

#### Integration Architecture

- **Action Schema Validation**: Ensures data integrity between Retell.ai and n8n
- **Webhook Templating**: Environment-specific endpoint configuration
- **Error Handling**: Consistent response formats across all tools
- **Timeout Management**: Graceful handling of external service delays

### Extending the System

1. **Add New Tools**: Update `build_config.webhooks.tools` in config.json, create matching n8n
   workflow in `src/n8n/`
2. **Modify Flows**: Use `/retell-flow` Copilot command for conversation logic
3. **Update Prompts**: Edit markdown files in `src/prompts/`
4. **Custom Actions**: Define new action schemas with proper parameter validation
5. **Update Client Data**: Modify `client_data` section for business information and services

### Troubleshooting

#### Common Issues & Solutions

**Build Problems**

```bash
# Validate JSON syntax
find src/ -name "*.json" -exec node -pe "JSON.parse(require('fs').readFileSync('{}', 'utf8')); '✓ {}'" \;

# Check prompt injection
npm run clean && npm run build
ls -la dist/prompts/  # Should contain processed prompt files
```

**Template Variables Not Working**

```bash
# Check config.json syntax
cat config.json | jq .  # Should parse without errors

# Verify filename templating
ls -la dist/  # Filenames should show actual business name
```

**Webhook Configuration Issues**

```bash
# Verify webhook URL templating
jq '.conversationFlow.tools[] | {name: .name, url: .url}' "dist/*Retell Agent.json"

# Check n8n endpoint matching
grep -r "webhook" dist/n8n/
```

## Resources

### Documentation

- [Retell.ai Documentation](https://docs.retell.ai) - Conversation flows, voice settings
- [n8n Documentation](https://docs.n8n.io) - Workflow automation, node configuration
- [GitHub Copilot Instructions](.github/copilot-instructions.md) - Development assistance with slash
  commands
- [GitHub Copilot Prompts](.github/prompts/) - Detailed prompt files for development workflows

### Repository Links

- **GitHub Repository**: https://github.com/raulduk3/ai-voice-reception-template
- **Latest Releases**: https://github.com/raulduk3/ai-voice-reception-template/releases
- **Actions History**: https://github.com/raulduk3/ai-voice-reception-template/actions

### Template Updates

```bash
# Stay current with template improvements
git remote add upstream https://github.com/raulduk3/ai-voice-reception-template.git
git fetch upstream
git merge upstream/main  # Carefully merge template updates
```

---

_Built with ❤️ for professional AI voice reception systems._
