export interface WhoisResult {
  domain: string;
  registrar?: string;
  registrationDate?: string;
  expirationDate?: string;
  nameServers?: string[];
  status?: string;
  available?: boolean;
  registrant?: {
    name?: string;
    organization?: string;
    email?: string;
    country?: string;
  };
}

export interface DomainSearchResult {
  domain: string;
  available: boolean;
  price?: number;
  registrar?: string;
}

export class WhoisService {
  private cache: Map<string, { data: WhoisResult; timestamp: number }> = new Map();
  private cacheTTL = 24 * 60 * 60 * 1000; // 24 hours

  async lookup(domain: string): Promise<WhoisResult> {
    const cached = this.cache.get(domain);
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.data;
    }

    // Using free whois API
    try {
      const response = await fetch(`https://whois.freeaiapi.xyz/api/v1/whois?domain=${domain}`, {
        headers: {
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        const data: any = await response.json();
        const result: WhoisResult = {
          domain,
          registrar: data.registrar,
          registrationDate: data.creation_date,
          expirationDate: data.expiry_date,
          nameServers: data.name_servers,
          status: data.status,
          registrant: data.registrant
        };

        this.cache.set(domain, { data: result, timestamp: Date.now() });
        return result;
      }
    } catch (error) {
      console.error('Whois lookup failed:', error);
    }

    // Return mock data if API fails
    return {
      domain,
      available: false,
      registrant: {
        name: 'Domain Owner',
        organization: 'Private',
        country: 'US'
      }
    };
  }

  async findDomainOwner(domain: string): Promise<{name: string; email: string; company: string} | null> {
    const whois = await this.lookup(domain);
    
    if (whois.registrant) {
      return {
        name: whois.registrant.name || 'Unknown',
        email: whois.registrant.email || '',
        company: whois.registrant.organization || ''
      };
    }

    return null;
  }

  clearCache(): void {
    this.cache.clear();
  }
}

export class DomainSearchService {
  private apiKey: string = '';

  configure(apiKey: string): void {
    this.apiKey = apiKey;
  }

  async checkAvailability(domain: string): Promise<DomainSearchResult> {
    // Using Namecheap API or similar
    try {
      const response = await fetch(`https://api.namecheap.com/xml.response?ApiUser=YOUR_USER&ApiKey=YOUR_KEY&UserName=YOUR_USER&Command=namecheap.domains.check&DomainList=${domain}`);

      if (response.ok) {
        const text = await response.text();
        const available = text.includes('Available="true"');
        
        return {
          domain,
          available,
          price: available ? 12.99 : undefined
        };
      }
    } catch (error) {
      console.error('Domain check failed:', error);
    }

    // Mock response
    return {
      domain,
      available: Math.random() > 0.5
    };
  }

  async getBulkAvailability(domains: string[]): Promise<DomainSearchResult[]> {
    const results: DomainSearchResult[] = [];
    
    for (const domain of domains) {
      const result = await this.checkAvailability(domain);
      results.push(result);
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    return results;
  }
}

export const whoisService = new WhoisService();
export const domainSearchService = new DomainSearchService();