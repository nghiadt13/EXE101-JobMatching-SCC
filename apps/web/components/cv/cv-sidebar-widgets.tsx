'use client';

import { useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Camera, CheckCircle2, ShieldCheck, Info, Eye, FileCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

type CvSidebarWidgetsProps = {
  userName: string;
  hasCvs: boolean;
  onConfigureDefaultClick?: () => void;
};

export function CvSidebarWidgets({ userName, hasCvs, onConfigureDefaultClick }: CvSidebarWidgetsProps) {
  const [isSeekingJobs, setIsSeekingJobs] = useState(false);

  function handleToggleJobSeeking() {
    const nextState = !isSeekingJobs;
    setIsSeekingJobs(nextState);
    if (nextState) {
      toast.success('Đã bật chế độ Tìm việc! Nhà tuyển dụng có thể liên hệ với bạn.');
    } else {
      toast.warning('Đã tắt chế độ Tìm việc.');
    }
  }

  function handleConfigurePublicCV() {
    if (onConfigureDefaultClick) {
      onConfigureDefaultClick();
    } else if (!hasCvs) {
      toast.warning('Vui lòng tạo một CV trước khi thiết lập CV chính thức!');
    } else {
      toast.info('Vui lòng chọn một CV từ danh sách bên dưới và đặt làm CV chính thức!');
    }
  }

  const memberSince = new Date().toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' });

  return (
    <div className="col-span-1 flex flex-col gap-8">
      {/* Profile Mini Widget */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/85 dark:border-slate-800/80 p-6 shadow-sm relative overflow-hidden transition-all duration-200">
        <div className="absolute top-0 right-0 transform translate-x-4 -translate-y-4 w-24 h-24 bg-brand-500/5 rounded-full blur-xl pointer-events-none" />

        <div className="flex items-start justify-between gap-4">
          <div className="flex gap-4">
            {/* Avatar */}
            <div className="relative w-16 h-16 shrink-0 rounded-2xl overflow-hidden ring-4 ring-slate-100 dark:ring-slate-800/80">
              <div className="flex h-full w-full items-center justify-center rounded-2xl bg-brand-100 dark:bg-brand-900/40 text-brand-600 dark:text-brand-400 font-bold text-xl uppercase">
                {userName.charAt(0)}
              </div>
              <button
                type="button"
                onClick={() => toast.info('Tính năng đổi ảnh đại diện đang được phát triển.')}
                className="absolute bottom-0 right-0 inset-x-0 bg-black/60 hover:bg-black/80 text-white text-[9px] py-0.5 text-center transition-all flex items-center justify-center gap-0.5 cursor-pointer"
              >
                <Camera className="w-2.5 h-2.5" /> Đổi ảnh
              </button>
            </div>

            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <h4 className="font-bold text-slate-800 dark:text-slate-100 text-base">{userName}</h4>
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-400">
                  <CheckCircle2 className="w-2.5 h-2.5 fill-current" /> ĐÃ XÁC THỰC
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">Thành viên từ {memberSince}</p>
              <button
                type="button"
                onClick={() => toast.success('Đang chuyển hướng đến cổng thanh toán TopCV Pro...')}
                className="mt-2 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-brand-500" /> Nâng cấp tài khoản PRO
              </button>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-slate-100 dark:bg-slate-800 my-5" />

        {/* Job seeking Switch Toggle */}
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-950/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800/80">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Trạng thái tìm việc</span>
              <p
                className={`text-sm font-bold transition-colors ${
                  isSeekingJobs
                    ? 'text-brand-600 dark:text-brand-400'
                    : 'text-slate-400 dark:text-slate-500'
                }`}
              >
                {isSeekingJobs ? 'Đang Bật tìm việc' : 'Đang Tắt tìm việc'}
              </p>
            </div>

            {/* Custom Toggle Switch */}
            <button
              type="button"
              onClick={handleToggleJobSeeking}
              className={`w-12 h-6.5 rounded-full p-0.5 transition-all duration-300 focus:outline-none relative cursor-pointer ${
                isSeekingJobs ? 'bg-brand-500' : 'bg-slate-300 dark:bg-slate-700'
              }`}
            >
              <div
                className={`w-5.5 h-5.5 rounded-full bg-white shadow-md transition-transform duration-300 flex items-center justify-center ${
                  isSeekingJobs ? 'translate-x-[22px]' : 'translate-x-0'
                }`}
              >
                <div
                  className={`w-1.5 h-1.5 rounded-full transition-colors ${
                    isSeekingJobs ? 'bg-brand-600' : 'bg-slate-300 dark:bg-slate-500'
                  }`}
                />
              </div>
            </button>
          </div>

          {/* Guide Message */}
          <div
            className={`space-y-3 text-xs leading-relaxed p-3.5 rounded-xl border transition-all duration-300 ${
              isSeekingJobs
                ? 'bg-blue-50/50 dark:bg-blue-950/10 border-blue-100/50 dark:border-blue-950/30 text-blue-800 dark:text-blue-400'
                : 'bg-amber-50/50 dark:bg-amber-950/10 border-amber-100/50 dark:border-amber-950/30 text-slate-500 dark:text-slate-400'
            }`}
          >
            <div className="flex gap-2">
              {isSeekingJobs ? (
                <>
                  <CheckCircle2 className="w-4.5 h-4.5 text-brand-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Trạng thái tìm việc của bạn đang Bật!</p>
                    <p className="text-[11px] mt-1 leading-relaxed opacity-90">
                      Hồ sơ đã hiển thị ưu tiên. Các nhà tuyển dụng (NTD) có thể tìm thấy, trực tiếp xem và gửi tin nhắn mời phỏng vấn đến bạn.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <p>
                    Khi bật trạng thái tìm việc, hồ sơ của bạn sẽ hiển thị ở vị trí ưu tiên trong danh mục ứng viên tiềm năng để hàng nghìn nhà tuyển dụng tiếp cận.
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Recruiter Search Setup Widget */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/85 dark:border-slate-800/80 p-6 shadow-sm space-y-4 transition-all duration-200">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <Eye className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100">Cho phép nhà tuyển dụng tìm kiếm</h4>
            <p className="text-[11px] text-slate-400">Cấu hình hồ sơ công khai</p>
          </div>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          Bạn chưa liên kết CV chính thức nào để hiển thị tìm kiếm công khai. Hãy chọn một mẫu CV chuẩn hóa để bật tính năng tự động khớp nối thông minh.
        </p>

        <button
          type="button"
          onClick={handleConfigurePublicCV}
          className="w-full py-2.5 border border-dashed border-slate-300 hover:border-brand-500 dark:border-slate-800 dark:hover:border-brand-400 text-slate-600 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 bg-slate-50/50 dark:bg-slate-950/20 cursor-pointer"
        >
          <FileCheck className="w-4 h-4" /> Cấu hình CV chính thức ngay
        </button>
      </div>

      {/* App Mobile Promotion Widget */}
      <div className="bg-slate-900 dark:bg-slate-950 text-white rounded-2xl p-6 shadow-xl relative overflow-hidden group border border-slate-800">
        <div className="absolute inset-0 bg-gradient-to-tr from-blue-950/80 to-slate-950 opacity-90" />

        <div className="relative z-10 space-y-4">
          <div className="flex items-center justify-between">
            <div className="px-2.5 py-1 rounded bg-brand-500/20 text-brand-400 text-[10px] font-bold tracking-wider uppercase">Ứng dụng di động</div>
            <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
          </div>

          <div className="space-y-1">
            <h4 className="font-extrabold text-base tracking-tight text-white group-hover:text-brand-400 transition-colors">Tải ứng dụng TopCV</h4>
            <p className="text-xs text-slate-400">Không bao giờ bỏ lỡ thông báo cơ hội vàng từ các doanh nghiệp lớn.</p>
          </div>

          {/* QR Code */}
          <div className="flex items-center gap-4 bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
            <div className="w-16 h-16 bg-white p-1 rounded-lg shrink-0">
              <svg viewBox="0 0 100 100" className="w-full h-full text-slate-900">
                <rect x="0" y="0" width="25" height="25" />
                <rect x="5" y="5" width="15" height="15" fill="white" />
                <rect x="8" y="8" width="9" height="9" />

                <rect x="75" y="0" width="25" height="25" />
                <rect x="80" y="5" width="15" height="15" fill="white" />
                <rect x="83" y="8" width="9" height="9" />

                <rect x="0" y="75" width="25" height="25" />
                <rect x="5" y="80" width="15" height="15" fill="white" />
                <rect x="8" y="83" width="9" height="9" />

                <rect x="35" y="10" width="10" height="10" />
                <rect x="50" y="5" width="15" height="10" />
                <rect x="35" y="35" width="20" height="15" />
                <rect x="65" y="30" width="10" height="25" />
                <rect x="10" y="45" width="15" height="10" />
                <rect x="40" y="65" width="25" height="20" />
                <rect x="75" y="75" width="15" height="15" />
                <rect x="90" y="90" width="10" height="10" />
              </svg>
            </div>
            <div className="space-y-1 text-slate-300 text-xs">
              <p className="font-bold flex items-center gap-1">Quét mã QR</p>
              <p className="text-[10px] text-slate-400 leading-normal">Dùng camera của điện thoại quét mã QR để bắt đầu cài đặt.</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={() => toast.success('Đang mở App Store...')}
              className="flex items-center justify-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer text-slate-200"
            >
              iOS App
            </button>
            <button
              type="button"
              onClick={() => toast.success('Đang mở Google Play Store...')}
              className="flex items-center justify-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer text-slate-200"
            >
              Android App
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
