import type { Metadata } from 'next';
import { HomepageMain } from '@/components/home/homepage-main';

export const metadata: Metadata = {
  title: 'HireStream - Your Career Starts Here',
  description:
    'Over 500,000 active job openings from top-tier companies and innovative startups worldwide.',
  alternates: { canonical: '/' },
};

export default function HomePage() {
  return <HomepageMain />;
}