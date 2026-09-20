
// ---------------------------------
// AUDIO FX
// ---------------------------------
const typingAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playTypingClick() {
    try {
        if(typingAudioCtx.state === 'suspended') typingAudioCtx.resume();
        const osc = typingAudioCtx.createOscillator();
        const gainNode = typingAudioCtx.createGain();
        
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(300, typingAudioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, typingAudioCtx.currentTime + 0.03);
        
        gainNode.gain.setValueAtTime(0.1, typingAudioCtx.currentTime); // very subtle
        gainNode.gain.exponentialRampToValueAtTime(0.001, typingAudioCtx.currentTime + 0.03);
        
        osc.connect(gainNode);
        gainNode.connect(typingAudioCtx.destination);
        
        osc.start();
        osc.stop(typingAudioCtx.currentTime + 0.03);
    } catch(e) {}
}

let typingAutoSpeak = true;

function toggleAutoSpeak() {
    typingAutoSpeak = !typingAutoSpeak;
    const btn = document.getElementById('btnToggleAutoSpeak');
    if (btn) {
        if (typingAutoSpeak) {
            btn.innerHTML = '<i class="fas fa-volume-up mr-1"></i>Tự động đọc';
            btn.classList.remove('text-gray-400');
            btn.classList.add('text-green-500');
        } else {
            btn.innerHTML = '<i class="fas fa-volume-mute mr-1"></i>Đã tắt tự động';
            btn.classList.remove('text-green-500');
            btn.classList.add('text-gray-400');
        }
    }
}

// ==========================================
// TYPING GAME LOGIC
// ==========================================
const typingLessons = [
    { id: 'lesson1', name: 'Tiếng Anh Giao Tiếp Lớp Học', data: [{"vn": "Chào cả lớp.", "en": "Good morning, everyone."}, {"vn": "Chào cả lớp (buổi chiều).", "en": "Good afternoon, class."}, {"vn": "Hôm nay các em thế nào?", "en": "How are you today?"}, {"vn": "Mọi người đã sẵn sàng chưa?", "en": "Is everyone ready?"}, {"vn": "Chúng ta hãy bắt đầu bài học nhé.", "en": "Let's begin our lesson."}, {"vn": "Hôm nay ai vắng mặt?", "en": "Who is absent today?"}, {"vn": "Có ai vắng mặt không?", "en": "Is anyone absent?"}, {"vn": "Hãy trả lời khi cô/thầy gọi tên nhé.", "en": "Please answer when I call your name."}, {"vn": "Mời các em ngồi xuống.", "en": "Please sit down."}, {"vn": "Xin hãy chú ý.", "en": "Pay attention, please."}, {"vn": "Trật tự và tập trung vào bài học nào.", "en": "Stop talking and focus on the lesson."}, {"vn": "Chúng ta bắt đầu thôi.", "en": "Let's get started."}, {"vn": "Hôm nay chúng ta sẽ học về hàm số bậc hai.", "en": "Today we are going to study quadratic functions."}, {"vn": "Chủ đề của chúng ta hôm nay là đạo hàm.", "en": "Our topic today is derivatives."}, {"vn": "Trong bài học này, chúng ta sẽ học về xác suất.", "en": "In this lesson, we will learn about probability."}, {"vn": "Sau bài học này, các em sẽ có thể giải được những bài toán này.", "en": "By the end of this lesson, you will be able to solve these problems."}, {"vn": "Bài học hôm nay rất quan trọng.", "en": "Today's lesson is very important."}, {"vn": "Sau bài học này, các em cần có thể:", "en": "After this lesson, you should be able to:"}, {"vn": "- Định nghĩa...", "en": "- define ..."}, {"vn": "- Nhận biết...", "en": "- identify ..."}, {"vn": "- Tính toán...", "en": "- calculate ..."}, {"vn": "- Giải thích...", "en": "- explain ..."}, {"vn": "- Vận dụng...", "en": "- apply ..."}, {"vn": "Ví dụ: Sau bài học này, các em sẽ có thể tìm đạo hàm của một hàm số.", "en": "For example: After this lesson, you should be able to find the derivative of a function."}, {"vn": "Hãy cùng ôn lại bài cũ nhé.", "en": "Let's review the previous lesson."}, {"vn": "Lần trước chúng ta đã học gì?", "en": "What did we learn last time?"}, {"vn": "Có ai có thể tóm tắt lại bài học trước không?", "en": "Can anyone summarize the previous lesson?"}, {"vn": "Ai có thể trả lời câu hỏi này?", "en": "Who can answer this question?"}, {"vn": "Xin vui lòng giơ tay.", "en": "Please raise your hand."}, {"vn": "Hãy đọc kỹ đề bài.", "en": "Please read the problem carefully."}, {"vn": "Đọc to câu hỏi lên nào.", "en": "Read the question aloud."}, {"vn": "Dành một phút để đọc đề nhé.", "en": "Take one minute to read it."}, {"vn": "Gạch chân các thông tin quan trọng.", "en": "Underline the important information."}, {"vn": "Đề bài yêu cầu chúng ta tìm gì?", "en": "What is the problem asking us to find?"}, {"vn": "Chúng ta hãy cùng giải bài toán này.", "en": "Let's solve this problem together."}, {"vn": "Hãy làm theo cô/thầy từng bước một.", "en": "Follow me step by step."}, {"vn": "Đầu tiên, chúng ta cần xác định thông tin đã cho.", "en": "First, we need to identify the given information."}, {"vn": "Tiếp theo, chúng ta rút gọn biểu thức.", "en": "Next, we simplify the expression."}, {"vn": "Cuối cùng, chúng ta kiểm tra lại kết quả.", "en": "Finally, we check the answer."}, {"vn": "Suy nghĩ kỹ nhé.", "en": "Think carefully."}, {"vn": "Cứ từ từ làm.", "en": "Take your time."}, {"vn": "Đừng vội vàng.", "en": "Don't rush."}, {"vn": "Hãy thử một phương pháp khác.", "en": "Try another method."}, {"vn": "Có cách nào đơn giản hơn không?", "en": "Is there a simpler way?"}, {"vn": "Tập xác định của hàm số này là gì?", "en": "What is the domain of this function?"}, {"vn": "Tập giá trị là gì?", "en": "What is the range?"}, {"vn": "Hàm số này đồng biến hay nghịch biến?", "en": "Is the function increasing or decreasing?"}, {"vn": "Đỉnh của parabol ở đâu?", "en": "Where is the vertex?"}, {"vn": "Giá trị lớn nhất là bao nhiêu?", "en": "What is the maximum value?"}, {"vn": "Giá trị nhỏ nhất là bao nhiêu?", "en": "What is the minimum value?"}, {"vn": "Hệ số góc của đường thẳng này là gì?", "en": "What is the slope of this line?"}, {"vn": "Đạo hàm của hàm số này là bao nhiêu?", "en": "What is the derivative of this function?"}, {"vn": "Làm thế nào để giải phương trình này?", "en": "How do you solve this equation?"}, {"vn": "Tại sao chúng ta lại làm như vậy?", "en": "Why do we do this?"}, {"vn": "Em có thể giải thích câu trả lời của mình không?", "en": "Can you explain your answer?"}, {"vn": "Em có thể trình bày lời giải của mình không?", "en": "Can you show your solution?"}, {"vn": "Có phương pháp nào khác không?", "en": "Is there another method?"}, {"vn": "Ai muốn trả lời nào?", "en": "Who would like to answer?"}, {"vn": "Có xung phong không?", "en": "Any volunteers?"}, {"vn": "Xin vui lòng giơ tay lên.", "en": "Raise your hand, please."}, {"vn": "Mời em lên bảng.", "en": "Please come to the board."}, {"vn": "Hãy viết câu trả lời của em lên bảng.", "en": "Write your answer on the board."}, {"vn": "Hãy giải thích lời giải cho cả lớp nghe.", "en": "Explain your solution to the class."}, {"vn": "Xuất sắc!", "en": "Excellent!"}, {"vn": "Rất tốt.", "en": "Very good."}, {"vn": "Chính xác rồi.", "en": "That's correct."}, {"vn": "Làm tốt lắm.", "en": "Good job / Well done."}, {"vn": "Hoàn hảo.", "en": "Perfect."}, {"vn": "Làm tốt lắm.", "en": "Great work."}, {"vn": "Chính xác.", "en": "Exactly."}, {"vn": "Chưa chính xác lắm.", "en": "Not exactly."}, {"vn": "Gần đúng rồi.", "en": "Almost correct."}, {"vn": "Hãy thử lại xem.", "en": "Try again."}, {"vn": "Suy nghĩ thêm một lần nữa nhé.", "en": "Think about it one more time."}, {"vn": "Kiểm tra lại phép tính của em đi.", "en": "Check your calculation."}, {"vn": "Em đã bỏ sót một bước rồi.", "en": "You missed one step."}, {"vn": "Hãy cẩn thận với dấu (cộng/trừ).", "en": "Be careful with the sign."}, {"vn": "Hãy ghi nhớ công thức này.", "en": "Remember this formula."}, {"vn": "Công thức này rất hữu ích.", "en": "This formula is very useful."}, {"vn": "Xin hãy ghi vào vở.", "en": "Please write it down."}, {"vn": "Các em nên học thuộc công thức này.", "en": "You should memorize this formula."}, {"vn": "Đừng quên điều kiện nhé.", "en": "Don't forget the condition."}, {"vn": "Chú ý đến mẫu thức.", "en": "Pay attention to the denominator."}, {"vn": "Luôn kiểm tra tập xác định.", "en": "Always check the domain."}, {"vn": "Xét hàm số f(x).", "en": "Consider the function f(x)."}, {"vn": "Đồ thị là một đường parabol.", "en": "The graph is a parabola."}, {"vn": "Hàm số đồng biến trên khoảng này.", "en": "The function is increasing on this interval."}, {"vn": "Hàm số nghịch biến trên khoảng đó.", "en": "The function is decreasing on that interval."}, {"vn": "Đỉnh tại điểm (2, -1).", "en": "The vertex is at (2, -1)."}, {"vn": "Đồ thị cắt trục hoành tại hai điểm.", "en": "The graph intersects the x-axis at two points."}, {"vn": "Giao điểm với trục tung bằng...", "en": "The y-intercept is equal to ..."}, {"vn": "Tìm đạo hàm.", "en": "Find the derivative."}, {"vn": "Lấy đạo hàm hai vế.", "en": "Differentiate both sides."}, {"vn": "Áp dụng quy tắc chuỗi (đạo hàm hàm hợp).", "en": "Apply the chain rule."}, {"vn": "Áp dụng quy tắc tích.", "en": "Apply the product rule."}, {"vn": "Rút gọn kết quả.", "en": "Simplify the result."}, {"vn": "Cho đạo hàm bằng 0.", "en": "Set the derivative equal to zero."}, {"vn": "Tìm các điểm tới hạn.", "en": "Find the critical points."}, {"vn": "Vẽ hình cẩn thận nhé.", "en": "Draw the figure carefully."}, {"vn": "Đánh dấu trung điểm.", "en": "Mark the midpoint."}, {"vn": "Nối hai điểm này lại.", "en": "Connect these two points."}, {"vn": "Đo góc này.", "en": "Measure the angle."}, {"vn": "Hai đường thẳng này song song với nhau.", "en": "The two lines are parallel."}, {"vn": "Các mặt phẳng này vuông góc với nhau.", "en": "These planes are perpendicular."}, {"vn": "Gọi O là tâm của đường tròn.", "en": "Let O be the center of the circle."}, {"vn": "Làm việc theo cặp nhé.", "en": "Work in pairs."}, {"vn": "Làm việc theo nhóm 4 người.", "en": "Work in groups of four."}, {"vn": "Thảo luận với bạn bên cạnh.", "en": "Discuss with your partner."}, {"vn": "Chia sẻ ý kiến của em.", "en": "Share your ideas."}, {"vn": "So sánh kết quả của các em.", "en": "Compare your answers."}, {"vn": "Giúp đỡ lẫn nhau nhé.", "en": "Help each other."}, {"vn": "Các em có 5 phút.", "en": "You have five minutes."}, {"vn": "Trật tự nào.", "en": "Please be quiet."}, {"vn": "Thôi nói chuyện.", "en": "Stop talking."}, {"vn": "Chú ý lắng nghe.", "en": "Listen carefully."}, {"vn": "Nói nhỏ thôi.", "en": "Keep your voice down."}, {"vn": "Tập trung vào bài làm của em.", "en": "Focus on your work."}, {"vn": "Hướng mắt lên bảng.", "en": "Eyes on the board."}, {"vn": "Cất điện thoại đi.", "en": "Put away your phones."}, {"vn": "Chúng ta cùng kiểm tra kết quả nhé.", "en": "Let's check the answer."}, {"vn": "So sánh kết quả của em với kết quả của cô/thầy.", "en": "Compare your answer with mine."}, {"vn": "Các em có ra cùng kết quả không?", "en": "Did you get the same answer?"}, {"vn": "Có câu hỏi nào không?", "en": "Any questions?"}, {"vn": "Bước nào khó đối với các em?", "en": "Which step is difficult?"}, {"vn": "Các em có hiểu lời giải này không?", "en": "Do you understand this solution?"}, {"vn": "Hãy làm Bài tập 1.", "en": "Please do Exercise 1."}, {"vn": "Hoàn thành Bài tập 2 và 3.", "en": "Complete Exercises 2 and 3."}, {"vn": "Hoàn thành phiếu bài tập.", "en": "Finish the worksheet."}, {"vn": "Nộp bài trước thứ Sáu nhé.", "en": "Submit your work before Friday."}, {"vn": "Đừng quên bài tập về nhà.", "en": "Don't forget your homework."}, {"vn": "Hết giờ rồi.", "en": "Time is up."}, {"vn": "Hôm nay đến đây là xong.", "en": "That's all for today."}, {"vn": "Hẹn gặp lại các em vào buổi học sau.", "en": "See you next class."}, {"vn": "Chúc các em một ngày tốt lành.", "en": "Have a nice day."}, {"vn": "Cảm ơn sự chú ý của các em.", "en": "Thank you for your attention."}] },
    { id: 'lesson2', name: 'Từ vựng Toán Học (Mệnh đề)', data: [{"vn": "Mệnh đề", "en": "Proposition"}, {"vn": "Mệnh đề đúng", "en": "True proposition"}, {"vn": "Mệnh đề sai", "en": "False proposition"}, {"vn": "Điều kiện cần", "en": "Necessary condition"}, {"vn": "Điều kiện đủ", "en": "Sufficient condition"}, {"vn": "Điều kiện cần và đủ", "en": "Necessary and sufficient condition"}, {"vn": "Phủ định", "en": "Negation"}, {"vn": "Phép kéo theo", "en": "Implication"}, {"vn": "Tương đương", "en": "Equivalence"}, {"vn": "Tập hợp", "en": "Set"}, {"vn": "Phần tử", "en": "Element"}, {"vn": "Thuộc", "en": "Belong to"}, {"vn": "Không thuộc", "en": "Does not belong to"}, {"vn": "Tập con", "en": "Subset"}, {"vn": "Tập rỗng", "en": "Empty set"}, {"vn": "Tập hợp bằng nhau", "en": "Equal sets"}, {"vn": "Hợp", "en": "Union"}, {"vn": "Giao", "en": "Intersection"}, {"vn": "Hiệu", "en": "Difference"}, {"vn": "Phần bù", "en": "Complement"}, {"vn": "Biểu đồ Ven", "en": "Venn diagram"}, {"vn": "Bất phương trình", "en": "Inequality"}, {"vn": "Hệ bất phương trình", "en": "System of inequalities"}, {"vn": "Miền nghiệm", "en": "Solution region"}, {"vn": "Nửa mặt phẳng", "en": "Half-plane"}, {"vn": "Đường biên", "en": "Boundary line"}, {"vn": "Giao điểm", "en": "Intersection point"}, {"vn": "Miền nghiệm chung", "en": "Feasible region"}, {"vn": "Hàm mục tiêu", "en": "Objective function"}, {"vn": "Bài toán tối ưu", "en": "Optimization problem"}, {"vn": "Hàm số", "en": "Function"}, {"vn": "Biến số", "en": "Variable"}, {"vn": "Miền xác định / Tập xác định", "en": "Domain"}, {"vn": "Tập giá trị", "en": "Range"}, {"vn": "Đồ thị", "en": "Graph"}, {"vn": "Hàm số đồng biến", "en": "Increasing function"}, {"vn": "Hàm số nghịch biến", "en": "Decreasing function"}, {"vn": "Hàm số chẵn", "en": "Even function"}, {"vn": "Hàm số lẻ", "en": "Odd function"}, {"vn": "Hàm số bậc nhất", "en": "Linear function"}, {"vn": "Hàm số bậc hai", "en": "Quadratic function"}, {"vn": "Parabol", "en": "Parabola"}, {"vn": "Đỉnh", "en": "Vertex"}, {"vn": "Trục đối xứng", "en": "Axis of symmetry"}, {"vn": "Nghiệm", "en": "Root"}, {"vn": "Giá trị lớn nhất", "en": "Maximum value"}, {"vn": "Giá trị nhỏ nhất", "en": "Minimum value"}, {"vn": "Góc", "en": "Angle"}, {"vn": "Tam giác", "en": "Triangle"}, {"vn": "Cạnh đối diện", "en": "Opposite side"}, {"vn": "Góc đối diện", "en": "Opposite angle"}, {"vn": "Định lý sin", "en": "Sine law"}, {"vn": "Định lý cos", "en": "Cosine law"}, {"vn": "Nửa chu vi", "en": "Semiperimeter"}, {"vn": "Diện tích", "en": "Area"}, {"vn": "Bán kính ngoại tiếp", "en": "Circumradius"}, {"vn": "Bán kính nội tiếp", "en": "Inradius"}, {"vn": "Vectơ", "en": "Vector"}, {"vn": "Độ dài vectơ", "en": "Magnitude"}, {"vn": "Vectơ không", "en": "Zero vector"}, {"vn": "Hai vectơ cùng phương", "en": "Parallel vectors"}, {"vn": "Hai vectơ cùng hướng", "en": "Same direction"}, {"vn": "Hai vectơ ngược hướng", "en": "Opposite direction"}, {"vn": "Tổng vectơ", "en": "Vector sum"}, {"vn": "Hiệu vectơ", "en": "Vector difference"}, {"vn": "Tích với số thực", "en": "Scalar multiplication"}, {"vn": "Tích vô hướng", "en": "Dot product"}, {"vn": "Tích có hướng", "en": "Cross product (Vector product)"}, {"vn": "Góc giữa hai vectơ", "en": "Angle between vectors"}, {"vn": "Vectơ pháp tuyến", "en": "Normal vector"}, {"vn": "Vectơ chỉ phương", "en": "Direction vector"}, {"vn": "Đường thẳng", "en": "Line"}, {"vn": "Phương trình đường thẳng", "en": "Equation of a line"}, {"vn": "Phương trình tham số", "en": "Parametric equation"}, {"vn": "Phương trình tổng quát", "en": "General equation"}, {"vn": "Phương trình chính tắc", "en": "Symmetric equation"}, {"vn": "Hệ số góc", "en": "Slope"}, {"vn": "Song song", "en": "Parallel"}, {"vn": "Vuông góc", "en": "Perpendicular"}, {"vn": "Dữ liệu", "en": "Data"}, {"vn": "Mẫu số liệu", "en": "Data sample"}, {"vn": "Tần số", "en": "Frequency"}, {"vn": "Tần suất", "en": "Relative frequency"}, {"vn": "Bảng phân bố", "en": "Frequency table"}, {"vn": "Trung bình cộng", "en": "Mean"}, {"vn": "Trung vị", "en": "Median"}, {"vn": "Tứ phân vị", "en": "Quartile"}, {"vn": "Mốt", "en": "Mode"}, {"vn": "Khoảng biến thiên", "en": "Range"}, {"vn": "Độ lệch chuẩn", "en": "Standard deviation"}, {"vn": "Biểu đồ cột", "en": "Bar chart"}, {"vn": "Biểu đồ tròn", "en": "Pie chart"}, {"vn": "Biểu đồ đoạn thẳng", "en": "Line graph"}, {"vn": "Biến cố", "en": "Event"}, {"vn": "Xác suất", "en": "Probability"}, {"vn": "Đường tròn lượng giác", "en": "Unit circle"}, {"vn": "Góc lượng giác", "en": "Trigonometric angle"}, {"vn": "Hàm sin", "en": "Sine function"}, {"vn": "Hàm cos", "en": "Cosine function"}, {"vn": "Hàm tan", "en": "Tangent function"}, {"vn": "Hàm cot", "en": "Cotangent function"}, {"vn": "Chu kỳ", "en": "Period"}, {"vn": "Biên độ", "en": "Amplitude"}, {"vn": "Phương trình lượng giác", "en": "Trigonometric equation"}, {"vn": "Dãy số", "en": "Sequence"}, {"vn": "Số hạng", "en": "Term"}, {"vn": "Số hạng tổng quát", "en": "General term"}, {"vn": "Cấp số cộng", "en": "Arithmetic sequence"}, {"vn": "Công sai", "en": "Common difference"}, {"vn": "Cấp số nhân", "en": "Geometric sequence"}, {"vn": "Công bội", "en": "Common ratio"}, {"vn": "Tổng n số hạng đầu", "en": "Sum of first n terms"}, {"vn": "Giới hạn", "en": "Limit"}, {"vn": "Liên tục", "en": "Continuous"}, {"vn": "Cực đại", "en": "Local maximum"}, {"vn": "Cực tiểu", "en": "Local minimum"}, {"vn": "Vô cực", "en": "Infinity"}, {"vn": "Hàm số liên tục", "en": "Continuous function"}, {"vn": "Đạo hàm", "en": "Derivative"}, {"vn": "Đạo hàm cấp hai", "en": "Second derivative"}, {"vn": "Tiếp tuyến", "en": "Tangent line"}, {"vn": "Tốc độ biến thiên", "en": "Rate of change"}, {"vn": "Không gian", "en": "Space"}, {"vn": "Điểm", "en": "Point"}, {"vn": "Mặt phẳng", "en": "Plane"}, {"vn": "Đường thẳng vuông góc", "en": "Perpendicular lines"}, {"vn": "Hình chóp", "en": "Pyramid"}, {"vn": "Hình lăng trụ", "en": "Prism"}, {"vn": "Khoảng cách", "en": "Distance"}, {"vn": "Góc giữa hai mặt phẳng", "en": "Dihedral angle"}, {"vn": "Điểm cực trị", "en": "Extreme point"}, {"vn": "Đồng biến", "en": "Increasing"}, {"vn": "Nghịch biến", "en": "Decreasing"}, {"vn": "Tiệm cận", "en": "Asymptote"}, {"vn": "Tiệm cận đứng", "en": "Vertical asymptote"}, {"vn": "Tiệm cận ngang", "en": "Horizontal asymptote"}, {"vn": "Tiệm cận xiên", "en": "Oblique asymptote"}, {"vn": "Điểm uốn", "en": "Inflection point"}, {"vn": "Khảo sát hàm số", "en": "Analyze a function"}, {"vn": "Nguyên hàm", "en": "Antiderivative"}, {"vn": "Tích phân", "en": "Integral"}, {"vn": "Tích phân xác định", "en": "Definite integral"}, {"vn": "Cận dưới", "en": "Lower limit"}, {"vn": "Cận trên", "en": "Upper limit"}, {"vn": "Diện tích hình phẳng", "en": "Area of a plane region"}, {"vn": "Thể tích khối tròn xoay", "en": "Volume of revolution"}, {"vn": "Hoán vị", "en": "Permutation"}, {"vn": "Chỉnh hợp", "en": "Arrangement"}, {"vn": "Tổ hợp", "en": "Combination"}, {"vn": "Phép thử", "en": "Experiment"}, {"vn": "Không gian mẫu", "en": "Sample space"}, {"vn": "Biến cố đối", "en": "Complementary event"}, {"vn": "Biến cố độc lập", "en": "Independent events"}, {"vn": "Xác suất có điều kiện", "en": "Conditional probability"}, {"vn": "Biến ngẫu nhiên", "en": "Random variable"}, {"vn": "Giá trị kỳ vọng", "en": "Expected value"}, {"vn": "Số phức", "en": "Complex number"}, {"vn": "Phần thực", "en": "Real part"}, {"vn": "Phần ảo", "en": "Imaginary part"}, {"vn": "Đơn vị ảo", "en": "Imaginary unit"}, {"vn": "Môđun", "en": "Modulus"}, {"vn": "Số phức liên hợp", "en": "Complex conjugate"}] },
    { id: 'lesson3', name: 'Từ vựng Cơ Bản', data: [{"vn": "Con chó", "en": "Dog"}, {"vn": "Con mèo", "en": "Cat"}, {"vn": "Quả táo", "en": "Apple"}, {"vn": "Trường học", "en": "School"}, {"vn": "Giáo viên", "en": "Teacher"}, {"vn": "Học sinh", "en": "Student"}] }
];

let typingCustomLessons = JSON.parse(localStorage.getItem('dojo_custom_typing') || '[]');

let currentTypingData = [];
let typingWordIndex = 0;
let typingCharIndex = 0;
let typingStartTime = null;
let typingErrors = 0;
let typingTargetStudentId = null;
let typingWordHidden = false;

function openTypingGameMenu() {
    document.getElementById('gameMenuModal').classList.add('hidden');
    document.getElementById('typingGameMenuModal').classList.remove('hidden');
    renderTypingLessons();
}

function closeTypingGameMenu() {
    document.getElementById('typingGameMenuModal').classList.add('hidden');
}

function renderTypingLessons() {
    const container = document.getElementById('typingLessonList');
    container.innerHTML = '';
    
    // Default lessons
    typingLessons.forEach((l, i) => {
        container.innerHTML += `
            <div class="bg-blue-50 p-3 rounded-xl border border-blue-100 flex justify-between items-center mb-2">
                <div>
                    <h4 class="font-bold text-blue-800">${l.name}</h4>
                    <p class="text-xs text-blue-600">${l.data.length} từ vựng</p>
                </div>
                <button onclick="startTypingGame('default', ${i})" class="px-4 py-2 bg-blue-500 text-white font-bold rounded-lg shadow hover:bg-blue-600 transition">Chơi</button>
            </div>
        `;
    });
    
    // Custom lessons
    typingCustomLessons.forEach((l, i) => {
        container.innerHTML += `
            <div class="bg-purple-50 p-3 rounded-xl border border-purple-100 flex justify-between items-center mb-2">
                <div>
                    <h4 class="font-bold text-purple-800">${l.name}</h4>
                    <p class="text-xs text-purple-600">${l.data.length} từ vựng</p>
                </div>
                <div class="flex gap-2">
                    <button onclick="deleteCustomTypingLesson(${i})" class="w-8 h-8 bg-white text-red-500 rounded-lg shadow hover:bg-red-50 flex items-center justify-center"><i class="fas fa-trash"></i></button>
                    <button onclick="startTypingGame('custom', ${i})" class="px-4 py-2 bg-purple-500 text-white font-bold rounded-lg shadow hover:bg-purple-600 transition">Chơi</button>
                </div>
            </div>
        `;
    });

    }

function showAddCustomTyping() {
    const text = prompt("Nhập danh sách từ vựng theo định dạng: Tiếng Anh - Tiếng Việt\nMỗi từ một dòng.\nVí dụ:\nApple - Quả táo\nHello - Xin chào");
    if(!text) return;
    
    const lines = text.split('\n');
    const data = [];
    lines.forEach(line => {
        const parts = line.split('-');
        if(parts.length >= 2) {
            data.push({ en: parts[0].trim(), vn: parts[1].trim() });
        }
    });
    
    if (data.length === 0) {
        alert("Không tìm thấy từ vựng hợp lệ. Vui lòng kiểm tra lại định dạng (Tiếng Anh - Tiếng Việt).");
        return;
    }
    
    const name = prompt("Nhập tên bài học:") || "Bài học tự tạo";
    typingCustomLessons.push({ name, data });
    localStorage.setItem('dojo_custom_typing', JSON.stringify(typingCustomLessons));
    renderTypingLessons();
}

function deleteCustomTypingLesson(idx) {
    if(confirm("Bạn muốn xóa bài này?")) {
        typingCustomLessons.splice(idx, 1);
        localStorage.setItem('dojo_custom_typing', JSON.stringify(typingCustomLessons));
        renderTypingLessons();
    }
}

// ---------------------------------
// GAME PLAY LOGIC
// ---------------------------------
let isVirtualKeyboardInitialized = false;

function initVirtualKeyboard() {
    if (isVirtualKeyboardInitialized) return;
    isVirtualKeyboardInitialized = true;
    
    document.querySelectorAll('.kbd-key').forEach(keyEl => {
        if (!keyEl.id || !keyEl.id.startsWith('kbd_')) return;
        let char = keyEl.id.replace('kbd_', '');
        
        // Handle special cases based on ID mapping
        if (char === 'space') char = ' ';
        else if (char === 'comma') char = ',';
        else if (char === 'dot') char = '.';
        else if (char === 'slash') char = '/';
        else if (char === 'quote') char = "'";
        
        // Add hover styles and pointer
        keyEl.classList.add('cursor-pointer', 'hover:bg-gray-100', 'active:bg-gray-200');
        
        // Touch/Click handler
        const handleVirtualClick = (e) => {
            e.preventDefault(); // Prevent double firing on touch devices
            
            // Allow clicking ONLY if the game is active (word index valid)
            if (typingWordIndex >= currentTypingData.length) return;
            
            // Give visual feedback on the key itself when pressed manually
            keyEl.classList.add('scale-95', 'brightness-90');
            setTimeout(() => keyEl.classList.remove('scale-95', 'brightness-90'), 100);
            
            handleTypingInput({
                key: char,
                preventDefault: () => {},
                ctrlKey: false,
                altKey: false,
                metaKey: false
            });
        };
        
        keyEl.addEventListener('mousedown', handleVirtualClick);
        keyEl.addEventListener('touchstart', handleVirtualClick, {passive: false});
    });

    }


function skipTypingWord() {
    if(typingWordIndex >= currentTypingData.length) return;
    
    // Play skip sound if desired, or just move on
    typingWordIndex++;
    typingCharIndex = 0;
    
    if (typingWordIndex >= currentTypingData.length) {
        // End game
        const accuracy = Math.round(((typingTotalCharsTyped - typingMistakes) / Math.max(1, typingTotalCharsTyped)) * 100);
        showTypingResult(typingWPM, accuracy);
        return;
    }
    
    renderTypingWord();
}

function startTypingGame(type, idx) {
    let selectedStudent = null;
    const currentStudents = students.filter(s => s.classId === currentClassId);
    if(currentStudents.length > 0) {
        const stt = prompt("Nhập Số Thứ Tự học sinh chơi để cộng 1 điểm thưởng khi hoàn thành (Để trống nếu chỉ chơi tự do):");
        if(stt) {
            selectedStudent = currentStudents.find(s => parseInt(s.stt) === parseInt(stt));
            if(!selectedStudent) {
                alert("Không tìm thấy học sinh có STT = " + stt);
                return;
            }
        }
    }
    
    typingTargetStudentId = selectedStudent ? selectedStudent.id : null;
    
    if(type === 'default') currentTypingData = [...typingLessons[idx].data];
    else currentTypingData = [...typingCustomLessons[idx].data];
    
    // Load toàn bộ câu hỏi theo đúng thứ tự (không random, không giới hạn 15 câu)
    // currentTypingData giữ nguyên thứ tự gốc
    
    typingWordIndex = 0;
    typingCharIndex = 0;
    typingErrors = 0;
    typingStartTime = Date.now();
    if (typingListeningMode) typingTopTextRevealed = false;
    
    // Yêu cầu: Khi ở chế độ Luyện Nghe, mặc định ẩn gợi ý phím
    if (typingListeningMode) {
        typingShowKeyboardHint = false;
        const btn = document.getElementById('btnToggleKeyboardHint');
        if (btn) {
            btn.innerHTML = '<i class="fas fa-eye-slash mr-1"></i>Ẩn gợi ý phím';
            btn.className = "text-gray-500 hover:text-pink-500 font-bold text-sm bg-gray-100 px-3 py-1.5 rounded-lg transition-colors";
        }
    } else {
        // Chế độ thường mặc định bật
        typingShowKeyboardHint = true;
        const btn = document.getElementById('btnToggleKeyboardHint');
        if (btn) {
            btn.innerHTML = '<i class="fas fa-eye mr-1"></i>Hiện gợi ý phím';
            btn.className = "text-pink-500 hover:text-pink-600 font-bold text-sm bg-pink-50 px-3 py-1.5 rounded-lg border border-pink-200 transition-colors";
        }
    }

    
    closeTypingGameMenu();
    document.getElementById('typingPlayModal').classList.remove('hidden');
    initVirtualKeyboard();
    
    document.addEventListener('keydown', handleTypingInput);
    renderTypingWord();
}

function closeTypingPlay() {
    document.getElementById('typingPlayModal').classList.add('hidden');
    document.removeEventListener('keydown', handleTypingInput);
}

function renderTypingWord() {
    if (typingWordIndex >= currentTypingData.length) {
        finishTypingGame();
        return;
    }
    
    const wordObj = currentTypingData[typingWordIndex];
    
    // Render Vietnamese text with manual speaker button
    let topTextHTML = wordObj.vn;
    if (typingListeningMode && !typingTopTextRevealed) {
        topTextHTML = `<button onclick="revealTopText()" class="text-gray-400 hover:text-purple-500 transition border border-dashed border-gray-300 rounded-xl px-6 py-2 text-xl font-medium"><i class="fas fa-eye mr-2"></i>Click để xem nội dung hội thoại</button>`;
    } else {
        topTextHTML = `
            <span class="relative inline-block group cursor-pointer" onclick="if(typingListeningMode) { typingTopTextRevealed = false; renderTypingWord(); }">
                ${wordObj.vn}
                <button onclick="event.stopPropagation(); speakVietnameseSlowly('${wordObj.vn.replace(/'/g, "\'")}')" class="absolute -right-10 top-1/2 -translate-y-1/2 text-gray-300 hover:text-red-500 transition opacity-0 group-hover:opacity-100">
                    <i class="fas fa-volume-up text-lg"></i>
                </button>
            </span>
        `;
    }
    document.getElementById('typingVnText').innerHTML = topTextHTML;


    
    const enText = wordObj.en;
    const displayEl = document.getElementById('typingEnDisplay');
    displayEl.innerHTML = '';
    
    // Action buttons container (Eye + Speaker)
    const actionBtns = document.createElement('div');
    actionBtns.className = 'absolute -right-20 top-1/2 -translate-y-1/2 flex flex-col gap-3';
    
    // Speaker button
    const speakBtn = document.createElement('button');
    speakBtn.innerHTML = '<i class="fas fa-volume-up text-xl"></i>';
    speakBtn.className = 'text-gray-400 hover:text-green-500 transition';
    speakBtn.onclick = () => {
        if (typingListeningMode) {
            const vnText = currentTypingData[typingWordIndex].vn;
            speakVietnameseSlowly(vnText);
        } else if (typingReadLang === 'en') {
            speakEnglishSlowly(enText);
        } else {
            const vnText = currentTypingData[typingWordIndex].vn;
            speakVietnameseSlowly(vnText);
        }
        document.activeElement.blur();
    };
    
    // Toggle hidden button
    const toggleBtn = document.createElement('button');
    toggleBtn.innerHTML = typingWordHidden ? '<i class="fas fa-eye-slash text-xl"></i>' : '<i class="fas fa-eye text-xl"></i>';
    toggleBtn.className = 'text-gray-400 hover:text-blue-500 transition';
    toggleBtn.onclick = () => {
        typingWordHidden = !typingWordHidden;
        renderTypingWord();
        document.activeElement.blur();
    };
    
    actionBtns.appendChild(speakBtn);
    actionBtns.appendChild(toggleBtn);
    displayEl.appendChild(actionBtns);

    
    for(let i=0; i<enText.length; i++) {
        const span = document.createElement('span');
        span.innerText = enText[i] === ' ' ? '␣' : enText[i];
        span.className = 'inline-block px-1 mx-[1px] transition-all duration-100 font-mono text-5xl font-black border-b-4 border-transparent ' + 
        ((typingWordHidden && i >= typingCharIndex && enText[i] !== ' ') ? 'text-transparent bg-gray-200 rounded-lg select-none' : 'text-gray-300 select-none');
        if (i < typingCharIndex) {
            span.classList.remove('text-gray-300');
            span.classList.add('text-green-500');
            if (enText[i] === ' ') span.classList.add('bg-green-50', 'text-green-300', 'rounded-lg');
        } else if (i === typingCharIndex) {
            span.classList.remove('text-gray-300');
            span.classList.add('text-gray-800', 'border-blue-500');
            if (enText[i] === ' ') span.classList.add('bg-blue-50', 'text-blue-300', 'rounded-lg');
        }
        displayEl.appendChild(span);
    }
    
    // Update progress
    document.getElementById('typingProgress').style.width = ((typingWordIndex / currentTypingData.length) * 100) + '%';
    document.getElementById('typingProgressText').innerText = `${typingWordIndex}/${currentTypingData.length}`;
    
    updateWPM();
    updateTypingKeyboard(enText[typingCharIndex]);
    
    // Auto pronounce when starting a new word
    if (typingCharIndex === 0 && typingAutoSpeak) {
        if (typingListeningMode || typingReadLang === 'vi') {
            speakVietnameseSlowly(wordObj.vn);
        } else {
            speakEnglishSlowly(enText);
        }
    }
}

function handleTypingInput(e) {
    if(e.ctrlKey || e.altKey || e.metaKey || e.key.length > 1) return;
    if(e.key === ' ') e.preventDefault();
    
    const wordObj = currentTypingData[typingWordIndex];
    const enText = wordObj.en;
    const expectedChar = enText[typingCharIndex];
    
    const isCorrect = (e.key === expectedChar) || (e.key.toLowerCase() === expectedChar.toLowerCase());
    
    if (isCorrect) {
        typingCharIndex++;
        
        // Lightweight tick sound
        const audio = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA');
        audio.volume = 0.2;
        audio.play().catch(()=>{});
        
        if (typingCharIndex >= enText.length) {
            typingWordIndex++;
            typingCharIndex = 0;
            if (typingListeningMode) typingTopTextRevealed = false;
            const displayEl = document.getElementById('typingEnDisplay');
            displayEl.classList.add('scale-105', 'text-green-500');
            setTimeout(() => {
                displayEl.classList.remove('scale-105', 'text-green-500');
                renderTypingWord();
            }, 150);
        } else {
            renderTypingWord();
        }
    } else {

        typingErrors++;
        const errAudio = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA='); // A quick low beep
        // Actually, let's use a real URL for error beep
        const realErrAudio = new Audio('https://www.soundjay.com/buttons/sounds/button-10.mp3');
        realErrAudio.volume = 0.3;
        realErrAudio.play().catch(()=>{});
        
        const displayEl = document.getElementById('typingEnDisplay');

        displayEl.classList.add('animate-shake', 'text-red-500');
        
        const keyId = getKbdId(expectedChar);
        const kbd = document.getElementById('kbd_' + keyId);
        if(kbd) kbd.classList.add('!bg-red-500', '!text-white');
        
        setTimeout(() => {
            displayEl.classList.remove('animate-shake', 'text-red-500');
            if(kbd) kbd.classList.remove('!bg-red-500', '!text-white');
        }, 300);
        updateWPM();
    }
}

function updateWPM() {
    const elapsedMinutes = (Date.now() - typingStartTime) / 60000;
    const totalCharsTyped = currentTypingData.slice(0, typingWordIndex).reduce((acc, val) => acc + val.en.length, 0) + typingCharIndex;
    
    const wpm = elapsedMinutes > 0 ? Math.round((totalCharsTyped / 5) / elapsedMinutes) : 0;
    document.getElementById('typingWpm').innerText = wpm;
    
    const acc = totalCharsTyped > 0 ? Math.round(((totalCharsTyped - typingErrors) / totalCharsTyped) * 100) : 100;
    document.getElementById('typingAcc').innerText = acc + '%';
}

function finishTypingGame() {
    document.removeEventListener('keydown', handleTypingInput);
    document.getElementById('typingProgress').style.width = '100%';
    
    let extraMsg = '';
    if(typingTargetStudentId) {
        addPoints(typingTargetStudentId, 1, 'Hoàn thành bài Luyện Gõ Tiếng Anh');
        const s = students.find(x=>x.id === typingTargetStudentId);
        extraMsg = `<div class="mt-4 px-4 py-2 bg-green-100 text-green-700 font-bold rounded-xl border border-green-200">🎉 Đã cộng +1 điểm cho: ${s.name}</div>`;
    }
    
    document.getElementById('typingVnText').innerHTML = `
        <div class="text-4xl font-black text-blue-600 mb-2">HOÀN THÀNH!</div>
        <div class="text-xl text-gray-600">Tốc độ: <b>${document.getElementById('typingWpm').innerText} WPM</b> | Chính xác: <b>${document.getElementById('typingAcc').innerText}</b></div>
        ${extraMsg}
    `;
    document.getElementById('typingEnDisplay').innerHTML = `
        <button onclick="closeTypingPlay()" class="mt-6 px-10 py-4 bg-blue-500 text-white font-black text-xl rounded-2xl hover:bg-blue-600 shadow-xl transition transform hover:scale-105">ĐÓNG</button>
    `;
    document.getElementById('virtualKeyboard').classList.add('hidden');
    triggerConfetti();
}

function getKbdId(char) {
    let keyId = char.toLowerCase();
    if(keyId === ' ') return 'space';
    if(keyId === ',') return 'comma';
    if(keyId === '.') return 'dot';
    if(keyId === "'") return 'quote';
    if(keyId === "-") return 'dash';
    if(keyId === "?") return 'question';
    if(keyId === "!") return 'bang';
    if(keyId === "(" || keyId === ")") return 'paren';
    return keyId;
}



// ---------------------------------
// EXCEL IMPORT / EXPORT
// ---------------------------------
function downloadListeningTemplate() {
    const ws_data = [
        ["Hội thoại (Cột A)", "Đáp án (Cột B)"],
        ["Woman: Which sport does Anna like? Boy: She played badminton before, and she sometimes plays tennis, but her favourite sport is basketball.", "Basketball"],
        ["Girl: Did you go to the zoo yesterday? Boy: No. I wanted to go, but it rained, so I went to the museum instead.", "Museum"],
        ["Woman: What colour is Tom's new bike? Boy: He liked the blue one, and his dad wanted the black one, but they bought the red bike.", "Red"]
    ];
    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "LuyenNghe");
    XLSX.writeFile(wb, "Dojo_Mau_Luyen_Nghe.xlsx");
}

function downloadTypingTemplate() {
    const ws_data = [
        ["Tiếng Anh", "Tiếng Việt"],
        ["Apple", "Quả táo"],
        ["School", "Trường học"],
        ["Teacher", "Giáo viên"]
    ];
    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "TuVung");
    XLSX.writeFile(wb, "Dojo_Mau_Tu_Vung.xlsx");
}

function handleTypingExcelUpload(e) {
    const file = e.target.files[0];
    if(!file) return;
    
    const reader = new FileReader();
    reader.onload = function(evt) {
        const data = evt.target.result;
        const workbook = XLSX.read(data, {type: 'binary'});
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(sheet);
        
        const parsedData = [];
        json.forEach(row => {
            const en = row['Tiếng Anh'] || row['Tieng Anh'] || row['English'] || row['Đáp án (Cột B)'];
            const vn = row['Tiếng Việt'] || row['Tieng Viet'] || row['Vietnamese'] || row['Hội thoại (Cột A)'];
            if(en && vn) {
                parsedData.push({ en: String(en).trim(), vn: String(vn).trim() });
            }
        });
        
        if (parsedData.length === 0) {
            alert("Không tìm thấy dữ liệu hợp lệ! Đảm bảo cột tên là 'Tiếng Anh' và 'Tiếng Việt' (hoặc 'Hội thoại (Cột A)' và 'Đáp án (Cột B)')");
            return;
        }
        
        const name = prompt("Nhập tên bài học cho file này:", file.name.split('.')[0]) || "Bài học Excel";
        typingCustomLessons.push({ name, data: parsedData });
        localStorage.setItem('dojo_custom_typing', JSON.stringify(typingCustomLessons));
        renderTypingLessons();
        alert("Đã thêm thành công " + parsedData.length + " từ vựng!");
        
        // Reset input
        e.target.value = '';
    };
    reader.readAsBinaryString(file);
}




let typingReadLang = 'en';

let typingListeningMode = false;
let typingShowKeyboardHint = true;
let typingTopTextRevealed = false;


let typingEyeCareMode = false;
function toggleEyeCareMode() {
    typingEyeCareMode = !typingEyeCareMode;
    const modal = document.getElementById('typingPlayModal');
    const btn = document.getElementById('btnEyeCare');
    if (typingEyeCareMode) {
        // Áp dụng bộ lọc chống mỏi mắt: ám vàng + giảm độ sáng nhẹ
        modal.style.filter = 'sepia(40%) brightness(90%) contrast(90%)';
        if (btn) {
            btn.innerHTML = '<i class="fas fa-sun mr-1"></i>Mặc định';
            btn.className = "text-gray-500 hover:text-gray-600 font-bold text-sm bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-200 transition-colors";
        }
    } else {
        modal.style.filter = 'none';
        if (btn) {
            btn.innerHTML = '<i class="fas fa-leaf mr-1"></i>Bảo vệ mắt';
            btn.className = "text-green-600 hover:text-green-700 font-bold text-sm bg-green-50 px-3 py-1.5 rounded-lg border border-green-200 transition-colors";
        }
    }
}

function toggleKeyboardHint() {
    typingShowKeyboardHint = !typingShowKeyboardHint;
    const btn = document.getElementById('btnToggleKeyboardHint');
    if (btn) {
        if (typingShowKeyboardHint) {
            btn.innerHTML = '<i class="fas fa-eye mr-1"></i>Hiện gợi ý phím';
            btn.className = "text-pink-500 hover:text-pink-600 font-bold text-sm bg-pink-50 px-3 py-1.5 rounded-lg border border-pink-200 transition-colors";
        } else {
            btn.innerHTML = '<i class="fas fa-eye-slash mr-1"></i>Ẩn gợi ý phím';
            btn.className = "text-gray-500 hover:text-pink-500 font-bold text-sm bg-gray-100 px-3 py-1.5 rounded-lg transition-colors";
        }
    }
    
    if (currentTypingData && currentTypingData.length > 0) {
        const wordObj = currentTypingData[typingWordIndex];
        const enText = wordObj.en;
        if(enText && typingCharIndex < enText.length) {
            updateTypingKeyboard(enText[typingCharIndex]);
        } else {
            updateTypingKeyboard(null);
        }
    }
}

function toggleListeningMode() {
    typingListeningMode = !typingListeningMode;
    const btn = document.getElementById('btnToggleListeningMode');
    if (btn) {
        if (typingListeningMode) {
            btn.innerHTML = '<i class="fas fa-headphones mr-1"></i>Chế độ Nghe';
            btn.className = "text-purple-600 hover:text-purple-700 font-bold text-sm bg-purple-50 px-3 py-1.5 rounded-lg border border-purple-200 transition-colors";
            
            // Auto switch to reading top line and hide word
            typingReadLang = 'vi';
            typingWordHidden = true;
            typingTopTextRevealed = false;
            
            const btnLang = document.getElementById('btnToggleReadLang');
            if(btnLang) {
                btnLang.innerHTML = '<i class="fas fa-comments mr-1"></i>Đọc Câu Hỏi';
                btnLang.className = "text-indigo-600 hover:text-indigo-700 font-bold text-sm bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-200 transition-colors";
            }
        } else {
            btn.innerHTML = '<i class="fas fa-headphones mr-1"></i>Luyện Nghe';
            btn.className = "text-gray-500 hover:text-purple-500 font-bold text-sm bg-gray-100 px-3 py-1.5 rounded-lg transition-colors";
            typingTopTextRevealed = true; // reveal top text
        }
    }
    renderTypingWord();
}

function revealTopText() {
    typingTopTextRevealed = true;
    renderTypingWord();
}


function toggleReadLang() {
    if (typingListeningMode) {
        // Just replay the question in listening mode
        if(currentTypingData && currentTypingData.length > 0) {
            const wordObj = currentTypingData[typingWordIndex];
            speakVietnameseSlowly(wordObj.vn);
        }
        return;
    }
    typingReadLang = typingReadLang === 'en' ? 'vi' : 'en';
    const btn = document.getElementById('btnToggleReadLang');
    if (btn) {
        if (typingReadLang === 'en') {
            btn.innerHTML = '<i class="fas fa-keyboard mr-1"></i>Đọc Đáp Án';
            btn.className = "text-blue-500 hover:text-blue-600 font-bold text-sm bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200 transition-colors";
        } else {
            btn.innerHTML = '<i class="fas fa-comments mr-1"></i>Đọc Câu Hỏi';
            btn.className = "text-indigo-600 hover:text-indigo-700 font-bold text-sm bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-200 transition-colors";
        }
    }
    // Read the current word in the new language
    if(currentTypingData && currentTypingData.length > 0) {
        const wordObj = currentTypingData[typingWordIndex];
        if (typingReadLang === 'en') speakEnglishSlowly(wordObj.en);
        else speakVietnameseSlowly(wordObj.vn);
    }
}

let typingSpeechSessionId = 0;
function speakVietnameseSlowly(text, rate = 0.9) {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    
    // Check if it's an English conversation
    const conversationRegex = /(Woman:|Boy:|Girl:|Man:)\s*(.*?)(?=(Woman:|Boy:|Girl:|Man:|$))/gi;
    const isConversation = /(Woman:|Boy:|Girl:|Man:)/i.test(text);
    
    typingSpeechSessionId++;
    const currentSessionId = typingSpeechSessionId;
    
    if (isConversation) {
        let match;
        const parts = [];
        
        while ((match = conversationRegex.exec(text)) !== null) {
            parts.push({
                role: match[1].replace(':', '').trim().toLowerCase(),
                text: match[2].trim()
            });
        }
        
        if (parts.length > 0) {
            const voices = window.speechSynthesis.getVoices();
            const getBestVoice = (gender) => {
                const enVoices = voices.filter(v => v.lang.includes('en'));
                if (gender === 'female') {
                    return enVoices.find(v => v.name.includes('Google US English')) ||
                           enVoices.find(v => v.name.includes('Google UK English Female')) ||
                           enVoices.find(v => v.name.includes('Zira')) ||
                           enVoices.find(v => v.name.includes('Samantha')) ||
                           enVoices.find(v => v.name.includes('Female')) ||
                           enVoices[0];
                } else {
                    return enVoices.find(v => v.name.includes('Google UK English Male')) ||
                           enVoices.find(v => v.name.includes('David')) ||
                           enVoices.find(v => v.name.includes('Alex')) ||
                           enVoices.find(v => v.name.includes('Daniel')) ||
                           enVoices.find(v => v.name.includes('Male')) ||
                           enVoices[0];
                }
            };
            
            const bestFemale = getBestVoice('female');
            const bestMale = getBestVoice('male');
            
            const getVoice = (role) => {
                if (role === 'woman' || role === 'girl') return bestFemale;
                if (role === 'man' || role === 'boy') return bestMale;
                return voices.find(v => v.lang === 'en-US'); // default
            };
            
            const getPitch = (role) => {
                if (role === 'woman') return 1.0; // Natural adult female
                if (role === 'man') return 1.0; // Natural adult male
                if (role === 'girl') return 1.3; // Slightly higher for child
                if (role === 'boy') return 1.2; // Slightly higher for child
                return 1.0;
            };
            
            let currentPart = 0;
            function speakNext() {
                if (typingSpeechSessionId !== currentSessionId) return;
                if (currentPart >= parts.length) return;
                const part = parts[currentPart];
                const utterance = new SpeechSynthesisUtterance(part.text);
                utterance.lang = 'en-US';
                utterance.rate = 1.0; // Natural exam rate
                utterance.volume = 1.0; // Max volume
                
                const voice = getVoice(part.role);
                if (voice) utterance.voice = voice;
                utterance.pitch = getPitch(part.role);
                
                utterance.onend = () => {
                    currentPart++;
                    speakNext();
                };
                
                window.speechSynthesis.speak(utterance);
            }
            
            speakNext();
            return;
        }
    }
    
    // If not a conversation, determine if it's mostly Vietnamese or English
    // A quick hack: if it has no Vietnamese diacritics, maybe it's English, but for now we fallback to Vietnamese voice or Google English
    const hasVietnamese = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(text);
    
    if (hasVietnamese) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'vi-VN';
        utterance.rate = rate;
        
        const voices = window.speechSynthesis.getVoices();
        const googleVoice = voices.find(v => (v.name.includes('Google') || v.name.includes('Vietnam')) && v.lang.includes('vi'));
        if (googleVoice) {
            utterance.voice = googleVoice;
        }
        
        window.speechSynthesis.speak(utterance);
    } else {
        speakEnglishSlowly(text, 0.9);
    }
}

function speakEnglishSlowly(text, rate = 1.0) {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel(); // Stop any ongoing speech
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US';
        utterance.rate = rate; // Natural exam rate
        utterance.volume = 1.0; // Max volume
        
        // Try to find a good Google voice if available
        const voices = window.speechSynthesis.getVoices();
        const googleVoice = voices.find(v => v.name.includes('Google') && v.lang.includes('en'));
        if (googleVoice) {
            utterance.voice = googleVoice;
        }
        
        window.speechSynthesis.speak(utterance);
    }
}



function getKeyColorClass(char) {
    const key = char.toLowerCase();
    
    // Left Pinky (Purple)
    if (['q', 'a', 'z', '1', '~', '`'].includes(key)) return 'bg-purple-500 shadow-purple-500/50';
    // Left Ring (Blue)
    if (['w', 's', 'x', '2'].includes(key)) return 'bg-blue-500 shadow-blue-500/50';
    // Left Middle (Green)
    if (['e', 'd', 'c', '3'].includes(key)) return 'bg-green-500 shadow-green-500/50';
    // Left Index (Yellow)
    if (['r', 'f', 'v', '4', 't', 'g', 'b', '5'].includes(key)) return 'bg-yellow-500 shadow-yellow-500/50';
    
    // Thumbs (Gray)
    if (key === ' ' || key === 'space') return 'bg-gray-500 shadow-gray-500/50';
    
    // Right Index (Red)
    if (['y', 'h', 'n', '6', 'u', 'j', 'm', '7'].includes(key)) return 'bg-red-500 shadow-red-500/50';
    // Right Middle (Orange)
    if (['i', 'k', ',', '8'].includes(key)) return 'bg-orange-500 shadow-orange-500/50';
    // Right Ring (Teal)
    if (['o', 'l', '.', '9'].includes(key)) return 'bg-teal-500 shadow-teal-500/50';
    // Right Pinky (Pink)
    if (['p', ';', '/', '0', '-', '=', '[', ']', "'", '\\', '?', '!'].includes(key)) return 'bg-pink-500 shadow-pink-500/50';
    
    // Default fallback
    return 'bg-blue-500 shadow-blue-500/50';
}

function updateTypingKeyboard(expectedChar) {
    // We need to clear all possible color classes
    const colorClasses = ['bg-purple-500', 'shadow-purple-500/50', 'bg-blue-500', 'shadow-blue-500/50', 
                          'bg-green-500', 'shadow-green-500/50', 'bg-yellow-500', 'shadow-yellow-500/50',
                          'bg-gray-500', 'shadow-gray-500/50', 'bg-red-500', 'shadow-red-500/50',
                          'bg-orange-500', 'shadow-orange-500/50', 'bg-teal-500', 'shadow-teal-500/50',
                          'bg-pink-500', 'shadow-pink-500/50', 'text-white', 'scale-110', 'shadow-lg', 'z-10'];
                          
    document.querySelectorAll('.kbd-key').forEach(el => {
        el.classList.remove(...colorClasses);
        el.classList.add('bg-white', 'text-gray-700');
    });
    
    if(!expectedChar || !typingShowKeyboardHint) return;
    
    const keyId = getKbdId(expectedChar);
    const kbd = document.getElementById('kbd_' + keyId);
    if(kbd) {
        kbd.classList.remove('bg-white', 'text-gray-700');
        const colorClass = getKeyColorClass(expectedChar);
        kbd.classList.add(...colorClass.split(' '), 'text-white', 'scale-110', 'shadow-lg', 'z-10');
    }
}
