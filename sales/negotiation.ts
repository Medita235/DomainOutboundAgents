import { BaseAgent } from '../base/agent';

interface Negotiation {
  id: string;
  leadId: string;
  domain: string;
  askingPrice: number;
  offerPrice: number;
  status: 'initial' | 'negotiating' | 'counter-offer' | 'accepted' | 'rejected' | 'closed';
  messages: NegotiationMessage[];
  milestone: string;
  startedAt: Date;
  updatedAt: Date;
}

interface NegotiationMessage {
  id: string;
  from: 'buyer' | 'seller';
  message: string;
  price?: number;
  timestamp: Date;
}

const VALUE_SCRIPT = {
  'brand-identity': 'Your domain is your brand. A premium .com signals established, serious business.',
  'seo-value': 'Exact match domains get 36% higher click-through rates in search.',
  'traffic-value': 'This domain likely receives directnavigation traffic worth thousands monthly.',
  'resale-value': 'Premium domains appreciate 15-25% annually. This is an investment.',
  'brand-protection': 'Securing your matching .com prevents competitor spoofing.'
};

export class NegotiationAgent extends BaseAgent {
  private negotiations: Map<string, Negotiation> = new Map();

  constructor() {
    super({
      name: 'negotiation-agent',
      description: 'Handles pricing discussions and closes domain sales',
      instructions: `
You are the Negotiation Agent. Your role is to:
1. Handle buyer objections
2. Re-sell domain value
3. Negotiate price
4. Close the sale

OBJECTION HANDLING:
- "Too expensive" -> Ask budget, offer payment plan
- "Not interested" -> Diagnostic questions
- "Need to think" -> Provide more info, set deadline
- "Comparing options" -> Highlight unique value

VALUE RE-SELLING:
1. Brand identity signal
2. SEO click-through advantage
3. Direct navigation traffic
4. Investment appreciation
5. Competitor protection

SALES CLOSING:
- Direct to Afternic for trust
- Change Boost -> Standard (15% vs 20% commission)
- Offer payment plans for large deals`,
      tools: ['fetch', 'send-email']
    });
  }

  async startNegotiation(
    leadId: string,
    domain: string,
    askingPrice: number
  ): Promise<Negotiation> {
    const negotiation: Negotiation = {
      id: crypto.randomUUID(),
      leadId,
      domain,
      askingPrice,
      offerPrice: askingPrice,
      status: 'initial',
      messages: [],
      milestone: 'Initial contact',
      startedAt: new Date(),
      updatedAt: new Date()
    };

    this.negotiations.set(negotiation.id, negotiation);
    return negotiation;
  }

  async receiveOffer(negotiationId: string, offerPrice: number, message: string): Promise<void> {
    const negotiation = this.negotiations.get(negotiationId);
    if (!negotiation) return;

    negotiation.offerPrice = offerPrice;
    negotiation.messages.push({
      id: crypto.randomUUID(),
      from: 'buyer',
      message,
      price: offerPrice,
      timestamp: new Date()
    });
    negotiation.status = 'negotiating';
    negotiation.updatedAt = new Date();
  }

  async counterOffer(negotiationId: string, newPrice: number, reason: string): Promise<void> {
    const negotiation = this.negotiations.get(negotiationId);
    if (!negotiation) return;

    negotiation.messages.push({
      id: crypto.randomUUID(),
      from: 'seller',
      message: reason,
      price: newPrice,
      timestamp: new Date()
    });
    negotiation.status = 'counter-offer';
    negotiation.updatedAt = new Date();
  }

  async handleObjection(
    negotiationId: string,
    objection: string
  ): Promise<{response: string; action: string}> {
    const lower = objection.toLowerCase();
    
    if (lower.includes('expensive') || lower.includes('price') || lower.includes('cost')) {
      return {
        response: 'I understand budget is a factor. What range are you working with? We can also discuss payment plans for qualified buyers.',
        action: 'ask-budget'
      };
    }

    if (lower.includes('not interested') || lower.includes('no')) {
      return {
        response: 'May I ask what specifically doesn\'t fit? I want to understand your needs.',
        action: 'diagnose'
      };
    }

    if (lower.includes('think') || lower.includes('consider')) {
      return {
        response: 'Of course. I\'ll send over some additional materials. This offer is valid for 7 days.',
        action: 'provide-info'
      };
    }

    return {
      response: 'I appreciate you reaching out. Let me answer any questions you have.',
      action: 'info'
    };
  }

  async closeSale(negotiationId: string): Promise<{url: string; instructions: string}> {
    const negotiation = this.negotiations.get(negotiationId);
    if (!negotiation) throw new Error('Negotiation not found');

    negotiation.status = 'accepted';
    negotiation.updatedAt = new Date();

    return {
      url: 'https://www.afternic.com/domain/' + negotiation.domain,
      instructions: `
1. Redirect buyer to Afternic
2. Change listing from Boost (20%) to Standard (15%)
3. Use Fast Transfer for quick handover
4. Update CRM with sale price
`
    };
  }

  async rejectOffer(negotiationId: string): Promise<void> {
    const negotiation = this.negotiations.get(negotiationId);
    if (negotiation) {
      negotiation.status = 'rejected';
    }
  }

  async getNegotiation(id: string): Promise<Negotiation | null> {
    return this.negotiations.get(id) || null;
  }

  async getActiveNegotiations(): Promise<Negotiation[]> {
    return Array.from(this.negotiations.values())
      .filter(n => ['initial', 'negotiating', 'counter-offer'].includes(n.status));
  }

  resellValue(domain: string): string {
    const values = Object.entries(VALUE_SCRIPT).map(([key, value]) => value);
    return values[Math.floor(Math.random() * values.length)];
  }

  calculateFairPrice(askingPrice: number, buyerOffer: number, multiplier: number = 0.8): number {
    const floor = askingPrice * multiplier;
    if (buyerOffer >= floor) return buyerOffer;
    return Math.round(floor / 100) * 100;
  }
}

export const negotiationAgent = new NegotiationAgent();