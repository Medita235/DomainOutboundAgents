import { resendService, sendGridService } from './emailService';
import { apolloService } from './apolloService';
import { blandVoiceService, vapiVoiceService } from './voiceService';
import { whoisService, domainSearchService } from './domainService';

export interface ServiceConfig {
  email: {
    provider: 'resend' | 'sendgrid' | 'none';
    apiKey: string;
    fromEmail: string;
    fromName: string;
  };
  leads: {
    provider: 'apollo' | 'none';
    apiKey: string;
  };
  voice: {
    provider: 'bland' | 'vapi' | 'none';
    apiKey: string;
  };
  domain: {
    whoisApiKey: string;
  };
}

export class ServiceManager {
  private config: ServiceConfig | null = null;

  configure(config: ServiceConfig): void {
    this.config = config;
    this.initializeServices();
  }

  private initializeServices(): void {
    if (!this.config) return;

    // Email service
    if (this.config.email.provider === 'resend') {
      resendService.configure({ apiKey: this.config.email.apiKey });
    } else if (this.config.email.provider === 'sendgrid') {
      sendGridService.configure(this.config.email.apiKey);
    }

    // Lead service
    if (this.config.leads.provider === 'apollo') {
      apolloService.configure({ apiKey: this.config.leads.apiKey });
    }

    // Voice service
    if (this.config.voice.provider === 'bland') {
      blandVoiceService.configure({ apiKey: this.config.voice.apiKey });
    } else if (this.config.voice.provider === 'vapi') {
      vapiVoiceService.configure(this.config.voice.apiKey);
    }
  }

  getStatus(): {
    email: { configured: boolean; provider: string };
    leads: { configured: boolean; provider: string };
    voice: { configured: boolean; provider: string };
    domain: { configured: boolean };
  } {
    return {
      email: {
        configured: resendService.isConfigured() || sendGridService.isConfigured(),
        provider: this.config?.email.provider || 'none'
      },
      leads: {
        configured: apolloService.isConfigured(),
        provider: this.config?.leads.provider || 'none'
      },
      voice: {
        configured: blandVoiceService.isConfigured() || vapiVoiceService.isConfigured(),
        provider: this.config?.voice.provider || 'none'
      },
      domain: {
        configured: true
      }
    };
  }

  async testAllServices(): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {};

    // Test email (dry run)
    results.email = resendService.isConfigured() || sendGridService.isConfigured();

    // Test Apollo
    const people = await apolloService.searchPeople({ limit: 1 });
    results.leads = apolloService.isConfigured() || people.length > 0;

    // Test voice (can't really test without making call)
    results.voice = blandVoiceService.isConfigured() || vapiVoiceService.isConfigured();

    // Test domain
    results.domain = true;

    return results;
  }
}

export const serviceManager = new ServiceManager();

// Re-export all services
export {
  resendService,
  sendGridService,
  apolloService,
  blandVoiceService,
  vapiVoiceService,
  whoisService,
  domainSearchService
};