
import { Mastra } from '@mastra/core/mastra';
import { PinoLogger } from '@mastra/loggers';
import { LibSQLStore } from '@mastra/libsql';
import { weatherWorkflow } from './workflows/weather-workflow';
import { orderAgent } from './agents/order-agent';
import { shopAgent } from './agents/shop-agent';
import { masterAgent } from './agents/master-agent';
import { chatAgent } from './agents/chat-agent';

export const mastra = new Mastra({
  workflows: { weatherWorkflow },
  agents: { chatAgent, orderAgent, shopAgent, masterAgent },
  storage: new LibSQLStore({
    // stores telemetry, evals, ... into memory storage, if it needs to persist, change to file:../mastra.db
    url: ":memory:",
  }),
  logger: new PinoLogger({
    name: 'Mastra',
    level: 'info',
  }),
});
