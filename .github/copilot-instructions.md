# Cybersecurity Compliance UI - Copilot Instructions

<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

This is an Angular 18 frontend application for a cybersecurity compliance chatbot system that integrates with a Node.js MCP (Model Context Protocol) backend.

## Project Context
- **Frontend**: Angular 18 with TypeScript and SCSS
- **Backend**: Node.js Express server with MCP architecture running on localhost:3000
- **Database**: SQLite for conversation history and compliance data
- **AI**: Ollama with llama3.2:3b model for intelligent responses
- **Real-time**: Server-Sent Events (SSE) for notifications

## Architecture Guidelines
1. **MCP Integration**: Connect to backend agents (auditor, reviewer, manager) via REST API
2. **Agent-Based UI**: Different interfaces for different compliance roles
3. **Selection-Based Interactions**: Provide predefined options instead of just text input
4. **File Upload**: Support evidence document uploads with drag-and-drop
5. **Real-time Updates**: Handle SSE notifications for compliance alerts

## Component Structure
- Use standalone components (Angular 18 pattern)
- Implement reactive forms for user interactions
- Create reusable UI components for compliance workflows
- Use Angular services for backend communication

## Styling Guidelines
- Use modern CSS Grid and Flexbox
- Implement responsive design for mobile/desktop
- Use CSS custom properties for theming
- Follow accessibility best practices

## API Integration
- Backend endpoints: /chat, /upload, /events, /health
- Handle different agent roles: auditor, reviewer, manager
- Implement proper error handling and loading states
- Use observables for reactive programming

## Key Features to Implement
- Multi-agent chat interface with role selection
- Quick action buttons for common compliance tasks
- File upload with progress indicators
- Real-time notification system
- Evidence management dashboard
- Compliance status tracking
