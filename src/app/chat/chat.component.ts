import { Component, OnInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { McpService, Agent, ChatMessage } from '../services/mcp.service';
import { Subscription } from 'rxjs';

interface QuickAction {
  id: string;
  label: string;
  message: string;
  icon: string;
  category: string;
}

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="chat-container">
      <!-- Header -->
      <div class="chat-header">
        <div class="agent-selector">
          <h2>Angular Cybersecurity Compliance Assistant</h2>
          <div class="agents">
            <button 
              *ngFor="let agent of agents" 
              [class]="'agent-button ' + (selectedAgent?.id === agent.id ? 'active' : '')"
              [style.border-color]="agent.color"
              (click)="selectAgent(agent)">
              <span class="agent-icon">{{agent.icon}}</span>
              <div class="agent-info">
                <div class="agent-name">{{agent.name}}</div>
                <div class="agent-description">{{agent.description}}</div>
              </div>
            </button>
          </div>
        </div>
      </div>

      <!-- Messages -->
      <div class="messages-container" #messagesContainer>
        <div class="welcome-message" *ngIf="messages.length === 0">
          <div class="welcome-content">
            <h3>Welcome to Compliance Assistant</h3>
            <p>Select an agent and choose from the quick actions below, or type your own message.</p>
          </div>
        </div>
        
        <div *ngFor="let message of messages" class="message" [class.user]="message.role === 'user'" [class.assistant]="message.role === 'assistant'">
          <div class="message-avatar" *ngIf="message.role === 'assistant'">
            <span>{{getAgentIcon(message.agent)}}</span>
          </div>
          <div class="message-content">
            <div class="message-text">{{message.content}}</div>
            <div class="message-time">{{formatTime(message.timestamp)}}</div>
          </div>
          <div class="message-avatar user-avatar" *ngIf="message.role === 'user'">
            <span>👤</span>
          </div>
        </div>

        <div *ngIf="loading" class="message assistant">
          <div class="message-avatar">
            <span>{{selectedAgent?.icon || '🤖'}}</span>
          </div>
          <div class="message-content">
            <div class="typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="quick-actions" *ngIf="selectedAgent">
        <h4>Quick Actions for {{selectedAgent.name}}</h4>
        <div class="actions-grid">
          <button 
            *ngFor="let action of getQuickActions()" 
            class="action-button"
            (click)="sendQuickAction(action)">
            <span class="action-icon">{{action.icon}}</span>
            <span class="action-label">{{action.label}}</span>
          </button>
        </div>
      </div>

      <!-- File Upload -->
      <div class="file-upload-section" *ngIf="selectedAgent">
        <div class="upload-area" 
             [class.dragover]="isDragOver"
             (dragover)="onDragOver($event)" 
             (dragleave)="onDragLeave($event)"
             (drop)="onDrop($event)"
             (click)="fileInput.click()">
          <input #fileInput type="file" (change)="onFileSelected($event)" style="display: none;" 
                 accept=".pdf,.doc,.docx,.txt,.csv,.xlsx">
          <div class="upload-content">
            <span class="upload-icon">📎</span>
            <span>Drop files here or click to upload</span>
            <small>Supported: PDF, DOC, TXT, CSV, XLSX</small>
          </div>
        </div>
      </div>

      <!-- Input Section -->
      <div class="input-section">
        <div class="input-container">
          <input 
            type="text" 
            [(ngModel)]="currentMessage" 
            (keypress)="onKeyPress($event)"
            [placeholder]="getPlaceholder()"
            [disabled]="!selectedAgent || loading">
          <button 
            (click)="sendMessage()" 
            [disabled]="!currentMessage.trim() || !selectedAgent || loading"
            class="send-button">
            <span *ngIf="!loading">Send</span>
            <span *ngIf="loading">⏳</span>
          </button>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./chat.component.scss']
})
export class ChatComponent implements OnInit, OnDestroy {
  @ViewChild('messagesContainer') messagesContainer!: ElementRef;
  @ViewChild('fileInput') fileInput!: ElementRef;

  agents: Agent[] = [];
  selectedAgent: Agent | null = null;
  messages: ChatMessage[] = [];
  currentMessage = '';
  loading = false;
  isDragOver = false;
  userId = 'user-' + Math.random().toString(36).substr(2, 9);

  private subscriptions: Subscription[] = [];

  private quickActionsMap: Record<string, QuickAction[]> = {
    auditor: [
      { id: 'review-evidence', label: 'Review Evidence', message: 'Please review the uploaded evidence for compliance gaps', icon: '🔍', category: 'review' },
      { id: 'sox-audit', label: 'SOX Compliance', message: 'Help me with SOX compliance requirements and documentation', icon: '📊', category: 'compliance' },
      { id: 'security-assessment', label: 'Security Assessment', message: 'Conduct a security risk assessment of our current systems', icon: '🔒', category: 'security' },
      { id: 'audit-checklist', label: 'Audit Checklist', message: 'Generate an audit checklist for our upcoming compliance review', icon: '✅', category: 'planning' }
    ],
    reviewer: [
      { id: 'approve-process', label: 'Approve Process', message: 'Review and approve the compliance process documentation', icon: '✓', category: 'approval' },
      { id: 'policy-review', label: 'Policy Review', message: 'Review our current security policies for completeness', icon: '📋', category: 'policy' },
      { id: 'remediation-plan', label: 'Remediation Plan', message: 'Create a remediation plan for identified compliance issues', icon: '🔧', category: 'remediation' },
      { id: 'training-gaps', label: 'Training Assessment', message: 'Identify training gaps in our compliance program', icon: '🎓', category: 'training' }
    ],
    manager: [
      { id: 'compliance-status', label: 'Compliance Status', message: 'Provide an overview of our current compliance status', icon: '📈', category: 'reporting' },
      { id: 'risk-dashboard', label: 'Risk Dashboard', message: 'Show me the current risk dashboard and key metrics', icon: '📊', category: 'metrics' },
      { id: 'budget-planning', label: 'Budget Planning', message: 'Help me plan the compliance budget for next quarter', icon: '💰', category: 'budget' },
      { id: 'executive-summary', label: 'Executive Summary', message: 'Generate an executive summary of our compliance initiatives', icon: '📝', category: 'reporting' }
    ]
  };

  constructor(private mcpService: McpService) {}

  ngOnInit() {
    this.agents = this.mcpService.getAgents();
    
    // Subscribe to messages
    const messagesSubscription = this.mcpService.messages$.subscribe(messages => {
      this.messages = messages;
      this.scrollToBottom();
    });

    // Subscribe to loading state
    const loadingSubscription = this.mcpService.loading$.subscribe(loading => {
      this.loading = loading;
      if (!loading) {
        this.scrollToBottom();
      }
    });

    this.subscriptions.push(messagesSubscription, loadingSubscription);

    // Connect to notifications
    this.mcpService.connectToNotifications(this.userId);
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.mcpService.disconnectFromNotifications();
  }

  selectAgent(agent: Agent) {
    this.selectedAgent = agent;
    this.mcpService.clearMessages();
  }

  getQuickActions(): QuickAction[] {
    if (!this.selectedAgent) return [];
    return this.quickActionsMap[this.selectedAgent.id] || [];
  }

  sendQuickAction(action: QuickAction) {
    if (!this.selectedAgent) return;
    
    this.mcpService.sendMessage({
      userId: this.userId,
      role: this.selectedAgent.id as any,
      message: action.message
    }).subscribe({
      next: (response) => {
        console.log('Response received:', response);
      },
      error: (error) => {
        console.error('Error sending message:', error);
      }
    });
  }

  sendMessage() {
    if (!this.currentMessage.trim() || !this.selectedAgent) return;

    this.mcpService.sendMessage({
      userId: this.userId,
      role: this.selectedAgent.id as any,
      message: this.currentMessage
    }).subscribe({
      next: (response) => {
        console.log('Response received:', response);
        this.currentMessage = '';
      },
      error: (error) => {
        console.error('Error sending message:', error);
      }
    });
  }

  onKeyPress(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      this.sendMessage();
    }
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.uploadFile(file);
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragOver = false;
    
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.uploadFile(files[0]);
    }
  }

  uploadFile(file: File) {
    if (!this.selectedAgent) return;

    this.mcpService.uploadFile(file, this.userId).subscribe({
      next: (response) => {
        console.log('File uploaded:', response);
        if (response.summary) {
          // Add the summary as a message
          const summaryMessage = `File "${response.filename}" uploaded successfully. Summary: ${response.summary}`;
          this.mcpService.sendMessage({
            userId: this.userId,
            role: this.selectedAgent!.id as any,
            message: summaryMessage
          }).subscribe();
        }
      },
      error: (error) => {
        console.error('Upload error:', error);
      }
    });
  }

  getPlaceholder(): string {
    if (!this.selectedAgent) return 'Select an agent first';
    return `Ask ${this.selectedAgent.name} something...`;
  }

  getAgentIcon(agentName?: string): string {
    if (!agentName) return '🤖';
    const agent = this.agents.find(a => a.name === agentName);
    return agent?.icon || '🤖';
  }

  formatTime(timestamp: string): string {
    return new Date(timestamp).toLocaleTimeString();
  }

  private scrollToBottom() {
    setTimeout(() => {
      const container = this.messagesContainer?.nativeElement;
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    }, 100);
  }
}
