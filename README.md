# Enterprise Multi-Agent Customer Support Ticket Analyzer

A production-style **multi-agent customer support ticket analysis system** built with **Next.js App Router**, **OpenAI Agents SDK**, and **Tailwind CSS**.

This project demonstrates how an enterprise support team can use multiple specialized AI agents to analyze incoming customer tickets, classify severity, detect SLA risk, identify likely root causes, assess customer sentiment, recommend escalation, and draft a professional customer response.

Created by **Suhas Bhairav**  
Website: [https://suhasbhairav.com](https://suhasbhairav.com)

---

## Project Overview

Modern customer support teams receive thousands of tickets across email, chat, phone, portals, and internal escalation channels. For enterprise clients, every delay can lead to SLA breaches, customer churn, revenue loss, and operational disruption.

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

## What This Project Does

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

---

## Architecture

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