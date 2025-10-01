# Dynamic Variables Guide

## Quick Setup

Dynamic variables allow you to customize what your AI agent says during conversations. Any variable
you add will be available as `{{variable_name}}` in all Retell prompts.

## Adding Dynamic Variables

### 1. Add to config.json

```json
{
  "business": {
    "name": "Your Business Name",
    "agent_display_name": "Your Business AI Receptionist",
    "agent_human_name": "Assistant"
  },
  "dynamic_variables": {
    "phone_number": "(555) 123-4567",
    "address": "123 Main Street, Anytown, State",
    "website": "www.yourbusiness.com",
    "hours": "Monday-Friday 9AM-5PM",
    "parking": "Free parking available"
  }
}
```

### 2. Use in Prompts

Your variables automatically work in any Retell prompt:

```markdown
## Business Information

- Phone: {{phone_number}}
- Address: {{address}}
- Website: {{website}}
- Hours: {{hours}}
- Parking: {{parking}}

When asked about our location, say: "We're located at {{address}}. {{parking}}. You can visit our
website at {{website}} or call us at {{phone_number}}."
```

### 3. Build and Deploy

```bash
npm run build
```

All your dynamic variables are automatically:

- ✅ Added to the Retell agent configuration
- ✅ Available as `{{variable_name}}` in prompts
- ✅ Ready for use in conversations

## Common Examples

### Service Business

```json
"dynamic_variables": {
  "service_area": "Downtown and surrounding areas",
  "response_time": "Usually within 2 hours",
  "payment_methods": "Cash, card, and digital payments",
  "emergency_contact": "(555) 999-HELP"
}
```

### Medical Practice

```json
"dynamic_variables": {
  "office_hours": "Monday-Friday 8AM-6PM, Saturday 9AM-2PM",
  "after_hours": "Call (555) 123-URGENT for emergencies",
  "insurance": "We accept most major insurance plans",
  "new_patients": "New patients welcome - bring ID and insurance card"
}
```

### Restaurant

```json
"dynamic_variables": {
  "cuisine_type": "Authentic Italian cuisine",
  "reservations": "Reservations recommended for parties of 4+",
  "delivery": "Free delivery within 3 miles",
  "specialties": "Homemade pasta and wood-fired pizza"
}
```

## Best Practices

✅ **Keep it conversational**: "Free parking in back lot" vs "Parking: Available"  
✅ **Use clear names**: `office_hours` not `hrs` or `schedule`  
✅ **Keep values short**: Retell works best with concise, natural text  
✅ **Update regularly**: Keep seasonal/promotional content current  
✅ **Test thoroughly**: Always test new variables before deploying

## Advanced Usage

### Conditional Content

```json
"dynamic_variables": {
  "seasonal_promotion": "Summer special: 20% off lawn services",
  "weather_notice": "Service may be delayed during severe weather",
  "holiday_hours": "Closed major holidays - call for details"
}
```

### Contact Information

```json
"dynamic_variables": {
  "main_phone": "(555) 123-MAIN",
  "text_line": "(555) 123-TEXT",
  "email": "hello@yourbusiness.com",
  "social_media": "Follow us @YourBusiness on Instagram"
}
```

That's it! Your AI agent will automatically use these variables in conversations, making it easy to
keep information current and consistent across all customer interactions.
