import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { TitleScene } from "./scenes/TitleScene";
import { ScreenshotScene } from "./scenes/ScreenshotScene";
import { ScrollingHomepageScene } from "./scenes/ScrollingHomepageScene";
import { OutroScene } from "./scenes/OutroScene";

const TRANSITION_DURATION = 15; // 0.5s at 30fps
const TOTAL_STEPS = 10;

export const DemoVideo = () => {
  return (
    <TransitionSeries>
      {/* Scene 1: Title - 3s */}
      <TransitionSeries.Sequence durationInFrames={90}>
        <TitleScene />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({ durationInFrames: TRANSITION_DURATION })}
      />

      {/* Scene 2: Homepage Scrolling - 10s (HIGHLIGHT - show all sections) */}
      <TransitionSeries.Sequence durationInFrames={300}>
        <ScrollingHomepageScene />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition
        presentation={slide({ direction: "from-right" })}
        timing={linearTiming({ durationInFrames: TRANSITION_DURATION })}
      />

      {/* Scene 3: Login Page - 3s */}
      <TransitionSeries.Sequence durationInFrames={90}>
        <ScreenshotScene
          src="screenshots/01-login.png"
          title="Đăng nhập hệ thống"
          description="Hỗ trợ 3 vai trò: Candidate, Recruiter, và Admin — mỗi vai trò có dashboard riêng"
          step={2}
          totalSteps={TOTAL_STEPS}
          accentColor="#4F46E5"
        />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition
        presentation={slide({ direction: "from-right" })}
        timing={linearTiming({ durationInFrames: TRANSITION_DURATION })}
      />

      {/* Scene 4: Candidate Dashboard - 4s */}
      <TransitionSeries.Sequence durationInFrames={120}>
        <ScreenshotScene
          src="screenshots/02-candidate-dashboard.png"
          title="Dashboard Ứng viên"
          description="Tổng quan về ứng tuyển, trạng thái hồ sơ, và các hành động nhanh: Manage CVs, Browse Jobs, Smart Job Match"
          step={3}
          totalSteps={TOTAL_STEPS}
          accentColor="#0EA5E9"
        />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition
        presentation={slide({ direction: "from-right" })}
        timing={linearTiming({ durationInFrames: TRANSITION_DURATION })}
      />

      {/* Scene 5: CV Management - 8s (CORE FEATURE) */}
      <TransitionSeries.Sequence durationInFrames={240}>
        <ScreenshotScene
          src="screenshots/03-cv-management.png"
          title="⭐ Quản lý CV — AI Parse tự động"
          description="Upload CV (PDF/DOCX) → AI tự động phân tích nội dung → Trích xuất kỹ năng, kinh nghiệm → Sẵn sàng matching với Job"
          step={4}
          totalSteps={TOTAL_STEPS}
          accentColor="#8B5CF6"
          isHighlight
          zoomTarget={{ x: 55, y: 55, scale: 1.6, startFrame: 90 }}
          callouts={[
            { text: "Upload PDF / DOCX", x: 38, y: 32, delay: 30, direction: "left" },
            { text: "AI tự động phân tích", x: 55, y: 60, delay: 55, direction: "right" },
            { text: "Tạo CV mới ✨", x: 78, y: 43, delay: 70, direction: "right" },
          ]}
        />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition
        presentation={slide({ direction: "from-right" })}
        timing={linearTiming({ durationInFrames: TRANSITION_DURATION })}
      />

      {/* Scene 6: Job Listing - 3s */}
      <TransitionSeries.Sequence durationInFrames={90}>
        <ScreenshotScene
          src="screenshots/04-job-listing.png"
          title="Danh sách việc làm"
          description="Tìm kiếm, lọc theo danh mục nghề, hình thức kinh doanh — Hiển thị mức lương, skills và thời gian đăng"
          step={5}
          totalSteps={TOTAL_STEPS}
          accentColor="#10B981"
        />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({ durationInFrames: TRANSITION_DURATION })}
      />

      {/* Scene 7: Job Detail + Apply - 8s (CORE FEATURE) */}
      <TransitionSeries.Sequence durationInFrames={240}>
        <ScreenshotScene
          src="screenshots/05-job-detail.png"
          title="⭐ Chi tiết việc làm & Ứng tuyển"
          description="Xem Job Description, Requirements, Benefits chi tiết — Thông tin công ty — Apply Now chỉ với 1 click"
          step={6}
          totalSteps={TOTAL_STEPS}
          accentColor="#F59E0B"
          isHighlight
          zoomTarget={{ x: 70, y: 25, scale: 1.5, startFrame: 100 }}
          callouts={[
            { text: "Mô tả công việc chi tiết", x: 55, y: 20, delay: 30, direction: "right" },
            { text: "Apply chỉ 1 click! 🚀", x: 82, y: 15, delay: 60, direction: "left" },
            { text: "Yêu cầu & Benefits", x: 55, y: 50, delay: 45, direction: "right" },
          ]}
        />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition
        presentation={slide({ direction: "from-right" })}
        timing={linearTiming({ durationInFrames: TRANSITION_DURATION })}
      />

      {/* Scene 8: AI Matching - 8s (CORE FEATURE - HIGHLIGHT) */}
      <TransitionSeries.Sequence durationInFrames={240}>
        <ScreenshotScene
          src="screenshots/06-ai-matching.png"
          title="⭐ AI Matching — Điểm phù hợp"
          description="AI so sánh CV với JD → Tính điểm Match % → Hiển thị kỹ năng khớp — Ứng viên theo dõi status: Applied, Reviewing, Rejected"
          step={7}
          totalSteps={TOTAL_STEPS}
          accentColor="#EF4444"
          isHighlight
          zoomTarget={{ x: 65, y: 55, scale: 1.5, startFrame: 90 }}
          callouts={[
            { text: "AI Match Score", x: 65, y: 22, delay: 25, direction: "right" },
            { text: "81% khớp! 🎯", x: 68, y: 67, delay: 50, direction: "right" },
            { text: "71% — Cybersecurity", x: 68, y: 59, delay: 65, direction: "right" },
            { text: "Trạng thái: APPLIED / REJECTED", x: 58, y: 40, delay: 40, direction: "left" },
          ]}
        />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({ durationInFrames: TRANSITION_DURATION })}
      />

      {/* Scene 9: Recruiter Dashboard - 4s */}
      <TransitionSeries.Sequence durationInFrames={120}>
        <ScreenshotScene
          src="screenshots/07-recruiter-dashboard.png"
          title="Dashboard Recruiter"
          description="Tổng quan pipeline tuyển dụng: Total Jobs, Published Jobs, Applications, Pending Review"
          step={8}
          totalSteps={TOTAL_STEPS}
          accentColor="#3B82F6"
        />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition
        presentation={slide({ direction: "from-right" })}
        timing={linearTiming({ durationInFrames: TRANSITION_DURATION })}
      />

      {/* Scene 10: Recruiter Jobs Management - 5s */}
      <TransitionSeries.Sequence durationInFrames={150}>
        <ScreenshotScene
          src="screenshots/08-recruiter-jobs.png"
          title="Quản lý công việc"
          description="Tạo job mới, upload JD → AI parse → Quản lý vòng đời: Draft → Published → Closed"
          step={9}
          totalSteps={TOTAL_STEPS}
          accentColor="#6366F1"
          callouts={[
            { text: "Upload JD tự động", x: 78, y: 42, delay: 25, direction: "left" },
            { text: "Publish / Close / Delete", x: 55, y: 50, delay: 45, direction: "left" },
          ]}
        />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition
        presentation={slide({ direction: "from-right" })}
        timing={linearTiming({ durationInFrames: TRANSITION_DURATION })}
      />

      {/* Scene 11: Applications Review - 5s */}
      <TransitionSeries.Sequence durationInFrames={150}>
        <ScreenshotScene
          src="screenshots/09-recruiter-applications.png"
          title="Xem xét ứng viên"
          description="AI phân tích chi tiết: Overall fit, Strengths, Hard Constraints — Recruiter update status ứng viên"
          step={10}
          totalSteps={TOTAL_STEPS}
          accentColor="#EC4899"
          zoomTarget={{ x: 55, y: 40, scale: 1.4, startFrame: 50 }}
          callouts={[
            { text: "12% — Weak fit", x: 42, y: 30, delay: 20, direction: "left" },
            { text: "AI phân tích chi tiết", x: 50, y: 45, delay: 35, direction: "right" },
            { text: "Hard Constraints Failed ⚠️", x: 55, y: 62, delay: 50, direction: "right" },
          ]}
        />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({ durationInFrames: TRANSITION_DURATION })}
      />

      {/* Scene 12: Outro - 3s */}
      <TransitionSeries.Sequence durationInFrames={90}>
        <OutroScene />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  );
};
