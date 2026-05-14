# Enterprise AI Agent Systems Lab

A production-style collection of enterprise AI agent applications built with **Next.js App Router**, **OpenAI Agents SDK**, **Tailwind CSS**, **Zod**, and **JavaScript**.

This repository currently includes two AI agent systems:

1. **Enterprise Multi-Agent Customer Support Ticket Analyzer**
2. **Enterprise Procurement Approval Agent with Human Review**

Both projects demonstrate how AI agents can be used in realistic enterprise workflows where structured output, guardrails, human review, and operational usefulness matter more than generic chatbot responses.

Created by **Suhas Bhairav**  
Website: [https://suhasbhairav.com](https://suhasbhairav.com)

---

## Table of Contents

- [Project 1: Enterprise Multi-Agent Customer Support Ticket Analyzer](#project-1-enterprise-multi-agent-customer-support-ticket-analyzer)
- [Project 2: Enterprise Procurement Approval Agent with Human Review](#project-2-enterprise-procurement-approval-agent-with-human-review)
- [Shared Design Principles](#shared-design-principles)
- [Tech Stack](#tech-stack)
- [Folder Structure](#folder-structure)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Running Locally](#running-locally)
- [API Routes](#api-routes)
- [Local Development Notes](#local-development-notes)
- [Production Notes](#production-notes)
- [Possible Integrations](#possible-integrations)
- [Screenshots](#screenshots)
- [AI Lab JSON Content](#ai-lab-json-content)
- [Learning Goals](#learning-goals)
- [Why These Projects Matter](#why-these-projects-matter)
- [Created By](#created-by)

---

# Project 1: Enterprise Multi-Agent Customer Support Ticket Analyzer

A production-style **multi-agent customer support ticket analysis system** built with **Next.js App Router**, **OpenAI Agents SDK**, **Tailwind CSS**, **Zod**, and **JavaScript**.

This project demonstrates how an enterprise support team can use multiple specialized AI agents to analyze incoming customer tickets, classify severity, detect SLA risk, identify likely root causes, assess customer sentiment, recommend escalation, and draft a professional customer response.

---

## Project Overview

Modern customer support teams receive thousands of tickets across email, chat, phone, portals, and internal escalation channels.

For enterprise clients, every delay can lead to:

- SLA breaches
- Customer churn
- Revenue loss
- Renewal risk
- Operational disruption
- Internal escalation
- Loss of customer trust

This project shows how a **multi-agent AI workflow** can support enterprise ticket triage and decision-making.

Instead of using a single generic chatbot, this application uses a coordinated set of specialist agents:

- Customer Sentiment Analyst
- Severity and Escalation Analyst
- Root Cause Analyst
- SLA Risk Analyst
- Customer Response Drafting Agent
- Enterprise Ticket Analysis Orchestrator

The orchestrator coordinates these specialist agents and produces one structured, operationally useful analysis.

---

## What the Customer Support Analyzer Does

The application accepts a customer support ticket with fields such as:

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
- Product context or known incident notes

It then sends the ticket to a backend API route powered by the OpenAI Agents SDK.

The backend returns a structured analysis containing:

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
- Governance and quality checks
- Tags
- Next best action

---

## Why Multi-Agent?

A single LLM prompt can analyze a ticket, but enterprise support workflows usually require multiple types of expertise.

For example:

- A support lead cares about severity and SLA risk.
- A customer success manager cares about customer sentiment and churn risk.
- An engineer cares about root cause and diagnostic checks.
- A support agent cares about what to reply to the customer.
- A governance team cares about safe output and human review requirements.

This project separates those responsibilities into focused agents and lets one orchestrator combine the results.

The result is not just a summary.  
The result is a structured operational support plan.

---

## Customer Support Analyzer Architecture

```txt
User Interface
    |
    |  Ticket Form
    v
Next.js Frontend: app/page.js
    |
    |  POST /api/ticket-analyzer
    v
Next.js API Route: app/api/ticket-analyzer/route.js
    |
    |  OpenAI Agents SDK
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
Responsive Enterprise Dashboard UI
```

# Project 2: Enterprise Procurement Approval Agent with Human Review

A production-style **enterprise procurement approval agent** built with **Next.js App Router**, **OpenAI Agents SDK**, **Tailwind CSS**, **Zod**, and **human-in-the-loop approval logic**.

This project demonstrates how AI agents can support procurement teams by analyzing purchase requests, checking policy compliance, assessing vendor risk, reviewing budget impact, evaluating business justification, and preparing the request for human approval.

The important point is that the AI does **not** silently approve or execute purchases. The AI prepares a structured decision package, but the final approval remains with a human reviewer.

---

## Project 2 Overview

Enterprise procurement is rarely a simple yes or no decision.

A single software purchase may require several checks before it can move forward:

- Is the vendor already approved?
- Is the purchase above the approval threshold?
- Does it require budget owner approval?
- Does it process personal data?
- Does it touch security-sensitive systems?
- Does it require privacy review?
- Does it require security review?
- Are contract terms, SLA terms, and data residency details clear?
- Is the business justification strong enough?
- Should the purchase be approved, rejected, or approved only with conditions?

This project demonstrates how an AI agent can turn a raw procurement request into a structured approval analysis.

The agent reviews the request and produces a decision package that a procurement manager, budget owner, security reviewer, privacy reviewer, or executive approver can inspect.

---

## Business Use Case

Imagine an engineering team wants to buy an observability platform.

The request looks valuable because it can help the company:

- Monitor production APIs
- Reduce incident response time
- Improve reliability reporting
- Give engineering teams visibility into latency, errors, and service health

But the same request also creates risk:

- The vendor is new
- The software may process personal data
- The software may touch production logs and infrastructure data
- The cost is above the procurement approval threshold
- Security certifications are not yet verified
- SLA terms are not confirmed
- Data residency details are unclear

A human reviewer should not approve this blindly.

The AI agent helps by producing a clear recommendation such as:

```txt
Approve with conditions