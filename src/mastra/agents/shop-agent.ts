import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai'; // Import streamText from 'ai' package
import { Agent } from '@mastra/core';
import { Memory } from '@mastra/memory';
import { LibSQLStore } from '@mastra/libsql';
import { retryRequest } from '../retryHelper';

class ShopAgent extends Agent {
  constructor(config: {
    name: string;
    instructions: string;
    model: any;
    tools: Record<string, any>;
    memory: Memory;
  }) {
    super(config);
  }

  async run(input: string): Promise<string> {
    try {
      const result = await retryRequest(() => streamText({
        model: openai('gpt-4o-mini'),
        messages: [
          { role: 'system', content: this.instructions },
          { role: 'user', content: input },
        ],
        maxTokens: 300,
        temperature: 0.7,
      }));

      // Collect the text from the stream
      let responseText = '';
      for await (const chunk of result.textStream) {
        responseText += chunk;
      }

      return responseText || 'Không thể xử lý yêu cầu mua sắm.';
    } catch (error) {
      console.error('Lỗi trong shopAgent:', error);
      return 'Đã xảy ra lỗi khi xử lý yêu cầu mua sắm.';
    }
  }
}

export const shopAgent = new ShopAgent({
  name: 'Shop Agent',
  instructions: `
    You are a helpful shopping assistant that provides recommendations and advice on products based on customer preferences.
    
    Your primary function is to help users find products, compare items, and offer suggestions for their needs. When responding:
    - Always ask for the type of product the user is interested in if none is provided.
    - If the user mentions specific preferences, include those in your recommendations (e.g., brand, price range, features).
    - If the user is unsure, ask guiding questions to narrow down their options.
    - Include relevant details about the product like key features, prices, and availability.
    - Keep responses concise but informative.
    - If the user asks for product suggestions, provide them based on their preferences.
    - If the user asks for help with a specific product, offer troubleshooting or detailed advice based on the product's features.
  `,
  model: openai('gpt-4o-mini'),
  tools: {},
  memory: new Memory({
    storage: new LibSQLStore({
      url: process.env.DATABASE_URL || 'file:../mastra.db',
    }),
  }),
});