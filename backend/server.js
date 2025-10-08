// Import các thư viện cần thiết
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors'); // Thư viện để cho phép kết nối từ domain khác
const fetch = require('node-fetch'); // Thư viện để gọi API

// Đọc các biến từ tệp .env
dotenv.config();

const app = express();
const port = process.env.PORT || 3000; // Render sẽ tự cung cấp PORT

// --- Cấu hình ---

// Cho phép Vercel gọi đến server này
app.use(cors({
  origin: 'https://tavis-chem-scribe-lite.vercel.app' // Tạm thời cho phép tất cả, sau này có thể đổi thành URL Vercel của bạn
}));

// Cho phép server đọc dữ liệu JSON gửi lên
app.use(express.json({ limit: '10mb' })); // Tăng giới hạn payload lên 10MB

// --- API Endpoints ---

// Endpoint để xử lý ảnh
app.post('/api/process-image', async (req, res) => {
  try {
    const { base64Image } = req.body;
    if (!base64Image) {
      return res.status(400).json({ error: 'Không có dữ liệu ảnh.' });
    }

    const description = await callGeminiAPI(base64Image);
    
    if (description) {
      res.json({ description: description });
    } else {
      res.status(500).json({ error: 'Lỗi khi phân tích hình ảnh từ Gemini.' });
    }

  } catch (error) {
    console.error("Lỗi server:", error);
    res.status(500).json({ error: 'Đã có lỗi xảy ra trên server.' });
  }
});

// Endpoint cho UptimeRobot "ping"
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// --- Hàm gọi Gemini (logic không đổi) ---
async function callGeminiAPI(base64Image) {
  const API_KEY = process.env.GEMINI_API_KEY;
  if (!API_KEY) {
      console.error("Lỗi: Không tìm thấy GEMINI_API_KEY trong biến môi trường.");
      return null;
  }
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;
  const newPrompt = `Bối cảnh: Bạn là một giáo viên khoa học đang giải thích một hình ảnh trong sách giáo khoa cho một học sinh khiếm thị qua lời nói. Nhiệm vụ: Phân tích hình ảnh được cung cấp và tạo ra một đoạn mô tả bằng văn nói, không chỉ mô tả những gì nhìn thấy mà còn giải thích các kiến thức khoa học liên quan. Quy tắc bắt buộc: 1. Câu mở đầu khái quát: Bắt đầu bằng một câu duy nhất để tóm tắt nội dung chính của hình ảnh. Câu này phải ngắn gọn và giúp người nghe xác định ngay lập tức đây có phải là hình ảnh họ cần hay không. (Ví dụ: "Đây là sơ đồ thí nghiệm điều chế khí chlorine trong phòng thí nghiệm.") 2. Mô tả chi tiết: Ngay sau câu mở đầu, hãy đi thẳng vào mô tả chi tiết và giải thích. 3. Giọng văn giáo viên: Dùng giọng văn tự tin, chắc chắn, và rõ ràng như đang giảng bài. Tránh tuyệt đối các từ ngữ phỏng đoán như "dường như", "có vẻ là", "có lẽ". 4. Trình tự logic: Mô tả theo một trình tự dễ theo dõi. Nếu là thí nghiệm, hãy đi từng bước một. 5. Giải thích "Tại sao": Sau khi mô tả một hiện tượng, hãy giải thích ngắn gọn nguyên nhân khoa học đằng sau nó. 6. Mở rộng kiến thức: Liên hệ các chi tiết trong ảnh với các khái niệm hoặc định luật khoa học lớn hơn khi có thể. 7. Kết thúc dứt khoát: Sau khi mô tả và giải thích xong, hãy kết thúc ngay. Tuyệt đối không đặt câu hỏi mở hay gợi ý một cuộc trò chuyện.`;
  
  const payload = {
      contents: [{
          parts: [
              { text: newPrompt },
              { inline_data: { mime_type: "image/jpeg", data: base64Image } }
          ]
      }]
  };
  try {
      const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!response.ok) {
          console.error("Phản hồi không hợp lệ từ API:", await response.text());
          return null;
      }
      const result = await response.json();
      return result.candidates[0].content.parts[0].text;
  } catch (error) {
      console.error("Không thể gọi Gemini API:", error);
      return null;
  }
}

// Khởi động server
app.listen(port, () => {
  console.log(`Server đang chạy tại cổng ${port}`);
});
