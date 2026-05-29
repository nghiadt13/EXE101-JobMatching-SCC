import Link from 'next/link';

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-md-outline-variant/30 bg-md-surface-container-high">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-6">
        <div>
          <div className="text-lg font-bold text-md-primary">TopCV Platform</div>
          <div className="mt-1 text-sm text-md-on-surface-variant">
            © 2026 TopCV Recruitment Ecosystem. All rights reserved.
          </div>
        </div>
        <div className="flex flex-wrap gap-4">
          <Link href="#" className="text-sm text-md-on-surface-variant hover:text-md-primary transition-colors">
            Về chúng tôi
          </Link>
          <Link href="#" className="text-sm text-md-on-surface-variant hover:text-md-primary transition-colors">
            Điều khoản dịch vụ
          </Link>
          <Link href="#" className="text-sm text-md-on-surface-variant hover:text-md-primary transition-colors">
            Chính sách bảo mật
          </Link>
          <Link href="#" className="text-sm text-md-on-surface-variant hover:text-md-primary transition-colors">
            Liên hệ hỗ trợ
          </Link>
          <Link href="#" className="text-sm text-md-on-surface-variant hover:text-md-primary transition-colors">
            Dành cho nhà tuyển dụng
          </Link>
        </div>
      </div>
    </footer>
  );
}
