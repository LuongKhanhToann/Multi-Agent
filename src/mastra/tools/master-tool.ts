import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
import { orderAgent } from "../agents/order-agent";
import { shopAgent } from "../agents/shop-agent";
import { chatAgent } from "../agents/chat-agent";
import { retryRequest } from "../retryHelper";

// Schema cho input và output
const inputSchema = z.object({
  userRequest: z.string().describe("Yêu cầu của người dùng cần phân loại"),
});

const outputSchema = z.object({
  result: z.string().describe("Kết quả xử lý yêu cầu"),
});

// Tạo tool phân loại và chuyển tiếp yêu cầu
export const handleRequestTool = createTool({
  id: "handle-request",
  description: "Phân loại và chuyển tiếp yêu cầu người dùng đến agent phù hợp.",
  inputSchema,
  outputSchema,
  execute: async ({ context }) => {
    const { userRequest } = context;

    // Kiểm tra API key
    if (!process.env.OPENAI_API_KEY) {
      console.error("Missing OPENAI_API_KEY");
      return { result: "Lỗi hệ thống. Vui lòng thử lại sau." };
    }

    // Prompt phân loại yêu cầu
    const classificationPrompt = `
      Phân loại yêu cầu sau vào một trong ba nhóm sau:
      - "shop": Yêu cầu liên quan đến sản phẩm, mua sắm, tìm kiếm thông tin về sản phẩm hoặc dịch vụ.
      - "order": Yêu cầu liên quan đến đơn hàng, bao gồm xác nhận, theo dõi tình trạng đơn hàng hoặc thay đổi đơn hàng.
      - "chat": Yêu cầu không liên quan đến mua sắm hay đơn hàng, chỉ là câu hỏi hoặc tương tác chung.

      Vui lòng phân loại yêu cầu sau vào một trong ba nhóm trên:
      Yêu cầu: "${userRequest}"
      Chỉ trả về một trong ba giá trị "shop", "order", hoặc "chat". Không thêm bất kỳ thông tin nào khác.
    `;

    try {
      // Phân loại với OpenAI (retry khi gặp rate limit)
      const { text: classification } = await retryRequest(() => generateText({
        model: openai("gpt-4o-mini"),
        prompt: classificationPrompt,
        maxTokens: 50,
        temperature: 0.5,
      }));

      let type = classification.trim().toLowerCase();

      // Chuyển tiếp yêu cầu trực tiếp đến agent con hoặc trả lời trực tiếp
      switch (type) {
        case "shop":
          const shopResult = await shopAgent.run(userRequest);
          return { result: `${shopResult} (Type phân loại: ${type})` };

        case "order":
          const orderResult = await orderAgent.run(userRequest);
          return { result: `${orderResult} (Type phân loại: ${type})` };

        case "chat":
          const chatResult = await chatAgent.run(userRequest);
          return { result: `${chatResult} (Type phân loại: ${type})` };

        default:
          return {
            result: `Yêu cầu không rõ ràng. Type phân loại: ${type}. Vui lòng thử lại.`,
          };
      }
    } catch (error) {
      console.error("Lỗi xử lý yêu cầu:", error);
      return { result: "Lỗi hệ thống. Vui lòng thử lại sau." };
    }
  },
});
