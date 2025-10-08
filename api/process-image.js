// This is your new backend function.
// Vercel will automatically run this code when your app makes a request to /api/process-image

export default async function handler(req, res) {
    // 1. Check if the request is a POST request
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Only POST requests are allowed' });
    }

    try {
        // 2. Get the API Key securely from Vercel's environment variables
        const API_KEY = process.env.API_KEY;
        if (!API_KEY) {
            throw new Error("API_KEY environment variable is not set.");
        }

        // 3. Get the image data from the request sent by the frontend
        const base64Image = req.body.image;
        if (!base64Image) {
            return res.status(400).json({ message: 'No image data provided.' });
        }

        // 4. Prepare the prompt and payload to send to Google
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${API_KEY}`;
        const newPrompt = `Bối cảnh: Bạn là một giáo viên khoa học, có khả năng biến bất kỳ hình ảnh khoa học nào (hóa học, vật lý, sinh học) thành một bài giảng nói mạch lạc và dễ hiểu cho học sinh khiếm thị. Nhiệm-vụ: Phân tích hình ảnh và tạo ra một bài giảng bằng văn nói, kết hợp giữa mô tả trực quan và giải thích kiến thức chuyên sâu. Quy-trình tư-duy (Đây là các bước để bạn suy-nghĩ, không phải để trình-bày theo một dàn bài cứng nhắc): 1. Khái-quát: Nhìn tổng thể và xác định chủ đề chính của hình ảnh là gì. (Ví dụ: "Đây là sơ đồ chu trình nước trong tự nhiên" hay "Đây là hình ảnh minh họa định luật III Newton.") 2. Mô-tả các yếu-tố chính: Xác định các thành phần, đối tượng, nhãn, hoặc ký hiệu quan trọng trong ảnh. 3. Phân-tích Mối-quan-hệ hoặc Trình-tự: * Nếu là một quy-trình (như thí nghiệm, chu trình sinh học): Mô tả nó theo từng bước, từ bắt đầu đến kết thúc. * Nếu là một sơ-đồ tĩnh (như cấu tạo nguyên tử, sơ đồ lực): Giải thích mối quan hệ logic, cấu trúc hoặc tương tác giữa các yếu tố. 4. Giảng-giải kiến-thức: Đây là bước quan trọng nhất. Từ những gì đã mô tả, hãy giảng giải về nguyên lý khoa học cốt lõi. Trong phần này, hãy tự nhiên lồng ghép các câu trả lời cho câu hỏi "Tại sao nó lại như vậy?" và mở rộng ra các định luật hoặc khái niệm lớn hơn có liên quan. Yêu-cầu về văn-phong và đầu-ra (BẮT-BUỘC): 1. Mở-đầu: Luôn bắt đầu bằng một câu khái quát duy nhất đã xác định ở bước 1. 2. Văn-nói mạch-lạc: Tuyệt-đối không trình bày theo dạng báo cáo hay liệt kê. Hãy dệt các bước tư duy của bạn thành một bài giảng có câu chuyện, có sự dẫn dắt tự nhiên. 3. Giọng-văn giáo-viên: Tự tin, chắc chắn, và rõ ràng. Tránh tuyệt đối các từ phỏng đoán như "dường như", "có vẻ là", "có lẽ". 4. Kết-thúc dứt-khoát: Kết thúc ngay sau khi đã giảng giải xong, không đặt câu hỏi mở hay các câu tổng kết mang tính đối thoại.`;

        const payload = {
            contents: [{
                parts: [
                    { text: newPrompt },
                    { inline_data: { mime_type: "image/jpeg", data: base64Image } }
                ]
            }]
        };

        // 5. Make the actual call to the Gemini API
        const geminiResponse = await fetch(apiUrl, { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify(payload) 
        });

        if (!geminiResponse.ok) {
            console.error('Gemini API Error:', await geminiResponse.text());
            throw new Error('Failed to fetch from Gemini API.');
        }

        const result = await geminiResponse.json();
        const description = result.candidates[0].content.parts[0].text;
        
        // 6. Send the successful result back to the frontend
        res.status(200).json({ description: description });

    } catch (error) {
        console.error('Internal Server Error:', error);
        // 7. Send an error message back to the frontend if something goes wrong
        res.status(500).json({ message: 'An error occurred on the server.' });
    }
}

