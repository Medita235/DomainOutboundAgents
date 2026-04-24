import { BaseAgent } from '../base/agent';

interface CallSession {
  id: string;
  leadId: string;
  phone: string;
  status: 'queued' | 'dialing' | 'ringing' | 'connected' | 'voicemail' | 'completed' | 'failed';
  startedAt: Date;
  connectedAt: Date | null;
  duration: number;
  recordingUrl: string | null;
  transcript: string;
  outcome: 'interested' | 'callback' | 'not-interested' | 'no-answer' | 'invalid' | null;
}

interface VoiceConfig {
  provider: 'bland.ai' | 'vapi.ai' | 'ajelix' | 'twilio';
  voiceId: string;
  voiceClone?: string;
  language: 'en-US' | 'en-GB' | 'ar' | 'fr' | 'es';
  speed: number;
  temperature: number;
}

interface CallScript {
  id: string;
  name: string;
  steps: ScriptStep[];
}

interface ScriptStep {
  order: number;
  type: 'greeting' | 'pitch' | 'qualify' | 'objection' | 'demo' | 'close' | 'transfer';
  text: string;
  timeout: number;
  branches?: Record<string, string>;
}

export class VoiceSellerAgent extends BaseAgent {
  private sessions: Map<string, CallSession> = new Map();
  private config: VoiceConfig = {
    provider: 'bland.ai',
    voiceId: 'default',
    language: 'en-US',
    speed: 1.0,
    temperature: 0.7
  };

  constructor() {
    super({
      name: 'voice-seller-agent',
      description: 'AI-powered cold calling agent for domain sales',
      instructions: `
You are the Voice Seller Agent. Your role is to:
1. Auto-dial leads
2. Deliver human-like pitches
3. Qualify prospects
4. Handle objections
5. Book meetings

CALL FLOW:
1. Introduction + Greeting
2. Value Pitch (30 seconds)
3. Qualify (Budget, Timeline, Authority)
4. Handle Objections
5. Book Meeting or Thank & Disconnect

QUALIFICATION CRITERIA:
- Budget: $X,XXX+
- Timeline: Within 30 days
- Authority: Can make purchase decision

OBJECTION HANDLING:
- "Not interested" -> Brief value prop, then thank
- "Too expensive" -> Ask budget
- "Call back" -> Schedule callback

TRANSFER:
- Qualified -> Book meeting via calendar
- Not qualified -> Add to email nurture
- Voicemail -> Leave message + follow-up email`,
      tools: ['fetch', 'call']
    });
  }

  async initiateCall(leadId: string, phone: string, script: CallScript): Promise<CallSession> {
    const session: CallSession = {
      id: crypto.randomUUID(),
      leadId,
      phone,
      status: 'queued',
      startedAt: new Date(),
      connectedAt: null,
      duration: 0,
      recordingUrl: null,
      transcript: '',
      outcome: null
    };

    this.sessions.set(session.id, session);
    return session;
  }

  async dial(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    session.status = 'dialing';
    console.log(`Dialing ${session.phone}...`);
  }

  async detectVoicemail(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    session.status = 'voicemail';
    this.leaveVoicemail(sessionId);
  }

  private async leaveVoicemail(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    const voicemailScript = `Hi, this is Ayoub calling about ${session.leadId}. 

I wanted to touch base briefly. Give me a call back at your convenience. Thanks.`;
    
    console.log(`Leaving voicemail for session ${sessionId}`);
  }

  async handleKeyPress(sessionId: string, key: string): Promise<string> {
    const handlers: Record<string, string> = {
      '1': 'transfer',
      '2': 'callback',
      '3': 'info',
      '0': 'disconnect'
    };

    return handlers[key] || 'continue';
  }

  async completeCall(sessionId: string, outcome: CallSession['outcome']): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    session.status = 'completed';
    session.outcome = outcome;
    
    if (session.connectedAt) {
      session.duration = Math.floor(
        (Date.now() - session.connectedAt.getTime()) / 1000
      );
    }
  }

  async getConfig(): Promise<VoiceConfig> {
    return this.config;
  }

  async updateConfig(config: Partial<VoiceConfig>): Promise<void> {
    this.config = { ...this.config, ...config };
  }

  async getSession(sessionId: string): Promise<CallSession | null> {
    return this.sessions.get(sessionId) || null;
  }

  async getSessionStats(): Promise<{
    total: number;
    connected: number;
    voicemails: number;
    interested: number;
    avgDuration: number;
  }> {
    const sessions = Array.from(this.sessions.values());
    return {
      total: sessions.length,
      connected: sessions.filter(s => s.status === 'connected').length,
      voicemails: sessions.filter(s => s.status === 'voicemail').length,
      interested: sessions.filter(s => s.outcome === 'interested').length,
      avgDuration: sessions.reduce((sum, s) => sum + s.duration, 0) / sessions.length || 0
    };
  }

  generatePitch(domain: string, price: number): string {
    return `Hi, this is Ayoub. I'm calling about ${domain}. 

It's available and I wanted to see if it fits your business. The price is ${price.toLocaleString()} dollars.

Do you have 30 seconds?`;
  }
}

export const voiceSellerAgent = new VoiceSellerAgent();