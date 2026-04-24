import { BaseAgent } from '../base/agent';

interface SpinVariation {
  id: string;
  text: string;
  tokens: string[];
  used: boolean;
}

interface SpinTaxTemplate {
  id: string;
  subject: string;
  body: string;
  variables: string[];
  variations: SpinVariation[];
}

export class SpinTaxGenerator extends BaseAgent {
  private templates: Map<string, SpinTaxTemplate> = new Map();
  private defaultGreeting = ['Hey', 'Hello', 'Hi', 'Good morning', 'Good afternoon'];
  private defaultOpener = ['regarding', 'about', 'concerning', 'with regards to'];
  private defaultCTA = ['Let me know', 'Feel free to', 'Happy to', 'Would love to'];

  constructor() {
    super({
      name: 'spin-tax-generator',
      description: 'Creates unique email variations to avoid spam filters',
      instructions: `
You are the Spin Tax Generator. Your role is to:
1. Generate unique variations of each email
2. Rotate synonyms to avoid pattern detection
3. Shift information positions
4. Create human-like variation

SPIN TAX METHODOLOGY:
- Rotate greetings: {Hey|Hello|Hi}
- Rotate openers: {regarding|about|concerning}
- Rotate CTAs: {Let me know|Feel free to}
- Shift key information positions
- Vary word count and sentence structure
- Use AI for draft, human for refinement

CRITICAL RULES:
- Each variation must be grammatically correct
- Maintain consistent value proposition
- Never repeat exact phrases across accounts
- Generate 5+ variations per campaign`,
      tools: ['fetch']
    });
  }

  generateSpinTax(template: string, variables: Record<string, string>): SpinTaxTemplate {
    const vars = this.extractVariables(template);
    const variations: SpinVariation[] = [];
    
    for (let i = 0; i < 10; i++) {
      const variation = this.createVariation(template, variables, i);
      variations.push({
        id: crypto.randomUUID(),
        text: variation,
        tokens: this.tokenize(variation),
        used: false
      });
    }

    const spinTemplate: SpinTaxTemplate = {
      id: crypto.randomUUID(),
      subject: this.extractSubject(template),
      body: this.extractBody(template),
      variables: vars,
      variations
    };

    this.templates.set(spinTemplate.id, spinTemplate);
    return spinTemplate;
  }

  createVariation(template: string, variables: Record<string, string>, seed: number): string {
    let text = template;
    
    text = text.replace(/\{greeting\}/g, this.rotateItem(this.defaultGreeting, seed));
    text = text.replace(/\{opener\}/g, this.rotateItem(this.defaultOpener, seed));
    text = text.replace(/\{cta\}/g, this.rotateItem(this.defaultCTA, seed));
    
    Object.entries(variables).forEach(([key, value], index) => {
      if ((index + seed) % 2 === 0) {
        text = text.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
      } else {
        text = text.replace(new RegExp(`\\{${key}\\}`, 'g'), this.shuffleWords(value));
      }
    });

    return text;
  }

  private rotateItem(items: string[], index: number): string {
    return items[index % items.length];
  }

  private shuffleWords(text: string): string {
    const words = text.split(' ');
    if (words.length < 2) return text;
    const first = words[0];
    const last = words[words.length - 1];
    words[0] = last;
    words[words.length - 1] = first;
    return words.join(' ');
  }

  private extractVariables(template: string): string[] {
    const matches = template.match(/\{(\w+)\}/g) || [];
    return [...new Set(matches.map(m => m.replace(/[{}]/g, '')))];
  }

  private extractSubject(template: string): string {
    const lines = template.split('\n');
    return lines[0] || '';
  }

  private extractBody(template: string): string {
    const lines = template.split('\n');
    return lines.slice(1).join('\n');
  }

  private tokenize(text: string): string[] {
    return text.toLowerCase().split(/\W+/).filter(t => t.length > 2);
  }

  getNextVariation(templateId: string): SpinVariation | null {
    const template = this.templates.get(templateId);
    if (!template) return null;
    
    const unused = template.variations.find(v => !v.used);
    if (unused) {
      unused.used = true;
      return unused;
    }
    
    const regenerated = this.regenerateVariation(template);
    return regenerated;
  }

  private regenerateVariation(template: SpinTaxTemplate): SpinVariation {
    const baseVariation = template.variations[0]?.text || template.body;
    const newVariation = this.shuffleSentence(baseVariation);
    
    return {
      id: crypto.randomUUID(),
      text: newVariation,
      tokens: this.tokenize(newVariation),
      used: true
    };
  }

  private shuffleSentence(text: string): string {
    const sentences = text.split('. ');
    if (sentences.length < 2) return text;
    const first = sentences.shift();
    sentences.push(first || '');
    return sentences.join('. ');
  }

  createDomainPitch(domain: string, price: number, buyerName?: string): string {
    const greeting = buyerName ? `Hey ${buyerName}` : '{greeting}';
    
    const templates = [
      `${greeting},

{opener} the domain ${domain} - I've been tracking its value and wanted to reach out directly.

Your brand deserves a premium domain. ${domain} is available for $${price.toLocaleString()}.

{cta} discuss - I'm flexible on terms.

Best,
Ayoub`,
      `${greeting},

I noticed ${domain} aligns with your business. Your current setup could be elevated with the premium .com.

${domain} - $${price.toLocaleString()}.

{cta} for details.

Best,
Ayoub`,
      `${greeting},

Quick question - have you considered upgrading to ${domain}?

It's available at $${price.toLocaleString()} and would solidify your brand identity.

{cta} to chat about it.

Thanks,
Ayoub`
    ];

    return templates[Math.floor(Math.random() * templates.length)];
  }
}

export const spinTaxGenerator = new SpinTaxGenerator();