import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Shield, Cpu, BarChart3, Activity } from 'lucide-react';

export function Navigation() {
  const [location] = useLocation();

  return (
    <nav className="border-b border-slate-700 bg-slate-800/50 backdrop-blur supports-[backdrop-filter]:bg-slate-800/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <div className="flex-shrink-0 flex items-center space-x-2">
              <Shield className="h-8 w-8 text-blue-400" />
              <span className="text-xl font-bold text-white">DeFi Risk Oracle</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button
                  variant={location === '/' || location === '/dashboard' ? 'default' : 'ghost'}
                  size="sm"
                  className={`flex items-center space-x-2 ${
                    location === '/' || location === '/dashboard' 
                      ? 'bg-blue-600 text-white' 
                      : 'text-slate-300 hover:text-white hover:bg-slate-700'
                  }`}
                >
                  <BarChart3 className="h-4 w-4" />
                  <span>Risk Dashboard</span>
                </Button>
              </Link>
              
              <Link href="/nosana">
                <Button
                  variant={location === '/nosana' ? 'default' : 'ghost'}
                  size="sm"
                  className={`flex items-center space-x-2 ${
                    location === '/nosana' 
                      ? 'bg-blue-600 text-white' 
                      : 'text-slate-300 hover:text-white hover:bg-slate-700'
                  }`}
                >
                  <Cpu className="h-4 w-4" />
                  <span>Nosana Network</span>
                </Button>
              </Link>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-2 px-3 py-1 bg-slate-700/50 rounded-full">
              <Activity className="h-4 w-4 text-green-400" />
              <span className="text-sm text-slate-300">Live</span>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}