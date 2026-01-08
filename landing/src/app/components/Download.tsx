'use client';

import { useEffect, useState } from 'react';

type Platform = 'windows' | 'macos-intel' | 'macos-arm' | 'linux' | 'unknown';

interface ReleaseAsset {
  name: string;
  browser_download_url: string;
}

interface Release {
  tag_name: string;
  assets: ReleaseAsset[];
}

const GITHUB_REPO = 'galaxy-co-ai/wingman';

function detectPlatform(): Platform {
  if (typeof window === 'undefined') return 'unknown';
  const ua = navigator.userAgent.toLowerCase();

  if (ua.includes('win')) return 'windows';
  if (ua.includes('mac')) {
    // Check for Apple Silicon
    const isAppleSilicon =
      ua.includes('arm') ||
      (navigator as Navigator & { userAgentData?: { platform: string } }).userAgentData?.platform === 'macOS';
    // Default to ARM for modern Macs, but show both options
    return isAppleSilicon ? 'macos-arm' : 'macos-intel';
  }
  if (ua.includes('linux')) return 'linux';
  return 'unknown';
}

const platformInfo: Record<Platform, { label: string; extension: string; pattern: RegExp }> = {
  windows: { label: 'Windows', extension: '.msi', pattern: /\.msi$/ },
  'macos-intel': { label: 'macOS (Intel)', extension: '.dmg', pattern: /x64\.dmg$/ },
  'macos-arm': { label: 'macOS (Apple Silicon)', extension: '.dmg', pattern: /aarch64\.dmg$/ },
  linux: { label: 'Linux', extension: '.AppImage', pattern: /\.AppImage$/ },
  unknown: { label: 'All Platforms', extension: '', pattern: /.*/ },
};

export default function Download() {
  const [platform, setPlatform] = useState<Platform>('unknown');
  const [release, setRelease] = useState<Release | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setPlatform(detectPlatform());

    fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases/latest`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setRelease(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const getDownloadUrl = (targetPlatform: Platform): string => {
    if (!release) {
      return `https://github.com/${GITHUB_REPO}/releases`;
    }
    const info = platformInfo[targetPlatform];
    const asset = release.assets.find((a) => info.pattern.test(a.name));
    return asset?.browser_download_url || `https://github.com/${GITHUB_REPO}/releases`;
  };

  const allPlatforms: Platform[] = ['windows', 'macos-arm', 'macos-intel', 'linux'];

  return (
    <section id="download" className="py-20 sm:py-28 bg-gray-50 dark:bg-gray-900">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
            Download Wingman
          </h2>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
            {release ? `Latest version: ${release.tag_name}` : 'Get started with Wingman today'}
          </p>
        </div>

        <div className="mx-auto mt-10 max-w-md">
          {/* Primary download button */}
          {platform !== 'unknown' && (
            <a
              href={getDownloadUrl(platform)}
              className="flex items-center justify-center gap-2 w-full rounded-lg bg-primary-600 px-6 py-4 text-lg font-semibold text-white shadow-sm hover:bg-primary-500 transition-colors"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              Download for {platformInfo[platform].label}
            </a>
          )}

          {/* All platform links */}
          <div className="mt-8">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 text-center mb-4">
              All platforms
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {allPlatforms.map((p) => (
                <a
                  key={p}
                  href={getDownloadUrl(p)}
                  className={`flex items-center justify-center gap-2 rounded-lg border px-4 py-3 text-sm font-medium transition-colors ${
                    p === platform
                      ? 'border-primary-600 bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400 dark:border-primary-700'
                      : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  {platformInfo[p].label}
                </a>
              ))}
            </div>
          </div>

          {/* Requirements note */}
          <p className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
            Requires Claude CLI to be installed.{' '}
            <a
              href="https://docs.anthropic.com/en/docs/claude-code"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-600 hover:text-primary-500 dark:text-primary-400"
            >
              Learn more →
            </a>
          </p>

          {loading && (
            <p className="mt-4 text-center text-sm text-gray-400">
              Checking for latest release...
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
