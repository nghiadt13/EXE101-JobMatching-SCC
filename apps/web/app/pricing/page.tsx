'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SiteHeader } from '@/components/layout/site-header';
import { createPaymentLink } from '@/lib/payment-client';
import { toast } from 'sonner';
import {
  Gem,
  Check,
  Minus,
  Plus,
  Ticket,
  HelpCircle,
  ShieldCheck,
  Zap,
  X,
  Copy,
  Loader2,
} from 'lucide-react';

type UserSession = {
  user?: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string | null;
    planName?: string | null;
  };
  accessToken?: string;
};

export default function PricingPage() {
  const router = useRouter();
  const [session, setSession] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [planCycle, setPlanCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [buySessionCount, setBuySessionCount] = useState(5);
  const [redeemCode, setRedeemCode] = useState('');
  const [currentPlan, setCurrentPlan] = useState('Free Plan');
  const [userProfile, setUserProfile] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Bank Info configuration for SePay (configurable via environment variables)
  const bankId = process.env.NEXT_PUBLIC_SEPAY_BANK_ID || 'VPBank';
  const accountNumber =
    process.env.NEXT_PUBLIC_SEPAY_ACCOUNT_NUMBER || '0989095212';
  const accountName =
    process.env.NEXT_PUBLIC_SEPAY_ACCOUNT_NAME || 'DANG PHUONG NAM';

  useEffect(() => {
    const fetchSessionAndProfile = async () => {
      try {
        const sessionRes = await fetch('/api/auth/session');
        if (sessionRes.ok) {
          const sessionData = (await sessionRes.json()) as UserSession;
          setSession(sessionData);

          if (sessionData?.accessToken) {
            // Get detailed profile (to get latest planName)
            const profileRes = await fetch(
              `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api'}/profile`,
              {
                headers: {
                  Authorization: `Bearer ${sessionData.accessToken}`,
                },
              },
            );
            if (profileRes.ok) {
              const profile = await profileRes.json();
              setUserProfile(profile);
              setCurrentPlan(profile.planName || 'Free Plan');
            } else {
              setCurrentPlan(sessionData.user?.planName || 'Free Plan');
            }
            
            // Fetch transactions
            const txRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api'}/payment/history`, {
              headers: { Authorization: `Bearer ${sessionData.accessToken}` }
            });
            if (txRes.ok) {
              setTransactions(await txRes.json());
            }
          }
        }
      } catch (error) {
        console.error('Error fetching session:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSessionAndProfile();
  }, []);

  const fetchTransactionsOnly = async (accessToken: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api'}/payment/history`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) setTransactions(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  // Polling to check if payment went through (planName updated to Pro Plan)
  useEffect(() => {
    if (!showPaymentModal || currentPlan === 'Pro Plan') return;

    const interval = setInterval(async () => {
      try {
        const sessionRes = await fetch('/api/auth/session');
        if (sessionRes.ok) {
          const sessionData = (await sessionRes.json()) as UserSession;
          if (sessionData?.accessToken) {
            const profileRes = await fetch(
              `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api'}/profile`,
              {
                headers: {
                  Authorization: `Bearer ${sessionData.accessToken}`,
                },
              },
            );
            if (profileRes.ok) {
              const profile = await profileRes.json();
              if (profile.planName === 'Pro Plan') {
                setCurrentPlan('Pro Plan');
                setUserProfile(profile);
                toast.success(
                  'Thanh toán thành công! Tài khoản của bạn đã được nâng cấp lên gói Pro.',
                );
                setShowPaymentModal(false);
                fetchTransactionsOnly(sessionData.accessToken);
                clearInterval(interval);
              }
            }
          }
        }
      } catch (error) {
        console.error('Error checking payment status:', error);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [showPaymentModal, currentPlan, session]);

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    toast.success(`Đã sao chép ${fieldName}`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleUpgradePro = async () => {
    if (!session?.accessToken) {
      toast.error('Vui lòng đăng nhập để nâng cấp gói!');
      router.push('/login?callbackUrl=/pricing');
      return;
    }
    setPaymentLoading(true);
    try {
      const amount = planCycle === 'monthly' ? 49000 : 490000;
      const planName = planCycle === 'monthly' ? 'PRO · Theo tháng' : 'PRO · Theo năm';
      await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api'}/payment/intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify({ amount, planName }),
      });
      await fetchTransactionsOnly(session.accessToken);
      setShowPaymentModal(true);
    } catch (error) {
      toast.error('Lỗi khi khởi tạo thanh toán');
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleBuySessions = async () => {
    if (!session?.accessToken) {
      toast.error('Vui lòng đăng nhập để thực hiện giao dịch!');
      router.push('/login?callbackUrl=/pricing');
      return;
    }

    setPaymentLoading(true);
    try {
      const pricePerSession = isPro ? 8000 : 10000;
      const totalPrice = buySessionCount * pricePerSession;

      const res = await createPaymentLink(session.accessToken, totalPrice);
      toast.success('Đang tạo đơn thanh toán...');
      if (res.checkoutUrl) {
        window.location.href = res.checkoutUrl;
      }
    } catch (error: any) {
      toast.error(
        error.message || 'Lỗi khởi tạo thanh toán. Vui lòng thử lại.',
      );
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleApplyRedeem = () => {
    if (!redeemCode.trim()) {
      toast.error('Vui lòng nhập mã redeem code!');
      return;
    }
    toast.error('Mã redeem code không hợp lệ hoặc đã hết hạn!');
  };

  const getExpiryDate = () => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')} ${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
  };

  const isPro = currentPlan === 'Pro Plan';
  const pricePerSession = isPro ? 8000 : 10000;
  const buySessionTotal = buySessionCount * pricePerSession;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-16">
      <SiteHeader
        isAuthenticated={Boolean(session?.accessToken)}
        role={session?.user?.role || undefined}
        user={
          session?.user
            ? {
                name: session.user.name,
                email: session.user.email,
                avatarUrl: session.user.image,
                planName: currentPlan,
              }
            : null
        }
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2.5">
              Nâng cấp gói{' '}
              <Gem className="h-7 w-7 text-amber-500 animate-pulse" />
            </h1>
            <p className="mt-2 text-slate-500 text-sm md:text-base">
              Mở khóa sức mạnh AI Matching và nhận thông báo việc làm tức thời.
            </p>
          </div>
        </div>

        {/* Current Plan Card */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm mb-10 transition-all hover:shadow-md">
          <div className="flex items-center gap-2 mb-6">
            <div className="p-2 bg-primary-50 rounded-lg text-primary-600">
              <ShieldCheck className="h-5 w-5 text-indigo-600" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">
              Trạng thái hiện tại
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center md:text-left">
            <div className="flex flex-col items-center md:items-start justify-center">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Gói hiện tại
              </span>
              <div className="mt-2 flex flex-wrap items-center justify-center md:justify-start gap-2">
                <span
                  className={`px-3.5 py-1 rounded-full text-xs font-bold shadow-sm ${
                    isPro
                      ? 'bg-amber-100 text-amber-800 border border-amber-200'
                      : 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                  }`}
                >
                  {isPro ? 'Gói Pro' : 'Gói Free'}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500 text-white animate-pulse">
                  Đang hoạt động
                </span>
              </div>
            </div>

            <div className="border-l border-slate-100 pl-0 md:pl-6 flex flex-col items-center md:items-start justify-center">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                AI Matching
              </span>
              <span className="mt-2 text-xl font-extrabold text-slate-800">
                {isPro ? 'Vô hạn' : '10'}{' '}
                <span className="text-xs font-normal text-slate-400">
                  {!isPro && 'lượt/ngày'}
                </span>
              </span>
            </div>

            <div className="border-l border-slate-100 pl-0 md:pl-6 flex flex-col items-center md:items-start justify-center">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Chu kỳ
              </span>
              <span className="mt-2 text-sm font-bold text-slate-800">
                {isPro ? 'Theo tháng' : 'Không có'}
              </span>
            </div>

            <div className="border-l border-slate-100 pl-0 md:pl-6 flex flex-col items-center md:items-start justify-center">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Hết hạn
              </span>
              <span className="mt-2 text-sm font-semibold text-slate-600">
                {isPro ? getExpiryDate() : 'Vĩnh viễn'}
              </span>
            </div>
          </div>
        </div>

        {/* Pricing Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Comparison Table / Left Side */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-slate-100 gap-4">
              <h2 className="text-xl font-bold text-slate-900">
                Chọn gói nâng cấp
              </h2>
              <div className="inline-flex bg-slate-100 p-1 rounded-xl">
                <button
                  onClick={() => setPlanCycle('monthly')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    planCycle === 'monthly'
                      ? 'bg-white text-slate-800 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Theo tháng
                </button>
                <button
                  onClick={() => setPlanCycle('yearly')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    planCycle === 'yearly'
                      ? 'bg-white text-slate-800 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Theo năm
                </button>
              </div>
            </div>

            {/* Matrix comparison table */}
            <div className="overflow-x-auto mt-6">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="py-4 text-xs font-bold text-slate-400 uppercase tracking-wider w-1/3">
                      Tính năng
                    </th>
                    <th className="py-4 text-center w-1/3">
                      <div className="text-base font-bold text-slate-800">
                        Basic
                      </div>
                      {isPro ? (
                        <span className="mt-2 inline-flex text-xs font-semibold text-slate-400 uppercase tracking-wider">
                          Gói miễn phí
                        </span>
                      ) : (
                        <span className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-emerald-600 uppercase tracking-wider bg-emerald-50 px-2.5 py-1 rounded-lg">
                          <Check className="h-3.5 w-3.5" /> Đang dùng
                        </span>
                      )}
                    </th>
                    <th className="py-4 text-center bg-indigo-50/40 rounded-t-xl w-1/3 relative">
                      <span className="absolute top-2 right-2 px-2 py-0.5 bg-emerald-500 text-[8px] font-black text-white rounded-full tracking-wider uppercase">
                        Khuyên dùng
                      </span>
                      <div className="text-base font-bold text-slate-800 flex items-center justify-center gap-1">
                        Pro <Zap className="h-4 w-4 text-amber-500 fill-amber-500" />
                      </div>
                      {isPro ? (
                        <span className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-emerald-600 uppercase tracking-wider bg-emerald-50 px-2.5 py-1 rounded-lg">
                          <Check className="h-3.5 w-3.5" /> Đang dùng
                        </span>
                      ) : (
                        <button
                          onClick={handleUpgradePro}
                          disabled={paymentLoading}
                          className="mt-3 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white rounded-xl text-xs font-bold hover:from-indigo-700 hover:to-indigo-600 hover:scale-[1.03] transition-all shadow-md shadow-indigo-500/20 hover:shadow-lg hover:shadow-indigo-500/30 active:scale-95 duration-150 uppercase tracking-wider disabled:opacity-50 inline-flex items-center justify-center gap-1.5 min-w-[130px]"
                        >
                          {paymentLoading ? (
                            <>
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              <span>Đang xử lý...</span>
                            </>
                          ) : (
                            <>
                              <span>Chọn gói Pro</span>
                              <Zap className="h-3.5 w-3.5 fill-white text-white" />
                            </>
                          )}
                        </button>
                      )}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-slate-100 hover:bg-slate-50/50">
                    <td className="py-4 font-semibold text-slate-600 text-sm">
                      Giá
                    </td>
                    <td className="py-4 text-center font-bold text-slate-800">
                      0đ
                    </td>
                    <td className="py-4 text-center font-black text-slate-900 bg-indigo-50/40">
                      {planCycle === 'monthly'
                        ? '49.000đ / tháng'
                        : '490.000đ / năm'}
                    </td>
                  </tr>
                  <tr className="border-b border-slate-100 hover:bg-slate-50/50">
                    <td className="py-4 font-semibold text-slate-600 text-sm">
                      Lượt AI Matching / ngày
                    </td>
                    <td className="py-4 text-center text-slate-700 text-sm">
                      10 lượt
                    </td>
                    <td className="py-4 text-center text-slate-800 text-sm font-bold bg-indigo-50/40">
                      Không giới hạn
                    </td>
                  </tr>
                  <tr className="border-b border-slate-100 hover:bg-slate-50/50">
                    <td className="py-4 font-semibold text-slate-600 text-sm">
                      Tốc độ truy vấn tìm việc
                    </td>
                    <td className="py-4 text-center text-slate-700 text-sm">
                      Tiêu chuẩn
                    </td>
                    <td className="py-4 text-center text-indigo-700 text-sm font-bold bg-indigo-50/40">
                      Siêu tốc (Ưu tiên)
                    </td>
                  </tr>
                  <tr className="border-b border-slate-100 hover:bg-slate-50/50">
                    <td className="py-4 font-semibold text-slate-600 text-sm">
                      Thông báo việc làm qua Email
                    </td>
                    <td className="py-4 text-center text-slate-700 text-sm">
                      Cập nhật hàng tuần
                    </td>
                    <td className="py-4 text-center text-emerald-600 text-sm font-bold bg-indigo-50/40">
                      Tức thời ngay khi có việc
                    </td>
                  </tr>
                  <tr className="border-b border-slate-100 hover:bg-slate-50/50">
                    <td className="py-4 font-semibold text-slate-600 text-sm">
                      Phân tích CV bằng AI
                    </td>
                    <td className="py-4 text-center text-slate-700 text-sm">
                      Điểm cơ bản
                    </td>
                    <td className="py-4 text-center text-slate-800 text-sm font-bold bg-indigo-50/40">
                      Chi tiết & Gợi ý cải thiện
                    </td>
                  </tr>
                  <tr className="border-b border-slate-100 hover:bg-slate-50/50">
                    <td className="py-4 font-semibold text-slate-600 text-sm">
                      Nổi bật hồ sơ (Top Applicant)
                    </td>
                    <td className="py-4 text-center">
                      <span className="text-slate-300">-</span>
                    </td>
                    <td className="py-4 text-center bg-indigo-50/40">
                      <Check className="h-4.5 w-4.5 text-emerald-500 mx-auto" />
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50/50">
                    <td className="py-4 font-semibold text-slate-600 text-sm">
                      Tự động tối ưu CV
                    </td>
                    <td className="py-4 text-center">
                      <span className="text-slate-300">-</span>
                    </td>
                    <td className="py-4 text-center bg-indigo-50/40 rounded-b-xl">
                      <Check className="h-4.5 w-4.5 text-emerald-500 mx-auto" />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Right Column Panels */}
          <div className="flex flex-col gap-6">
            {/* Redeem Code Panel */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <Ticket className="h-5 w-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900">Redeem code</h3>
              </div>
              <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                Bạn có thể kích hoạt gói bằng redeem code từ các sự kiện hoặc
                đối tác thay vì thanh toán qua cổng trực tuyến.
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={redeemCode}
                  onChange={(e) => setRedeemCode(e.target.value)}
                  placeholder="Nhập mã ưu đãi"
                  className="flex-1 px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all placeholder-slate-300"
                />
                <button
                  onClick={handleApplyRedeem}
                  className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm shrink-0"
                >
                  Áp dụng
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Transaction History Section */}
        <div className="mt-16 max-w-5xl">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">
            Lịch sử thanh toán
          </h2>

          <div className="flex flex-col gap-4">
            {transactions.length === 0 ? (
              <div className="text-center p-8 bg-white rounded-2xl border border-slate-100 shadow-sm text-slate-500">
                Chưa có giao dịch nào
              </div>
            ) : (
              transactions.map((tx) => (
                <div key={tx.id} className="bg-white rounded-2xl border border-slate-100 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm hover:shadow-md transition-shadow">
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">
                      {tx.planName || 'Gói Pro'}
                    </h3>
                    <p className="text-sm text-slate-500 mt-1">
                      {tx.amount.toLocaleString('vi-VN')}đ · Mã đơn {tx.orderCode}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 md:gap-6 justify-end w-full md:w-auto">
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${
                      tx.status === 'SUCCESS' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                      tx.status === 'FAILED' ? 'bg-red-50 text-red-600 border-red-100' :
                      'bg-blue-50 text-blue-600 border-blue-100'
                    }`}>
                      {tx.status === 'SUCCESS' ? 'Thành công' : tx.status === 'FAILED' ? 'Thất bại' : 'Đang chờ'}
                    </span>
                    {tx.status === 'PENDING' && (
                      <button 
                        onClick={() => setShowPaymentModal(true)}
                        className="flex items-center gap-1 px-4 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-50 transition-colors"
                      >
                        Tiếp tục <span className="text-lg leading-none">&rarr;</span>
                      </button>
                    )}
                    <span className="text-sm text-slate-400 min-w-[130px] text-right">
                      {new Date(tx.createdAt).toLocaleString('vi-VN')}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      {/* Payment QR Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-100 overflow-hidden relative animate-in fade-in zoom-in duration-200">
            {/* Close button */}
            <button
              onClick={() => setShowPaymentModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-50 transition-all"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="p-6 md:p-8">
              <h3 className="text-xl font-bold text-slate-900 mb-2 flex items-center gap-2">
                Nâng cấp Pro Plan <Gem className="h-5 w-5 text-amber-500" />
              </h3>
              <p className="text-slate-500 text-sm mb-6">
                Quét mã VietQR dưới đây để thanh toán tự động qua SePay. Gói Pro
                sẽ kích hoạt ngay khi giao dịch thành công.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                {/* QR Code Column */}
                <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-2xl border border-slate-100 relative group">
                  <div className="relative bg-white p-3 rounded-xl shadow-sm border border-slate-200/60">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`https://vietqr.app/img/?bank=${bankId}&acc=${accountNumber}&template=compact&amount=${
                        planCycle === 'monthly' ? 49000 : 490000
                      }&des=${encodeURIComponent(`SCC ${session?.user?.id}`)}&showinfo=true`}
                      alt="VietQR Payment Code"
                      className="w-48 h-48 object-contain"
                    />
                  </div>
                  <span className="mt-3 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Mã VietQR tự động
                  </span>
                </div>

                {/* Transfer Info Column */}
                <div className="flex flex-col gap-4">
                  <div className="text-xs text-indigo-600 font-bold bg-indigo-50 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-600" />{' '}
                    Hệ thống đang chờ bạn quét mã thanh toán...
                  </div>

                  <div className="space-y-3.5">
                    <div>
                      <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Ngân hàng
                      </span>
                      <div className="text-sm font-semibold text-slate-800">
                        VPBank (Ngân hàng TMCP Việt Nam Thịnh Vượng)
                      </div>
                    </div>

                    <div>
                      <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Số tài khoản
                      </span>
                      <div className="flex items-center justify-between mt-0.5">
                        <span className="text-sm font-extrabold text-slate-900 tracking-wide">
                          {accountNumber}
                        </span>
                        <button
                          onClick={() =>
                            copyToClipboard(accountNumber, 'Số tài khoản')
                          }
                          className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-50 transition-all"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div>
                      <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Tên tài khoản
                      </span>
                      <div className="text-sm font-semibold text-slate-800">
                        {accountName}
                      </div>
                    </div>

                    <div>
                      <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Số tiền cần chuyển
                      </span>
                      <div className="flex items-center justify-between mt-0.5">
                        <span className="text-base font-extrabold text-indigo-600">
                          {(planCycle === 'monthly'
                            ? 49000
                            : 490000
                          ).toLocaleString('vi-VN')}
                          đ
                        </span>
                        <button
                          onClick={() =>
                            copyToClipboard(
                              (planCycle === 'monthly'
                                ? 49000
                                : 490000
                              ).toString(),
                              'Số tiền',
                            )
                          }
                          className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-50 transition-all"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div className="p-3 bg-amber-50/60 border border-amber-200/60 rounded-xl">
                      <span className="block text-[10px] font-bold text-amber-800 uppercase tracking-wider">
                        Nội dung chuyển khoản bắt buộc
                      </span>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-sm font-black text-amber-900 tracking-wider">
                          SCC {session?.user?.id}
                        </span>
                        <button
                          onClick={() =>
                            copyToClipboard(
                              `SCC ${session?.user?.id}`,
                              'Nội dung chuyển khoản',
                            )
                          }
                          className="p-1.5 text-amber-600 hover:text-amber-800 rounded-lg hover:bg-amber-100/50 transition-all"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                      </div>
                      <p className="text-[10px] text-amber-700/80 mt-1.5 leading-normal">
                        *Lưu ý: Bạn phải ghi chính xác nội dung này để hệ thống
                        nhận diện đúng tài khoản và nâng cấp tự động.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
