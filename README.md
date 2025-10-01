# Layer 7 AI Voice Receptionist Template

**Professional AI voice receptionist template with intelligent templating system, PII protection, and seamless Retell.ai + n8n integration.**

> **Template-First Approach**: Clone once, customize for unlimited clients with automated configuration management, prompt injection, and webhook templating.

---

# Table of Contents
1. [Quick Start for New Clients](#quick-start-for-new-clients)  
2. [Template Architecture](#template-architecture)  
   - [Smart Configuration System](#smart-configuration-system)  
   - [Project Structure](#project-structure)  
3. [Client Configuration Guide](#client-configuration-guide)  
   - [config.json – Control Center](#configjson--control-center)  
   - [Template Variable System](#template-variable-system)  
   - [Auto-Generated Outputs](#auto-generated-outputs)  
4. [GitHub Copilot Integration Prompts](#github-copilot-integration-prompts)  
   - [Retell Agent Flow Editing](#retell-agent-flow-editing)  
   - [n8n Workflow Development](#n8n-workflow-development)  
   - [Prompt Engineering and Security](#prompt-engineering-and-security)  
   - [Template System Extension](#template-system-extension)  
5. [Advanced Template Features](#advanced-template-features)  
   - [Intelligent Build System](#intelligent-build-system)  
   - [Extensibility Features](#extensibility-features)  
   - [CI/CD and Release Management](#cicd-and-release-management)  
6. [Deployment Guide](#deployment-guide)  
   - [Retell.ai Configuration](#retellai-configuration)  
   - [n8n Workflow Import](#n8n-workflow-import)  
   - [Integration Testing](#integration-testing)  
   - [Client Onboarding Checklist](#client-onboarding-checklist)  
7. [Real-World Client Examples](#real-world-client-examples)  
8. [Architecture Deep Dive](#architecture-deep-dive)  
   - [Conversation Flow Design](#conversation-flow-design)  
   - [Security-First Approach](#security-first-approach)  
   - [Integration Architecture](#integration-architecture)  
9. [Available Commands](#available-commands)  
10. [Release Management](#release-management)  
11. [Security Features](#security-features)  
12. [Resources and Links](#resources-and-links)  
13. [Development](#development)  
14. [Troubleshooting Guide](#troubleshooting-guide)  

---

# Quick Start for New Clients
```bash
git clone https://github.com/raulduk3/layer7-voice-ai-receptionist.git client-name-voice-ai
cd client-name-voice-ai
npm install
cp config.example.json config.json
npm run build
```

# Template Architecture

## Smart Configuration System
- Single Source of Truth: `config.json`  
- Automatic Templating  
- Prompt Injection  
- Webhook Management  

## Project Structure
```
📁 Template Repository
├── config.json
├── build.js
├── template/
│   ├── {{agent_name}} - Retell Agent.json
│   ├── prompts/
│   │   ├── {{business_name}} Core Prompt.md
│   │   └── {{business_name}} Answer Question - RAG Prompt.md
│   └── n8n/
│       ├── bookAppointment.json
│       └── ...
└── dist/
    ├── [Business] <-> [Agent] - Retell Agent.json
    ├── prompts/[Business] Core Prompt.md
    ├── knowledge-base/
    └── n8n/[workflows].json
```

# Client Configuration Guide

## config.json – Control Center
```json
{
  "business": {
    "name": "Caroline Smith's Salon",
    "agent_display_name": "Caroline Smith <-> AI Receptionist",
    "agent_human_name": "Myra"
  },
  "webhooks": {
    "bookAppointment": "id-1",
    "answerQuestion": "id-2"
  },
  "voice_settings": {
    "voice_id": "11labs-Cimo"
  },
  "dynamic_variables": {
    "phone_number": "+17734699726"
  }
}
```

## Template Variable System
| Category | Variables | Applied To | Purpose |
|----------|-----------|------------|---------|
| Business Identity | `business_name`, `agent_human_name` | Filenames, prompts | Branding |
| Infrastructure | `transfer_phone_number`, `webhooks.*` | Agent + workflows | Config |
| Voice Settings | `voice_id`, `interruption_sensitivity` | Retell agent | Voice behavior |
| Dynamic Variables | Custom fields | Prompts | Client-specific data |

# GitHub Copilot Integration Prompts

## Retell Agent Flow Editing
...  

## n8n Workflow Development  
...  

## Prompt Engineering and Security  
...  

## Template System Extension  
...  

# Advanced Template Features

## Intelligent Build System
- Two-Phase Build  
- Prompt Injection  
- Webhook Templating  
- Extensibility  

## Extensibility Features
- Add flows via config.json  
- New dynamic variables auto-injected  

## CI/CD and Release Management
- Build validation  
- Format checking  
- Automated releases  

# Deployment Guide

## Retell.ai Configuration
- Upload agent JSON  
- Verify webhook URLs  
- Configure voice settings  

## n8n Workflow Import
- Import workflows  
- Configure credentials  
- Test endpoints  

## Integration Testing
- Appointment booking  
- Question answering  
- Lead capture  
- Human escalation  

## Client Onboarding Checklist
- Config customized  
- Prompts updated  
- Build success  
- Agent uploaded  
- Workflows tested  

# Real-World Client Examples
- Dental Office  
- Multi-Location Salon  
- Review Request Flow  

# Architecture Deep Dive

## Conversation Flow Design
- Router-based  
- Context preservation  
- Error recovery  

## Security-First Approach
- PII protection  
- MFA  
- RAG prompt security  

## Integration Architecture
- Webhook templating  
- Error handling  
- Credential security  

# Available Commands
| Category | Command | Purpose |
|----------|---------|---------|
| Build | `npm run build` | Generate files |
| Build | `npm run clean` | Clear artifacts |
| Code | `npm run format` | Format files |
| Release | `npm run release:patch` | Bug fixes |
| Release | `npm run release:minor` | Features |
| Release | `npm run release:major` | Breaking changes |

# Release Management
- Semantic Versioning  
- Automated pipeline  

# Security Features
- PII filtering  
- Multi-factor appointment access  
- Secrets management  

# Resources and Links
- GitHub Repository  
- Retell.ai Documentation  
- n8n Documentation  

# Development
- Fork → Install → Customize → Build → Deploy  
- Add flows and dynamic variables  

# Troubleshooting Guide
- Validate JSON  
- Clean + rebuild  
- Check webhook config  

---
_Last Updated: October 2025_
