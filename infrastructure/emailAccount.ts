import { BaseAgent } from '../base/agent';

interface EmailAccount {
  id: string;
  email: string;
  domain: string;
  status: 'warming' | 'active' | 'suspended' | 'closed';
  reputation: number;
  dayCount: number;
  emailsSentToday: number;
  totalSent: number;
  lastWarmingAction: Date | null;
  warmingTasks: WarmingTask[];
  createdAt: Date;
}

interface WarmingTask {
  type: 'inbound' | 'outbound' | 'reply';
  completed: boolean;
  date: Date;
}

interface WarmingProtocol {
  day: number;
  actions: string[];
  maxEmails: number;
}

const WARMING_PROTOCOL: WarmingProtocol[] = [
  { day: 1, actions: ['Setup profile', 'Send 2-5 emails to local businesses'], maxEmails: 5 },
  { day: 2, actions: ['Subscribe to newsletters', 'Send 5-10 emails'], maxEmails: 10 },
  { day: 3, actions: ['Reply to newsletter emails', 'Send 10-15 emails'], maxEmails: 15 },
  { day: 4, actions: ['Increase to 15-20 emails', 'Engage in threads'], maxEmails: 20 },
  { day: 5, actions: ['Maintain 20-30 emails', 'Start light outreach'], maxEmails: 30 },
  { day: 6-14, actions: ['Gradual increase to 50/day'], maxEmails: 50 },
  { day: 15-30, actions: ['Scale to 100/day'], maxEmails: 100 },
  { day: 30+, actions: ['Full production mode'], maxEmails: 150 }
];

export class EmailAccountManager extends BaseAgent {
  private accounts: Map<string, EmailAccount> = new Map();

  constructor() {
    super({
      name: 'email-account-manager',
      description: 'Manages warmup and rotation of email accounts',
      instructions: `
You are the Email Account Manager. Your role is to:
1. Create and configure new email accounts
2. Execute warming protocols
3. Monitor account reputation
4. Rotate accounts for sending
5. Enforce daily limits

WARMING PROTOCOL:
- Days 1-5: 5-30 emails max
- Days 6-14: 30-50 emails max
- Days 15-30: 50-100 emails max
- Day 30+: Full production (100-150)

CRITICAL RULES:
- Never exceed daily limit per account
- Always do inbound engagement first
- Rotate accounts every 100 emails
- Halt account if reputation drops below 50`,
      tools: ['search', 'fetch', 'send-email']
    });
  }

  async createAccount(email: string, domain: string): Promise<EmailAccount> {
    const account: EmailAccount = {
      id: crypto.randomUUID(),
      email,
      domain,
      status: 'warming',
      reputation: 50,
      dayCount: 0,
      emailsSentToday: 0,
      totalSent: 0,
      lastWarmingAction: null,
      warmingTasks: [],
      createdAt: new Date()
    };

    this.accounts.set(account.id, account);
    return account;
  }

  async executeWarming(accountId: string): Promise<WarmingProtocol | null> {
    const account = this.accounts.get(accountId);
    if (!account || account.status !== 'warming') return null;

    const dayDiff = Math.floor(
      (Date.now() - account.createdAt.getTime()) / (1000 * 60 * 60 * 24)
    );
    account.dayCount = dayDiff;

    const protocol = WARMING_PROTOCOL.find(p => dayDiff >= p.day - 1 && dayDiff < p.day);
    if (protocol) {
      account.lastWarmingAction = new Date();
      account.emailsSentToday = 0;
    }

    return protocol || null;
  }

  async canSend(accountId: string): Promise<{allowed: boolean; reason?: string}> {
    const account = this.accounts.get(accountId);
    if (!account) return { allowed: false, reason: 'Account not found' };
    if (account.status === 'suspended') return { allowed: false, reason: 'Account suspended' };
    if (account.status === 'closed') return { allowed: false, reason: 'Account closed' };

    const dayDiff = Math.floor(
      (Date.now() - account.createdAt.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    const dayLimit = dayDiff < 5 ? 30 : dayDiff < 15 ? 50 : dayDiff < 30 ? 100 : 150;
    
    if (account.emailsSentToday >= dayLimit) {
      return { allowed: false, reason: 'Daily limit reached' };
    }

    return { allowed: true };
  }

  async recordSend(accountId: string): Promise<void> {
    const account = this.accounts.get(accountId);
    if (account) {
      account.emailsSentToday++;
      account.totalSent++;
    }
  }

  async setStatus(accountId: string, status: EmailAccount['status']): Promise<void> {
    const account = this.accounts.get(accountId);
    if (account) {
      account.status = status;
    }
  }

  async getAccountList(): Promise<EmailAccount[]> {
    return Array.from(this.accounts.values());
  }
}

export const emailAccountManager = new EmailAccountManager();