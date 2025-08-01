import { openai } from '@ai-sdk/openai';
import { Agent } from '@mastra/core';
import { Memory } from '@mastra/memory';
import { LibSQLStore } from '@mastra/libsql';
import { handleRequestTool } from '../tools/master-tool';

// Định nghĩa Master Chat Agent
export const masterAgent = new Agent({
  name: 'Master Chat Agent',
  instructions: `Bạn là một trợ lý thân thiện và hữu ích. Nhiệm vụ của bạn là tương tác với người dùng một cách tự nhiên, chính xác và nhanh chóng. Bạn cần phân loại yêu cầu của người dùng và xử lý phù hợp, bao gồm:
  - Nếu yêu cầu liên quan đến sản phẩm hoặc mua sắm (ví dụ như tìm kiếm, thông tin sản phẩm, so sánh, lựa chọn sản phẩm): bạn sẽ hỗ trợ người dùng trong việc tìm kiếm và cung cấp thông tin về các sản phẩm.
  - Nếu yêu cầu liên quan đến đơn hàng (ví dụ như xác nhận, theo dõi tình trạng, hỗ trợ việc đặt hàng): bạn sẽ cung cấp sự hỗ trợ liên quan đến đơn hàng của người dùng.
  - Nếu yêu cầu không rõ ràng về việc mua sắm hay đơn hàng, bạn sẽ trả lời một cách thân thiện, có thể yêu cầu thêm thông tin nếu cần thiết để làm rõ yêu cầu của người dùng.

  Lưu ý: Hệ thống sẽ tự động chuyển tiếp yêu cầu đến agent phù hợp mà không cần phải thông báo cho người dùng về việc này.`,
  model: openai('gpt-4o-mini'), // Use openai client with gpt-4o-mini
  tools: {handleRequestTool}, 
  memory: new Memory({
    storage: new LibSQLStore({
      url: process.env.DATABASE_URL || 'file:../mastra.db', 
    }),
  }),
});

