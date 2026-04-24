import { BaseAgent } from '../base/agent';

export interface Lead {
  id: string;
  domain: string;
  tier: 1 | 2 | 3;
  tierName: 'Direct Upgrade' | 'Similar Niche' | 'Market Participant';
  owner: string;
  email: string;
  company: string;
  source: 'apollo' | 'linkedin' | 'google-maps' | 'directory' | 'manual';
  status: 'new' | 'contacted' | 'qualified' | 'not-interested' | 'converted';
  score: number;
  notes: string;
  createdAt: Date;
  lastContacted: Date | null;
}

export interface LeadSearchParams {
  domain: string;
  vertical?: string;
  location?: string;
  tier?: 1 | 2 | 3;
  source?: string;
  minScore?: number;
}

const LEAD_TIERS = {
  1: {
    name: 'Direct Upgrade',
    description: 'Owners of lower-tier extensions (.net, .org, .biz) or hyphenated versions',
    weight: 100,
    examples: ['example.net', 'example.org', 'example-biz.com']
  },
  2: {
    name: 'Similar Niche',
    description: 'Businesses in adjacent niches',
    weight: 70,
    examples: ['property management for real estate domain']
  },
  3: {
    name: 'Market Participant',
    description: 'General businesses in same geographic area',
    weight: 40,
    examples: ['local businesses in target city']
  }
};

export class LeadSourcingAgent extends BaseAgent {
  private leads: Map<string, Lead> = new Map();

  constructor() {
    super({
      name: 'lead-sourcing-agent',
      description: 'Sources high-intent leads for domain sales',
      instructions: `
You are the Lead Sourcing Agent. Your role is to:
1. Find leads for domain sales using multiple sources
2. Classify leads by opportunity tier
3. Score leads by intent and fit

SOURCES:
- Apollo.io: Decision makers in target companies
- LinkedIn: Company owners and executives
- Google Maps: Businesses with sponsored listings (high intent)
- Directories: Yellow Pages, industry directories
- Manual: Direct domain research

CLASSIFICATION:
- TIER 1: Direct upgrade targets (same domain, different TLD)
- TIER 2: Similar niche businesses
- TIER 3: General market participants

SCORING:
- 90-100: Hot lead, immediate contact
- 70-89: Warm lead, prioritize
- 50-69: Medium lead, nurture
- 0-49: Cold lead, low priority`,
      tools: ['search', 'fetch']
    });
  }

  async searchLeads(params: LeadSearchParams): Promise<Lead[]> {
    const leads: Lead[] = [];
    const baseDomain = params.domain.replace(/\\.com|\\.net|\\.org|\\.biz|\\.io$/, '');

    if (params.tier === 1 || !params.tier) {
      const tier1Leads = this.findDirectUpgradeLeads(baseDomain);
      leads.push(...tier1Leads);
    }

    if (params.tier === 2 || !params.tier) {
      const tier2Leads = this.findSimilarNicheLeads(baseDomain, params.vertical);
      leads.push(...tier2Leads);
    }

    if (params.tier === 3 || !params.tier) {
      const tier3Leads = this.findMarketParticipants(baseDomain, params.location);
      leads.push(...tier3Leads);
    }

    leads.forEach(l => this.leads.set(l.id, l));
    return leads;
  }

  private findDirectUpgradeLeads(baseDomain: string): Lead[] {
    const extensions = ['.net', '.org', '.biz', '.io', '.co', '-com', '-net'];
    const leads: Lead[] = [];

    extensions.forEach(ext => {
      const domain = baseDomain + ext;
      leads.push({
        id: crypto.randomUUID(),
        domain,
        tier: 1,
        tierName: 'Direct Upgrade',
        owner: 'To be found',
        email: '',
        company: '',
        source: 'manual',
        status: 'new',
        score: 95,
        notes: `Direct upgrade target for ${baseDomain}.com`,
        createdAt: new Date(),
        lastContacted: null
      });
    });

    return leads;
  }

  private findSimilarNicheLeads(baseDomain: string, vertical?: string): Lead[] {
    const verticals = this.inferVertical(baseDomain, vertical);
    const leads: Lead[] = [];

    verticals.forEach(v => {
      leads.push({
        id: crypto.randomUUID(),
        domain: v.company,
        tier: 2,
        tierName: 'Similar Niche',
        owner: v.owner,
        email: '',
        company: v.company,
        source: 'apollo',
        status: 'new',
        score: v.score,
        notes: `Similar niche: ${v.niche}`,
        createdAt: new Date(),
        lastContacted: null
      });
    });

    return leads;
  }

  private findMarketParticipants(domain: string, location?: string): Lead[] {
    return [
      {
        id: crypto.randomUUID(),
        domain: domain,
        tier: 3,
        tierName: 'Market Participant',
        owner: 'To be found',
        email: '',
        company: domain,
        source: 'google-maps',
        status: 'new',
        score: 50,
        notes: 'Market participant in target area',
        createdAt: new Date(),
        lastContacted: null
      }
    ];
  }

  private inferVertical(domain: string, vertical?: string): Array<{company: string; owner: string; niche: string; score: number}> {
    if (!vertical) {
      if (domain.includes('realestate') || domain.includes('property')) {
        return [
          { company: 'Property Management Co', owner: '', niche: 'Property Management', score: 75 },
          { company: 'Real Estate Agency', owner: '', niche: 'Real Estate', score: 70 }
        ];
      }
      if (domain.includes('solar') || domain.includes('energy')) {
        return [
          { company: 'Solar Solutions', owner: '', niche: 'Solar Energy', score: 75 },
          { company: 'Energy Corp', owner: '', niche: 'Renewable Energy', score: 70 }
        ];
      }
    }
    return [];
  }

  async getLead(id: string): Promise<Lead | null> {
    return this.leads.get(id) || null;
  }

  async updateLeadStatus(id: string, status: Lead['status']): Promise<void> {
    const lead = this.leads.get(id);
    if (lead) {
      lead.status = status;
      if (status === 'contacted') {
        lead.lastContacted = new Date();
      }
    }
  }

  async getLeadsByStatus(status: Lead['status']): Promise<Lead[]> {
    return Array.from(this.leads.values()).filter(l => l.status === status);
  }

  async getLeadsByScore(minScore: number): Promise<Lead[]> {
    return Array.from(this.leads.values())
      .filter(l => l.score >= minScore)
      .sort((a, b) => b.score - a.score);
  }
}

export const leadSourcingAgent = new LeadSourcingAgent();