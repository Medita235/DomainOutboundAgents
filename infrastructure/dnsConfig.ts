interface DNSConfig {
  domain: string;
  records: DNSRecord[];
  spf: boolean;
  dkim: boolean;
  dmarc: boolean;
}

interface DNSRecord {
  type: 'A' | 'AAAA' | 'CNAME' | 'MX' | 'TXT' | 'SPF' | 'DKIM';
  name: string;
  value: string;
  priority?: number;
  ttl: number;
}

interface DNSTemplate {
  provider: string;
  records: Omit<DNSRecord, 'name'>[];
}

const DNS_TEMPLATES: Record<string, DNSTemplate> = {
  'google-workspace': {
    provider: 'Google Workspace',
    records: [
      { type: 'MX', value: 'aspmx.l.google.com.', priority: 1, ttl: 3600 },
      { type: 'MX', value: 'alt1.aspmx.l.google.com.', priority: 5, ttl: 3600 },
      { type: 'TXT', value: 'v=spf1 include:_spf.google.com ~all', ttl: 3600 },
      { type: 'TXT', value: 'google-site-verification=XXXXX', ttl: 3600 }
    ]
  },
  'protonmail': {
    provider: 'Proton Mail',
    records: [
      { type: 'MX', value: 'mail.protonmail.ch.', priority: 10, ttl: 3600 },
      { type: 'TXT', value: 'v=spf1 include:_spf.protonmail.ch ~all', ttl: 3600 },
      { type: 'TXT', value: 'protonmail._domainkey=protonmail key', ttl: 3600 }
    ]
  },
  'resend': {
    provider: 'Resend',
    records: [
      { type: 'TXT', value: 'v=spf1 include:_spf.resend.com ~all', ttl: 3600 },
      { type: 'CNAME', value: 'resend._domainkey.resend.com.', ttl: 3600 },
      { type: 'DKIM', value: 'selector.resend.com.', ttl: 3600 }
    ]
  },
  'aws-ses': {
    provider: 'AWS SES',
    records: [
      { type: 'MX', value: 'feedback-smtp.us-east-1.amazonses.com.', priority: 10, ttl: 3600 },
      { type: 'TXT', value: 'v=spf1 include:amazonses.com ~all', ttl: 3600 }
    ]
  },
  'mailgun': {
    provider: 'Mailgun',
    records: [
      { type: 'MX', value: 'mxa.mailgun.org.', priority: 10, ttl: 3600 },
      { type: 'MX', value: 'mxb.mailgun.org.', priority: 20, ttl: 3600 },
      { type: 'TXT', value: 'v=spf1 include:mailgun.org ~all', ttl: 3600 }
    ]
  }
};

export class DNSConfigManager {
  private configs: Map<string, DNSConfig> = new Map();

  getTemplate(provider: string): DNSTemplate | null {
    return DNS_TEMPLATES[provider] || null;
  }

  generateSPF(domain: string, include: string): DNSRecord {
    return {
      type: 'TXT',
      name: domain,
      value: `v=spf1 include:${include} ~all`,
      ttl: 3600
    };
  }

  generateDKIM(domain: string, selector: string, key: string): DNSRecord {
    return {
      type: 'TXT',
      name: `${selector}._domainkey.${domain}`,
      value: `v=DKIM1; k=rsa; p=${key}`,
      ttl: 3600
    };
  }

  generateDMARC(domain: string, policy: 'quarantine' | 'reject' | 'none' = 'quarantine'): DNSRecord {
    return {
      type: 'TXT',
      name: '_dmarc',
      value: `v=DMARC1; p=${policy}; rua=mailto:dmarc@${domain}`,
      ttl: 3600
    };
  }

  generateFullAuth(domain: string, emailProvider: string): DNSConfig {
    const template = this.getTemplate(emailProvider);
    const records: DNSRecord[] = [];
    
    if (template) {
      template.records.forEach(r => {
        records.push({ ...r, name: domain });
      });
    }

    records.push(this.generateDMARC(domain));

    const config: DNSConfig = {
      domain,
      records,
      spf: true,
      dkim: true,
      dmarc: true
    };

    this.configs.set(domain, config);
    return config;
  }

  async verifyDNS(domain: string): Promise<{
    spf: boolean;
    dkim: boolean;
    dmarc: boolean;
  }> {
    return {
      spf: true,
      dkim: true,
      dmarc: true
    };
  }

  getConfig(domain: string): DNSConfig | null {
    return this.configs.get(domain) || null;
  }

  listProviders(): string[] {
    return Object.keys(DNS_TEMPLATES);
  }
}

export const dnsConfigManager = new DNSConfigManager();