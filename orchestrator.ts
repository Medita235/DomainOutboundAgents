import { domainFleetManager } from './infrastructure/domainFleet';
import { emailAccountManager } from './infrastructure/emailAccount';
import { dnsConfigManager } from './infrastructure/dnsConfig';
import { leadSourcingAgent } from './leads/leadSourcing';
import { emailVerifierAgent } from './leads/emailVerifier';
import { spinTaxGenerator } from './outreach/spinTax';
import { campaignOrchestrator } from './outreach/campaignOrchestrator';
import { responseHandlerAgent } from './sales/responseHandler';
import { negotiationAgent } from './sales/negotiation';
import { voiceSellerAgent } from './voice/voiceSeller';

export interface OrchestratorConfig {
  minDomains: number;
  minAccountsPerDomain: number;
  maxDailyEmails: number;
  warmingDays: number;
}

export interface OutboundCampaign {
  id: string;
  domain: string;
  leads: number;
  validatedLeads: number;
  emailsSent: number;
  replies: number;
  revenue: number;
  status: string;
}

export class OutboundOrchestrator {
  private config: OrchestratorConfig;
  private campaigns: Map<string, OutboundCampaign> = new Map();
  private isRunning = false;

  constructor() {
    this.config = {
      minDomains: 10,
      minAccountsPerDomain: 3,
      maxDailyEmails: 50,
      warmingDays: 30
    };
  }

  async start(): Promise<void> {
    this.isRunning = true;
    console.log('Outbound Orchestrator started');
    await this.runCampaignLoop();
  }

  async stop(): Promise<void> {
    this.isRunning = false;
    console.log('Outbound Orchestrator stopped');
  }

  async createCampaign(domain: string, emailAccounts: string[]): Promise<string> {
    const campaign = await campaignOrchestrator.createCampaign(
      `Campaign-${domain}`,
      domain,
      emailAccounts,
      [],
      spinTaxGenerator.createDomainPitch(domain, 2500)
    );

    const outboundCampaign: OutboundCampaign = {
      id: campaign.id,
      domain,
      leads: 0,
      validatedLeads: 0,
      emailsSent: 0,
      replies: 0,
      revenue: 0,
      status: 'draft'
    };

    this.campaigns.set(campaign.id, outboundCampaign);
    return campaign.id;
  }

  async runCampaignLoop(): Promise<void> {
    if (!this.isRunning) return;

    const campaigns = await campaignOrchestrator.getActiveCampaigns();
    
    for (const campaign of campaigns) {
      if (campaign.stats.sent >= campaign.emailsPerDay * campaign.accounts.length) {
        continue;
      }

      const account = await campaignOrchestrator.getNextSendingAccount(campaign.id);
      if (!account) continue;

      const canSend = await emailAccountManager.canSend(account);
      if (!canSend.allowed) continue;

      await emailAccountManager.recordSend(account);
      await campaignOrchestrator.recordSend(campaign.id, account, '', 'sent');
    }

    setTimeout(() => this.runCampaignLoop(), 60000);
  }

  async getStatus(): Promise<{
    running: boolean;
    campaigns: number;
    totalLeads: number;
    totalSent: number;
    totalReplies: number;
    totalRevenue: number;
  }> {
    const campaigns = Array.from(this.campaigns.values());
    return {
      running: this.isRunning,
      campaigns: campaigns.length,
      totalLeads: campaigns.reduce((sum, c) => sum + c.leads, 0),
      totalSent: campaigns.reduce((sum, c) => sum + c.emailsSent, 0),
      totalReplies: campaigns.reduce((sum, c) => sum + c.replies, 0),
      totalRevenue: campaigns.reduce((sum, c) => sum + c.revenue, 0)
    };
  }

  async healthCheck(): Promise<{
    domainFleet: any;
    emailAccounts: number;
    activeCampaigns: number;
  }> {
    return {
      domainFleet: await domainFleetManager.getFleetStatus(),
      emailAccounts: (await emailAccountManager.getAccountList()).length,
      activeCampaigns: (await campaignOrchestrator.getActiveCampaigns()).length
    };
  }
}

export const orchestrator = new OutboundOrchestrator();

export {
  domainFleetManager,
  emailAccountManager,
  dnsConfigManager,
  leadSourcingAgent,
  emailVerifierAgent,
  spinTaxGenerator,
  campaignOrchestrator,
  responseHandlerAgent,
  negotiationAgent,
  voiceSellerAgent
};