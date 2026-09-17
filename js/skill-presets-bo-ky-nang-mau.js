// ============================================================
// SKILL PRESETS – BỘ KỸ NĂNG MẪU
// ============================================================
const SKILL_PRESETS = {
    homeroom: {
        label: 'Lớp chủ nhiệm',
        icon:  'fa-chalkboard-teacher',
        color: 'text-blue-600',
        bg:    'bg-blue-50',
        border:'border-blue-200',
        description: '20 tiêu chí đánh giá nề nếp, tác phong học sinh',
        positive: [
            { id:'h_p1',  name:'Đi học đúng giờ',       points:1, icon:'fa-clock',          color:'bg-blue-100 text-blue-700 border-blue-200' },
            { id:'h_p2',  name:'Đồng phục đúng quy định',points:1, icon:'fa-tshirt',         color:'bg-indigo-100 text-indigo-700 border-indigo-200' },
            { id:'h_p3',  name:'Chuẩn bị bài đầy đủ',   points:1, icon:'fa-book-open',      color:'bg-cyan-100 text-cyan-700 border-cyan-200' },
            { id:'h_p4',  name:'Phát biểu xây dựng bài', points:1, icon:'fa-hand-paper',     color:'bg-green-100 text-green-700 border-green-200' },
            { id:'h_p5',  name:'Giúp đỡ bạn bè',         points:1, icon:'fa-handshake',      color:'bg-teal-100 text-teal-700 border-teal-200' },
            { id:'h_p6',  name:'Việc tốt mỗi ngày',      points:1, icon:'fa-heart',          color:'bg-pink-100 text-pink-700 border-pink-200' },
            { id:'h_p7',  name:'Trực nhật tốt',           points:1, icon:'fa-broom',          color:'bg-orange-100 text-orange-700 border-orange-200' },
            { id:'h_p8',  name:'Giữ vệ sinh',             points:1, icon:'fa-leaf',           color:'bg-green-100 text-green-700 border-green-200' },
            { id:'h_p9',  name:'Tham gia phong trào',     points:2, icon:'fa-flag',           color:'bg-yellow-100 text-yellow-700 border-yellow-200' },
            { id:'h_p10', name:'Tiến bộ bản thân',        points:2, icon:'fa-chart-line',     color:'bg-emerald-100 text-emerald-700 border-emerald-200' },
            { id:'p_s3',  name:'Thưởng đặc biệt',         points:3, icon:'fa-gift',           color:'bg-pink-100 text-pink-600 border-pink-200' },
            { id:'p_s5',  name:'Xuất sắc đặc biệt',       points:5, icon:'fa-crown',          color:'bg-amber-100 text-amber-600 border-amber-200' },
        ],
        negative: [
            { id:'h_n1',  name:'Đi học muộn',                    points:-1, icon:'fa-clock',              color:'bg-red-100 text-red-600 border-red-200' },
            { id:'h_n2',  name:'Không làm bài tập',              points:-1, icon:'fa-times-circle',       color:'bg-red-100 text-red-600 border-red-200' },
            { id:'h_n3',  name:'Không học bài',                  points:-1, icon:'fa-book',               color:'bg-red-100 text-red-600 border-red-200' },
            { id:'h_n4',  name:'Mất trật tự',                    points:-1, icon:'fa-volume-up',          color:'bg-red-100 text-red-600 border-red-200' },
            { id:'h_n5',  name:'Sử dụng điện thoại sai quy định',points:-2, icon:'fa-mobile',             color:'bg-red-200 text-red-700 border-red-300' },
            { id:'h_n6',  name:'Nói tục',                        points:-1, icon:'fa-comment-slash',      color:'bg-red-100 text-red-600 border-red-200' },
            { id:'h_n7',  name:'Xả rác',                         points:-1, icon:'fa-trash',              color:'bg-red-100 text-red-600 border-red-200' },
            { id:'h_n8',  name:'Thiếu lễ phép',                  points:-1, icon:'fa-user-slash',         color:'bg-red-100 text-red-600 border-red-200' },
            { id:'h_n9',  name:'Gây gổ với bạn',                 points:-2, icon:'fa-fist-raised',        color:'bg-red-200 text-red-700 border-red-300' },
            { id:'h_n10', name:'Vi phạm an toàn trường học',     points:-3, icon:'fa-exclamation-triangle',color:'bg-red-300 text-red-800 border-red-400' },
        ]
    },
    subject: {
        label: 'Giáo viên bộ môn',
        icon:  'fa-graduation-cap',
        color: 'text-purple-600',
        bg:    'bg-purple-50',
        border:'border-purple-200',
        description: 'Tiêu chí đánh giá theo học tập bộ môn',
        positive: [
            { id:'s_p1', name:'Làm bài tốt',            points:1, icon:'fa-star',          color:'bg-yellow-100 text-yellow-600 border-yellow-200' },
            { id:'s_p2', name:'Phát biểu xây dựng bài', points:1, icon:'fa-hand-paper',    color:'bg-blue-100 text-blue-600 border-blue-200' },
            { id:'s_p3', name:'Đạt điểm cao (≥8)',      points:2, icon:'fa-medal',          color:'bg-amber-100 text-amber-600 border-amber-200' },
            { id:'s_p4', name:'Hoàn thành bài tập',     points:1, icon:'fa-check-circle',  color:'bg-green-100 text-green-600 border-green-200' },
            { id:'s_p5', name:'Giải bài khó',           points:2, icon:'fa-lightbulb',     color:'bg-orange-100 text-orange-600 border-orange-200' },
            { id:'s_p6', name:'Giúp bạn học bài',       points:1, icon:'fa-handshake',     color:'bg-teal-100 text-teal-600 border-teal-200' },
            { id:'s_p7', name:'Tiến bộ môn học',        points:2, icon:'fa-chart-line',    color:'bg-emerald-100 text-emerald-600 border-emerald-200' },
            { id:'s_p8', name:'Chuẩn bị đồ dùng đầy đủ',points:1,icon:'fa-pencil-ruler',  color:'bg-cyan-100 text-cyan-600 border-cyan-200' },
            { id:'p_s3', name:'Thưởng đặc biệt',        points:3, icon:'fa-gift',          color:'bg-pink-100 text-pink-600 border-pink-200' },
            { id:'p_s5', name:'Xuất sắc đặc biệt',      points:5, icon:'fa-crown',         color:'bg-amber-100 text-amber-600 border-amber-200' },
        ],
        negative: [
            { id:'s_n1', name:'Không làm bài tập',      points:-1, icon:'fa-times-circle',   color:'bg-red-100 text-red-600 border-red-200' },
            { id:'s_n2', name:'Không học bài',           points:-1, icon:'fa-book',            color:'bg-red-100 text-red-600 border-red-200' },
            { id:'s_n3', name:'Mất trật tự trong giờ',  points:-1, icon:'fa-volume-up',       color:'bg-red-100 text-red-600 border-red-200' },
            { id:'s_n4', name:'Sử dụng điện thoại',     points:-2, icon:'fa-mobile',           color:'bg-red-200 text-red-700 border-red-300' },
            { id:'s_n5', name:'Không mang đồ dùng',     points:-1, icon:'fa-pencil-ruler',    color:'bg-red-100 text-red-600 border-red-200' },
            { id:'s_n6', name:'Gian lận bài kiểm tra',  points:-3, icon:'fa-ban',              color:'bg-red-300 text-red-800 border-red-400' },
        ]
    },
    custom: {
        label: 'Tùy chỉnh',
        icon:  'fa-sliders-h',
        color: 'text-gray-600',
        bg:    'bg-gray-50',
        border:'border-gray-200',
        description: 'Bộ kỹ năng mặc định, tự do tùy chỉnh',
        positive: [], // Will be populated from DEFAULT_SKILLS
        negative: []
    }
};

const DEFAULT_SKILLS = {
    positive: [
        { id:'p1', name:'Làm bài tốt',   points:1, icon:'fa-star',           color:'bg-yellow-100 text-yellow-600 border-yellow-200' },
        { id:'p2', name:'Phát biểu',      points:1, icon:'fa-hand-paper',     color:'bg-blue-100 text-blue-600 border-blue-200' },
        { id:'p3', name:'Giúp đỡ bạn',   points:1, icon:'fa-hands-helping',  color:'bg-green-100 text-green-600 border-green-200' },
        { id:'p4', name:'Làm việc nhóm', points:1, icon:'fa-users',           color:'bg-purple-100 text-purple-600 border-purple-200' },
        { id:'p5', name:'Sáng tạo',       points:1, icon:'fa-lightbulb',      color:'bg-orange-100 text-orange-600 border-orange-200' },
        { id:'p6', name:'Chuyên cần',     points:1, icon:'fa-calendar-check', color:'bg-teal-100 text-teal-600 border-teal-200' },
        { id:'p7', name:'Chăm chỉ',       points:1, icon:'fa-book',           color:'bg-indigo-100 text-indigo-600 border-indigo-200' },
        { id:'p8',  name:'Tiến bộ',            points:2, icon:'fa-arrow-trend-up', color:'bg-emerald-100 text-emerald-600 border-emerald-200' },
        { id:'p_s3', name:'Thưởng đặc biệt',   points:3, icon:'fa-gift',           color:'bg-pink-100 text-pink-600 border-pink-200' },
        { id:'p_s5', name:'Xuất sắc đặc biệt', points:5, icon:'fa-crown',          color:'bg-amber-100 text-amber-600 border-amber-200' },
    ],
    negative: [
        { id:'n1', name:'Nói chuyện',     points:-1, icon:'fa-comments',  color:'bg-red-100 text-red-600 border-red-200' },
        { id:'n2', name:'Chưa làm bài',   points:-1, icon:'fa-book-dead', color:'bg-red-100 text-red-600 border-red-200' },
        { id:'n3', name:'Đi muộn',        points:-1, icon:'fa-clock',     color:'bg-red-100 text-red-600 border-red-200' },
        { id:'n4', name:'Làm việc riêng', points:-1, icon:'fa-gamepad',   color:'bg-red-100 text-red-600 border-red-200' },
        { id:'n5', name:'Mất trật tự',    points:-2, icon:'fa-bullhorn',  color:'bg-red-200 text-red-700 border-red-300' },
        { id:'n6', name:'Vô lễ',          points:-3, icon:'fa-angry',     color:'bg-red-300 text-red-800 border-red-400' },
    ]
};

