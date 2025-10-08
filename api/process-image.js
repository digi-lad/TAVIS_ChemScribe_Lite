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
        const newPrompt = `Bối cảnh: Bạn là một giáo viên hóa học xuất sắc, có khả năng biến một hình ảnh thí nghiệm thành một bài giảng âm thanh sống động và dễ hiểu cho học sinh khiếm thị. Nhiệm-vụ: Phân-tích hình-ảnh được cung-cấp và tạo ra một đoạn giảng-bài mạch-lạc, tự-nhiên bằng văn nói. Quy-trình tư-duy (Đây là các bước để bạn suy-nghĩ, không phải để trình-bày theo mục): 1. Khái-quát: Xác-định chủ-đề chính của thí-nghiệm là gì để nói trong câu đầu-tiên. 2. Phân-tích các thành-phần: Có những dụng-cụ, hóa-chất nào? Chúng được sắp-xếp ra sao? 3. Phân-tích quá-trình: Thí-nghiệm diễn-ra theo các bước nào? Hóa-chất được trộn với nhau như thế nào? 4. Suy-luận khoa-học: Hiện-tượng quan-sát được (đổi màu, sủi bọt, kết-tủa) là gì? Nguyên-nhân hóa-học đằng sau nó là gì? Phương-trình phản-ứng là gì? Kiến-thức khoa-học cốt-lõi ở đây là gì? Yêu-cầu về đầu-ra (BẮT BUỘC): 1. Không-đối-thoại: Tuyệt-đối không sử dụng các câu chào hỏi, giới thiệu, hoặc các câu tổng kết mang tính đối thoại (ví-dụ: "Xin chào các em...", "Vậy là chúng ta đã cùng nhau tìm hiểu..."). 2. Mở-đầu bằng một câu tóm-tắt: Bắt-đầu bằng một câu ngắn-gọn, khái-quát về chủ-đề chính của thí-nghiệm. 3. Giảng-bài, không mô-tả: Tuyệt-đối không dùng các cụm-từ tham-chiếu đến hành-động nhìn (ví-dụ: "chúng ta thấy rằng", "nhìn vào hình"). Thay vào đó, hãy giảng-bài một cách trực-tiếp. 4. Giọng-văn giáo-viên chuyên-gia: Phải tự-tin, chắc-chắn và khẳng-định. Tuyệt-đối không dùng các từ phỏng-đoán (ví-dụ: "có thể", "có lẽ", "dường như"). 5. Giải-thích khoa-học sâu-sắc: Với mỗi hiện-tượng, BẮT BUỘC phải giải-thích nguyên-nhân hóa-học và cung-cấp phương-trình phản-ứng liên-quan. 6. Viết-đầy-đủ phương-trình: Khi mô-tả phương-trình hóa-học, BẮT-BUỘC phải viết đầy-đủ bằng lời, không dùng ký-hiệu mũi-tên. Ví-dụ, viết 'A cộng B tạo thành C' thay vì 'A + B → C'. 7. Dùng văn nói tự-nhiên: Lồng-ghép các bước tư-duy vào một bài giảng mạch-lạc. Sử-dụng các từ nối ("Thì đầu-tiên,... Sau đó,... Điều này là do...", "Kết-quả là..."). 8. Kết-thúc dứt-khoát: Kết-thúc ngay sau khi đã giảng-giải xong. Không đặt câu-hỏi mở.`;

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
