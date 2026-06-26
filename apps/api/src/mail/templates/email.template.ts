const GOLD_COLOR = '#C6A461';

export function getBaseTemplate(title: string, content: string) {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          background-color: #f3f4f6;
          margin: 0;
          padding: 40px 20px;
          color: #1f2937;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #ffffff;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        }
        .header {
          background-color: ${GOLD_COLOR};
          height: 6px;
          width: 100%;
        }
        .logo-area {
          padding: 30px 40px 10px;
          text-align: center;
        }
        .logo-text {
          font-size: 14px;
          font-weight: 700;
          color: #9ca3af;
          letter-spacing: 2px;
          text-transform: uppercase;
        }
        .content {
          padding: 20px 40px 40px;
        }
        h1 {
          font-size: 24px;
          font-weight: 700;
          color: #111827;
          margin-top: 0;
          margin-bottom: 24px;
          text-align: center;
        }
        p {
          font-size: 16px;
          line-height: 1.6;
          color: #374151;
          margin-bottom: 16px;
        }
        strong {
          color: #111827;
          font-weight: 600;
        }
        .btn-container {
          text-align: center;
          margin: 32px 0;
        }
        .btn {
          display: inline-block;
          background-color: ${GOLD_COLOR};
          color: #ffffff !important;
          font-weight: 600;
          font-size: 16px;
          text-decoration: none;
          padding: 14px 28px;
          border-radius: 8px;
          transition: background-color 0.2s;
        }
        .btn:hover {
          background-color: #b08d4a;
        }
        .footer {
          background-color: #f9fafb;
          padding: 24px 40px;
          text-align: center;
          border-top: 1px solid #e5e7eb;
        }
        .footer p {
          font-size: 13px;
          color: #6b7280;
          margin: 0 0 8px 0;
        }
        .footer a {
          color: ${GOLD_COLOR};
          text-decoration: none;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header"></div>
        <div class="logo-area">
          <div class="logo-text">SMART JOB MATCHING</div>
        </div>
        <div class="content">
          <h1>${title}</h1>
          ${content}
        </div>
        <div class="footer">
          <p>You're receiving this email because you signed up for Smart Job Matching.</p>
          <p>Questions? Contact our support team at <a href="mailto:support@jobmatching.com">support@jobmatching.com</a></p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export function getWelcomeEmailHtml(userName: string, webUrl = 'https://www.jobmatching-scc.id.vn'): string {
  const content = `
    <p>Hi <strong>${userName}</strong>,</p>
    <p>Welcome to <strong>Smart Job Matching</strong>! We're thrilled to have you on board.</p>
    <p>Our platform uses advanced AI and Cosine Similarity to find the perfect job opportunities that match your unique skills and experience.</p>
    <p>To get started, simply complete your profile and upload your latest CV. We'll handle the rest.</p>
    <div class="btn-container">
      <a href="${webUrl}/" class="btn">Complete Profile</a>
    </div>
  `;
  return getBaseTemplate('Welcome to Smart Job Matching', content);
}

export function getUpgradeEmailHtml(
  userName: string,
  planName: string,
  orderCode: string,
  webUrl = 'https://www.jobmatching-scc.id.vn',
): string {
  const content = `
    <p>Hi <strong>${userName}</strong>,</p>
    <p>Thank you for upgrading to <strong>${planName}</strong>! Your payment was successful and your premium features are now active.</p>
    <p>Order Code: <strong>${orderCode}</strong></p>
    <p>You now have full access to advanced AI matching, premium job insights, and priority support.</p>
    <div class="btn-container">
      <a href="${webUrl}/" class="btn">Explore Pro Features</a>
    </div>
  `;
  return getBaseTemplate('Welcome to Pro', content);
}

export function getSmartMatchesEmailHtml(
  userName: string,
  matchesCount: number,
  webUrl = 'https://www.jobmatching-scc.id.vn',
): string {
  const content = `
    <p>Hi <strong>${userName}</strong>,</p>
    <p>Great news! Our AI has just finished scanning and found <strong>${matchesCount} new jobs</strong> that strongly match your profile.</p>
    <p>Our world-class AI has scoured thousands of listings to handpick the absolute best, most lucrative opportunities tailored to your exceptional talent!</p>
    <div class="btn-container">
      <a href="${webUrl}/dashboard/candidate/recommendations" class="btn">View Your Matches</a>
    </div>
  `;
  return getBaseTemplate('Your Smart Job Matches Are Ready', content);
}
