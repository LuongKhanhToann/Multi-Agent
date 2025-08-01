// retryHelper.ts

// Hàm retry với exponential backoff và giới hạn thời gian tối thiểu giữa các lần thử lại
export const retryRequest = async (func: Function, retries = 5, delay = 2500, minDelay = 1000): Promise<any> => {
  let attempt = 0;
  while (attempt < retries) {
    try {
      return await func(); // Thực thi yêu cầu
    } catch (error) {
      if (error?.response?.status === 429) { // Kiểm tra mã lỗi rate limit
        attempt++;
        console.log(`Rate limit exceeded. Retrying in ${delay / 1000} seconds...`);
        
        // Đảm bảo delay không nhỏ hơn minDelay
        const finalDelay = Math.max(delay, minDelay);
        
        await new Promise(resolve => setTimeout(resolve, finalDelay)); // Chờ trước khi thử lại
        delay *= 2; // Tăng thời gian chờ theo kiểu exponential
      } else {
        throw error; // Throw lỗi khác
      }
    }
  }
  throw new Error('Maximum retry attempts reached'); // Quá số lần retry
};


// // retryHelper.ts

// // Hàm retry với throttle và exponential backoff
// export const retryRequest = async (func: Function, retries = 5, delay = 2500, minDelay = 1000, maxRateLimit = 3): Promise<any> => {
//   let attempt = 0;
//   let rateLimitResetTime = Date.now() + 20000; // Tính toán thời gian tối thiểu chờ 20s

//   while (attempt < retries) {
//     try {
//       // Kiểm tra xem thời gian có thể gửi yêu cầu tiếp theo không (rate limit)
//       const remainingTime = rateLimitResetTime - Date.now();
//       if (remainingTime > 0) {
//         console.log(`Waiting for ${Math.ceil(remainingTime / 1000)} seconds before retrying...`);
//         await new Promise(resolve => setTimeout(resolve, remainingTime)); // Đợi thời gian còn lại trước khi gửi yêu cầu mới
//       }

//       return await func(); // Thực thi yêu cầu

//     } catch (error) {
//       if (error?.response?.status === 429) { // Kiểm tra mã lỗi rate limit
//         attempt++;
//         console.log(`Rate limit exceeded. Retrying in ${delay / 1000} seconds...`);
        
//         // Đảm bảo delay không nhỏ hơn minDelay
//         const finalDelay = Math.max(delay, minDelay);
        
//         await new Promise(resolve => setTimeout(resolve, finalDelay)); // Chờ trước khi thử lại
//         delay *= 2; // Tăng thời gian chờ theo kiểu exponential
//         rateLimitResetTime = Date.now() + 20000; // Cập nhật thời gian reset rate limit
//       } else {
//         throw error; // Throw lỗi khác
//       }
//     }
//   }
//   throw new Error('Maximum retry attempts reached'); // Quá số lần retry
// };
