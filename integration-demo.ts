import { 
  spinTaxGenerator,
  campaignOrchestrator,
  emailAccountManager,
  serviceManager,
  resendService,
  apolloService,
  blandVoiceService,
  whoisService
} from './index';
import * as fs from 'fs';
import * as path from 'path';

interface Config {
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

class IntegrationDemo {
  private domainToSell = 'homesolararray.com';
  private askingPrice = 2500;

  async run() {
    console.log('\n');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('   SERVICE INTEGRATION DEMO');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('\n');

    await this.loadConfig();
    await this.testServiceStatus();
    await this.demoApolloLeadSourcing();
    await this.demoWhoisLookup();
    await this.demoEmailSending();
    await this.demoVoiceCalling();

    console.log('\n');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('   INTEGRATION DEMO COMPLETE');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('\n');
  }

  private async loadConfig() {
    console.log('📋 Loading Service Configuration');
    console.log('───────────────────────────────────────────────────────────');

    const configPath = path.join(__dirname, 'config/services.json');
    
    let config: Config;
    
    if (fs.existsSync(configPath)) {
      const fileContent = fs.readFileSync(configPath, 'utf-8');
      config = JSON.parse(fileContent);
      console.log('   ✅ Loaded config from config/services.json');
    } else {
      const examplePath = path.join(__dirname, 'config/services.example.json');
      if (fs.existsSync(examplePath)) {
        console.log('   ⚠️  No config found. Using default config...');
        console.log(`   📝 Copy ${examplePath} to config/services.json and add your API keys`);
      }
      
      config = {
        email: { provider: 'none', apiKey: '', fromEmail: '', fromName: '' },
        leads: { provider: 'none', apiKey: '' },
        voice: { provider: 'none', apiKey: '' },
        domain: { whoisApiKey: '' }
      };
    }

    serviceManager.configure(config as any);
    console.log('');
  }

  private async testServiceStatus() {
    console.log('🔧 Service Status');
    console.log('───────────────────────────────────────────────────────────');

    const status = serviceManager.getStatus();
    
    console.log(`   Email:    ${status.email.configured ? '✅' : '❌'} ${status.email.provider}`);
    console.log(`   Leads:    ${status.leads.configured ? '✅' : '❌'} ${status.leads.provider}`);
    console.log(`   Voice:    ${status.voice.configured ? '✅' : '❌'} ${status.voice.provider}`);
    console.log(`   Domain:   ${status.domain.configured ? '✅' : '❌'} whois`);
    console.log('');
  }

  private async demoApolloLeadSourcing() {
    console.log('🎯 Apollo Lead Sourcing (Real)');
    console.log('───────────────────────────────────────────────────────────');

    const people = await apolloService.searchPeople({
      query: 'solar energy company',
      limit: 5
    });

    console.log(`   Found ${people.length} leads from Apollo:`);
    people.forEach((person, i) => {
      console.log(`   ${i + 1}. ${person.name} - ${person.title} at ${person.company}`);
      console.log(`      📧 ${person.email} | 📞 ${person.phone || 'N/A'}`);
    });
    console.log('');
  }

  private async demoWhoisLookup() {
    console.log('🔍 WHOIS Domain Lookup');
    console.log('───────────────────────────────────────────────────────────');

    const result = await whoisService.lookup(this.domainToSell);
    console.log(`   Domain: ${result.domain}`);
    console.log(`   Registrar: ${result.registrar || 'Unknown'}`);
    console.log(`   Registrant: ${result.registrant?.organization || 'Private'}`);
    console.log(`   Country: ${result.registrant?.country || 'Unknown'}`);
    console.log('');
  }

  private async demoEmailSending() {
    console.log('📧 Email Sending (Resend/SendGrid)');
    console.log('───────────────────────────────────────────────────────────');

    // Generate email with spin tax
    const emailTemplate = spinTaxGenerator.createDomainPitch(
      this.domainToSell, 
      this.askingPrice,
      'John'
    );

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a1a1a;">Premium Domain Opportunity</h2>
        <p style="font-size: 16px; line-height: 1.6;">
          ${emailTemplate.replace(/\n/g, '<br>')}
        </p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="font-size: 12px; color: #666;">
          This is a cold outreach email. If you'd like to opt out, please reply with "unsubscribe".
        </p>
      </div>
    `;

    const result = await resendService.sendEmail({
      from: 'Ayoub K <outreach@yourdomain.com>',
      to: 'test@example.com',
      subject: `${this.domainToSell} - Domain Inquiry`,
      html: emailHtml,
      text: emailTemplate
    });

    console.log(`   Status: ${result.status === 'sent' ? '✅' : '⚠️'} ${result.status}`);
    if (result.error) {
      console.log(`   Error: ${result.error}`);
      console.log('   (This is expected if Resend is not configured with API key)');
    } else if (result.messageId) {
      console.log(`   Message ID: ${result.messageId}`);
    }
    console.log('');
  }

  private async demoVoiceCalling() {
    console.log('📞 Voice Calling (Bland.ai)');
    console.log('───────────────────────────────────────────────────────────');

    // Generate script
    const script = await blandVoiceService.generateScript(this.domainToSell, this.askingPrice);
    
    console.log('   Generated voice script:');
    console.log(`   ─────────────────────`);
    console.log(`   1. ${script.greeting}`);
    console.log(`   2. ${script.pitch}`);
    console.log(`   3. ${script.qualification}`);
    console.log(`   4. Closing: ${script.closing}`);

    // Test call (won't actually call without API key)
    const callResult = await blandVoiceService.makeCall({
      phoneNumber: '+15550000000',
      task: script.greeting + ' ' + script.pitch,
      metadata: { domain: this.domainToSell }
    });

    console.log(`\n   Call test: ${callResult.status}`);
    if (callResult.error) {
      console.log(`   Note: ${callResult.error}`);
    }
    console.log('');
  }
}

// Run the demo
const demo = new IntegrationDemo();
demo.run().catch(console.error);