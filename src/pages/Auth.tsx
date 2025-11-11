import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Building2, TrendingUp } from 'lucide-react';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [portfolioValue, setPortfolioValue] = useState(0);
  const [dataCenterMW, setDataCenterMW] = useState(0);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    // Get closed won deals for portfolio value
    const { data: deals } = await supabase
      .from('deals')
      .select('amount_target')
      .eq('stage', 'Closed_Won');

    const totalValue = deals?.reduce((sum, deal) => 
      sum + (Number(deal.amount_target) || 0), 0
    ) || 0;
    
    setPortfolioValue(totalValue);

    // Get AI Data Center projects and extract MW from names
    const { data: projects } = await supabase
      .from('projects')
      .select('name, est_total_cost')
      .eq('project_type', 'AI_Data_Center')
      .in('stage', ['Construction', 'Stabilization', 'Exit']);

    let totalMW = 0;
    projects?.forEach(project => {
      // Extract MW from project name (e.g., "Lancaster TX 240MW Campus")
      const mwMatch = project.name.match(/(\d+)\s*MW/i);
      if (mwMatch) {
        totalMW += parseInt(mwMatch[1]);
      }
    });
    
    setDataCenterMW(totalMW);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        toast({
          title: 'Welcome back!',
          description: 'Successfully signed in.',
        });
        navigate('/dashboard');
      } else {
        const redirectUrl = `${window.location.origin}/dashboard`;
        
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: redirectUrl,
            data: {
              name: name,
            },
          },
        });

        if (error) throw error;

        toast({
          title: 'Account created!',
          description: 'You can now sign in.',
        });
        setIsLogin(true);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left side - Hero Section */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-primary via-blue-600 to-blue-800">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1),transparent)]" />
        
        <div className="relative z-10 flex flex-col justify-center p-12 text-white">
          <div className="space-y-6 max-w-lg">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-lg bg-white/10 backdrop-blur-sm flex items-center justify-center">
                <Building2 className="h-7 w-7" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">CAPS Capital</h2>
                <p className="text-sm text-blue-100">Enterprises</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <h1 className="text-4xl font-bold leading-tight">
                <span className="text-yellow-300">Tokenizing</span>
                <br />
                Luxury Real Estate
              </h1>
              
              <p className="text-lg text-blue-100">
                Revolutionizing luxury real estate and AI datacenter development through innovative tokenization
              </p>
            </div>

            <div className="flex gap-8 pt-6">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-yellow-300">
                  <TrendingUp className="h-5 w-5" />
                  <span className="text-2xl font-bold">
                    {portfolioValue > 0 
                      ? `$${(portfolioValue / 1000000).toFixed(1)}M` 
                      : '$0'}
                  </span>
                </div>
                <p className="text-sm text-blue-100">Portfolio Value</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-yellow-300">
                  <Building2 className="h-5 w-5" />
                  <span className="text-2xl font-bold">
                    {dataCenterMW > 0 ? `${dataCenterMW}MW` : '0MW'}
                  </span>
                </div>
                <p className="text-sm text-blue-100">AI Data Center</p>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl" />
      </div>

      {/* Right side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <Card className="w-full max-w-md border-0 shadow-2xl animate-fade-in">
          <CardContent className="p-8">
            <div className="space-y-6">
              {/* Logo & Title */}
              <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                  CAPS Capital
                </h1>
                <p className="text-muted-foreground text-sm">
                  {isLogin ? 'Welcome back to the future of real estate' : 'Join the future of real estate'}
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {!isLogin && (
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-medium">
                      Full Name
                    </Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="John Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required={!isLogin}
                      className="h-11"
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium">
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="h-11"
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full h-11 text-base font-semibold" 
                  disabled={loading}
                >
                  {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Sign Up'}
                </Button>
              </form>

              {/* Toggle */}
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  {isLogin
                    ? "Don't have an account? "
                    : 'Already have an account? '}
                  <span className="font-semibold text-primary">
                    {isLogin ? 'Sign up' : 'Sign in'}
                  </span>
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
