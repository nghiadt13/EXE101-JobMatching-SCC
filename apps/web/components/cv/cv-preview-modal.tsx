'use client';

import { useEffect, useCallback } from 'react';
import { X, Printer, Download, Phone, Mail, Globe, MapPin, Target, GraduationCap, Layers, Award, Cpu, Users, Check } from 'lucide-react';
import type { CvItem } from '@/lib/cv-client';
import { toast } from 'sonner';

type CvPreviewModalProps = {
  isOpen: boolean;
  onClose: () => void;
  cv: CvItem | null;
};

export function CvPreviewModal({ isOpen, onClose, cv }: CvPreviewModalProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (!isOpen) return;
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleKeyDown]);

  if (!isOpen || !cv) return null;

  // Extracted CV profile or mock fallbacks for premium rendering
  const profile = cv.candidateProfile;
  const hasProfileData = !!profile && (
    (profile.skills && profile.skills.length > 0) ||
    (profile.experience && profile.experience.length > 0) ||
    (profile.education && profile.education.length > 0)
  );

  const fullName = profile?.headline || 'Đàm Trọng Nghĩa';
  const roleName = profile?.headline ? 'Ứng viên tiềm năng' : 'Full-Stack Developer';
  const summary = profile?.summary || 
    'Là lập trình viên Full-Stack năng động và đầy đam mê, tôi khao khát ứng dụng kiến thức công nghệ hiện đại để xây dựng các giải pháp tối ưu cho doanh nghiệp. Mục tiêu ngắn hạn là hòa nhập nhanh và cống hiến giá trị, mục tiêu dài hạn là thăng tiến trở thành kỹ sư hệ thống / Solution Architect chuyên nghiệp.';

  const email = profile?.location ? 'candidate@example.com' : 'nghia.damtrong.it@gmail.com';
  const phone = '+84 947 274 xxx';
  const github = 'github.com/damtrongnghia';
  const location = profile?.location 
    ? `${profile.location.city || ''}, ${profile.location.country || ''}`.trim() || 'Hà Nội, Việt Nam'
    : 'Thanh Xuân, Hà Nội';

  // Skills
  const skills = profile?.skills && profile.skills.length > 0
    ? profile.skills
    : ['ReactJS', 'TailwindCSS', 'TypeScript', 'Spring Boot', 'NodeJS', 'PostgreSQL'];

  // Education list
  const educationList = profile?.education && profile.education.length > 0
    ? profile.education
    : [
        {
          school: 'Đại Học FPT',
          degree: 'Đại học',
          field: 'Chuyên ngành Kỹ thuật Phần mềm',
          startDate: '2021',
          endDate: 'Hiện tại',
          gpa: 'GPA: 3.2 / 4.0'
        }
      ];

  // Experience & Projects list
  const experienceList = profile?.experience && profile.experience.length > 0
    ? profile.experience
    : [];

  const projectsList = profile?.projects && profile.projects.length > 0
    ? profile.projects
    : [
        {
          name: 'Hệ Thống Đặt Chỗ Ngân Hàng Thông Minh',
          startDate: '11/2025',
          endDate: '03/2026',
          role: 'Lập trình viên chính (Full-Stack)',
          description: 'Xây dựng giải pháp đặt lịch hẹn trực tuyến đồng bộ trực tiếp với hệ thống phòng giao dịch nhằm giảm thời gian chờ đợi tại quầy của khách hàng.',
          highlights: [
            'Sử dụng Spring Boot cho backend, ReactJS làm UI/UX frontend',
            'Tích hợp cơ chế thông báo thời gian thực qua WebSockets',
            'Sử dụng Redis Cache giúp giảm thời gian truy vấn dữ liệu từ DB xuống 40%'
          ]
        }
      ];

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Xem trước CV"
    >
      {/* Backdrop */}
      <div
        className="backdrop-blur-sm animate-in fade-in duration-200"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(15, 23, 42, 0.7)',
        }}
        onClick={onClose}
      />

      {/* Modal Content */}
      <div 
        className="bg-white dark:bg-slate-900 rounded-2xl h-[90vh] flex flex-col border border-slate-200 dark:border-slate-800 shadow-2xl animate-in slide-in-from-bottom-5 duration-300 overflow-hidden glass"
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '896px', // 4xl standard width
          zIndex: 10000,
        }}
      >
        
        {/* Preview Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 glass bg-white/90 dark:bg-slate-900/90">
          <div className="space-y-0.5">
            <span className="text-[10px] text-brand-600 dark:text-brand-400 font-bold uppercase tracking-wider block">Chế độ xem trước thời gian thực</span>
            <h4 className="text-base font-extrabold text-slate-800 dark:text-slate-100 truncate max-w-[300px] sm:max-w-md">
              {cv.fileName || 'CV Preview'}
            </h4>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="p-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300 transition-all cursor-pointer bg-transparent"
              title="In trực tiếp"
            >
              <Printer className="w-4.5 h-4.5" />
            </button>
            <button
              onClick={() => toast.info('Đang tải CV xuống máy...')}
              className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs rounded-lg transition-all shadow flex items-center gap-1 cursor-pointer border-0"
            >
              <Download className="w-3.5 h-3.5" /> Tải PDF
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-all cursor-pointer border-0 bg-transparent"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Preview Body (Scrollable CV Content) */}
        <div className="flex-grow overflow-y-auto p-8 bg-slate-100 dark:bg-slate-950 flex justify-center w-full">
          
          {/* CV Document Paper Container */}
          <div className="bg-white text-slate-900 w-full max-w-[210mm] shadow-lg border border-slate-200 p-8 sm:p-12 rounded-xl text-left font-sans text-xs relative select-text leading-relaxed h-fit">
            
            {/* CV Header */}
            <div className="border-b-2 border-slate-800 pb-5 text-center sm:text-left flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
              <div>
                <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 uppercase leading-none">{fullName}</h1>
                <p className="text-sm font-bold text-brand-600 mt-2">{roleName}</p>
              </div>
              <div className="text-slate-500 space-y-1 text-right text-[11px] font-medium min-w-fit">
                <p className="flex items-center sm:justify-end gap-1"><Phone className="w-3 h-3 text-slate-400 shrink-0" /> {phone}</p>
                <p className="flex items-center sm:justify-end gap-1"><Mail className="w-3 h-3 text-slate-400 shrink-0" /> {email}</p>
                <p className="flex items-center sm:justify-end gap-1"><Globe className="w-3 h-3 text-slate-400 shrink-0" /> {github}</p>
                <p className="flex items-center sm:justify-end gap-1"><MapPin className="w-3 h-3 text-slate-400 shrink-0" /> {location}</p>
              </div>
            </div>

            {/* CV Content Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-6">
              
              {/* Left Grid Column (2/3 width) */}
              <div className="md:col-span-2 space-y-6">
                
                {/* Objective */}
                <section className="space-y-2">
                  <h2 className="text-xs font-bold text-slate-900 uppercase tracking-widest border-b border-slate-200 pb-1 flex items-center gap-1.5">
                    <Target className="w-4 h-4 text-brand-500 shrink-0" /> Mục tiêu nghề nghiệp
                  </h2>
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    {summary}
                  </p>
                </section>

                {/* Education */}
                <section className="space-y-3">
                  <h2 className="text-xs font-bold text-slate-900 uppercase tracking-widest border-b border-slate-200 pb-1 flex items-center gap-1.5">
                    <GraduationCap className="w-4 h-4 text-brand-500 shrink-0" /> Học vấn
                  </h2>
                  <div className="space-y-4">
                    {educationList.map((edu, idx) => (
                      <div key={idx} className="relative pl-4 border-l-2 border-brand-500/30 space-y-1">
                        <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-brand-500" />
                        <div className="flex justify-between items-start text-[11px]">
                          <h3 className="font-bold text-slate-800">{edu.school || edu.degree}</h3>
                          <span className="text-slate-400">{edu.startDate} - {edu.endDate}</span>
                        </div>
                        <p className="text-slate-500 font-medium">{edu.field || edu.degree}</p>
                        {('gpa' in edu) && <p className="text-slate-400 text-[10px]">{edu.gpa as string}</p>}
                      </div>
                    ))}
                  </div>
                </section>

                {/* Experience (if exists) */}
                {experienceList.length > 0 && (
                  <section className="space-y-3">
                    <h2 className="text-xs font-bold text-slate-900 uppercase tracking-widest border-b border-slate-200 pb-1 flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-brand-500 shrink-0" /> Kinh nghiệm làm việc
                    </h2>
                    <div className="space-y-4">
                      {experienceList.map((exp, idx) => (
                        <div key={idx} className="relative pl-4 border-l-2 border-brand-500/30 space-y-1">
                          <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-brand-500" />
                          <div className="flex justify-between items-start text-[11px]">
                            <h3 className="font-bold text-slate-800">{exp.company}</h3>
                            <span className="text-slate-400">{exp.startDate} - {exp.endDate}</span>
                          </div>
                          <p className="text-slate-500 font-medium">{exp.role}</p>
                          {exp.tech && exp.tech.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {exp.tech.map((t) => (
                                <span key={t} className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[9px] font-semibold">{t}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Products/Projects */}
                <section className="space-y-4">
                  <h2 className="text-xs font-bold text-slate-900 uppercase tracking-widest border-b border-slate-200 pb-1 flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-brand-500 shrink-0" /> Dự án nổi bật
                  </h2>
                  
                  <div className="space-y-4">
                    {projectsList.map((proj, idx) => (
                      <div key={idx} className="space-y-2">
                        <div className="flex justify-between items-start text-[11px]">
                          <h3 className="font-bold text-slate-800">{proj.name}</h3>
                          {('startDate' in proj) && (
                            <span className="text-slate-400 text-[10px]">
                              {proj.startDate} - {proj.endDate}
                            </span>
                          )}
                        </div>
                        {('role' in proj) && proj.role && (
                          <p className="text-slate-500 font-semibold text-[10px]">{proj.role}</p>
                        )}
                        <p className="text-slate-600 text-[11px] leading-relaxed">
                          {proj.description}
                        </p>
                        {('highlights' in proj) && proj.highlights ? (
                          <ul className="list-disc list-inside text-slate-500 text-[10px] pl-2 space-y-0.5">
                            {proj.highlights.map((h: string, i: number) => (
                              <li key={i}>{h}</li>
                            ))}
                          </ul>
                        ) : (
                          ('tech' in proj) && proj.tech && proj.tech.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {proj.tech.map((t) => (
                                <span key={t} className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[9px] font-semibold">{t}</span>
                              ))}
                            </div>
                          )
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              </div>

              {/* Right Grid Column (1/3 width) */}
              <div className="space-y-6">
                
                {/* Certifications */}
                <section className="space-y-2">
                  <h2 className="text-xs font-bold text-slate-900 uppercase tracking-widest border-b border-slate-200 pb-1 flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-brand-500 shrink-0" /> Chứng chỉ
                  </h2>
                  <div className="space-y-1.5 text-[11px]">
                    <div>
                      <p className="font-bold text-slate-800">IELTS Academic 7.5</p>
                      <p className="text-slate-400 text-[10px]">2025</p>
                    </div>
                    <div>
                      <p className="font-bold text-slate-800">AWS Certified Cloud Practitioner</p>
                      <p className="text-slate-400 text-[10px]">2025</p>
                    </div>
                  </div>
                </section>

                {/* Skills */}
                <section className="space-y-3">
                  <h2 className="text-xs font-bold text-slate-900 uppercase tracking-widest border-b border-slate-200 pb-1 flex items-center gap-1.5">
                    <Cpu className="w-4 h-4 text-brand-500 shrink-0" /> Kỹ năng
                  </h2>
                  <div className="space-y-2">
                    <div>
                      <span className="font-semibold text-slate-700 block mb-1">Công nghệ chính</span>
                      <div className="flex flex-wrap gap-1">
                        {skills.map((skill) => (
                          <span key={skill} className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-medium">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </section>

                {/* Soft Skills */}
                <section className="space-y-2">
                  <h2 className="text-xs font-bold text-slate-900 uppercase tracking-widest border-b border-slate-200 pb-1 flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-brand-500 shrink-0" /> Kỹ năng mềm
                  </h2>
                  <ul className="text-slate-600 text-[10px] space-y-1 pl-1">
                    <li className="flex items-center gap-1"><Check className="w-3 h-3 text-brand-500 shrink-0" /> Tư duy giải quyết vấn đề</li>
                    <li className="flex items-center gap-1"><Check className="w-3 h-3 text-brand-500 shrink-0" /> Thuyết trình và đàm phán</li>
                    <li className="flex items-center gap-1"><Check className="w-3 h-3 text-brand-500 shrink-0" /> Giao tiếp tiếng Anh lưu loát</li>
                  </ul>
                </section>
              </div>

            </div>

            {/* CV Watermark / Footer */}
            <div className="border-t border-slate-100 mt-8 pt-4 text-center text-[9px] text-slate-400">
              Hồ sơ được xác thực bảo mật bởi hệ thống topcv.pro
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
