import { BaseAgent } from '../base/agent';

interface Reply {
  id: string;
  campaignId: string;
  leadId: string;
  accountId: string;
  subject: string;
  body: string;
  receivedAt: Date;
  sentiment: 'positive' | 'neutral' | 'negative';
  intent: 'buy' | 'negotiate' | 'info' | 'not-interested' | 'unknown';
  requiresAction: boolean;
  handled: boolean;
}

export class ResponseHandlerAgent extends BaseAgent {
  private replies: Map<string, Reply> = new Map();

  constructor() {
    super({
      name: 'response-handler-agent',
      description: 'Processes incoming email replies',
      instructions: `
You are the Response Handler. Your role is to:
1. Parse incoming replies
2. Determine sentiment
3. Identify intent
4. Route to appropriate handler

SENTIMENT DETECTION:
- POSITIVE: Wants to buy, interested, asking price
- NEUTRAL: Asking questions, needs info
- NEGATIVE: Not interested, too expensive, never

INTENT DETECTION:
- BUY: Ready to purchase, asking about process
- NEGOTIATE: Counter-offer, asking discount
- INFO: General questions, domain info
- NOT-INTERESTED: Explicit rejection

CRITICAL RULES:
- Always acknowledge receipt within 1 hour
- Route positive intent to Negotiation Agent
- Use diagnostic questions for neutral
- Thank and disconnect for negative`,
      tools: ['fetch', 'send-email']
    });
  }

  async processReply(
    campaignId: string,
    leadId: string,
    accountId: string,
    subject: string,
    body: string
  ): Promise<Reply> {
    const reply: Reply = {
      id: crypto.randomUUID(),
      campaignId,
      leadId,
      accountId,
      subject,
      body,
      receivedAt: new Date(),
      sentiment: this.detectSentiment(body),
      intent: this.detectIntent(body),
      requiresAction: true,
      handled: false
    };

    this.replies.set(reply.id, reply);
    await this.routeReply(reply);
    
    return reply;
  }

  private detectSentiment(body: string): Reply['sentiment'] {
    const lower = body.toLowerCase();
    const positiveTerms = ['interested', 'yes', 'buy', 'purchase', 'tell me more', 'sounds good', 'price'];
    const negativeTerms = ['not interested', 'no thanks', 'not for me', 'remove', 'stop', 'never'];
    
    if (positiveTerms.some(t => lower.includes(t))) return 'positive';
    if (negativeTerms.some(t => lower.includes(t))) return 'negative';
    return 'neutral';
  }

  private detectIntent(body: string): Reply['intent'] {
    const lower = body.toLowerCase();
    
    if (lower.includes('buy') || lower.includes('purchase') || lower.includes('how to buy')) return 'buy';
    if (lower.includes('price') || lower.includes('cost') || lower.includes('discount')) return 'negotiate';
    if (lower.includes('what') || lower.includes('tell me') || lower.includes('info')) return 'info';
    if (lower.includes('not') || lower.includes('no') || lower.includes('stop')) return 'not-interested';
    return 'unknown';
  }

  private async routeReply(reply: Reply): Promise<void> {
    if (reply.sentiment === 'negative' || reply.intent === 'not-interested') {
      await this.sendThankYouDisconnect(reply);
      reply.handled = true;
      return;
    }

    if (reply.sentiment === 'positive' || reply.intent === 'buy') {
      await this.forwardToNegotiation(reply);
      return;
    }

    if (reply.intent === 'info' || reply.intent === 'negotiate') {
      await this.provideInfoOrNegotiate(reply);
      return;
    }
  }

  private async sendThankYouDisconnect(reply: Reply): Promise<void> {
    const templates = [
      'Thanks for your time. Removing you from our list.',
      'Understood. Best of luck with your search.',
      'No problem. Thanks for responding.'
    ];
    
    console.log(`Sending thank you disconnect to lead ${reply.leadId}`);
  }

  private async forwardToNegotiation(reply: Reply): Promise<void> {
    console.log(`Forwarding lead ${reply.leadId} to Negotiation Agent`);
  }

  private async provideInfoOrNegotiate(reply: Reply): Promise<void> {
    if (reply.intent === 'negotiate') {
      console.log(`Initiating negotiation with lead ${reply.leadId}`);
    } else {
      console.log(`Providing info to lead ${reply.leadId}`);
    }
  }

  async getPendingReplies(): Promise<Reply[]> {
    return Array.from(this.replies.values())
      .filter(r => r.requiresAction && !r.handled);
  }

  async markHandled(replyId: string): Promise<void> {
    const reply = this.replies.get(replyId);
    if (reply) {
      reply.handled = true;
    }
  }

  async getReplyStats(): Promise<{
    total: number;
    positive: number;
    neutral: number;
    negative: number;
    handled: number;
  }> {
    const replies = Array.from(this.replies.values());
    return {
      total: replies.length,
      positive: replies.filter(r => r.sentiment === 'positive').length,
      neutral: replies.filter(r => r.sentiment === 'neutral').length,
      negative: replies.filter(r => r.sentiment === 'negative').length,
      handled: replies.filter(r => r.handled).length
    };
  }
}

export const responseHandlerAgent = new ResponseHandlerAgent();