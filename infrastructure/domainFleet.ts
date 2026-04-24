import { BaseAgent } from '../base/agent';

interface DomainRecord {
  name: string;
  registrar: string;
  status: 'active' | 'suspended' | 'pending';
  reputation: number;
  sendingAccounts: number;
  emailsSent: number;
  lastUsed: Date | null;
  createdAt: Date;
}

interface DomainConfig {
  name: string;
  registrarApiKey?: string;
  nameserver: string;
  dnsRecords: DNSRecord[];
}

interface DNSRecord {
  type: 'A' | 'AAAA' | 'CNAME' | 'MX' | 'TXT' | 'SPF';
  name: string;
  value: string;
  priority?: number;
  ttl: number;
}

export class DomainFleetManager extends BaseAgent {
  private domains: Map<string, DomainRecord> = new Map();
  private nextDomainIndex = 0;

  constructor() {
    super({
      name: 'domain-fleet-manager',
      description: 'Manages sending domain fleet for outbound email',
      instructions: `
You are the Domain Fleet Manager. Your role is to:
1. Track all sending domains in the fleet
2. Monitor domain reputation scores
3. Rotate domains based on sending volume
4. Add new domains when needed
5. Suspend underperforming domains

CRITICAL RULES:
- Never use primary brand domain for cold outreach
- Rotate domains every 5,000 emails to maintain reputation
- Monitor bounce rates - suspend domain if >2% bounce
- Keep minimum 10 domains in active rotation`,
      tools: ['search', 'fetch', 'send-email']
    });
  }

  async addDomain(config: DomainConfig): Promise<DomainRecord> {
    const record: DomainRecord = {
      name: config.name,
      registrar: 'porkbun',
      status: 'active',
      reputation: 70,
      sendingAccounts: 0,
      emailsSent: 0,
      lastUsed: null,
      createdAt: new Date()
    };

    this.domains.set(config.name, record);
    return record;
  }

  async getOptimalDomain(): Promise<string | null> {
    const activeDomains = Array.from(this.domains.values())
      .filter(d => d.status === 'active' && d.reputation >= 70)
      .sort((a, b) => {
        if (a.emailsSent !== b.emailsSent) return a.emailsSent - b.emailsSent;
        return b.reputation - a.reputation;
      });

    if (activeDomains.length === 0) return null;
    
    const selected = activeDomains[0];
    selected.lastUsed = new Date();
    selected.emailsSent++;
    
    return selected.name;
  }

  async updateReputation(domain: string, reputation: number): Promise<void> {
    const record = this.domains.get(domain);
    if (record) {
      record.reputation = reputation;
      if (reputation < 50) record.status = 'suspended';
    }
  }

  async getDomainStats(domain: string): Promise<DomainRecord | null> {
    return this.domains.get(domain) || null;
  }

  async getFleetStatus(): Promise<{
    total: number;
    active: number;
    suspended: number;
    avgReputation: number;
  }> {
    const domains = Array.from(this.domains.values());
    return {
      total: domains.length,
      active: domains.filter(d => d.status === 'active').length,
      suspended: domains.filter(d => d.status === 'suspended').length,
      avgReputation: domains.reduce((sum, d) => sum + d.reputation, 0) / domains.length || 0
    };
  }
}

export const domainFleetManager = new DomainFleetManager();