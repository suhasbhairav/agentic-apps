# Enterprise AI Agent Systems Lab

A production-style collection of enterprise AI agent applications built with **Next.js App Router**, **React**, **Tailwind CSS**, **OpenAI Agents SDK**, **Zod**, and **JavaScript**.

This repository demonstrates how AI agents can be used in realistic enterprise workflows where **structured output**, **specialist agents**, **guardrails**, **human review**, and **operational usefulness** matter more than generic chatbot responses.

The repository currently includes three AI agent systems:

1. **Enterprise Multi-Agent Customer Support Ticket Analyzer**
2. **Enterprise Procurement Approval Agent with Human Review**
3. **Enterprise Contract Renewal Agent with Human Review**

Created by **Suhas Bhairav**  
Website: [https://suhasbhairav.com](https://suhasbhairav.com)

---

## Table of Contents

- [Why This Repository Exists](#why-this-repository-exists)
- [Projects Included](#projects-included)
- [Project 1: Enterprise Multi-Agent Customer Support Ticket Analyzer](#project-1-enterprise-multi-agent-customer-support-ticket-analyzer)
- [Project 2: Enterprise Procurement Approval Agent with Human Review](#project-2-enterprise-procurement-approval-agent-with-human-review)
- [Project 3: Enterprise Contract Renewal Agent with Human Review](#project-3-enterprise-contract-renewal-agent-with-human-review)
- [Shared Architecture](#shared-architecture)
- [Shared Design Principles](#shared-design-principles)
- [Tech Stack](#tech-stack)
- [Folder Structure](#folder-structure)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Running Locally](#running-locally)
- [API Routes](#api-routes)
- [Human Approval Workflow](#human-approval-workflow)
- [Structured Output](#structured-output)
- [Screenshots](#screenshots)
- [Production Notes](#production-notes)
- [Possible Enterprise Integrations](#possible-enterprise-integrations)
- [Learning Goals](#learning-goals)
- [Created By](#created-by)

---

# Why This Repository Exists

Most AI demos are chat interfaces.

But enterprise AI systems usually need more than chat.

Real enterprise teams need systems that can:

- Analyze business context
- Follow policy rules
- Identify missing information
- Assess operational risk
- Produce structured JSON output
- Route decisions to humans
- Pause sensitive execution
- Generate audit-friendly review packages
- Connect to real business systems
- Support governance, compliance, and accountability

This repository shows how AI agents can be used as **workflow intelligence layers**.

The goal is not to build agents that blindly execute business actions.  
The goal is to build agents that help humans make better decisions faster.

---

# Projects Included

## 1. Enterprise Multi-Agent Customer Support Ticket Analyzer

A multi-agent system that analyzes enterprise support tickets and produces a structured support decision package.

It helps support teams understand:

- Ticket severity
- SLA breach risk
- Customer sentiment
- Relationship risk
- Possible root cause
- Missing diagnostic information
- Recommended escalation
- Customer response draft
- Internal support note
- Next best action

---

## 2. Enterprise Procurement Approval Agent with Human Review

A human-in-the-loop AI agent that analyzes procurement requests before purchase approval.

It helps procurement teams understand:

- Policy compliance
- Required approvals
- Vendor risk
- Budget impact
- Business justification
- Missing information
- Human review requirements
- Purchase order readiness
- Governance concerns

---

## 3. Enterprise Contract Renewal Agent with Human Review

A human-in-the-loop AI agent that analyzes contract renewal requests before renewal approval.

It helps contract, procurement, finance, legal, security, and privacy teams understand:

- Renewal policy status
- Vendor performance
- SLA issues
- Commercial impact
- Price increase risk
- Legal risk
- Contract clauses to review
- Business value
- Negotiation levers
- Human approval requirements

---

# Project 1: Enterprise Multi-Agent Customer Support Ticket Analyzer

## Overview

The **Enterprise Multi-Agent Customer Support Ticket Analyzer** is a production-style AI workflow for enterprise support teams.

Modern support teams receive customer issues through:

- Email
- Chat
- Phone
- Support portals
- Internal escalation channels
- Customer success managers
- Account teams

For enterprise customers, every delay can create serious consequences:

- SLA breaches
- Customer dissatisfaction
- Revenue loss
- Churn risk
- Renewal risk
- Executive escalation
- Operational disruption

This project demonstrates how AI agents can help support teams triage and understand tickets faster.

Instead of using a single generic LLM prompt, this project uses specialist agents.

## Specialist Agents

The system can include agents such as:

- **Customer Sentiment Analyst**
- **Severity and Escalation Analyst**
- **Root Cause Analyst**
- **SLA Risk Analyst**
- **Customer Response Drafting Agent**
- **Enterprise Ticket Analysis Orchestrator**

Each agent focuses on one part of the problem.

The orchestrator combines the specialist outputs into a final structured analysis.

## Input Fields

The support ticket analyzer can accept fields such as:

- Ticket ID
- Subject
- Description
- Channel
- Customer tier
- Product
- Customer name
- Company
- Region
- SLA policy
- Product context
- Known incident notes

## Output

The backend returns structured support intelligence such as:

- Executive summary
- Ticket classification
- Severity level
- Urgency
- SLA breach risk
- Customer sentiment
- Relationship risk
- Root cause analysis
- Missing information
- Diagnostic questions
- Suggested internal checks
- Recommended actions
- Escalation recommendation
- Customer response draft
- Internal support note
- Governance checks
- Tags
- Next best action

## Why This Project Matters

Customer support is not just answering tickets.

Enterprise support requires:

- Prioritization
- SLA awareness
- Root cause thinking
- Customer relationship awareness
- Escalation management
- Clear internal notes
- Safe customer communication

This project shows how AI agents can transform an incoming ticket into a structured operational plan.

## Customer Support Architecture

```txt
User Interface
    |
    | Ticket Form
    v
Next.js Frontend
    |
    | POST /api/ticket-analyzer
    v
Next.js API Route
    |
    | OpenAI Agents SDK
    v
Enterprise Ticket Analysis Orchestrator
    |
    |-- Customer Sentiment Analyst
    |-- Severity and Escalation Analyst
    |-- Root Cause Analyst
    |-- SLA Risk Analyst
    |-- Customer Response Drafting Agent
    |
    v
Structured JSON Analysis
    |
    v
Enterprise Dashboard UI