# Layer 7 AI Voice Receptionist Template
[![GitHub release](https://img.shields.io/github/v/release/raulduk3/layer7-ai-voice)](https://github.com/raulduk3/layer7-ai-voice/releases/latest)
[![Build Status](https://img.shields.io/github/actions/workflow/status/raulduk3/layer7-ai-voice/build.yml)](https://github.com/raulduk3/layer7-ai-voice/actions/workflows/build.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen)](https://nodejs.org/)
[![Retell.ai](https://img.shields.io/badge/Retell.ai-Compatible-blue)](https://retell.ai/)
[![n8n](https://img.shields.io/badge/n8n-Workflows-orange)](https://n8n.io/)

Professional AI voice receptionist template with intelligent templating system, PII protection, and seamless Retell.ai + n8n integration. Template-first approach: clone once, customize for unlimited clients.

## Table of Contents

### Getting Started
- [Quick Start for New Clients](#-quick-start-for-new-clients)
- [Template Architecture](#️-template-architecture)
- [Client Configuration Guide](#-client-configuration-guide)

### Development & Extension
- [GitHub Copilot Integration](#-github-copilot-integration)
- [Advanced Template Features](#-advanced-template-features)
- [Real-World Client Examples](#-real-world-client-examples)

### Deployment & Operations
- [Deployment Guide](#-deployment-guide)
- [Available Commands](#️-available-commands)
- [Release Management](#-release-management)

### Security & Architecture  
- [Security Features](#️-security-features)
- [Architecture Deep Dive](#-architecture-deep-dive)
- [Development Guide](#️-development)

### Support & Troubleshooting
- [Troubleshooting Guide](#-troubleshooting-guide)
- [Resources & Links](#-resources--links)


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

## Configuration

Edit `config.json` with your client details:

```json
{
  "business": {
    "name": "Your Business Name",
    "phone": "+1234567890", 
    "address": "123 Main St, City, State",
    "hours": "Monday-Friday 9AM-5PM"
  },
  "infrastructure": {
    "base_webhook_url": "https://your-n8n-instance.com"
  },
  "webhooks": {
    "answerQuestion": "https://your-n8n-instance.com/webhook/answerQuestion",
    "bookAppointment": "https://your-n8n-instance.com/webhook/bookAppointment"
  }
}
```

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

```bash
npm run build     # Generate templated files
npm run format    # Format code with Prettier
npm run release   # Create GitHub release
```

## File Structure

```
├── config.json              # Client configuration
├── build.js                 # Template processor  
├── src/
│   ├── prompts/             # Business prompts (templated)
│   ├── *.json               # Agent/workflow configs (templated)
└── dist/                    # Generated client files
```

## Development

1. **Add Tools**: Update `config.json` webhooks, create n8n workflow
2. **Modify Flows**: Use `/retell-flow` Copilot command  
3. **Update Prompts**: Edit markdown files in `src/prompts/`
4. **Extend System**: Use `/extend-template` Copilot command

## Resources

- [Retell.ai Documentation](https://docs.retell.ai)
- [n8n Documentation](https://docs.n8n.io)
- [GitHub Copilot Prompts](.github/copilot-prompts/)
