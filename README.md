# Domain Sales Outbound AI Agents

AI-powered outbound email infrastructure for selling domain names.

## Features

- **Infrastructure Management**: Domain fleet, email accounts, DNS configuration
- **Lead Sourcing**: Find and classify high-intent leads (Tier 1/2/3)
- **Email Verification**: Zero-bounce validation
- **Spin Tax Generator**: Create unique email variations to avoid spam filters
- **Campaign Orchestrator**: Multi-account campaigns with follow-up sequences
- **Response Handler**: Process replies, detect sentiment and intent
- **Negotiation Agent**: Handle objections and close sales
- **Voice Seller**: AI-powered cold calling agent

## Quick Start

```bash
# Install dependencies
npm install

# Run demo
npm run demo
```

## Project Structure

```
├── config/
│   └── system.json          # Configuration settings
├── infrastructure/
│   ├── domainFleet.ts       # Manage sending domains
│   ├── emailAccount.ts      # Email accounts & warming
│   └── dnsConfig.ts         # SPF/DKIM/DMARC setup
├── leads/
│   ├── leadSourcing.ts      # Find leads
│   └── emailVerifier.ts     # Verify emails
├── outreach/
│   ├── spinTax.ts           # Generate variations
│   └── campaignOrchestrator.ts  # Manage campaigns
├── sales/
│   ├── responseHandler.ts   # Process replies
│   └── negotiation.ts       # Close deals
├── voice/
│   └── voiceSeller.ts       # Cold calling AI
├── orchestrator.ts          # Main coordinator
├── demo.ts                  # Demo script
└── index.ts                 # Exports
```

## Usage

```typescript
import { leadSourcingAgent, emailVerifierAgent, spinTaxGenerator } from './index';

// Find leads
const leads = await leadSourcingAgent.searchLeads({
  domain: 'yourdomain.com',
  vertical: 'solar'
});

// Verify emails
const validEmails = await emailVerifierAgent.filterValidEmails(emails);

// Generate email variations
const email = spinTaxGenerator.createDomainPitch('domain.com', 2500);
```

## Configuration

Edit `config/system.json` to customize:
- Email account limits
- Warming days
- Follow-up timing
- Provider settings

## License

MIT