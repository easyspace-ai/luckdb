import { Button } from '@luckdb/ui';
import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <div className="flex flex-col items-center gap-8">
          <h1 className="text-6xl font-bold text-center">
            Welcome to{' '}
            <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              LuckDB
            </span>
          </h1>
          <p className="text-xl text-gray-600 text-center max-w-2xl">
            Modern, AI-powered database management platform
          </p>
          <div className="flex gap-4 mt-8">
            <Link href="/dashboard">
              <Button variant="primary" size="lg">
                Get Started
              </Button>
            </Link>
            <Link href="/docs">
              <Button variant="outline" size="lg">
                Documentation
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

