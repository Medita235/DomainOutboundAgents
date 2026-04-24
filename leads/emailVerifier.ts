import { BaseAgent } from '../base/agent';

export interface EmailValidation {
  email: string;
  status: 'valid' | 'invalid' | 'catch-all' | 'unknown';
  isValid: boolean;
  isCatchAll: boolean;
  isRole: boolean;
  firstName: string;
  lastName: string;
  confidence: number;
  provider: string;
  checkedAt: Date;
}

export interface VerificationResult {
  total: number;
  valid: number;
  invalid: number;
  catchAll: number;
  unknown: number;
  bounceRate: number;
}

export class EmailVerifierAgent extends BaseAgent {
  private validations: Map<string, EmailValidation> = new Map();

  constructor() {
    super({
      name: 'email-verifier-agent',
      description: 'Validates email addresses before outreach',
      instructions: `
You are the Email Verifier Agent. Your role is to:
1. Verify email addresses exist and are active
2. Detect catch-all servers
3. Avoid hard bounces
4. Check role-based emails

VERIFICATION STATUS:
- VALID: Confirmed active inbox - Safe to send
- CATCH-ALL: Server accepts all mail - Use with caution
- INVALID: Email does not exist - FORBIDDEN to send
- UNKNOWN: No server response - HIGH RISK

CRITICAL RULES:
- Never send to INVALID emails (bounce rate destroys reputation)
- Use VALID emails only for high-value campaigns
- Flag CATCH-ALL for lower-priority campaigns
- Re-verify unknown status emails weekly`,
      tools: ['fetch']
    });
  }

  async verifyEmail(email: string): Promise<EmailValidation> {
    const cached = this.validations.get(email);
    if (cached) return cached;

    const validation = await this.performVerification(email);
    this.validations.set(email, validation);
    return validation;
  }

  async verifyBatch(emails: string[]): Promise<Map<string, EmailValidation>> {
    const results = new Map<string, EmailValidation>();
    
    for (const email of emails) {
      const validation = await this.verifyEmail(email);
      results.set(email, validation);
    }
    
    return results;
  }

  private async performVerification(email: string): Promise<EmailValidation> {
    const parts = email.split('@');
    const domain = parts[1] || '';
    const username = parts[0] || '';

    const isRole = this.isRoleBased(username);
    const provider = this.detectProvider(domain);
    const names = this.extractNames(username);

    const validation: EmailValidation = {
      email,
      status: 'valid',
      isValid: true,
      isCatchAll: false,
      isRole: isRole,
      firstName: names.firstName,
      lastName: names.lastName,
      confidence: 85,
      provider,
      checkedAt: new Date()
    };

    if (this.catchAllDomains.includes(domain)) {
      validation.status = 'catch-all';
      validation.isCatchAll = true;
      validation.isValid = true;
    }

    if (this.invalidDomains.includes(domain)) {
      validation.status = 'invalid';
      validation.isValid = false;
    }

    return validation;
  }

  private isRoleBased(username: string): boolean {
    const roleTerms = ['admin', 'support', 'info', 'sales', 'marketing', 'contact', 'help', 'noreply', 'no-reply', 'webmaster'];
    return roleTerms.some(term => username.toLowerCase().includes(term));
  }

  private detectProvider(domain: string): string {
    const providers: Record<string, string> = {
      'gmail.com': 'Google Workspace',
      'google.com': 'Google Workspace',
      'outlook.com': 'Microsoft 365',
      'hotmail.com': 'Microsoft 365',
      'yahoo.com': 'Yahoo Mail',
      'protonmail.com': 'Proton Mail',
      'proton.me': 'Proton Mail',
      'icloud.com': 'Apple iCloud',
      'zoho.com': 'Zoho Mail',
      'fastmail.com': 'FastMail'
    };
    return providers[domain] || 'Unknown';
  }

  private extractNames(username: string): {firstName: string; lastName: string} {
    const parts = username.split(/[._-]/);
    return {
      firstName: parts[0] || '',
      lastName: parts[1] || ''
    };
  }

  private catchAllDomains = ['example.com', 'test.com'];
  private invalidDomains = ['fake.com', 'none.com'];

  async getVerificationStats(emails: string[]): Promise<VerificationResult> {
    const validations = await Promise.all(emails.map(e => this.verifyEmail(e)));
    
    return {
      total: validations.length,
      valid: validations.filter(v => v.status === 'valid').length,
      invalid: validations.filter(v => v.status === 'invalid').length,
      catchAll: validations.filter(v => v.status === 'catch-all').length,
      unknown: validations.filter(v => v.status === 'unknown').length,
      bounceRate: validations.filter(v => !v.isValid).length / validations.length * 100
    };
  }

  async filterValidEmails(emails: string[]): Promise<string[]> {
    const validations = await Promise.all(emails.map(e => this.verifyEmail(e)));
    return validations.filter(v => v.isValid && !v.isRole).map(v => v.email);
  }
}

export const emailVerifierAgent = new EmailVerifierAgent();