'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CreditCard, Shield, QrCode, AlertCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

function SimulatePaymentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderCode = searchParams.get('orderCode') || '';
  const amountStr = searchParams.get('amount') || '199000';
  const amount = parseInt(amountStr, 10);

  const [timeLeft, setTimeLeft] = useState(900); // 15 minutes
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (timeLeft <= 0) {
      toast.error('Giao dịch thanh toán đã hết hạn!');
      router.push('/pricing');
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, router]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSimulateSuccess = () => {
    setIsProcessing(true);
    toast.success('Xác nhận thanh toán giả lập thành công!');
    setTimeout(() => {
      router.push(`/pricing/success?orderCode=${orderCode}&simulated=true`);
    }, 1500);
  };

  const handleCancel = () => {
    toast.error('Giao dịch thanh toán đã bị hủy!');
    router.push('/pricing');
  };

  const qrDataUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=247-vietinbank-970415-PRO${orderCode}`;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-between py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl mx-auto w-full bg-white shadow-xl rounded-3xl overflow-hidden border border-slate-200 flex flex-col md:flex-row">
        
        {/* Left Side: Payment Details */}
        <div className="flex-1 p-8 border-b md:border-b-0 md:border-r border-slate-200">
          <div className="flex items-center gap-3 pb-6 border-b border-slate-100">
            <div className="h-10 w-24 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-black tracking-wider text-sm shadow-md">
              payOS
            </div>
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100 flex items-center gap-1.5 animate-pulse">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Môi trường thử nghiệm
            </span>
          </div>

          <div className="mt-6 space-y-5">
            <div>
              <span className="text-xs font-medium text-slate-400">Số tiền cần thanh toán</span>
              <div className="text-3xl font-black text-slate-900 mt-1">
                {amount.toLocaleString('vi-VN')} <span className="text-lg font-bold text-slate-400">VND</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-50 text-sm">
              <div>
                <span className="text-xs text-slate-400">Mã đơn hàng</span>
                <p className="font-extrabold text-slate-800 mt-0.5">#{orderCode || 'N/A'}</p>
              </div>
              <div>
                <span className="text-xs text-slate-400">Nội dung chuyển khoản</span>
                <p className="font-extrabold text-slate-800 mt-0.5">PRO{orderCode}</p>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 space-y-4">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <CreditCard className="h-4.5 w-4.5 text-indigo-500" />
                Thông tin tài khoản thụ hưởng (Giả lập)
              </h3>
              
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 text-sm space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-500">Ngân hàng</span>
                  <span className="font-bold text-slate-800">VietinBank (Công thương Việt Nam)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Tên tài khoản</span>
                  <span className="font-bold text-slate-800">SCC RECRUITMENT SERVICES</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Số tài khoản</span>
                  <span className="font-bold text-slate-800 select-all">102872659918</span>
                </div>
              </div>
            </div>

            <div className="pt-6 flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleSimulateSuccess}
                disabled={isProcessing}
                className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Đang xử lý...
                  </>
                ) : (
                  'Xác nhận đã chuyển khoản'
                )}
              </button>
              <button
                onClick={handleCancel}
                disabled={isProcessing}
                className="py-3 px-6 border border-slate-200 hover:border-slate-300 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-all"
              >
                Hủy giao dịch
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: QR Code Display */}
        <div className="flex-1 bg-indigo-950 p-8 flex flex-col items-center justify-center text-white relative">
          <div className="absolute top-4 right-4 bg-indigo-900/60 px-3 py-1 rounded-full text-xs font-mono font-bold tracking-wider flex items-center gap-1.5 border border-indigo-800">
            Hết hạn sau: {formatTime(timeLeft)}
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-2xl flex flex-col items-center justify-center">
            {/* QR Frame/Holder */}
            <div className="relative border-4 border-indigo-600 p-2.5 rounded-2xl">
              <img
                src={qrDataUrl}
                alt="Payment QR Code"
                className="h-56 w-56 object-contain"
              />
            </div>
            
            <p className="mt-4 text-[10px] font-bold text-slate-400 tracking-widest uppercase flex items-center gap-1.5">
              <QrCode className="h-3.5 w-3.5 text-indigo-600" /> Quét mã để thanh toán
            </p>
          </div>

          <div className="mt-8 text-center max-w-xs">
            <p className="text-xs text-indigo-200 leading-relaxed">
              Sử dụng ứng dụng ngân hàng di động bất kỳ (VietQR) quét mã QR để thực hiện chuyển khoản.
            </p>
            <div className="mt-4 flex items-center justify-center gap-1.5 text-[10px] text-indigo-300 bg-indigo-900/30 px-3 py-1.5 rounded-xl border border-indigo-900">
              <Shield className="h-3.5 w-3.5 text-emerald-400" />
              Giao dịch giả lập an toàn và bảo mật
            </div>
          </div>
        </div>

      </div>

      {/* Footer warning */}
      <div className="max-w-md mx-auto text-center mt-6 text-slate-400 text-xs flex items-center justify-center gap-1.5 bg-slate-200/50 py-2.5 px-4 rounded-xl border border-slate-300/30">
        <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />
        Đây là giao diện thử nghiệm thanh toán giả lập tích hợp hệ thống PayOS của dự án SCC.
      </div>
    </div>
  );
}

export default function SimulatePaymentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-10 w-10 text-indigo-600 animate-spin mx-auto" />
          <p className="mt-4 text-sm text-slate-500">Đang tải thông tin thanh toán...</p>
        </div>
      </div>
    }>
      <SimulatePaymentContent />
    </Suspense>
  );
}
