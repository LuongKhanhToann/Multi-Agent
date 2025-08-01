import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai'; // Import streamText from 'ai' package
import { Agent } from '@mastra/core';
import { Memory } from '@mastra/memory';
import { LibSQLStore } from '@mastra/libsql';
import { retryRequest } from '../retryHelper';

class OrderAgent extends Agent {
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

      return responseText || 'Không thể xử lý yêu cầu đặt hàng.';
    } catch (error) {
      console.error('Lỗi trong orderAgent:', error);
      return 'Đã xảy ra lỗi khi xử lý yêu cầu đặt hàng.';
    }
  }
}

export const orderAgent = new OrderAgent({
  name: 'Order Agent',
  instructions: `
 You are an order assistant who helps customers complete their orders. You need to confirm customer information before processing the order:

  - Ask the customer to provide their name, phone number, and shipping address.
  - Then, ask about the products they want to order, including quantity and order description (product name, size, color, etc.).
  - Reconfirm all information to make sure the customer is sure before completing the order.
  - If there are errors or incomplete information, ask the customer to correct and provide the correct information.
  - Provide an overview of the order, including products, quantity, and shipping information before confirming the order.
  - Always maintain a friendly and polite attitude throughout the communication process.
  `,
  model: openai('gpt-4o-mini'),
  tools: {},
  memory: new Memory({
    storage: new LibSQLStore({
      url: process.env.DATABASE_URL || 'file:../mastra.db',
    }),
  }),
});
