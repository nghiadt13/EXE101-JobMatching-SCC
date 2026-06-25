'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { verifyPayment } from '@/lib/payment-client';
import { CheckCircle, ShieldCheck, ArrowRight, Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

function PaymentSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderCode = searchParams.get('orderCode');
  const simulated = searchParams.get('simulated') === 'true';

  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const confirmPayment = async () => {
      if (!orderCode) {
        toast.error('Thiếu mã giao dịch thanh toán!');
        setLoading(false);
        return;
      }

      try {
        const sessionRes = await fetch('/api/auth/session');
        if (!sessionRes.ok) {
          toast.error('Vui lòng đăng nhập lại để cập nhật gói!');
          router.push('/login');
          return;
        }

        const session = await sessionRes.json();
        const token = session?.accessToken;

        if (!token) {
          toast.error('Token xác thực không hợp lệ. Vui lòng đăng nhập lại!');
          router.push('/login');
          return;
        }

        const res = await verifyPayment(token, parseInt(orderCode, 10), simulated);
        
        if (res.success) {
          setSuccess(true);
          toast.success('Nâng cấp tài khoản lên Pro Plan thành công!');
        } else {
          toast.error(res.message || 'Xác thực thanh toán thất bại.');
        }
      } catch (error: any) {
        console.error('Verify payment error:', error);
        toast.error(error.message || 'Lỗi xác thực giao dịch.');
      } finally {
        setLoading(false);
      }
    };

    confirmPayment();
  }, [orderCode, simulated, router]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-md w-full bg-white shadow-xl rounded-3xl p-8 border border-slate-100 text-center relative overflow-hidden">
        
        {/* Decorative background gradients */}
        <div className="absolute -top-24 -left-24 h-48 w-48 bg-indigo-100 rounded-full blur-3xl opacity-60" />
        <div className="absolute -bottom-24 -right-24 h-48 w-48 bg-emerald-100 rounded-full blur-3xl opacity-60" />

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center">
            <Loader2 className="h-14 w-14 text-indigo-600 animate-spin" />
            <h2 className="mt-6 text-xl font-bold text-slate-800">Đang xác thực thanh toán</h2>
            <p className="mt-2 text-slate-400 text-sm">Vui lòng chờ trong giây lát, hệ thống đang đồng bộ gói...</p>
          </div>
        ) : success ? (
          <div className="py-6 flex flex-col items-center">
            <div className="h-20 w-20 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 animate-bounce">
              <CheckCircle className="h-12 w-12" />
            </div>

            <h2 className="mt-6 text-2xl font-black text-slate-900 tracking-tight">Thanh toán thành công!</h2>
            <p className="mt-3 text-slate-500 text-sm leading-relaxed px-4">
              Tài khoản của bạn đã được nâng cấp lên <span className="font-extrabold text-indigo-600">Pro Plan</span>. Chúc bạn có những trải nghiệm tuyệt vời cùng SCC!
            </p>

            <div className="mt-8 bg-indigo-50/50 border border-indigo-100/50 rounded-2xl p-4 w-full text-left text-xs space-y-2">
              <div className="flex justify-between items-center text-slate-500">
                <span>Dịch vụ</span>
                <span className="font-bold text-slate-800">Gói Pro Thành Viên</span>
              </div>
              <div className="flex justify-between items-center text-slate-500">
                <span>Mã đơn hàng</span>
                <span className="font-mono font-bold text-slate-800">#{orderCode}</span>
              </div>
              <div className="flex justify-between items-center text-slate-500">
                <span>Trạng thái</span>
                <span className="font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full text-[9px] uppercase tracking-wider">Hoàn tất</span>
              </div>
            </div>

            <button
              onClick={() => {
                // Refresh window so that SiteHeader updates its session immediately
                window.location.href = '/pricing';
              }}
              className="mt-8 w-full py-3.5 px-6 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-bold transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 group"
            >
              Xem trạng thái gói mới <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        ) : (
          <div className="py-6 flex flex-col items-center">
            <div className="h-20 w-20 bg-rose-100 rounded-full flex items-center justify-center text-rose-600">
              <ShieldCheck className="h-12 w-12 text-rose-500" />
            </div>

            <h2 className="mt-6 text-2xl font-black text-slate-900 tracking-tight">Xác thực thất bại</h2>
            <p className="mt-3 text-slate-500 text-sm leading-relaxed px-4">
              Không thể xác thực giao dịch thanh toán hoặc giao dịch này chưa được hoàn thành chuyển khoản.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-3 w-full">
              <button
                onClick={() => router.push('/pricing')}
                className="flex-1 py-3.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all"
              >
                Quay lại
              </button>
              <button
                onClick={() => window.location.reload()}
                className="py-3.5 px-6 border border-slate-200 hover:border-slate-300 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50 transition-all"
              >
                Thử lại
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-10 w-10 text-indigo-600 animate-spin mx-auto" />
          <p className="mt-4 text-sm text-slate-500">Đang đồng bộ giao dịch...</p>
        </div>
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  );
}
