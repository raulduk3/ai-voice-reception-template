# AI Voice Receptionist Template
[![GitHub release](https://img.shields.io/github/v/release/raulduk3/ai-voice-reception-template)](https://github.com/raulduk3/layer7-ai-voice/releases/latest)
[![GitHub Actions Workflow Status](https://img.shields.io/github/actions/workflow/status/raulduk3/ai-voice-reception-template/build-deploy.yml)](https://github.com/raulduk3/ai-voice-reception-template/actions/workflows/build-deploy.yml)
![License: AGPL v3](https://img.shields.io/badge/license-AGPL--3.0-yellow.svg)
[![Node.js](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen)](https://nodejs.org/)
[![Retell.ai](https://img.shields.io/badge/retell.ai-Compatible-blue)](https://retell.ai/)
[![n8n](https://img.shields.io/badge/n8n-Workflows-orange)](https://n8n.io/)

Professional AI voice receptionist template with intelligent templating system, PII protection, and seamless Retell.ai + n8n integration. Template-first approach: clone once, customize for unlimited clients with automated configuration management.

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
- [Deployment](#deployment)
- [Available Commands](#available-commands)
- [Real-World Examples](#real-world-examples)

### Development & Extension
- [File Structure](#file-structure)
- [Development](#development)
- [Resources](#resources)


## Quick Start

```bash
# Clone and setup
git clone https://github.com/raulduk3/layer7-ai-voice.git client-voice-ai
cd client-voice-ai
npm install

# Configure client
cp config.example.json config.json
# Edit config.json with client details

# Build
npm run build
```

## Features

- **Single Config**: `config.json` drives all customization
- **Prompt Injection**: Markdown prompts auto-inject into configurations  
- **Webhook Templating**: Dynamic URL generation per tool
- **PII Protection**: Security-first design with appointment identification
- **GitHub Copilot**: Custom slash commands for development

## Template Architecture

### Smart Configuration System
- **Single Source of Truth**: `config.json` drives all template variables
- **Automatic Templating**: Filenames, content, and configurations update automatically  
- **Prompt Injection**: Markdown prompts auto-inject into Retell agent and n8n workflows
- **Webhook Management**: Per-tool webhook URL configuration with environment support

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
│   └── ⚙️ n8n/                    # Workflow templates  
│       ├── answerQuestion.json
│       ├── bookAppointment.json
│       ├── cancelAppointment.json
│       ├── identifyAppointment.json
│       ├── logLead.json
│       └── modifyAppointment.json
└── 📁 dist/                       # Generated files (deploy these)
    ├── 🤖 [Business Name] - Retell Agent.json
    ├── 📝 prompts/[Business Name] Core Prompt.md
    ├── knowledge-base/[all markdown and text files]
    └── ⚙️ n8n/[all workflows with templated webhooks].json
```

## Configuration

Edit `config.json` with your client details:

```json
{
  "business": {
    "name": "Caroline Smith's Salon",
    "agent_display_name": "Caroline Smith <-> Layer 7 AI Voice Receptionist", 
    "agent_human_name": "Myra",
    "ai_support_hours": "24/7"
  },
  "infrastructure": {
    "transfer_phone_number": "+17734699726"
  },
  "webhooks": {
    "base_url": "https://your-n8n-instance.com/webhook",
    "bookAppointment": "unique-webhook-id-1",
    "answerQuestion": "unique-webhook-id-2",
    "logLead": "unique-webhook-id-3",
    "identifyAppointment": "unique-webhook-id-4", 
    "modifyAppointment": "unique-webhook-id-5",
    "cancelAppointment": "unique-webhook-id-6"
  },
  "voice_settings": {
    "voice_id": "11labs-Cimo",
    "max_call_duration_ms": 600000,
    "interruption_sensitivity": 0.9
  },
  "dynamic_variables": {
    "phone_number": "+17734699726",
    "address": "123 Beauty Lane, Chicago, IL 60601",
    "website": "www.carolinesmithsalon.com",
    "specialties": "Hair styling, coloring, and treatments"
  }
}
```

### Template Variable System

| Category | Variables | Auto-Applied To | Purpose |
|----------|-----------|-----------------|---------|
| **Business Identity** | `business_name`, `agent_display_name`, `agent_human_name` | Filenames, Retell agent, prompts | Client branding |
| **Infrastructure** | `transfer_phone_number`, `webhooks.*` | Transfer nodes, tool URLs | Technical config |
| **Voice Settings** | `voice_id`, `max_call_duration_ms`, `interruption_sensitivity` | Retell agent settings | Call behavior |
| **Dynamic Variables** | Custom fields in `dynamic_variables` | Retell runtime variables | Client-specific data |

## Action Schemas & Integration

### The Flexible Joint: How Retell.ai Connects to n8n

The system's power lies in its **action schemas** - standardized JSON contracts that define how the Retell.ai agent communicates with n8n workflows. Each action schema serves as a flexible joint, allowing client-specific customization while maintaining consistent data flow.

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
      "customerName": {"type": "string", "description": "Full customer name"},
      "phoneNumber": {"type": "string", "description": "Customer phone number"},
      "serviceType": {"type": "string", "description": "Type of service requested"},
      "preferredDate": {"type": "string", "description": "Preferred appointment date"},
      "preferredTime": {"type": "string", "description": "Preferred time slot"}
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
// Before templating (generic)
"url": "https://generic-n8n.com/webhook/bookAppointment"

// After templating (client-specific)
"url": "https://salon-client-n8n.com/webhook/book-salon-appointment"
```

The build system automatically:
- ✅ **Templates webhook URLs** for each client's n8n instance
- ✅ **Validates action schemas** against n8n workflow expectations
- ✅ **Injects business logic** into parameter validation
- ✅ **Customizes response messages** with client branding

## GitHub Copilot Commands

| Command | Purpose |
|---------|---------|
| `/retell-flow` | Modify conversation flows |
| `/n8n-workflow` | Create/modify workflows |
| `/secure-prompt` | Update prompts with security |
| `/extend-template` | Extend system features |

## Deployment

### 1. Retell.ai Setup
Upload `dist/[Business Name] - Retell Agent.json` to Retell.ai

### 2. n8n Setup  
Import workflow files from `dist/` directory

### 3. Test Integration
Verify webhook endpoints and conversation flows

## Security

- **PII Protection**: No personal info in general responses
- **Appointment Routing**: Sensitive queries go through identification
- **Secure Prompts**: Built-in security constraints
- **Dynamic Variables**: Runtime template replacement

## Available Commands

| Category | Command | Purpose |
|----------|---------|---------|
| **Build** | `npm run build` | Generate production files |
| **Build** | `npm run clean` | Clear build artifacts |
| **Build** | `npm run rebuild` | Clean + build (recommended) |
| **Code** | `npm run format` | Format all files with Prettier |
| **Release** | `npm run release:patch` | Bug fixes (1.0.0 → 1.0.1) |
| **Release** | `npm run release:minor` | New features (1.0.0 → 1.1.0) |
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

## Real-World Examples

### Example 1: Dental Office Setup
```json
// config.json for Downtown Dental Care
{
  "business": {
    "name": "Downtown Dental Care",
    "agent_display_name": "Downtown Dental Care AI Receptionist",
    "agent_human_name": "Sarah", 
    "ai_support_hours": "Monday-Friday 8AM-5PM"
  },
  "dynamic_variables": {
    "services": "Cleanings, Fillings, Root Canals, Whitening",
    "insurance_accepted": "Most major insurance plans accepted",
    "emergency_line": "+1234567890"
  }
}
```

**Generated Files:**
- `Downtown Dental Care AI Receptionist - Retell Agent.json`
- `Downtown Dental Care Core Prompt.md`
- All n8n workflows with dental office webhook URLs

### Example 2: Multi-Location Salon Chain
```json
// config.json for Bella's Beauty Network
{
  "business": {
    "name": "Bella's Beauty Network",
    "agent_display_name": "Bella <-> AI Concierge", 
    "agent_human_name": "Isabella",
    "ai_support_hours": "Daily 7AM-10PM"
  },
  "dynamic_variables": {
    "locations": "Downtown, Westside, North Beach locations",
    "services": "Hair, Nails, Skin Care, Massage Therapy",
    "booking_app": "Download our app for easy scheduling"
  }
}
```

### Example 3: Adding Review Request Feature

#### Step 1: Update config.json
```json
{
  "webhooks": {
    // ... existing webhooks
    "requestReview": "review-system-webhook-id"
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
├── template/                # Source templates (edit these)
│   ├── prompts/             # Business-specific prompts (templated)
│   ├── knowledge-base/      # RAG knowledge files (templated)  
│   ├── *.json               # Agent/workflow configs (templated)
│   └── n8n/                # n8n workflow templates
└── dist/                    # Generated client files (deploy these)
    ├── prompts/             # Processed prompts with injected content
    ├── knowledge-base/      # Client-specific knowledge base
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

1. **Add New Tools**: Update `config.json` webhooks, create matching n8n workflow
2. **Modify Flows**: Use `/retell-flow` Copilot command for conversation logic
3. **Update Prompts**: Edit markdown files in `template/prompts/`  
4. **Extend Templates**: Use `/extend-template` Copilot command for system features
5. **Custom Actions**: Define new action schemas with proper parameter validation

### Troubleshooting

#### Common Issues & Solutions

**Build Problems**
```bash
# Validate JSON syntax
find template/ -name "*.json" -exec node -pe "JSON.parse(require('fs').readFileSync('{}', 'utf8')); '✓ {}'" \;

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
- [GitHub Copilot Prompts](.github/copilot-prompts/) - Development assistance

### Repository Links
- **GitHub Repository**: https://github.com/raulduk3/layer7-ai-voice
- **Latest Releases**: https://github.com/raulduk3/layer7-ai-voice/releases
- **Actions History**: https://github.com/raulduk3/layer7-ai-voice/actions

### Template Updates
```bash
# Stay current with template improvements
git remote add upstream https://github.com/raulduk3/layer7-ai-voice.git
git fetch upstream
git merge upstream/main  # Carefully merge template updates
```

---

_Built with ❤️ for professional AI voice reception systems._
