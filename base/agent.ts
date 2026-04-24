export interface AgentConfig {
  name: string;
  description: string;
  instructions: string;
  tools: string[];
}

export interface AgentExecution {
  agentId: string;
  input: string;
  output?: any;
  status: 'pending' | 'running' | 'completed' | 'failed';
  error?: string;
}

export class BaseAgent {
  protected config: AgentConfig;
  protected tools: any[] = [];

  constructor(config: AgentConfig) {
    this.config = config;
  }

  async execute(input: string): Promise<any> {
    return {
      output: `Executed ${this.config.name} with input: ${input.substring(0, 50)}...`,
      status: 'completed'
    };
  }

  getConfig(): AgentConfig {
    return this.config;
  }
}

export class AgentRegistry {
  private static agents: Map<string, BaseAgent> = new Map();

  static register(name: string, agent: BaseAgent): void {
    this.agents.set(name, agent);
  }

  static get(name: string): BaseAgent | undefined {
    return this.agents.get(name);
  }

  static list(): string[] {
    return Array.from(this.agents.keys());
  }
}