export interface ResendConfig {
  apiKey: string;
}

export interface SendEmailOptions {
  from: string;
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface SendEmailResult {
  id: string;
  status: 'sent' | 'queued' | 'failed';
  messageId?: string;
  error?: string;
}

export class ResendService {
  private config: ResendConfig | null = null;

  configure(config: ResendConfig): void {
    this.config = config;
  }

  isConfigured(): boolean {
    return !!this.config?.apiKey;
  }

  async sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
    if (!this.config) {
      return { id: '', status: 'failed', error: 'Resend not configured' };
    }

    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: options.from,
          to: options.to,
          subject: options.subject,
          html: options.html,
          text: options.text
        })
      });

      const data: any = await response.json();

      if (response.ok) {
        return {
          id: data.id,
          status: 'sent',
          messageId: data.id
        };
      } else {
        return {
          id: '',
          status: 'failed',
          error: data.message || 'Failed to send email'
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

  async sendBatch(emails: SendEmailOptions[]): Promise<SendEmailResult[]> {
    const results: SendEmailResult[] = [];
    
    for (const email of emails) {
      const result = await this.sendEmail(email);
      results.push(result);
      
      // Rate limiting - wait between sends
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    return results;
  }
}

export class SendGridService {
  private apiKey: string = '';

  configure(apiKey: string): void {
    this.apiKey = apiKey;
  }

  isConfigured(): boolean {
    return !!this.apiKey;
  }

  async sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
    if (!this.apiKey) {
      return { id: '', status: 'failed', error: 'SendGrid not configured' };
    }

    try {
      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: options.to }] }],
          from: { email: options.from },
          subject: options.subject,
          content: [
            { type: 'text/plain', value: options.text || '' },
            { type: 'text/html', value: options.html }
          ]
        })
      });

      if (response.ok) {
        return {
          id: crypto.randomUUID(),
          status: 'sent'
        };
      } else {
        const data: any = await response.json();
        return {
          id: '',
          status: 'failed',
          error: data.errors?.[0]?.message || 'Failed to send'
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
}

export const resendService = new ResendService();
export const sendGridService = new SendGridService();