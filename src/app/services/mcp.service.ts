import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  agent?: string;
}

export interface ChatRequest {
  userId: string;
  role: 'auditor' | 'reviewer' | 'manager';
  message: string;
}

export interface ChatResponse {
  response: string;
  agent: string;
  functionCall: boolean;
}

export interface UploadResponse {
  success: boolean;
  filename: string;
  summary?: string;
  evidence_id?: string;
}

export interface Agent {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
}

@Injectable({
  providedIn: 'root'
})
export class McpService {
  private baseUrl = 'http://localhost:3000';
  private messagesSubject = new BehaviorSubject<ChatMessage[]>([]);
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private eventSource?: EventSource;

  public messages$ = this.messagesSubject.asObservable();
  public loading$ = this.loadingSubject.asObservable();

  private agents: Agent[] = [
    {
      id: 'auditor',
      name: 'Security Auditor',
      description: 'Validates evidence and compliance documentation',
      icon: '🔍',
      color: '#4f46e5'
    },
    {
      id: 'reviewer',
      name: 'Compliance Reviewer',
      description: 'Reviews and approves compliance processes',
      icon: '📋',
      color: '#059669'
    },
    {
      id: 'manager',
      name: 'Compliance Manager',
      description: 'Oversees compliance strategy and reporting',
      icon: '👔',
      color: '#dc2626'
    }
  ];

  constructor(private http: HttpClient) {}

  getAgents(): Agent[] {
    return this.agents;
  }

  getAgent(id: string): Agent | undefined {
    return this.agents.find(agent => agent.id === id);
  }

  sendMessage(request: ChatRequest): Observable<ChatResponse> {
    this.loadingSubject.next(true);
    
    // Add user message to local state
    const userMessage: ChatMessage = {
      role: 'user',
      content: request.message,
      timestamp: new Date().toISOString(),
      agent: request.role
    };
    
    const currentMessages = this.messagesSubject.value;
    this.messagesSubject.next([...currentMessages, userMessage]);

    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    return new Observable<ChatResponse>(observer => {
      this.http.post<ChatResponse>(`${this.baseUrl}/chat`, request, { headers })
        .subscribe({
          next: (response) => {
            // Add assistant response to local state
            const assistantMessage: ChatMessage = {
              role: 'assistant',
              content: response.response,
              timestamp: new Date().toISOString(),
              agent: response.agent
            };
            
            const updatedMessages = this.messagesSubject.value;
            this.messagesSubject.next([...updatedMessages, assistantMessage]);
            
            this.loadingSubject.next(false);
            observer.next(response);
            observer.complete();
          },
          error: (error) => {
            console.error('Chat error:', error);
            this.loadingSubject.next(false);
            observer.error(error);
          }
        });
    });
  }

  uploadFile(file: File, userId: string): Observable<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('userId', userId);

    return this.http.post<UploadResponse>(`${this.baseUrl}/upload`, formData);
  }

  checkHealth(): Observable<any> {
    return this.http.get(`${this.baseUrl}/health`);
  }

  connectToNotifications(userId: string): void {
    if (this.eventSource) {
      this.eventSource.close();
    }

    this.eventSource = new EventSource(`${this.baseUrl}/events?userId=${userId}`);
    
    this.eventSource.onmessage = (event) => {
      const notification = JSON.parse(event.data);
      console.log('Notification received:', notification);
      // Handle notifications (you can add a notification service here)
    };

    this.eventSource.onerror = (error) => {
      console.error('SSE connection error:', error);
    };
  }

  disconnectFromNotifications(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = undefined;
    }
  }

  clearMessages(): void {
    this.messagesSubject.next([]);
  }
}
