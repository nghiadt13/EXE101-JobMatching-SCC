"use client";

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';

type JobCard = {
  title: string;
  company: string;
  description: string;
  salary: string;
  location: string;
  iconClass: string;
  iconWrapClass: string;
  iconColorClass: string;
};

const jobCards: JobCard[] = [
  {
    title: 'iOS Developer Fulltime',
    company: 'Apple Inc. Vietnam',
    description: 'Develop cutting-edge mobile applications using Swift and SwiftUI for the Apple ecosystem.',
    salary: '15 - 35 Triệu',
    location: 'Hà Nội',
    iconClass: 'fa-brands fa-apple',
    iconWrapClass: '',
    iconColorClass: 'text-gray-800',
  },
  {
    title: 'Sale Representative (Global)',
    company: 'MIKY GROUP JSC',
    description:
      'Expand our market reach globally by building relationships with international enterprise clients.',
    salary: '8 - 20 Triệu',
    location: 'Remote OK',
    iconClass: 'fa-solid fa-lemon',
    iconWrapClass: 'overflow-hidden bg-orange-50',
    iconColorClass: 'text-orange-400',
  },
  {
    title: 'Accountant Manager',
    company: 'Tech Online Vietnam',
    description:
      'Lead our financial department and ensure compliance with Vietnamese accounting standards.',
    salary: 'Up to 25 Triệu',
    location: 'Hà Nội',
    iconClass: 'fa-solid fa-building-columns',
    iconWrapClass: 'bg-blue-50',
    iconColorClass: 'text-blue-600',
  },
  {
    title: 'Lead Product Designer',
    company: 'Figma Design Lab',
    description: 'Shape the future of collaborative design tools with a user-centric approach.',
    salary: '20 - 50 Triệu',
    location: 'Remote',
    iconClass: 'fa-brands fa-figma',
    iconWrapClass: 'bg-slate-50',
    iconColorClass: 'text-purple-600',
  },
  {
    title: 'Educational Consultant',
    company: 'EDUVATOR JSC',
    description: 'Advise students on career paths and higher education opportunities abroad.',
    salary: '15 - 25 Triệu',
    location: 'Hồ Chí Minh',
    iconClass: 'fa-solid fa-graduation-cap',
    iconWrapClass: 'bg-red-50',
    iconColorClass: 'text-red-500',
  },
  {
    title: 'Senior Data Analyst',
    company: 'Spotify Global',
    description: 'Use big data to understand user listening habits and drive product strategy.',
    salary: 'Negotiable',
    location: 'London, UK',
    iconClass: 'fa-brands fa-spotify',
    iconWrapClass: 'bg-green-50',
    iconColorClass: 'text-green-500',
  },
];

const demandBars = [
  { className: 'bg-white', height: '90%' },
  { className: 'bg-primary-200', height: '70%' },
  { className: 'bg-primary-300', height: '60%' },
  { className: 'bg-primary-400', height: '45%' },
  { className: 'bg-primary-100', height: '40%' },
];

export function HomepageMain() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [likedJobs, setLikedJobs] = useState<Set<number>>(new Set());
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!dropdownRef.current?.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    window.addEventListener('click', handleClickOutside);
    return () => {
      window.removeEventListener('click', handleClickOutside);
    };
  }, []);

  const toggleLikedJob = (index: number) => {
    setLikedJobs((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  return (
    <div className="bg-gray-50 text-slate-900" style={{ fontFamily: 'var(--font-inter), sans-serif' }}>
      <header className="sticky top-0 z-50 border-b border-gray-100 bg-white shadow-sm">
        <nav className="flex h-20 w-full items-center justify-between px-4 sm:px-8 lg:px-12">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-600 text-white">
              <i className="fa-solid fa-bolt-lightning text-xl" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-slate-800">HireStream</span>
          </div>

          <div className="hidden items-center space-x-8 lg:flex">
            <a className="transition-standard text-sm font-medium text-slate-600 hover:text-primary-600" href="#">
              Find Jobs
            </a>
            <a className="transition-standard text-sm font-medium text-slate-600 hover:text-primary-600" href="#">
              Companies
            </a>
            <a className="transition-standard text-sm font-medium text-slate-600 hover:text-primary-600" href="#">
              Salaries
            </a>
            <a
              className="transition-standard rounded-md border border-primary-600 px-4 py-2 text-sm font-semibold text-primary-600 hover:bg-primary-50"
              href="#"
            >
              Post a Job
            </a>
          </div>

          <div className="flex items-center space-x-2 md:space-x-4">
            <button
              className="transition-standard group relative rounded-full p-2.5 text-slate-600 hover:bg-primary-50 hover:text-primary-600"
              type="button"
            >
              <i className="fa-regular fa-bell text-xl" />
              <span className="absolute top-2 right-2 flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary-400 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary-600" />
              </span>
            </button>

            <button
              className="transition-standard rounded-full p-2.5 text-slate-600 hover:bg-primary-50 hover:text-primary-600"
              type="button"
            >
              <i className="fa-regular fa-comment-dots text-xl" />
            </button>

            <div className="hidden h-6 w-px bg-gray-200 md:block" />

            <div
              ref={dropdownRef}
              className={`relative ${isDropdownOpen ? 'dropdown-active' : ''}`}
              onMouseEnter={() => setIsDropdownOpen(true)}
              onMouseLeave={() => setIsDropdownOpen(false)}
            >
              <button
                className="transition-standard flex items-center gap-3 rounded-full p-1 hover:bg-gray-100 focus:outline-none"
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  setIsDropdownOpen((prev) => !prev);
                }}
              >
                <div className="h-10 w-10 overflow-hidden rounded-full border-2 border-primary-100">
                  <Image
                    alt="User"
                    className="h-full w-full object-cover"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuDJWS7D-glrmKnFu1VhcuuzOu_7JGrK2arpYsJhWT1gTvdQviF_WOQofU7PVeH7WcAnTep-bGy3eDxC-u5JWJ6btQ_PpU8N7RLp6ze8iuUAyxMNaPvh7vsNqNncmWtgpXqIkFfN-CwD9wvu3QBjNDz0P-aYmdSzPgd5pPKYsFLSoGF3ETtkfmQJmnIBQiJXzHR3C5WIeRcyyfW5do8LWB-YCjSE7LC6BWr8-hHiTUWfuLW5jH4sd6yFney9N9Bx4mjD9jH2lhNszDE"
                    width={40}
                    height={40}
                    unoptimized
                  />
                </div>
                <div className="hidden pr-2 text-left md:block">
                  <p className="text-xs leading-none font-bold text-slate-800">Alex Rivera</p>
                  <p className="mt-1 text-[10px] text-gray-500">Free Plan</p>
                </div>
                <i
                  className={`fa-solid fa-chevron-down mr-1 hidden text-[10px] text-gray-400 transition-transform duration-200 md:block ${
                    isDropdownOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              <div className="dropdown-menu absolute top-full right-0 z-[60] w-56 pt-2">
                <div className="rounded-xl border border-gray-100 bg-white py-2 shadow-xl">
                  <div className="mb-1 border-b border-gray-50 px-4 py-3">
                    <p className="text-sm font-semibold text-slate-900">Alex Rivera</p>
                    <p className="truncate text-xs text-gray-500">alex.rivera@example.com</p>
                  </div>
                  <a
                    className="transition-standard flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:bg-primary-50 hover:text-primary-600"
                    href="#"
                  >
                    <i className="fa-solid fa-user-gear w-4 text-center" /> Settings
                  </a>
                  <a
                    className="transition-standard flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:bg-primary-50 hover:text-primary-600"
                    href="#"
                  >
                    <i className="fa-solid fa-briefcase w-4 text-center" /> My Applications
                  </a>
                  <a
                    className="transition-standard flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:bg-primary-50 hover:text-primary-600"
                    href="#"
                  >
                    <i className="fa-solid fa-file-invoice w-4 text-center" /> My CVs
                  </a>
                  <div className="mx-2 my-1 h-px bg-gray-50" />
                  <a
                    className="transition-standard flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50"
                    href="#"
                  >
                    <i className="fa-solid fa-arrow-right-from-bracket w-4 text-center" /> Log out
                  </a>
                </div>
              </div>
            </div>
          </div>
        </nav>
      </header>

      <main>
        <section className="relative flex h-[600px] items-center justify-center overflow-hidden">
          <Image
            alt="Office Collaboration"
            className="absolute inset-0 h-full w-full object-cover"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDfgq41SCyJjCh8zdZiRw6w8jt0VVFLbbLZt7ykfAFG5aMhH40ASM8UMZ9MfGO8putfc51TN2a1kZKzgL-xf1h2OCA2zfSWVROPUmoryvq3LWede7BycCZTqzh84lcsbOCYi2E_Uci0U4tKT8uz1n9flsEcFS-JQpNGsZwDylU6idlM9bD_qSH0Ka99HwwLlw_9-MwVTdiTw3FGdxMlEg-6TyTfakh-LEv5JrJRl1lGhd3E8PBaADKLpsv489FaNa0QW7cfRgIorbk"
            fill
            sizes="100vw"
            unoptimized
          />
          <div className="hero-overlay absolute inset-0" />
          <div className="relative z-10 w-full max-w-4xl px-4 text-center">
            <h1 className="mb-6 text-4xl leading-tight font-extrabold text-white md:text-6xl">
              Find Your Dream Job <br />
              <span className="text-primary-400">Where You Belong.</span>
            </h1>
            <p className="mx-auto mb-10 max-w-2xl text-lg text-gray-300">
              Over 500,000 active job openings from top-tier companies and innovative startups worldwide.
            </p>

            <div className="mx-auto flex max-w-3xl flex-col items-center gap-2 rounded-2xl bg-white p-2 shadow-2xl md:flex-row">
              <div className="focus-within:ring-primary-100 flex w-full flex-1 items-center px-4 focus-within:rounded-xl focus-within:ring-2">
                <i className="fa-solid fa-magnifying-glass mr-3 text-gray-400" />
                <input
                  className="w-full border-none py-3 text-slate-800 focus:ring-0"
                  placeholder="Job title, keywords..."
                  type="text"
                />
              </div>
              <div className="hidden h-8 w-px bg-gray-200 md:block" />
              <div className="focus-within:ring-primary-100 flex w-full flex-1 items-center px-4 focus-within:rounded-xl focus-within:ring-2">
                <i className="fa-solid fa-location-dot mr-3 text-gray-400" />
                <input
                  className="w-full border-none py-3 text-slate-800 focus:ring-0"
                  placeholder="City or remote"
                  type="text"
                />
              </div>
              <button
                className="transition-standard w-full rounded-xl bg-primary-600 px-8 py-3.5 font-bold text-white hover:bg-primary-700 md:w-auto"
                type="button"
              >
                Search Jobs
              </button>
            </div>

            <div className="mt-8 flex flex-wrap justify-center gap-4 text-sm text-white/80">
              <span>Popular:</span>
              <a className="underline hover:text-white" href="#">
                Software Engineer
              </a>
              <a className="underline hover:text-white" href="#">
                Product Designer
              </a>
              <a className="underline hover:text-white" href="#">
                Marketing Manager
              </a>
            </div>
          </div>
        </section>

        <section className="relative z-20 -mt-16 px-4 py-12">
          <div className="stats-gradient mx-auto max-w-7xl overflow-hidden rounded-3xl p-8 text-white shadow-2xl">
            <div className="flex flex-col gap-8 lg:flex-row">
              <div className="space-y-8 lg:w-1/3">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full border border-white/20 bg-white/10 backdrop-blur-sm">
                      <i className="fa-solid fa-robot text-4xl text-white" />
                    </div>
                    <div className="absolute -top-1 -right-1 h-4 w-4 animate-pulse rounded-full border-2 border-primary-900 bg-primary-400" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Job Market Today</h2>
                    <p className="text-sm text-primary-100">March 13, 2026</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  <div className="rounded-2xl border border-white/10 bg-white/10 p-5 backdrop-blur-sm transition-all hover:bg-white/20">
                    <p className="text-3xl font-bold">5,059</p>
                    <p className="text-sm font-medium text-primary-100">New Jobs in last 24h</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/10 p-5 backdrop-blur-sm transition-all hover:bg-white/20">
                    <p className="text-3xl font-bold">63,198</p>
                    <p className="text-sm font-medium text-primary-100">Total Active Openings</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/10 p-5 backdrop-blur-sm transition-all hover:bg-white/20">
                    <p className="text-3xl font-bold">18,402</p>
                    <p className="text-sm font-medium text-primary-100">Hiring Companies</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:w-2/3">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                  <div className="mb-6 flex items-center justify-between">
                    <h3 className="text-sm font-bold tracking-wider text-white uppercase">
                      <i className="fa-solid fa-chart-line mr-2" /> Job Opportunity Growth
                    </h3>
                  </div>
                  <div className="relative flex h-48 items-end justify-between">
                    <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="none" viewBox="0 0 100 100">
                      <path
                        d="M0 80 Q 20 75, 40 85 T 60 50 T 80 40 T 100 20"
                        fill="none"
                        stroke="#ffffff"
                        strokeWidth="3"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col justify-between opacity-10">
                      <div className="w-full border-t border-white" />
                      <div className="w-full border-t border-white" />
                      <div className="w-full border-t border-white" />
                      <div className="w-full border-t border-white" />
                    </div>
                  </div>
                  <div className="mt-4 flex justify-between text-[10px] text-primary-100/70">
                    <span>11/02</span>
                    <span>17/02</span>
                    <span>23/02</span>
                    <span>01/03</span>
                    <span>07/03</span>
                    <span>13/03</span>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                  <div className="mb-6 flex items-center justify-between">
                    <h3 className="text-sm font-bold tracking-wider text-white uppercase">
                      <i className="fa-solid fa-chart-bar mr-2" /> Demand by Industry
                    </h3>
                    <select className="rounded border border-white/20 bg-white/10 px-2 py-1 text-xs text-white focus:border-white/40 focus:ring-0">
                      <option className="text-slate-800">Industries</option>
                    </select>
                  </div>
                  <div className="flex h-48 items-end justify-around gap-2 px-2">
                    {demandBars.map((bar) => (
                      <div
                        key={bar.height}
                        className={`bar-animate h-0 w-8 rounded-t-sm ${bar.className}`}
                        style={{ '--final-height': bar.height, height: 0 } as CSSProperties}
                      />
                    ))}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2 text-[10px] text-primary-50">
                    <span className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-white" /> Sales
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-primary-200" /> Admin
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-primary-300" /> Service
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-primary-400" /> Marketing
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-gray-100 bg-white py-12">
          <div className="mx-auto max-w-7xl px-4">
            <p className="mb-8 text-center text-sm font-semibold tracking-widest text-gray-400 uppercase">
              Trusted by 10,000+ top companies
            </p>
            <div className="flex flex-wrap items-center justify-center gap-10 grayscale md:gap-20 opacity-40">
              <i className="fa-brands fa-google text-4xl" />
              <i className="fa-brands fa-microsoft text-4xl" />
              <i className="fa-brands fa-amazon text-4xl" />
              <i className="fa-brands fa-apple text-4xl" />
              <i className="fa-brands fa-airbnb text-4xl" />
              <i className="fa-brands fa-slack text-4xl" />
            </div>
          </div>
        </section>

        <section className="bg-gray-50 py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-12 flex items-end justify-between">
              <div>
                <h2 className="text-3xl font-bold text-slate-900">Explore by Category</h2>
                <p className="mt-2 text-gray-500">Find the right path for your professional growth.</p>
              </div>
              <a className="font-semibold text-primary-600 hover:underline" href="#">
                View all categories <i className="fa-solid fa-arrow-right ml-1" />
              </a>
            </div>
            <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
              <div className="group cursor-pointer rounded-2xl border border-gray-100 bg-white p-8 transition-all hover:border-primary-500 hover:shadow-xl">
                <div className="transition-standard mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-blue-50 text-primary-600 group-hover:bg-primary-600 group-hover:text-white">
                  <i className="fa-solid fa-code text-2xl" />
                </div>
                <h3 className="text-lg font-bold text-slate-800">Tech &amp; Software</h3>
                <p className="mt-1 text-sm text-gray-500">1,240 Openings</p>
              </div>
              <div className="group cursor-pointer rounded-2xl border border-gray-100 bg-white p-8 transition-all hover:border-primary-500 hover:shadow-xl">
                <div className="transition-standard mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 group-hover:bg-primary-600 group-hover:text-white">
                  <i className="fa-solid fa-pen-nib text-2xl" />
                </div>
                <h3 className="text-lg font-bold text-slate-800">Design &amp; Creative</h3>
                <p className="mt-1 text-sm text-gray-500">840 Openings</p>
              </div>
              <div className="group cursor-pointer rounded-2xl border border-gray-100 bg-white p-8 transition-all hover:border-primary-500 hover:shadow-xl">
                <div className="transition-standard mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-green-50 text-green-600 group-hover:bg-primary-600 group-hover:text-white">
                  <i className="fa-solid fa-chart-line text-2xl" />
                </div>
                <h3 className="text-lg font-bold text-slate-800">Marketing &amp; Sales</h3>
                <p className="mt-1 text-sm text-gray-500">920 Openings</p>
              </div>
              <div className="group cursor-pointer rounded-2xl border border-gray-100 bg-white p-8 transition-all hover:border-primary-500 hover:shadow-xl">
                <div className="transition-standard mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-orange-50 text-orange-600 group-hover:bg-primary-600 group-hover:text-white">
                  <i className="fa-solid fa-landmark text-2xl" />
                </div>
                <h3 className="text-lg font-bold text-slate-800">Finance &amp; Banking</h3>
                <p className="mt-1 text-sm text-gray-500">450 Openings</p>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
              <div>
                <h2 className="text-3xl font-bold text-slate-900">Best Jobs For You</h2>
                <p className="mt-1 flex items-center gap-2 text-gray-500">
                  <span className="h-2 w-2 rounded-full bg-green-500" /> Recommendations by HireStream AI
                </p>
              </div>
              <a className="font-bold text-primary-600 hover:underline" href="#">
                View all <i className="fa-solid fa-chevron-right ml-1 text-xs" />
              </a>
            </div>

            <div className="hide-scrollbar mb-8 flex items-center gap-4 overflow-x-auto pb-2">
              <div className="flex shrink-0 items-center gap-2 rounded-lg bg-gray-100 px-4 py-2 text-gray-500">
                <i className="fa-solid fa-filter text-xs" />
                <span className="text-sm font-medium">Filter by: Location</span>
                <i className="fa-solid fa-chevron-down ml-2 text-[10px]" />
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="transition-standard rounded-full bg-primary-600 px-5 py-2 text-sm font-semibold text-white"
                  type="button"
                >
                  All Locations
                </button>
                <button
                  className="transition-standard rounded-full bg-gray-100 px-5 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-200"
                  type="button"
                >
                  Hà Nội
                </button>
                <button
                  className="transition-standard rounded-full bg-gray-100 px-5 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-200"
                  type="button"
                >
                  Ba Đình
                </button>
                <button
                  className="transition-standard rounded-full bg-gray-100 px-5 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-200"
                  type="button"
                >
                  Hoàn Kiếm
                </button>
                <button
                  className="transition-standard rounded-full bg-gray-100 px-5 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-200"
                  type="button"
                >
                  Hai Bà Trưng
                </button>
                <button
                  className="transition-standard rounded-full bg-gray-100 px-5 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-200"
                  type="button"
                >
                  Đống Đa
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {jobCards.map((job, index) => {
                const liked = likedJobs.has(index);
                return (
                  <div
                    key={job.title}
                    className="job-grid-card group relative flex h-full flex-col rounded-2xl border border-gray-200 bg-white p-6"
                  >
                    <div className="mb-4 flex items-start justify-between">
                      <div
                        className={`flex h-14 w-14 items-center justify-center rounded-xl border border-gray-100 p-2 ${job.iconWrapClass}`}
                      >
                        <i className={`${job.iconClass} text-3xl ${job.iconColorClass}`} />
                      </div>
                      <button
                        className="transition-standard flex h-8 w-8 items-center justify-center rounded-full border border-gray-100 text-gray-400 hover:border-red-100 hover:text-red-500"
                        type="button"
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          toggleLikedJob(index);
                        }}
                      >
                        <i
                          className={`${liked ? 'fa-solid text-red-500' : 'fa-regular'} fa-heart`}
                          aria-hidden="true"
                        />
                      </button>
                    </div>
                    <div className="flex-grow">
                      <Link href="/jobs/senior-backend-developer">
                        <h3 className="transition-standard mb-1 cursor-pointer text-lg leading-tight font-bold text-slate-900 group-hover:text-primary-600">
                          {job.title}
                        </h3>
                      </Link>
                      <p className="mb-2 text-sm text-gray-500">{job.company}</p>
                      <p className="line-clamp-2 mb-4 text-sm text-gray-600">{job.description}</p>
                      <div className="mb-4 flex items-center gap-2">
                        <span className="rounded bg-primary-50 px-2 py-0.5 text-sm font-bold text-primary-600">
                          {job.salary}
                        </span>
                      </div>
                    </div>
                    <div className="mt-auto flex items-center justify-between border-t border-gray-50 pt-4">
                      <div className="flex flex-wrap gap-2">
                        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                          {job.location}
                        </span>
                      </div>
                      <Link
                        className="flex items-center gap-1 text-sm font-bold text-primary-600 transition-all hover:gap-2"
                        href="/jobs/senior-backend-developer"
                      >
                        Xem chi tiết <i className="fa-solid fa-arrow-right text-xs" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-12 text-center">
              <button
                className="rounded-xl border-2 border-primary-600 px-8 py-3 font-bold text-primary-600 shadow-md transition-all hover:bg-primary-600 hover:text-white active:scale-95"
                type="button"
              >
                Explore 63,192 More Jobs
              </button>
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden bg-primary-900 py-24 text-white">
          <div className="absolute top-0 right-0 h-96 w-96 translate-x-1/2 -translate-y-1/2 rounded-full bg-primary-800 opacity-20 blur-3xl" />
          <div className="absolute bottom-0 left-0 h-64 w-64 -translate-x-1/2 translate-y-1/2 rounded-full bg-primary-700 opacity-20 blur-3xl" />
          <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-16 text-center">
              <h2 className="text-3xl font-bold md:text-4xl">How HireStream Works</h2>
              <p className="mt-4 text-primary-300">Three simple steps to your next career milestone.</p>
            </div>
            <div className="grid gap-12 text-center md:grid-cols-3">
              <div className="group flex flex-col items-center">
                <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-primary-700 bg-primary-800 shadow-lg transition-transform group-hover:scale-110">
                  <i className="fa-solid fa-user-plus text-3xl text-primary-400" />
                </div>
                <h3 className="mb-3 text-xl font-bold">Create Account</h3>
                <p className="text-primary-200">
                  Sign up in seconds. Tell us about your expertise and career aspirations.
                </p>
              </div>
              <div className="group flex flex-col items-center">
                <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-primary-700 bg-primary-800 shadow-lg transition-transform group-hover:scale-110">
                  <i className="fa-solid fa-file-arrow-up text-3xl text-primary-400" />
                </div>
                <h3 className="mb-3 text-xl font-bold">Upload CV</h3>
                <p className="text-primary-200">
                  Our AI-powered CV parser will help you stand out to hiring managers.
                </p>
              </div>
              <div className="group flex flex-col items-center">
                <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-primary-700 bg-primary-800 shadow-lg transition-transform group-hover:scale-110">
                  <i className="fa-solid fa-briefcase text-3xl text-primary-400" />
                </div>
                <h3 className="mb-3 text-xl font-bold">Get Hired</h3>
                <p className="text-primary-200">
                  Apply to jobs with one click and track your applications in real-time.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-gray-100 bg-white pt-20 pb-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-16 grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-4">
            <div className="col-span-1 lg:col-span-1">
              <div className="mb-6 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary-600 text-white">
                  <i className="fa-solid fa-bolt-lightning" />
                </div>
                <span className="text-xl font-bold text-slate-800">HireStream</span>
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
            <p>© 2023 HireStream Recruitment Inc. All rights reserved.</p>
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
    </div>
  );
}
