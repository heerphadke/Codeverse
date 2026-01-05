/**
 * Landing Page
 * Pre-auth hero page for Codeverse
 * 
 * Uses the global spacing and layout system for consistent spacing.
 * All padding/margin uses CSS variables from spacing.css
 */

import { Link } from 'react-router-dom';
import { 
  Play, 
  ArrowRight, 
  Zap, 
  Code2, 
  Shield, 
  Users, 
  Github,
  Terminal,
  Sparkles,
  Globe,
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#050508] overflow-x-hidden">
      {/* Skip link for accessibility */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      {/* Sticky Header */}
      <Header />

      {/* Main content */}
      <main id="main-content">
        <HeroSection />
        <FeaturesSection />
        <HowItWorksSection />
        <UseCasesSection />
        <CTASection />
      </main>

      {/* Footer */}
      <Footer />

      {/* Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'SoftwareApplication',
            name: 'Codeverse',
            description: 'Real-time collaborative code editing with live cursors, instant sync, and secure cloud execution — built for teams, interviews, and classrooms.',
            applicationCategory: 'DeveloperApplication',
            operatingSystem: 'Web',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'USD',
            },
            aggregateRating: {
              '@type': 'AggregateRating',
              ratingValue: '4.8',
              ratingCount: '150',
            },
          }),
        }}
      />
    </div>
  );
}

/* ============================================
   HEADER
   ============================================ */
function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-[#050508]/80 border-b border-white/5">
      <div 
        className="container flex items-center justify-between"
        style={{ height: 'var(--space-16)' }} // 64px header height
      >
        {/* Logo */}
        <Link to="/" className="flex items-center" style={{ gap: 'var(--space-2-5)' }}>
          <div 
            className="rounded-xl bg-gradient-to-br from-[#00C38A] to-[#00a878] flex items-center justify-center"
            style={{ width: 'var(--space-9)', height: 'var(--space-9)' }} // 36px
          >
            <Code2 className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-white tracking-tight">Codeverse</span>
        </Link>

        {/* Nav actions */}
        <nav className="flex items-center" style={{ gap: 'var(--space-3)' }} aria-label="Primary navigation">
          <Link 
            to="/login"
            className="text-sm font-medium text-gray-300 hover:text-white transition-colors"
            style={{ padding: 'var(--space-2) var(--space-4)' }}
            title="Sign in to access your projects"
          >
            Sign in
          </Link>
          <Link 
            to="/register"
            className="text-sm font-semibold text-white bg-gradient-to-r from-[#00C38A] to-[#00a878] rounded-xl hover:shadow-lg hover:shadow-[#00C38A]/20 transition-all active:scale-[0.98]"
            style={{ 
              padding: 'var(--space-2-5) var(--space-5)',
              minHeight: 'var(--touch-target-min)' // 44px minimum touch target
            }}
            title="Start collaborating now — no setup"
          >
            Get started
          </Link>
        </nav>
      </div>
    </header>
  );
}

/* ============================================
   HERO SECTION
   ============================================ */
function HeroSection() {
  return (
    <section 
      className="relative overflow-hidden"
      style={{ 
        paddingTop: 'calc(var(--space-section-xl) + 64px)', // Section padding + header offset
        paddingBottom: 'var(--space-section-xl)'
      }}
    >
      {/* Background gradient */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'linear-gradient(135deg, #061014 0%, #062022 50%, #051018 100%)' }}
      />
      
      {/* Glow effects */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-[#00C38A]/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-[#8B5CF6]/10 rounded-full blur-[100px] pointer-events-none" />
      
      <div className="container relative">
        <div 
          className="grid lg:grid-cols-[1fr,0.8fr] items-center"
          style={{ gap: 'var(--grid-gap-xl)' }} // 48px gap between columns
        >
          {/* Left column - Content */}
          <div className="text-center lg:text-left">
            {/* Badge */}
            <div 
              className="hero-badge inline-flex items-center rounded-full bg-[#00C38A]/10 border border-[#00C38A]/20 text-[#00C38A]"
              style={{ 
                gap: 'var(--space-2)',
                padding: 'var(--space-1-5) var(--space-3)',
                marginBottom: 'var(--space-6)' 
              }}
            >
              <Sparkles className="w-4 h-4" />
              Now in public beta
            </div>

            {/* Headline */}
            <h1 
              className="hero-title"
              style={{ marginBottom: 'var(--space-6)' }}
            >
              Code Together.
              <br />
              <span className="bg-gradient-to-r from-[#00C38A] to-[#8B5CF6] bg-clip-text text-transparent">
                Create Together.
              </span>
            </h1>

            {/* Subheadline */}
            <p 
              className="hero-subtitle mx-auto lg:mx-0"
              style={{ 
                maxWidth: '60ch',
                marginBottom: 'var(--space-8)' 
              }}
            >
              Real-time collaborative code editing with live cursors, instant sync, and secure cloud execution — built for teams, interviews, and classrooms.
            </p>

            {/* CTAs */}
            <div 
              className="flex flex-col sm:flex-row items-center justify-center lg:justify-start"
              style={{ 
                gap: 'var(--space-4)',
                marginBottom: 'var(--space-8)' 
              }}
            >
              <Link
                to="/register"
                className="group w-full sm:w-auto inline-flex items-center justify-center text-base font-semibold text-white bg-gradient-to-r from-[#00C38A] to-[#00a878] rounded-xl shadow-xl shadow-[#00C38A]/20 hover:shadow-2xl hover:shadow-[#00C38A]/30 transition-all active:scale-[0.98]"
                style={{ 
                  gap: 'var(--space-2)',
                  padding: 'var(--space-4) var(--space-8)',
                  minHeight: 'var(--touch-target-md)' // 48px
                }}
                title="Start collaborating now — no setup"
              >
                <Play className="w-5 h-5" />
                Try it free
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <button
                onClick={() => window.open('/register', '_self')}
                className="w-full sm:w-auto inline-flex items-center justify-center text-base font-semibold text-gray-300 border border-gray-700 rounded-xl hover:bg-white/5 hover:border-gray-600 hover:text-white transition-all"
                style={{ 
                  gap: 'var(--space-2)',
                  padding: 'var(--space-4) var(--space-8)',
                  minHeight: 'var(--touch-target-md)'
                }}
              >
                View demo
              </button>
            </div>

            {/* Trust line */}
            <p 
              className="text-sm text-gray-500"
              style={{ marginBottom: 'var(--space-8)' }}
            >
              Trusted by devs and teams for pair-programming, classroom labs, and remote interviews.
            </p>

            {/* Feature chips */}
            <div 
              className="flex flex-wrap items-center justify-center lg:justify-start"
              style={{ gap: 'var(--space-3)' }}
            >
              <FeatureChip icon={<Zap className="w-4 h-4" />} label="Real-time" />
              <FeatureChip icon={<Code2 className="w-4 h-4" />} label="Multi-language" />
              <FeatureChip icon={<Shield className="w-4 h-4" />} label="Safe execution" />
            </div>
          </div>

          {/* Right column - Hero mock */}
          <div 
            className="relative"
            style={{ marginTop: 'var(--space-8)' }}
          >
            <EditorMock />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================================
   FEATURES SECTION
   ============================================ */
function FeaturesSection() {
  return (
    <section 
      className="bg-[#0a0a0f]" 
      aria-labelledby="features-heading"
      style={{ 
        paddingTop: 'var(--space-section-lg)',
        paddingBottom: 'var(--space-section-lg)'
      }}
    >
      <div className="container">
        {/* Section header */}
        <div 
          className="text-center"
          style={{ marginBottom: 'var(--space-section-sm)' }}
        >
          <h2 
            id="features-heading" 
            className="text-3xl lg:text-4xl font-bold text-white"
            style={{ marginBottom: 'var(--space-4)' }}
          >
            Everything you need to code together
          </h2>
          <p 
            className="text-lg text-gray-400 mx-auto"
            style={{ maxWidth: 'var(--content-width)' }}
          >
            Built for developers who collaborate. From quick pair programming sessions to full classroom environments.
          </p>
        </div>

        {/* Features grid */}
        <div 
          className="grid md:grid-cols-3"
          style={{ gap: 'var(--grid-gap-lg)' }}
        >
          <FeatureCard
            icon={<Zap className="w-6 h-6" />}
            iconColor="emerald"
            title="Real-time sync"
            description="Collaborate with low-latency CRDT sync and live cursors. See every keystroke as it happens."
          />
          <FeatureCard
            icon={<Code2 className="w-6 h-6" />}
            iconColor="purple"
            title="Multi-language"
            description="JavaScript, Python, C/C++, Java, Go, Rust, and more. Full syntax highlighting and execution."
          />
          <FeatureCard
            icon={<Shield className="w-6 h-6" />}
            iconColor="blue"
            title="Safe execution"
            description="Sandboxed code runs with quotas and audit logs. Execute code without worrying about security."
          />
        </div>
      </div>
    </section>
  );
}

/* ============================================
   HOW IT WORKS SECTION
   ============================================ */
function HowItWorksSection() {
  return (
    <section 
      aria-labelledby="how-it-works-heading"
      style={{ 
        paddingTop: 'var(--space-section-lg)',
        paddingBottom: 'var(--space-section-lg)'
      }}
    >
      <div className="container">
        <div 
          className="text-center"
          style={{ marginBottom: 'var(--space-section-sm)' }}
        >
          <h2 
            id="how-it-works-heading" 
            className="text-3xl lg:text-4xl font-bold text-white"
            style={{ marginBottom: 'var(--space-4)' }}
          >
            Start collaborating in seconds
          </h2>
        </div>

        <div 
          className="grid md:grid-cols-3 mx-auto"
          style={{ gap: 'var(--grid-gap-lg)', maxWidth: 'var(--container-lg)' }}
        >
          <StepCard step={1} title="Create a room" description="Start a new project with one click" />
          <StepCard step={2} title="Invite teammates" description="Share a link — they join instantly" />
          <StepCard step={3} title="Code & run" description="Write, execute, and iterate together" />
        </div>
      </div>
    </section>
  );
}

/* ============================================
   USE CASES SECTION
   ============================================ */
function UseCasesSection() {
  return (
    <section 
      className="bg-[#0a0a0f]" 
      aria-labelledby="use-cases-heading"
      style={{ 
        paddingTop: 'var(--space-section-lg)',
        paddingBottom: 'var(--space-section-lg)'
      }}
    >
      <div className="container">
        <div 
          className="text-center"
          style={{ marginBottom: 'var(--space-section-sm)' }}
        >
          <h2 
            id="use-cases-heading" 
            className="text-3xl lg:text-4xl font-bold text-white"
            style={{ marginBottom: 'var(--space-4)' }}
          >
            Built for every use case
          </h2>
        </div>

        <div 
          className="grid md:grid-cols-3"
          style={{ gap: 'var(--grid-gap-lg)' }}
        >
          <UseCaseCard
            icon={<Users className="w-6 h-6" />}
            title="Pair programming"
            description="Debug together, review code live, and ship faster with real-time collaboration."
          />
          <UseCaseCard
            icon={<Terminal className="w-6 h-6" />}
            title="Technical interviews"
            description="Conduct live coding interviews with shared editor and instant code execution."
          />
          <UseCaseCard
            icon={<Globe className="w-6 h-6" />}
            title="Classroom labs"
            description="Teach coding with interactive exercises. See student progress in real-time."
          />
        </div>
      </div>
    </section>
  );
}

/* ============================================
   CTA SECTION
   ============================================ */
function CTASection() {
  return (
    <section 
      aria-labelledby="cta-heading"
      style={{ 
        paddingTop: 'var(--space-section-lg)',
        paddingBottom: 'var(--space-section-lg)'
      }}
    >
      <div className="container">
        <div 
          className="relative rounded-3xl overflow-hidden text-center"
          style={{ padding: 'var(--space-section-md)' }}
        >
          {/* Background */}
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{ background: 'linear-gradient(135deg, #062022 0%, #0a1520 100%)' }}
          />
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#00C38A]/20 rounded-full blur-[100px] pointer-events-none" />
          
          <div className="relative">
            <h2 
              id="cta-heading" 
              className="text-3xl lg:text-4xl font-bold text-white"
              style={{ marginBottom: 'var(--space-4)' }}
            >
              Ready to code together?
            </h2>
            <p 
              className="text-lg text-gray-400 mx-auto"
              style={{ 
                maxWidth: 'var(--content-width-narrow)',
                marginBottom: 'var(--space-8)' 
              }}
            >
              Join thousands of developers collaborating in real-time.
            </p>
            <Link
              to="/register"
              className="inline-flex items-center text-base font-semibold text-white bg-gradient-to-r from-[#00C38A] to-[#00a878] rounded-xl shadow-xl shadow-[#00C38A]/20 hover:shadow-2xl hover:shadow-[#00C38A]/30 transition-all active:scale-[0.98]"
              style={{ 
                gap: 'var(--space-2)',
                padding: 'var(--space-4) var(--space-8)',
                minHeight: 'var(--touch-target-md)'
              }}
            >
              Get started for free
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================================
   FOOTER
   ============================================ */
function Footer() {
  return (
    <footer 
      className="border-t border-white/5"
      style={{ padding: 'var(--space-8) 0' }}
    >
      <div className="container">
        <div 
          className="flex flex-col md:flex-row items-center justify-between"
          style={{ gap: 'var(--space-4)' }}
        >
          <div className="flex items-center" style={{ gap: 'var(--space-2)' }}>
            <div 
              className="rounded-lg bg-gradient-to-br from-[#00C38A] to-[#00a878] flex items-center justify-center"
              style={{ width: 'var(--space-7)', height: 'var(--space-7)' }}
            >
              <Code2 className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm text-gray-400">© 2024 Codeverse. All rights reserved.</span>
          </div>
          
          <nav 
            className="flex items-center"
            style={{ gap: 'var(--space-6)' }}
            aria-label="Footer navigation"
          >
            <a href="#" className="text-sm text-gray-500 hover:text-gray-300 transition-colors">
              Docs
            </a>
            <a href="#" className="text-sm text-gray-500 hover:text-gray-300 transition-colors">
              Pricing
            </a>
            <a 
              href="https://github.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-gray-500 hover:text-gray-300 transition-colors flex items-center"
              style={{ gap: 'var(--space-1-5)' }}
            >
              <Github className="w-4 h-4" />
              GitHub
            </a>
            <a href="#" className="text-sm text-gray-500 hover:text-gray-300 transition-colors">
              Privacy
            </a>
          </nav>
        </div>
      </div>
    </footer>
  );
}

/* ============================================
   COMPONENTS
   ============================================ */

// Feature chip component
function FeatureChip({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div 
      className="inline-flex items-center rounded-lg bg-white/5 border border-white/10 text-sm text-gray-300"
      style={{ 
        gap: 'var(--space-2)',
        padding: 'var(--space-1-5) var(--space-3)'
      }}
    >
      <span className="text-[#00C38A]">{icon}</span>
      {label}
    </div>
  );
}

// Feature card component
function FeatureCard({
  icon,
  iconColor,
  title,
  description,
}: {
  icon: React.ReactNode;
  iconColor: 'emerald' | 'purple' | 'blue';
  title: string;
  description: string;
}) {
  const colorStyles = {
    emerald: 'bg-[#00C38A]/10 text-[#00C38A] border-[#00C38A]/20',
    purple: 'bg-[#8B5CF6]/10 text-[#8B5CF6] border-[#8B5CF6]/20',
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  };

  return (
    <div 
      className="group rounded-2xl bg-[#0d0d14] border border-white/5 hover:border-white/10 transition-all"
      style={{ padding: 'var(--space-inset-xl)' }} // 24px padding
    >
      <div 
        className={`rounded-xl ${colorStyles[iconColor]} border flex items-center justify-center`}
        style={{ 
          width: 'var(--space-12)', // 48px
          height: 'var(--space-12)',
          marginBottom: 'var(--space-5)' // 20px
        }}
      >
        {icon}
      </div>
      <h3 
        className="text-lg font-semibold text-white"
        style={{ marginBottom: 'var(--space-2)' }}
      >
        {title}
      </h3>
      <p className="text-gray-400 leading-relaxed">{description}</p>
    </div>
  );
}

// Step card component
function StepCard({ step, title, description }: { step: number; title: string; description: string }) {
  return (
    <div 
      className="text-center"
      style={{ padding: 'var(--space-4)' }}
    >
      <div 
        className="rounded-full bg-gradient-to-br from-[#00C38A] to-[#00a878] text-white text-lg font-bold flex items-center justify-center mx-auto"
        style={{ 
          width: 'var(--space-12)', // 48px
          height: 'var(--space-12)',
          marginBottom: 'var(--space-4)'
        }}
      >
        {step}
      </div>
      <h3 
        className="text-lg font-semibold text-white"
        style={{ marginBottom: 'var(--space-2)' }}
      >
        {title}
      </h3>
      <p className="text-gray-400">{description}</p>
    </div>
  );
}

// Use case card
function UseCaseCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div 
      className="rounded-2xl bg-[#0d0d14] border border-white/5"
      style={{ padding: 'var(--space-inset-xl)' }}
    >
      <div 
        className="rounded-xl bg-white/5 text-[#00C38A] flex items-center justify-center"
        style={{ 
          width: 'var(--space-12)',
          height: 'var(--space-12)',
          marginBottom: 'var(--space-5)'
        }}
      >
        {icon}
      </div>
      <h3 
        className="text-lg font-semibold text-white"
        style={{ marginBottom: 'var(--space-2)' }}
      >
        {title}
      </h3>
      <p className="text-gray-400 leading-relaxed">{description}</p>
    </div>
  );
}

// Editor mock component (static, lightweight)
function EditorMock() {
  return (
    <div 
      className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-black/50"
      role="img"
      aria-label="Codeverse editor mock with two cursors showing live collaboration"
    >
      {/* Window chrome */}
      <div 
        className="flex items-center bg-[#1a1a2e] border-b border-white/5"
        style={{ 
          gap: 'var(--space-2)',
          padding: 'var(--space-3) var(--space-4)'
        }}
      >
        <div className="flex" style={{ gap: 'var(--space-1-5)' }}>
          <div className="w-3 h-3 rounded-full bg-red-500/80" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
          <div className="w-3 h-3 rounded-full bg-green-500/80" />
        </div>
        <div className="flex-1 flex items-center justify-center">
          <span className="text-xs text-gray-500 font-mono">main.js — Codeverse</span>
        </div>
      </div>

      {/* Editor content */}
      <div 
        className="bg-[#0a0a0f] font-mono text-sm"
        style={{ padding: 'var(--space-4)' }}
      >
        <div className="flex">
          {/* Line numbers */}
          <div 
            className="text-gray-600 select-none text-right"
            style={{ paddingRight: 'var(--space-4)', minWidth: '2.5rem' }}
          >
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
              <div key={n}>{n}</div>
            ))}
          </div>

          {/* Code */}
          <div className="flex-1 overflow-hidden">
            <div className="text-gray-300">
              <span className="text-purple-400">function</span>{' '}
              <span className="text-blue-400">collaborate</span>
              <span className="text-gray-500">(</span>
              <span className="text-orange-400">team</span>
              <span className="text-gray-500">)</span>{' '}
              <span className="text-gray-500">{'{'}</span>
            </div>
            <div className="text-gray-300" style={{ paddingLeft: 'var(--space-4)' }}>
              <span className="text-purple-400">const</span>{' '}
              <span className="text-blue-300">project</span>{' '}
              <span className="text-gray-500">=</span>{' '}
              <span className="text-purple-400">await</span>{' '}
              <span className="text-yellow-300">createRoom</span>
              <span className="text-gray-500">()</span>;
            </div>
            <div className="relative" style={{ paddingLeft: 'var(--space-4)' }}>
              <span className="text-gray-300">project.</span>
              <span className="text-yellow-300">invite</span>
              <span className="text-gray-500">(</span>
              <span className="text-green-400">team</span>
              <span className="text-gray-500">)</span>;
              {/* Cursor 1 */}
              <span className="absolute w-0.5 h-5 bg-[#00C38A] animate-pulse" style={{ marginLeft: 'var(--space-1)' }} />
              <span 
                className="absolute text-xs bg-[#00C38A] text-white rounded whitespace-nowrap"
                style={{ marginLeft: 'var(--space-2)', top: '-20px', padding: 'var(--space-0-5) var(--space-1-5)' }}
              >
                You
              </span>
            </div>
            <div className="text-gray-500" style={{ paddingLeft: 'var(--space-4)' }}>{'// Real-time collaboration'}</div>
            <div className="text-gray-300" style={{ paddingLeft: 'var(--space-4)' }}>
              <span className="text-purple-400">for</span>{' '}
              <span className="text-gray-500">(</span>
              <span className="text-purple-400">const</span>{' '}
              <span className="text-blue-300">member</span>{' '}
              <span className="text-purple-400">of</span>{' '}
              <span className="text-orange-400">team</span>
              <span className="text-gray-500">)</span>{' '}
              <span className="text-gray-500">{'{'}</span>
            </div>
            <div className="relative" style={{ paddingLeft: 'var(--space-8)' }}>
              <span className="text-gray-300">member.</span>
              <span className="text-yellow-300">startCoding</span>
              <span className="text-gray-500">()</span>;
              {/* Cursor 2 */}
              <span className="absolute w-0.5 h-5 bg-[#8B5CF6] animate-pulse" style={{ marginLeft: 'var(--space-1)', animationDelay: '0.5s' }} />
              <span 
                className="absolute text-xs bg-[#8B5CF6] text-white rounded whitespace-nowrap"
                style={{ marginLeft: 'var(--space-2)', top: '-20px', padding: 'var(--space-0-5) var(--space-1-5)' }}
              >
                Alex
              </span>
            </div>
            <div className="text-gray-300" style={{ paddingLeft: 'var(--space-4)' }}>
              <span className="text-gray-500">{'}'}</span>
            </div>
            <div className="text-gray-300" style={{ paddingLeft: 'var(--space-4)' }}>
              <span className="text-purple-400">return</span>{' '}
              <span className="text-green-400">'Success!'</span>;
            </div>
            <div className="text-gray-500">{'}'}</div>
          </div>
        </div>
      </div>

      {/* Status bar */}
      <div 
        className="flex items-center justify-between bg-[#1a1a2e] border-t border-white/5 text-xs text-gray-500"
        style={{ padding: 'var(--space-2) var(--space-4)' }}
      >
        <div className="flex items-center" style={{ gap: 'var(--space-3)' }}>
          <span className="flex items-center" style={{ gap: 'var(--space-1-5)' }}>
            <span className="w-2 h-2 rounded-full bg-green-500" />
            Connected
          </span>
          <span>2 collaborators</span>
        </div>
        <span>JavaScript</span>
      </div>
    </div>
  );
}
