import { SCCBrandLogo } from './brand-mark';

export function SiteFooter() {
  return (
    <footer className="border-t border-gray-100 bg-white pt-20 pb-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-16 grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-4">
          <div className="col-span-1 lg:col-span-1">
            <div className="mb-6 flex items-center gap-2">
              <SCCBrandLogo iconClassName="h-8 w-8 rounded-md" textClassName="text-xl" />
            </div>
            <p className="mb-6 text-gray-500">
              Join our newsletter to receive the latest job openings directly in your inbox.
            </p>
            <div className="flex">
              <input
                className="w-full rounded-l-lg border-gray-200 bg-gray-50 px-4 focus:border-primary-500 focus:ring-primary-500"
                placeholder="Email address"
                type="email"
              />
              <button
                className="transition-standard rounded-r-lg bg-primary-600 px-4 py-2 text-white hover:bg-primary-700"
                type="button"
              >
                <i className="fa-solid fa-paper-plane" />
              </button>
            </div>
          </div>

          <div>
            <h4 className="mb-6 font-bold text-slate-900">Quick Links</h4>
            <ul className="space-y-4 text-sm text-gray-500">
              <li>
                <a className="transition-standard hover:text-primary-600" href="#">
                  Browse Jobs
                </a>
              </li>
              <li>
                <a className="transition-standard hover:text-primary-600" href="#">
                  Company Profile
                </a>
              </li>
              <li>
                <a className="transition-standard hover:text-primary-600" href="#">
                  Job Notifications
                </a>
              </li>
              <li>
                <a className="transition-standard hover:text-primary-600" href="#">
                  Career Advice
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-6 font-bold text-slate-900">Support</h4>
            <ul className="space-y-4 text-sm text-gray-500">
              <li>
                <a className="transition-standard hover:text-primary-600" href="#">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a className="transition-standard hover:text-primary-600" href="#">
                  Terms of Service
                </a>
              </li>
              <li>
                <a className="transition-standard hover:text-primary-600" href="#">
                  Cookie Policy
                </a>
              </li>
              <li>
                <a className="transition-standard hover:text-primary-600" href="#">
                  Help Center
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-6 font-bold text-slate-900">Connect With Us</h4>
            <div className="flex space-x-4">
              <a
                className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-600 transition-all hover:bg-primary-600 hover:text-white"
                href="#"
              >
                <i className="fa-brands fa-linkedin-in" />
              </a>
              <a
                className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-600 transition-all hover:bg-primary-600 hover:text-white"
                href="#"
              >
                <i className="fa-brands fa-twitter" />
              </a>
              <a
                className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-600 transition-all hover:bg-primary-600 hover:text-white"
                href="#"
              >
                <i className="fa-brands fa-instagram" />
              </a>
              <a
                className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-600 transition-all hover:bg-primary-600 hover:text-white"
                href="#"
              >
                <i className="fa-brands fa-facebook-f" />
              </a>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 border-t border-gray-100 pt-8 text-sm text-gray-400 md:flex-row">
          <p>© 2023 SCC Smart Career Connector. All rights reserved.</p>
          <div className="flex space-x-6">
            <a className="hover:text-slate-600" href="#">
              Sitemap
            </a>
            <a className="hover:text-slate-600" href="#">
              English (US)
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
