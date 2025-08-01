import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai'; // Import streamText from 'ai' package
import { Agent } from '@mastra/core';
import { Memory } from '@mastra/memory';
import { LibSQLStore } from '@mastra/libsql';
import { retryRequest } from '../retryHelper';

class ChatAgent extends Agent {
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

      return responseText || 'Xin chào! Tôi có thể giúp gì cho bạn hôm nay?';
    } catch (error) {
      console.error('Lỗi trong ChatAgent:', error);
      return 'Đã xảy ra lỗi khi xử lý yêu cầu của bạn.';
    }
  }
}

export const chatAgent = new ChatAgent({
  name: 'Chat Agent',
  instructions: `
    Bạn là một trợ lý trò chuyện thân thiện và hữu ích. Mục tiêu của bạn là hỗ trợ người dùng với các câu hỏi và thắc mắc của họ.
    Trả lời một cách tự nhiên và hữu ích. Hãy trò chuyện với người dùng một cách thân thiện và tự nhiên. Không cần quá trang trọng hoặc chi tiết.
    Hãy chắc chắn rằng bạn luôn giữ thái độ tích cực và tạo cảm giác dễ chịu cho người dùng.
  `,
  model: openai('gpt-4o-mini'),
  tools: {},
  memory: new Memory({
    storage: new LibSQLStore({
      url: process.env.DATABASE_URL || 'file:../mastra.db',
    }),
  }),
});
