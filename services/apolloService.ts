export interface ApolloConfig {
  apiKey: string;
}

export interface ApolloPerson {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  phone?: string;
  title?: string;
  company?: string;
  companyDomain?: string;
  linkedinUrl?: string;
  city?: string;
  state?: string;
  country?: string;
}

export interface ApolloSearchParams {
  query?: string;
  organization?: string;
  title?: string[];
  locations?: string[];
  industries?: string[];
  limit?: number;
}

export class ApolloService {
  private config: ApolloConfig | null = null;

  configure(config: ApolloConfig): void {
    this.config = config;
  }

  isConfigured(): boolean {
    return !!this.config?.apiKey;
  }

  async searchPeople(params: ApolloSearchParams): Promise<ApolloPerson[]> {
    if (!this.config) {
      console.log('Apollo not configured - using mock data');
      return this.getMockPeople(params);
    }

    try {
      const response = await fetch('https://api.apollo.io/api/v1/mixed_people/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        },
        body: JSON.stringify({
          api_key: this.config.apiKey,
          q: params.query || params.organization,
          title_filter: params.title?.join('|'),
          location_filters: params.locations,
          industry_filters: params.industries,
          per_page: params.limit || 10
        })
      });

      const data: any = await response.json();
      
      if (data.people) {
        return data.people.map((p: any) => ({
          id: p.id,
          firstName: p.first_name,
          lastName: p.last_name,
          name: p.name,
          email: p.email,
          phone: p.phone_number,
          title: p.title,
          company: p.organization?.name,
          companyDomain: p.organization?.website_url,
          linkedinUrl: p.linkedin_url,
          city: p.city,
          state: p.state,
          country: p.country
        }));
      }
      
      return [];
    } catch (error) {
      console.error('Apollo API error:', error);
      return this.getMockPeople(params);
    }
  }

  async enrichEmail(email: string): Promise<{email: string; isValid: boolean; confidence: number}> {
    if (!this.config) {
      return { email, isValid: true, confidence: 80 };
    }

    try {
      const response = await fetch('https://api.apollo.io/api/v1/emails/find', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          api_key: this.config.apiKey,
          email: email
        })
      });

      const data: any = await response.json();
      return {
        email: data.email || email,
        isValid: data.status === 'valid',
        confidence: data.confidence || 0
      };
    } catch {
      return { email, isValid: true, confidence: 80 };
    }
  }

  async getCompanyDomains(companyName: string): Promise<string[]> {
    if (!this.config) {
      return [];
    }

    try {
      const response = await fetch('https://api.apollo.io/api/v1/organizations/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          api_key: this.config.apiKey,
          q: companyName
        })
      });

      const data: any = await response.json();
      
      if (data.organizations?.[0]) {
        const org = data.organization[0];
        return org.domain ? [org.domain] : [];
      }
      
      return [];
    } catch {
      return [];
    }
  }

  private getMockPeople(params: ApolloSearchParams): ApolloPerson[] {
    return [
      {
        id: 'mock-1',
        firstName: 'John',
        lastName: 'Smith',
        name: 'John Smith',
        email: 'john.smith@example.com',
        phone: '+1-555-0101',
        title: 'CEO',
        company: 'SolarTech Inc',
        companyDomain: 'solartech.com',
        linkedinUrl: 'https://linkedin.com/in/johnsmith',
        city: 'San Francisco',
        state: 'CA',
        country: 'USA'
      },
      {
        id: 'mock-2',
        firstName: 'Sarah',
        lastName: 'Johnson',
        name: 'Sarah Johnson',
        email: 'sarah.j@renewable.com',
        phone: '+1-555-0102',
        title: 'VP of Operations',
        company: 'Renewable Energy Corp',
        companyDomain: 'renewable.com',
        linkedinUrl: 'https://linkedin.com/in/sarahjohnson',
        city: 'Austin',
        state: 'TX',
        country: 'USA'
      },
      {
        id: 'mock-3',
        firstName: 'Mike',
        lastName: 'Chen',
        name: 'Mike Chen',
        email: 'm.chen@solarplus.com',
        phone: '+1-555-0103',
        title: 'Founder',
        company: 'SolarPlus',
        companyDomain: 'solarplus.io',
        linkedinUrl: 'https://linkedin.com/in/mikechen',
        city: 'Seattle',
        state: 'WA',
        country: 'USA'
      }
    ];
  }
}

export const apolloService = new ApolloService();