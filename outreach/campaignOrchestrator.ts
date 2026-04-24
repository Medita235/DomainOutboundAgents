import { BaseAgent } from '../base/agent';

interface Campaign {
  id: string;
  name: string;
  domain: string;
  status: 'draft' | 'scheduled' | 'active' | 'paused' | 'completed';
  emailsPerDay: number;
  followUpDelay: number;
  maxFollowUps: number;
  accounts: string[];
  leads: string[];
  templates: string[];
  stats: CampaignStats;
  createdAt: Date;
  startedAt: Date | null;
}

interface CampaignStats {
  sent: number;
  delivered: number;
  opened: number;
  replied: number;
  bounced: number;
  converted: number;
  revenue: number;
}

interface FollowUpSequence {
  day: number;
  template: string;
  sent: boolean;
}

export class CampaignOrchestrator extends BaseAgent {
  private campaigns: Map<string, Campaign> = new Map();
  private scheduledJobs: Map<string, FollowUpSequence[]> = new Map();

  constructor() {
    super({
      name: 'campaign-orchestrator',
      description: 'Orchestrates multi-account email campaigns',
      instructions: `
You are the Campaign Orchestrator. Your role is to:
1. Create and manage email campaigns
2. Schedule follow-up sequences
3. Rotate sending across accounts
4. Monitor campaign performance
5. Enforce sending thresholds

CAMPAIGN RULES:
- Max 100 emails/account/day
- Rotate accounts every 100 emails
- Follow-ups every 2-3 days
- Maximum 4 follow-ups per lead
- Stop on first reply

SCHEDULE:
- Day 0: Initial email
- Day 2-3: Follow-up 1
- Day 5-6: Follow-up 2
- Day 8-9: Follow-up 3
- Day 11-12: Final follow-up

Stop immediately when lead replies`,
      tools: ['fetch', 'send-email']
    });
  }

  async createCampaign(
    name: string,
    domain: string,
    accounts: string[],
    leads: string[],
    template: string
  ): Promise<Campaign> {
    const campaign: Campaign = {
      id: crypto.randomUUID(),
      name,
      domain,
      status: 'draft',
      emailsPerDay: 50,
      followUpDelay: 3,
      maxFollowUps: 4,
      accounts,
      leads,
      templates: [template],
      stats: {
        sent: 0,
        delivered: 0,
        opened: 0,
        replied: 0,
        bounced: 0,
        converted: 0,
        revenue: 0
      },
      createdAt: new Date(),
      startedAt: null
    };

    this.campaigns.set(campaign.id, campaign);
    return campaign;
  }

  async scheduleCampaign(campaignId: string): Promise<void> {
    const campaign = this.campaigns.get(campaignId);
    if (!campaign) return;

    const followUps: FollowUpSequence[] = [];
    for (let i = 1; i <= campaign.maxFollowUps; i++) {
      followUps.push({
        day: i * campaign.followUpDelay,
        template: `Follow-up ${i}`,
        sent: false
      });
    }

    this.scheduledJobs.set(campaignId, followUps);
    campaign.status = 'scheduled';
  }

  async startCampaign(campaignId: string): Promise<void> {
    const campaign = this.campaigns.get(campaignId);
    if (campaign) {
      campaign.status = 'active';
      campaign.startedAt = new Date();
    }
  }

  async pauseCampaign(campaignId: string): Promise<void> {
    const campaign = this.campaigns.get(campaignId);
    if (campaign) {
      campaign.status = 'paused';
    }
  }

  async getNextSendingAccount(campaignId: string): Promise<string | null> {
    const campaign = this.campaigns.get(campaignId);
    if (!campaign || campaign.accounts.length === 0) return null;

    const sentCounts = new Map<string, number>();
    campaign.accounts.forEach(a => sentCounts.set(a, 0));

    const minSent = Math.min(...Array.from(sentCounts.values()));
    return campaign.accounts.find(a => sentCounts.get(a) === minSent) || null;
  }

  async recordSend(campaignId: string, accountId: string, leadId: string, result: 'sent' | 'bounced'): Promise<void> {
    const campaign = this.campaigns.get(campaignId);
    if (!campaign) return;

    campaign.stats.sent++;
    if (result === 'sent') {
      campaign.stats.delivered++;
    } else {
      campaign.stats.bounced++;
    }
  }

  async recordReply(campaignId: string, leadId: string): Promise<void> {
    const campaign = this.campaigns.get(campaignId);
    if (campaign) {
      campaign.stats.replied++;
    }
  }

  async recordConversion(campaignId: string, amount: number): Promise<void> {
    const campaign = this.campaigns.get(campaignId);
    if (campaign) {
      campaign.stats.converted++;
      campaign.stats.revenue += amount;
    }
  }

  async getCampaign(campaignId: string): Promise<Campaign | null> {
    return this.campaigns.get(campaignId) || null;
  }

  async getCampaignStats(campaignId: string): Promise<CampaignStats | null> {
    const campaign = this.campaigns.get(campaignId);
    return campaign?.stats || null;
  }

  async getActiveCampaigns(): Promise<Campaign[]> {
    return Array.from(this.campaigns.values()).filter(c => c.status === 'active');
  }

  async getCampaignLeaderboard(): Promise<Array<{id: string; name: string; sent: number; revenue: number}>> {
    return Array.from(this.campaigns.values())
      .map(c => ({
        id: c.id,
        name: c.name,
        sent: c.stats.sent,
        revenue: c.stats.revenue
      }))
      .sort((a, b) => b.revenue - a.revenue);
  }
}

export const campaignOrchestrator = new CampaignOrchestrator();