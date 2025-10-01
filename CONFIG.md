# Configuration Guide

## Quick Setup

To customize your AI voice receptionist for your business:

### Option 1: Edit config.json (Recommended)

```json
{
  "business": {
    "name": "Your Business Name",
    "agent_name": "Your Business AI Voice Receptionist",
    "ai_support_hours": "Monday-Friday 9AM-6PM"
  },
  "infrastructure": {
    "webhook_base_url": "https://your-n8n.domain.com/webhook/your-webhook-id",
    "transfer_phone_number": "+15551234567"
  },
  "voice_settings": {
    "voice_id": "11labs-Adrian",
    "max_call_duration_ms": 900000,
    "interruption_sensitivity": 0.8
  },
  "templating": {
    "auto_generate_from_repo": false
  }
}
```

### Option 2: Auto-generate from Repository Name

1. Name your repository with your business (e.g., `acme-salon-voice-ai`)
2. Set `"auto_generate_from_repo": true` in config.json
3. The system will automatically generate business names

## What Gets Templated

The build system updates these specific build-time configuration fields:

### Business Identity

- `agent_name` - The main agent identifier in Retell
- `default_dynamic_variables.agent_name` - Agent name for Retell's templating system
- `default_dynamic_variables.business_name` - Business name for Retell's templating system
- `default_dynamic_variables.ai_support_hours` - Support hours for Retell's templating system

### Infrastructure & Deployment

- `tools[].url` - All webhook URLs for n8n integration endpoints
- `transfer_destination.number` - Phone number for human handoff

### Voice & Call Settings

- `voice_id` - ElevenLabs voice selection (e.g., "11labs-Adrian", "11labs-Cimo")
- `max_call_duration_ms` - Maximum call length in milliseconds
- `interruption_sensitivity` - How easily caller can interrupt (0.1-1.0)

### File Names

- `{{agent_name}} - Retell Agent.json` → `Your Business AI Voice Receptionist - Retell Agent.json`
- `prompts/{{business_name}} Core Prompt.md` → `prompts/Your Business Core Prompt.md`

## What Stays As Retell Dynamic Variables

These use Retell's runtime templating system ({{variable_name}}) and are NOT replaced at build time:

- **Prompt content** - Uses {{agent_name}}, {{business_name}}, {{ai_support_hours}}
- **agent_human_name** - Retell dynamic variable for conversational use
- **Conversation flow logic** - All prompts and conversation structures
- **n8n workflows** - Keep original functionality and structure

## Build Process

```bash
npm run build
```

Generated files in `dist/` folder will have:

- Proper agent names
- Configured dynamic variables
- Business-specific file names
- All ready for Retell.ai deployment

## Examples

### Salon Configuration

```json
{
  "business": {
    "name": "Bella's Beauty Salon",
    "agent_name": "Bella's Beauty Salon AI Receptionist",
    "ai_support_hours": "Tuesday-Saturday 9AM-7PM"
  }
}
```

### Dental Office Configuration

```json
{
  "business": {
    "name": "Downtown Dental Care",
    "agent_name": "Downtown Dental Care Virtual Assistant",
    "ai_support_hours": "Monday-Friday 8AM-5PM"
  }
}
```

### Restaurant Configuration

```json
{
  "business": {
    "name": "Mario's Italian Kitchen",
    "agent_display_name": "Mario's Italian Kitchen AI Host",
    "agent_human_name": "Maria",
    "ai_support_hours": "Daily 11AM-10PM"
  }
}
```

## Adding Custom Dynamic Variables

You can add your own dynamic variables that will be available as `{{your_variable}}` in all Retell
prompts and conversation flows.

### Step 1: Add Variables to config.json

Add a `dynamic_variables` section to your config:

```json
{
  "business": {
    "name": "Your Business",
    "agent_display_name": "Your Business AI Receptionist",
    "agent_human_name": "Assistant"
  },
  "dynamic_variables": {
    "location_address": "123 Main Street, Anytown, State 12345",
    "phone_number": "(555) 123-4567",
    "website": "www.yourbusiness.com",
    "parking_info": "Free parking available in rear lot",
    "special_hours": "Closed Sundays and major holidays"
  }
}
```

### Step 2: Update build.js (Optional - for custom processing)

If you need special processing for your variables, update the `processRetellAgentTemplate` method:

```javascript
// In build.js, add to processRetellAgentTemplate method:
if (dynVars.location_address !== undefined) {
  dynVars.location_address = this.templateVariables.location_address;
}
if (dynVars.phone_number !== undefined) {
  dynVars.phone_number = this.templateVariables.phone_number;
}
// ... add more as needed
```

### Step 3: Use in Prompts

Your custom variables will be automatically available in all prompts:

```markdown
## Business Information

- Location: {{location_address}}
- Phone: {{phone_number}}
- Website: {{website}}
- Parking: {{parking_info}}
- Special Hours: {{special_hours}}

When callers ask about our location, tell them: "We're located at {{location_address}}, and
{{parking_info}}"
```

### Common Use Cases

#### Service Business

```json
"dynamic_variables": {
  "service_area": "Downtown and surrounding neighborhoods",
  "emergency_contact": "(555) 999-HELP",
  "lead_time": "24-48 hours for most services",
  "payment_methods": "Cash, credit cards, and digital payments accepted"
}
```

#### Medical Practice

```json
"dynamic_variables": {
  "office_location": "Medical Plaza, Suite 200",
  "after_hours_number": "(555) 123-URGENT",
  "insurance_info": "We accept most major insurance plans",
  "new_patient_info": "New patients welcome, please bring ID and insurance card"
}
```

#### Restaurant

```json
"dynamic_variables": {
  "reservation_policy": "Reservations recommended for parties of 4 or more",
  "delivery_radius": "Within 5 miles of downtown",
  "chef_special": "Ask about today's chef's special!",
  "dietary_options": "Vegetarian, vegan, and gluten-free options available"
}
```

### Advanced: Conditional Variables

You can also set variables based on conditions:

```json
"dynamic_variables": {
  "current_promotion": "20% off new customer haircuts through October",
  "seasonal_message": "Fall specials now available!",
  "holiday_hours": "Extended hours during holiday season"
}
```

### Best Practices

1. **Keep it business-relevant**: Only add variables that will be used in conversations
2. **Use clear names**: `parking_info` is better than `parking` or `park_details`
3. **Keep values concise**: Retell works best with shorter, conversational text
4. **Test thoroughly**: Always test new variables in your prompts before deploying
5. **Update regularly**: Keep seasonal/promotional content current
