import { 
  orchestrator,
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
} from './index';

class DomainSalesDemo {
  private domainToSell = 'homesolararray.com';
  private askingPrice = 2500;

  async run() {
    console.log('\n');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('   DOMAIN SALES OUTBOUND AI AGENTS - DEMO');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('\n');

    await this.step1_setupInfrastructure();
    await this.step2_sourceLeads();
    await this.step3_verifyEmails();
    await this.step4_generateEmailVariations();
    await this.step5_createCampaign();
    await this.step6_simulateReply();
    await this.step7_negotiation();
    await this.step8_voiceSeller();
    await this.showFinalStats();

    console.log('\n');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('   DEMO COMPLETE');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('\n');
  }

  private async step1_setupInfrastructure() {
    console.log('📧 STEP 1: Setting Up Email Infrastructure');
    console.log('───────────────────────────────────────────────────────────');

    // Add sending domains
    const domains = ['mail-sender1.com', 'mail-sender2.com', 'mail-sender3.com'];
    for (const domain of domains) {
      await domainFleetManager.addDomain({ name: domain, nameserver: 'cloudflare', dnsRecords: [] });
    }

    const fleetStatus = await domainFleetManager.getFleetStatus();
    console.log(`   ✅ Domain fleet: ${fleetStatus.active} active domains`);

    // Create email accounts
    const accounts = [
      'john.smith@sender1.com',
      'mike.johnson@sender2.com',
      'alex.brown@sender3.com'
    ];

    for (const email of accounts) {
      const domain = email.split('@')[1];
      await emailAccountManager.createAccount(email, domain);
    }

    const accountList = await emailAccountManager.getAccountList();
    console.log(`   ✅ Email accounts: ${accountList.length} accounts created`);

    // Setup DNS
    const dnsConfig = dnsConfigManager.generateFullAuth('mail-sender1.com', 'resend');
    console.log(`   ✅ DNS configured: SPF, DKIM, DMARC enabled`);
    console.log('');
  }

  private async step2_sourceLeads() {
    console.log('🎯 STEP 2: Sourcing Leads');
    console.log('───────────────────────────────────────────────────────────');

    const leads = await leadSourcingAgent.searchLeads({
      domain: this.domainToSell,
      vertical: 'solar',
      tier: 1
    });

    console.log(`   ✅ Found ${leads.length} leads for: ${this.domainToSell}`);

    leads.forEach((lead, i) => {
      console.log(`   ${i + 1}. ${lead.domain} (Tier ${lead.tier} - ${lead.tierName}) - Score: ${lead.score}`);
    });
    console.log('');
  }

  private async step3_verifyEmails() {
    console.log('✅ STEP 3: Verifying Emails');
    console.log('───────────────────────────────────────────────────────────');

    const testEmails = [
      'contact@homesolararray.net',
      'admin@fakeemail123.com',
      'info@solarcompanies.com',
      'sales@legitbusiness.com'
    ];

    const results = await emailVerifierAgent.verifyBatch(testEmails);
    
    results.forEach((validation, email) => {
      const status = validation.isValid ? '✅ VALID' : '❌ INVALID';
      const role = validation.isRole ? ' (role-based)' : '';
      console.log(`   ${status}: ${email}${role}`);
    });

    const stats = await emailVerifierAgent.getVerificationStats(testEmails);
    console.log(`   📊 Bounce rate: ${stats.bounceRate.toFixed(1)}%`);
    console.log('');
  }

  private async step4_generateEmailVariations() {
    console.log('✍️  STEP 4: Generating Email Variations (Spin Tax)');
    console.log('───────────────────────────────────────────────────────────');

    const baseTemplate = spinTaxGenerator.createDomainPitch(this.domainToSell, this.askingPrice);
    console.log('   Base template created:');
    console.log('   ─────────────────────');
    console.log('   ' + baseTemplate.substring(0, 150) + '...');
    console.log('');

    // Generate variations
    const variations = [];
    for (let i = 0; i < 3; i++) {
      const variation = spinTaxGenerator.createDomainPitch(
        this.domainToSell, 
        this.askingPrice,
        'John'
      );
      variations.push(variation);
    }

    console.log(`   ✅ Generated ${variations.length} unique variations`);
    console.log('   Each variation has different greeting/opener/CTA');
    console.log('');
  }

  private async step5_createCampaign() {
    console.log('📨 STEP 5: Creating Campaign');
    console.log('───────────────────────────────────────────────────────────');

    const accountList = await emailAccountManager.getAccountList();
    const accountIds = accountList.map(a => a.id);

    const campaign = await campaignOrchestrator.createCampaign(
      `Campaign-${this.domainToSell}`,
      this.domainToSell,
      accountIds,
      ['lead-1', 'lead-2', 'lead-3'],
      spinTaxGenerator.createDomainPitch(this.domainToSell, this.askingPrice)
    );

    await campaignOrchestrator.scheduleCampaign(campaign.id);
    await campaignOrchestrator.startCampaign(campaign.id);

    console.log(`   ✅ Campaign created: ${campaign.name}`);
    console.log(`   📧 Status: ${campaign.status}`);
    console.log(`   📊 Accounts: ${campaign.accounts.length} sending accounts`);
    console.log('');
  }

  private async step6_simulateReply() {
    console.log('💬 STEP 6: Processing Reply');
    console.log('───────────────────────────────────────────────────────────');

    const reply = await responseHandlerAgent.processReply(
      'campaign-123',
      'lead-1',
      'account-1',
      'Re: homesolararray.com',
      'Hi, I am interested in this domain. What is the best price you can offer?'
    );

    console.log(`   📩 Reply received:`);
    console.log(`   - Sentiment: ${reply.sentiment.toUpperCase()}`);
    console.log(`   - Intent: ${reply.intent.toUpperCase()}`);
    console.log(`   - Action required: ${reply.requiresAction}`);
    console.log('');
  }

  private async step7_negotiation() {
    console.log('💰 STEP 7: Negotiation');
    console.log('───────────────────────────────────────────────────────────');

    const negotiation = await negotiationAgent.startNegotiation(
      'lead-1',
      this.domainToSell,
      this.askingPrice
    );

    console.log(`   ✅ Negotiation started for: ${this.domainToSell}`);
    console.log(`   💵 Asking price: $${this.askingPrice.toLocaleString()}`);

    // Simulate buyer offer
    await negotiationAgent.receiveOffer(negotiation.id, 1500, 'Can you do $1,500?');

    // Handle objection
    const objectionResponse = await negotiationAgent.handleObjection(
      negotiation.id,
      'That seems expensive'
    );

    console.log(`   📝 Objection handled: ${objectionResponse.action}`);
    console.log(`   💬 Response: ${objectionResponse.response.substring(0, 80)}...`);
    console.log('');
  }

  private async step8_voiceSeller() {
    console.log('📞 STEP 8: Voice Seller Agent');
    console.log('───────────────────────────────────────────────────────────');

    const config = await voiceSellerAgent.getVoiceConfig();
    console.log(`   🔧 Voice config:`);
    console.log(`   - Provider: ${config.provider}`);
    console.log(`   - Language: ${config.language}`);
    console.log(`   - Speed: ${config.speed}x`);

    const pitch = voiceSellerAgent.generatePitch(this.domainToSell, this.askingPrice);
    console.log(`\n   📝 Generated pitch:\n   "${pitch.substring(0, 100)}..."`);
    console.log('');
  }

  private async showFinalStats() {
    console.log('📊 FINAL STATISTICS');
    console.log('───────────────────────────────────────────────────────────');

    const status = await orchestrator.getStatus();
    console.log(`   Campaigns: ${status.campaigns}`);
    console.log(`   Total Leads: ${status.totalLeads}`);
    console.log(`   Emails Sent: ${status.totalSent}`);
    console.log(`   Replies: ${status.totalReplies}`);
    console.log(`   Revenue: $${status.totalRevenue.toLocaleString()}`);

    const health = await orchestrator.healthCheck();
    console.log(`\n   🔧 Infrastructure Health:`);
    console.log(`   - Domain Fleet: ${health.domainFleet.active} active / ${health.domainFleet.total} total`);
    console.log(`   - Email Accounts: ${health.emailAccounts}`);
    console.log(`   - Active Campaigns: ${health.activeCampaigns}`);
  }
}

// Run the demo
const demo = new DomainSalesDemo();
demo.run().catch(console.error);