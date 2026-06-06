# Enterprise AI Agent Apps

A portfolio of enterprise AI agent applications built around high-value business workflows: customer support, procurement, project risk, contract renewals, sales enablement, and customer service operations.

These apps are designed to show how agentic AI can improve decision quality, reduce manual analysis, standardize governance, and keep humans in control of sensitive business actions.

Created by **Suhas Bhairav**  
Website: [suhasbhairav.com](https://suhasbhairav.com)

## Executive Overview

This folder contains **7 projects in total**, organized into two groups:

- **4 AI Agent Workflow Apps** for structured business analysis, policy checks, risk review, and human approval.
- **3 AI Copilot Projects** for role-specific knowledge assistance using uploaded business documents.

The common goal across all projects is practical enterprise adoption: useful workflows, clear outputs, reviewable decisions, and business controls.

## AI Agent Workflow Apps (4 Projects)

| Project | Business Function | Business Value | Link |
| --- | --- | --- | --- |
| AI Customer Support Tickets Analyzer | Customer support and customer success | Prioritizes tickets, identifies SLA and relationship risk, drafts responses, and helps support leaders standardize triage quality. | [Open project](./ai-customer-support-tickets-analyzer/) |
| AI Procurement Approval Agent | Procurement, finance, and operations | Reviews purchase requests against policy, highlights vendor and budget risk, and pauses purchase-order submission for human approval. | [Open project](./ai-human-agent-approval/) |
| AI Project Risk Review Agent | PMO, delivery, and transformation leadership | Assesses project delivery risk, identifies missing controls, and requires human approval before formal risk-register submission. | [Open project](./ai-project-risk-review-agent/) |
| AI Contract Renewal Agent | Legal, procurement, finance, and vendor management | Reviews renewals for commercial, legal, performance, security, and business-value risk before renewal execution. | [Open project](./ai-contract-renewal-agent/) |

## AI Copilot Projects (3 Projects)

The AI Copilots are included under [`ai-copilots`](./ai-copilots/) and are separate from the workflow approval apps. They focus on helping business users retrieve, understand, and act on knowledge from uploaded PDF documents.

| Copilot Project | Business Function | Business Value | Link |
| --- | --- | --- | --- |
| Sales Knowledge Engine: 10 AI Workflow Buttons | Sales enablement, account teams, and revenue operations | Turns uploaded sales PDFs into 10 guided AI workflow buttons for account briefs, pain point discovery, objection handling, proposals, renewals, meeting prep, CRM notes, and fallback chat. | [Open Sales Knowledge Engine](./ai-copilots/knowledge-engine-copilot/) |
| Sales Copilot | Sales enablement and account teams | Turns sales PDFs, reports, playbooks, and reference documents into a searchable assistant for faster account preparation and customer conversations. | [Open Sales Copilot](./ai-copilots/sales-copilot/) |
| Customer Service Copilot | Customer service and support operations | Indexes service policies, FAQs, manuals, and SLA documents, then drafts customer-ready replies in selectable service tones. | [Open Customer Service Copilot](./ai-copilots/customer-service-copilot/) |

## Project Details

### [AI Customer Support Tickets Analyzer](./ai-customer-support-tickets-analyzer/)

Analyzes enterprise support tickets and produces a structured support decision package.

It helps teams understand ticket severity, SLA breach risk, customer sentiment, relationship risk, possible root cause, missing diagnostic information, recommended escalation, customer response drafts, internal notes, governance checks, tags, and next best action.

Source links:

- [Application UI](./ai-customer-support-tickets-analyzer/app/page.js)
- [Ticket analyzer API](./ai-customer-support-tickets-analyzer/app/api/ticket-analyzer/route.js)

### [AI Procurement Approval Agent](./ai-human-agent-approval/)

Reviews procurement requests before purchase approval and keeps sensitive purchase-order submission behind human review.

It helps teams evaluate policy compliance, required approvals, vendor risk, budget impact, business justification, missing information, purchase-order readiness, and governance concerns.

Source links:

- [Application UI](./ai-human-agent-approval/app/page.js)
- [Procurement approval API](./ai-human-agent-approval/app/api/procurement-approval-agent/route.js)

### [AI Project Risk Review Agent](./ai-project-risk-review-agent/)

Reviews project plans for delivery, dependency, stakeholder, timeline, budget, and governance risk.

It is aimed at PMO and transformation leaders who need consistent project risk review before risks are formally submitted or acted on.

Source links:

- [Application UI](./ai-project-risk-review-agent/app/page.js)
- [Project risk review API](./ai-project-risk-review-agent/app/api/project-risk-review-agent/route.js)

### [AI Contract Renewal Agent](./ai-contract-renewal-agent/)

Analyzes contract renewal requests before renewal execution.

It helps teams review renewal policy status, vendor performance, SLA issues, commercial impact, price-increase risk, legal clauses, security and privacy review needs, business value, negotiation levers, and approval requirements.

Source links:

- [Application UI](./ai-contract-renewal-agent/app/page.js)
- [Contract renewal API](./ai-contract-renewal-agent/app/api/contract-renewal-agent/route.js)

### [Sales Knowledge Engine: 10 AI Workflow Buttons](./ai-copilots/knowledge-engine-copilot/)

A workflow-first sales knowledge engine for revenue teams. Users upload sales PDFs, proposals, case studies, product documents, customer notes, and RFP material, then run guided workflow buttons instead of starting from a blank chatbot.

The project includes 10 sales workflows: account briefing, customer pain point finder, objection handling, proposal draft, follow-up email, competitor comparison, renewal risk review, upsell opportunity finder, meeting preparation, and CRM note generation. A fallback chat remains available for open-ended questions.

Source links:

- [Frontend UI](./ai-copilots/knowledge-engine-copilot/frontend/app/page.js)
- [FastAPI backend](./ai-copilots/knowledge-engine-copilot/fastapi-backend/main.py)

### [Sales Copilot](./ai-copilots/sales-copilot/)

A document-based sales assistant for uploaded PDF knowledge. Sales teams can upload reference documents and chat with them to support account planning, discovery preparation, and customer conversations.

Source links:

- [Frontend UI](./ai-copilots/sales-copilot/frontend/app/page.js)
- [FastAPI backend](./ai-copilots/sales-copilot/fastapi-backend/main.py)

### [Customer Service Copilot](./ai-copilots/customer-service-copilot/)

A document-based service assistant for customer support teams. Support teams can upload service policies, FAQs, product manuals, and SLA documents, then generate customer-ready responses grounded in those documents.

Source links:

- [Frontend UI](./ai-copilots/customer-service-copilot/frontend/app/page.js)
- [FastAPI backend](./ai-copilots/customer-service-copilot/fastapi-backend/main.py)

## Enterprise Themes

- **Human control:** approval-based apps pause sensitive actions for human review.
- **Decision consistency:** agents produce structured, repeatable business outputs.
- **Governance:** workflows surface missing information, risk, policy issues, and approval needs.
- **Operational usefulness:** each app is built around a real business process, not a generic chatbot.
- **Knowledge leverage:** copilot apps turn business documents into role-specific assistants.

## Developer Notes

The Next.js agent apps use React, Tailwind CSS, JavaScript, the OpenAI Agents SDK, and Zod.

The copilot apps use a Next.js frontend with a FastAPI backend, LlamaIndex, OpenAI models, PDF upload, and local vector storage. The Sales Knowledge Engine also exposes task-specific workflow endpoints so business users can click guided actions instead of writing prompts.

### Environment Variables

The Next.js agent apps use:

```bash
OPENAI_API_KEY=your_openai_api_key
```

Optional model overrides:

```bash
SUPPORT_AGENT_MODEL=gpt-5-nano
PROCUREMENT_AGENT_MODEL=gpt-5-nano
PROJECT_RISK_AGENT_MODEL=gpt-5-nano
CONTRACT_RENEWAL_AGENT_MODEL=gpt-5-nano
```

Optional persistence for human-approval state:

```bash
UPSTASH_REDIS_REST_URL=your_upstash_redis_rest_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_redis_rest_token
```

Optional dry-run switches for guarded action tools:

```bash
PROCUREMENT_DRY_RUN=true
PROJECT_RISK_DRY_RUN=true
CONTRACT_RENEWAL_DRY_RUN=true
```

The FastAPI copilot backends use:

```bash
OPENAI_API_KEY=your_openai_api_key
FRONTEND_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
OPENAI_MODEL=gpt-4o-mini
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
```

### Running Locally

Run each app from its own directory.

For a Next.js agent app:

```bash
cd ai-customer-support-tickets-analyzer
npm install
npm run dev
```

Use the same command pattern for [AI Procurement Approval Agent](./ai-human-agent-approval/), [AI Project Risk Review Agent](./ai-project-risk-review-agent/), and [AI Contract Renewal Agent](./ai-contract-renewal-agent/).

For an AI Copilot project, run the backend and frontend separately.

Sales Knowledge Engine backend:

```bash
cd ai-copilots/knowledge-engine-copilot/fastapi-backend
python -m venv .venv
source .venv/bin/activate
pip install fastapi uvicorn python-multipart python-dotenv llama-index llama-index-llms-openai llama-index-embeddings-openai
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

Sales Knowledge Engine frontend:

```bash
cd ai-copilots/knowledge-engine-copilot/frontend
npm install
npm run dev
```

Sales Copilot backend:

```bash
cd ai-copilots/sales-copilot/fastapi-backend
python -m venv .venv
source .venv/bin/activate
pip install fastapi uvicorn python-multipart python-dotenv llama-index llama-index-llms-openai llama-index-embeddings-openai
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

Sales Copilot frontend:

```bash
cd ai-copilots/sales-copilot/frontend
npm install
npm run dev
```

Use the same backend/frontend pattern for [Customer Service Copilot](./ai-copilots/customer-service-copilot/). The current frontend code expects the FastAPI backend at `http://127.0.0.1:8000`.

## License

See [LICENSE](./LICENSE).
