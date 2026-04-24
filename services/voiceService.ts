export interface BlandConfig {
  apiKey: string;
}

export interface VoiceCallRequest {
  phoneNumber: string;
  agentId?: string;
  task: string;
  voiceId?: string;
  language?: string;
  recordCall?: boolean;
  metadata?: Record<string, string>;
}

export interface VoiceCallResult {
  id: string;
  status: 'queued' | 'in-progress' | 'completed' | 'failed';
  duration?: number;
  recordingUrl?: string;
  transcript?: string;
  summary?: string;
  error?: string;
}

export interface VoiceScript {
  greeting: string;
  pitch: string;
  qualification: string;
  objectionHandling: Record<string, string>;
  closing: string;
}

export class BlandVoiceService {
  private config: BlandConfig | null = null;

  configure(config: BlandConfig): void {
    this.config = config;
  }

  isConfigured(): boolean {
    return !!this.config?.apiKey;
  }

  async makeCall(request: VoiceCallRequest): Promise<VoiceCallResult> {
    if (!this.config) {
      return {
        id: 'mock-call-' + Date.now(),
        status: 'completed',
        duration: 30,
        summary: 'Mock call completed (Bland.ai not configured)'
      };
    }

    try {
      const response = await fetch('https://api.bland.ai/call', {
        method: 'POST',
        headers: {
          'Authorization': this.config.apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          phone_number: request.phoneNumber,
          task: request.task,
          voice_id: request.voiceId || 'male-deep',
          language: request.language || 'en',
          record_call: request.recordCall ?? true,
          metadata: request.metadata
        })
      });

      const data: any = await response.json();

      if (response.ok && data.call_id) {
        return {
          id: data.call_id,
          status: 'queued'
        };
      } else {
        return {
          id: '',
          status: 'failed',
          error: data.message || 'Call failed'
        };
      }
    } catch (error: any) {
      return {
        id: '',
        status: 'failed',
        error: error.message
      };
    }
  }

  async getCallStatus(callId: string): Promise<VoiceCallResult> {
    if (!this.config) {
      return { id: callId, status: 'completed' };
    }

    try {
      const response = await fetch(`https://api.bland.ai/call/${callId}`, {
        headers: {
          'Authorization': this.config.apiKey
        }
      });

      const data: any = await response.json();

      return {
        id: callId,
        status: data.status || 'completed',
        duration: data.duration,
        recordingUrl: data.recording_url,
        transcript: data.transcript,
        summary: data.summary
      };
    } catch (error: any) {
      return {
        id: callId,
        status: 'failed',
        error: error.message
      };
    }
  }

  async generateScript(domain: string, price: number): Promise<VoiceScript> {
    return {
      greeting: `Hi, this is Ayoub calling about ${domain}. Do you have 30 seconds?`,
      pitch: `I'm reaching out because ${domain} is available and I wanted to see if it fits your business. The price is $${price.toLocaleString()}.`,
      qualification: `Before I share more details, can you confirm you're the decision maker for domain acquisitions? And what's your timeline - are you looking to acquire within 30 days?`,
      objectionHandling: {
        'expensive': `I understand budget is a concern. Let me ask - what's range are you working with? We can often be flexible on terms.`,
        'not_interested': `May I ask what specifically doesn't fit? I want to make sure I'm reaching the right people.`,
        'call_back': `Absolutely. What's the best time to reach you? I'll schedule a follow-up.`
      },
      closing: `Great speaking with you. I'll send over some materials and follow up via email. Talk soon.`
    };
  }

  async leaveVoicemail(phoneNumber: string, domain: string, price: number): Promise<VoiceCallResult> {
    const script = `Hi, this is Ayoub calling about ${domain}. It's available at $${price.toLocaleString()}. Give me a call back at your convenience. Thanks.`;
    
    return this.makeCall({
      phoneNumber,
      task: script,
      metadata: { type: 'voicemail' }
    });
  }
}

export class VapiVoiceService {
  private apiKey: string = '';

  configure(apiKey: string): void {
    this.apiKey = apiKey;
  }

  isConfigured(): boolean {
    return !!this.apiKey;
  }

  async makeCall(phoneNumber: string, script: string): Promise<VoiceCallResult> {
    if (!this.apiKey) {
      return {
        id: 'mock-vapi-' + Date.now(),
        status: 'completed',
        summary: 'Mock call (Vapi not configured)'
      };
    }

    try {
      const response = await fetch('https://api.vapi.ai/call', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          phone_number_id: phoneNumber,
          script
        })
      });

      const data: any = await response.json();
      
      return {
        id: data.id,
        status: data.status
      };
    } catch (error: any) {
      return {
        id: '',
        status: 'failed',
        error: error.message
      };
    }
  }
}

export const blandVoiceService = new BlandVoiceService();
export const vapiVoiceService = new VapiVoiceService();