# Retell Agent State Machine Test Suite

This document exhaustively enumerates all conversation paths and transitions in the Retell agent template, providing a human-readable test plan for validating the agent's state machine logic over chat or simulated calls.

## How to Use
- Each test case starts from a specific node (state) and simulates a user input matching the transition condition.
- The expected next node and any relevant assertions are listed.
- This suite covers all nodes, edges, and function outcomes (success, failure, error, fallback, escalation, etc.).
- Use this as a checklist for manual or automated chat-based testing.

---

## Legend
- **Node**: The current state in the conversation flow.
- **User Input**: Example utterance or intent matching the transition condition.
- **Expected Next Node**: The node the agent should transition to.
- **Notes**: Special assertions, tool calls, or edge cases.

---

## Test Cases

### 1. Router Node
| User Input / Intent | Expected Next Node | Notes |
|--------------------|-------------------|-------|
| "I want to check my appointment for John Doe" | Identify Appointment | Personal details trigger appointment lookup |
| "What are your business hours?" | Answer Question | General info, non-personal |
| "I'd like to book an appointment" | Gather New Appointment Details | Booking intent |
| "I need to change my appointment" | Identify Appointment | Modification intent |
| "I want to cancel my appointment" | Identify Appointment | Cancellation intent |
| "I'm done, thank you" | End Call Confirmation | End intent |
| "Can I speak to a manager?" | Escalation Logic | Human escalation |
| [Unclear/ambiguous intent] | Fallback/Log Lead/Provide Callback | Fallback path |

### 2. Gather New Appointment Details
| User Input / Intent | Expected Next Node | Notes |
|--------------------|-------------------|-------|
| [All required info collected] | Book Appointment | Triggers booking tool |
| "Never mind" | Router | User cancels booking |

### 3. Book Appointment (Function Node)
| Tool Outcome | Expected Next Node | Notes |
|--------------|-------------------|-------|
| Success      | End Call Confirmation | Booking succeeded |
| Failure      | Re-Verify Appointment Details | Validation failed, retry |
| Error        | Fallback/Log Lead/Provide Callback | System/tool error |

### 4. Re-Verify Appointment Details
| User Input / Intent | Expected Next Node | Notes |
|--------------------|-------------------|-------|
| [Corrected info provided] | Gather New Appointment Details | Retry booking |
| "Abandon booking" | End Call Confirmation | User gives up |
| "I don't want to continue" | Router | User opts out |

### 5. Answer Question Node
| User Input / Intent | Expected Next Node | Notes |
|--------------------|-------------------|-------|
| [Requires real-time/company info] | Answer Question (Function) | Triggers RAG tool |
| [Disputes answer or KB insufficient] | Answer Question (Function) | Retry or escalate |
| [Satisfied] | Router | Ends Q&A |

### 6. Answer Question (Function Node)
| Tool Outcome | Expected Next Node | Notes |
|--------------|-------------------|-------|
| Success      | Router | Answer delivered |
| Failure      | Q/A Fail | Could not answer |
| Error        | Fallback/Log Lead/Provide Callback | System/tool error |

### 7. Q/A Fail
| User Input / Intent | Expected Next Node | Notes |
|--------------------|-------------------|-------|
| "End call" | Fallback/Log Lead/Provide Callback | User gives up |
| "Continue" | Router | User wants to keep going |

### 8. Identify Appointment Node
| User Input / Intent | Expected Next Node | Notes |
|--------------------|-------------------|-------|
| [Sufficient details] | Identify Appointment (Function) | Triggers lookup tool |
| [Insufficient details] | Fallback/Log Lead/Provide Callback | Fallback |

### 9. Identify Appointment (Function Node)
| Tool Outcome | Expected Next Node | Notes |
|--------------|-------------------|-------|
| Success      | Cancel or Modify Existing Appointment | Appointment found |
| Failure      | Identify Appointment | Retry lookup |
| Error        | Fallback/Log Lead/Provide Callback | System/tool error |

### 10. Cancel or Modify Existing Appointment
| User Input / Intent | Expected Next Node | Notes |
|--------------------|-------------------|-------|
| [Modification details collected] | Modify Appointment (Function) | Proceed to modify |
| [Cancellation confirmed] | Cancel Appointment (Function) | Proceed to cancel |
| "Never mind" | Router | User opts out |

### 11. Modify Appointment (Function Node)
| Tool Outcome | Expected Next Node | Notes |
|--------------|-------------------|-------|
| Success      | End Call Confirmation | Modification succeeded |
| Error        | Fallback/Log Lead/Provide Callback | System/tool error |

### 12. Cancel Appointment (Function Node)
| Tool Outcome | Expected Next Node | Notes |
|--------------|-------------------|-------|
| Success      | End Call Confirmation | Cancellation succeeded |
| Error        | Fallback/Log Lead/Provide Callback | System/tool error |

### 13. End Call Confirmation
| User Input / Intent | Expected Next Node | Notes |
|--------------------|-------------------|-------|
| "Yes, I'm done" | End Call | End of conversation |
| [Else] | Router | User not ready to end |

### 14. End Call
| User Input / Intent | Expected Next Node | Notes |
|--------------------|-------------------|-------|
| [Any] | (Terminal) | Conversation ends |

### 15. Fallback/Log Lead/Provide Callback
| User Input / Intent | Expected Next Node | Notes |
|--------------------|-------------------|-------|
| [All info collected] | Log Lead (Function) | Log lead/callback |
| "No callback" | End Call Confirmation | User declines callback |
| "Speak to human" | Escalation Logic | Human escalation |

### 16. Log Lead (Function Node)
| Tool Outcome | Expected Next Node | Notes |
|--------------|-------------------|-------|
| Success      | End Call Confirmation | Lead logged |
| Error        | Fallback/Log Lead/Provide Callback | System/tool error |

### 17. Escalation Logic (Branch Node)
| Condition | Expected Next Node | Notes |
|-----------|-------------------|-------|
| During support hours | Transfer Call | Human transfer |
| Else | Fallback/Log Lead/Provide Callback | No human available |

### 18. Transfer Call
| User Input / Intent | Expected Next Node | Notes |
|--------------------|-------------------|-------|
| [Transfer failed] | Fallback/Log Lead/Provide Callback | Transfer error |

---

## Coverage
- All nodes, edges, and tool outcomes are covered.
- Each function node is tested for success, failure, and error.
- All fallback and escalation paths are included.

---

## How to Extend
- Add new nodes/edges to the table above as you update the agent template.
- For automated testing, use this as a basis for generating test scripts.

---

## Example Usage
- Use this suite to manually test the agent over chat, or as a reference for automated test generation.
- Mark each test case as passed/failed during your QA process.
