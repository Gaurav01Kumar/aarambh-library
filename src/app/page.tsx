import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Users, TrendingUp, Shield, Clock, Zap, CheckCircle, ArrowRight } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      {/* Navigation */}
      <nav className="border-b border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-950/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="h-8 w-8 text-primary" />
              <span className="text-2xl font-bold">Aarambh Library</span>
            </div>
            <div className="hidden md:flex items-center gap-6">
              <Link href="#features" className="text-slate-600 dark:text-slate-400 hover:text-primary transition-colors">
                Features
              </Link>
              <Link href="#pricing" className="text-slate-600 dark:text-slate-400 hover:text-primary transition-colors">
                Pricing
              </Link>
              <Link href="#about" className="text-slate-600 dark:text-slate-400 hover:text-primary transition-colors">
                About
              </Link>
              <Link href="/student-registration" className="text-slate-600 dark:text-slate-400 hover:text-primary transition-colors font-medium">
                Student Registration
              </Link>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/auth/signin">
                <Button variant="ghost">Sign In</Button>
              </Link>
              <Link href="/auth/signup">
                <Button>Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 md:py-32">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Zap className="h-4 w-4" />
            <span>New: AI-Powered Seat Management</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 bg-clip-text text-transparent">
            Aarambh Library: Modern Management Made Simple
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400 mb-8 max-w-2xl mx-auto">
            Streamline your library operations with our comprehensive SaaS platform. Manage students, seats, attendance, and finances effortlessly.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/signup">
              <Button size="lg" className="w-full sm:w-auto">
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/student-registration">
              <Button size="lg" variant="outline" className="w-full sm:w-auto border-primary text-primary hover:bg-primary/5">
                Register as Student
              </Button>
            </Link>
            <Link href="#features">
              <Button size="lg" variant="ghost" className="w-full sm:w-auto">
                Learn More
              </Button>
            </Link>
          </div>
          <div className="mt-12 flex flex-wrap justify-center gap-8 text-sm text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span>14-day free trial</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span>Cancel anytime</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-4 py-20 bg-slate-50 dark:bg-slate-900/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything You Need</h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Comprehensive features to manage your library efficiently
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              icon={<Users className="h-8 w-8" />}
              title="Student Management"
              description="Register and manage students with detailed profiles, ID verification, and subscription tracking."
            />
            <FeatureCard
              icon={<BookOpen className="h-8 w-8" />}
              title="Seat Management"
              description="Real-time seat availability, different seat tiers, and automatic assignment system."
            />
            <FeatureCard
              icon={<Clock className="h-8 w-8" />}
              title="QR Code Entry"
              description="Generate unique QR codes for students and track check-in/check-out times automatically."
            />
            <FeatureCard
              icon={<TrendingUp className="h-8 w-8" />}
              title="Financial Tracking"
              description="Complete transaction management, expense tracking, and revenue analytics."
            />
            <FeatureCard
              icon={<Shield className="h-8 w-8" />}
              title="Fee Reminders"
              description="Automated fee reminders with multiple notification channels and overdue tracking."
            />
            <FeatureCard
              icon={<Zap className="h-8 w-8" />}
              title="Real-time Dashboard"
              description="Comprehensive dashboard with live statistics, charts, and actionable insights."
            />
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="container mx-auto px-4 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Simple, Transparent Pricing</h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Choose the plan that fits your library's needs
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <PricingCard
              name="Free"
              price="₹0"
              description="Perfect for small libraries"
              features={[
                'Up to 25 students',
                'Basic seat management',
                'Manual attendance',
                'Basic reports',
                'Email support',
              ]}
              cta="Start Free"
              popular={false}
            />
            <PricingCard
              name="Basic"
              price="₹2,999"
              description="For growing libraries"
              features={[
                'Up to 100 students',
                'QR code entry system',
                'Automated reminders',
                'Advanced analytics',
                'Priority support',
                'API access',
              ]}
              cta="Start Trial"
              popular={true}
            />
            <PricingCard
              name="Pro"
              price="₹7,999"
              description="For large institutions"
              features={[
                'Unlimited students',
                'Multi-location support',
                'Custom integrations',
                'White-label solution',
                'Dedicated support',
                'Advanced security',
              ]}
              cta="Contact Sales"
              popular={false}
            />
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="container mx-auto px-4 py-20 bg-slate-50 dark:bg-slate-900/50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Why Choose Aarambh Library?</h2>
          <p className="text-lg text-slate-600 dark:text-slate-400 mb-12">
            Built by library professionals, for library professionals. We understand the unique challenges of managing a modern library and have designed our platform to address them head-on.
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">500+</div>
              <div className="text-slate-600 dark:text-slate-400">Libraries Managed</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">50K+</div>
              <div className="text-slate-600 dark:text-slate-400">Students Served</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">99.9%</div>
              <div className="text-slate-600 dark:text-slate-400">Uptime Guaranteed</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Transform Your Library?</h2>
          <p className="text-lg text-slate-600 dark:text-slate-400 mb-8">
            Join hundreds of libraries already using Aarambh Library to streamline their operations
          </p>
          <Link href="/auth/signup">
            <Button size="lg">
              Get Started Today
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
        <div className="container mx-auto px-4 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="h-6 w-6 text-primary" />
                <span className="text-xl font-bold">Aarambh Library</span>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Modern library management made simple
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                <li><Link href="#features" className="hover:text-primary">Features</Link></li>
                <li><Link href="#pricing" className="hover:text-primary">Pricing</Link></li>
                <li><Link href="#" className="hover:text-primary">Documentation</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                <li><Link href="#" className="hover:text-primary">About</Link></li>
                <li><Link href="#" className="hover:text-primary">Blog</Link></li>
                <li><Link href="#" className="hover:text-primary">Careers</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                <li><Link href="#" className="hover:text-primary">Help Center</Link></li>
                <li><Link href="#" className="hover:text-primary">Contact</Link></li>
                <li><Link href="#" className="hover:text-primary">Status</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-200 dark:border-slate-800 mt-8 pt-8 text-center text-sm text-slate-600 dark:text-slate-400">
            <p>&copy; 2024 Aarambh Library. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <Card className="border-2 hover:border-primary/50 transition-colors">
      <CardHeader>
        <div className="text-primary mb-2">{icon}</div>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-slate-600 dark:text-slate-400">{description}</p>
      </CardContent>
    </Card>
  );
}

function PricingCard({ name, price, description, features, cta, popular }: {
  name: string,
  price: string,
  description: string,
  features: string[],
  cta: string,
  popular: boolean
}) {
  return (
    <Card className={`relative ${popular ? 'border-primary border-2' : ''}`}>
      {popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-medium">
          Most Popular
        </div>
      )}
      <CardHeader>
        <CardTitle className="text-2xl">{name}</CardTitle>
        <div className="text-3xl font-bold">{price}<span className="text-lg font-normal text-slate-600 dark:text-slate-400">/month</span></div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3 mb-6">
          {features.map((feature, index) => (
            <li key={index} className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
              <span className="text-sm">{feature}</span>
            </li>
          ))}
        </ul>
        <Button className="w-full" variant={popular ? 'default' : 'outline'}>
          {cta}
        </Button>
      </CardContent>
    </Card>
  );
}