// ============================================================
// NHẬN XÉT TỰ ĐỘNG
// ============================================================
const COMMENTS = {
    // Điểm cộng cao, điểm trừ thấp
    excellent: [
        'Xuất sắc! Em là nguồn cảm hứng cho cả lớp. 🌟',
        'Thầy/cô rất tự hào về em! Tiếp tục tỏa sáng nhé! 🏆',
        'Em đang viết nên câu chuyện thành công của chính mình! 🚀',
        'Thành tích của em thật ấn tượng và đáng ngưỡng mộ! 🌠',
        'Em chứng minh rằng nỗ lực luôn được đền đáp xứng đáng! 💫',
        'Cả lớp học hỏi được rất nhiều tinh thần từ em! 👑',
        'Em là minh chứng sống động cho câu "Có công mài sắt có ngày nên kim"! ⭐',
        'Phong độ tuyệt vời! Thầy/cô tin em sẽ còn tiến xa hơn nữa! 🦅',
        'Không có gì là không thể với em khi em nỗ lực như vậy! 💎',
        'Em đang đặt những bước chân vững chắc nhất trên hành trình học tập! 🎯',
    ],
    // Điểm tốt, ổn định
    positive: [
        'Em đang học tập rất tích cực, thầy/cô hài lòng lắm! 😊',
        'Thái độ học tập của em đáng được ghi nhận và khen thưởng! 👍',
        'Em đang trên đà tiến bộ rất tốt, hãy duy trì nhé! 📈',
        'Sự chăm chỉ của em đang được đền đáp từng ngày! 🌻',
        'Em đóng góp rất tích cực cho không khí lớp học! 🎉',
        'Thầy/cô nhận thấy em ngày càng tiến bộ hơn! ✨',
        'Em có nhiều điểm mạnh tuyệt vời, hãy tiếp tục phát huy! 💪',
        'Sự cố gắng của em truyền cảm hứng cho các bạn xung quanh! 🌈',
        'Em đang làm rất tốt! Thầy/cô luôn theo dõi và cổ vũ em! 🤩',
        'Tinh thần học tập của em thật đáng khen ngợi! 🥰',
    ],
    // Điểm cộng nhiều hơn trừ, đang tiến bộ
    improving: [
        'Em đang tiến bộ từng ngày, thầy/cô tin tưởng vào em! 💚',
        'Hướng đi đúng rồi! Tiếp tục cố gắng thêm một chút nữa nhé! 👊',
        'Mỗi ngày một chút tiến bộ chính là thành công bền vững! 🌱',
        'Em có tiềm năng lớn, hãy tự tin hơn vào bản thân mình! 🦋',
        'Thầy/cô thấy em đang cố gắng và rất trân trọng điều đó! 🤝',
        'Con đường phía trước rộng mở hơn khi em tiếp tục như thế này! 🛤️',
        'Mỗi bước tiến nhỏ đều có giá trị rất lớn đối với thầy/cô! 🐾',
        'Em đang học hỏi và trưởng thành qua từng ngày! 📚',
        'Sự kiên trì của em sẽ sớm mang lại kết quả xứng đáng! ⏳',
        'Em đang xây dựng nền tảng vững chắc cho tương lai! 🏗️',
    ],
    // Có điểm trừ nhiều hơn, cần cố gắng — vẫn tích cực
    needsWork: [
        'Thầy/cô tin rằng em có thể làm tốt hơn nhiều! 💛',
        'Hãy để ngày mai là cơ hội tuyệt vời để em tỏa sáng nhé! 🌅',
        'Em có nhiều tài năng chưa được khám phá hết, đừng bỏ lỡ! 💎',
        'Thầy/cô luôn sẵn sàng đồng hành cùng em trên hành trình tiến bộ! 🤗',
        'Mỗi ngày là một trang mới — hãy viết thật đẹp nhé em! 📖',
        'Hãy biến những thử thách thành bậc thang vươn cao em nhé! 🦅',
        'Thầy/cô tin rằng bên trong em có một học sinh xuất sắc! ✊',
        'Đừng ngại vấp ngã — đó chính là cách em học cách đứng vững! 🌱',
        'Mỗi lần cố gắng là em đang đầu tư cho tương lai của chính mình! 🎯',
        'Em đặc biệt theo cách của riêng mình, thầy/cô trân trọng điều đó! 🌈',
    ],
    // Chưa có điểm
    neutral: [
        'Chào mừng em đến với hành trình học tập tuyệt vời! 🎒',
        'Mỗi ngày đến lớp là một ngày em lớn lên và trưởng thành! 🌱',
        'Em có tất cả những gì cần thiết để thành công! 🌈',
        'Thầy/cô mong được chứng kiến em tỏa sáng theo cách của em! ⭐',
        'Hành trình vạn dặm bắt đầu từ một bước chân đầu tiên! 👣',
        'Em là một phần không thể thiếu của lớp học này! 🏠',
        'Cả lớp rất vui khi có em! Hãy luôn mỉm cười nhé! 🎈',
        'Hãy bắt đầu ngày mới với năng lượng tích cực em nhé! ☀️',
        'Tiềm năng của em đang chờ được khơi dậy! 💥',
        'Thầy/cô tin em sẽ để lại dấu ấn đặc biệt! 🦋',
    ],
};

function generateComment(student) {
    const p = student.positivePoints || 0;
    const n = student.negativePoints || 0;
    let pool;
    if (p === 0 && n === 0)             pool = COMMENTS.neutral;
    else if (p >= 10 && n <= 2)         pool = COMMENTS.excellent;
    else if (p >= 5 && n <= p * 0.35)  pool = COMMENTS.positive;
    else if (p > n)                     pool = COMMENTS.improving;
    else                                pool = COMMENTS.needsWork;
    // Seed deterministic theo id + tổng điểm (thay đổi khi điểm thay đổi)
    const seed = Math.abs((student.id * 7 + p * 3 + n * 5)) % pool.length;
    return pool[seed];
}

