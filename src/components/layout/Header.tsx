
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import ThemeToggle from '@/components/ThemeToggle';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { LogOut, Briefcase, ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface HeaderProps {
  username?: string;
  currentWorkspace?: string;
  workspaces?: string[];
  onWorkspaceChange?: (workspace: string) => void;
}

export default function Header({ 
  username, 
  currentWorkspace = 'Personal', 
  workspaces = ['Personal', 'Work', 'Projects'], 
  onWorkspaceChange 
}: HeaderProps) {
  const [greeting, setGreeting] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 18) setGreeting('Good afternoon');
    else setGreeting('Good evening');
  }, []);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      toast({
        title: 'Error signing out',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Signed out successfully',
      });
    }
  };

  const handleWorkspaceChange = (workspace: string) => {
    if (onWorkspaceChange) {
      onWorkspaceChange(workspace);
      toast({
        title: `Switched to ${workspace} workspace`,
        duration: 2000,
      });
    }
  };

  return (
    <header className="border-b border-white/10 bg-black/40 backdrop-blur-xl supports-[backdrop-filter]:bg-black/30 sticky top-0 z-50">
      <div className="container flex h-16 items-center justify-between py-4">
        <div className="flex items-center gap-2">
          <h1 className="text-xl md:text-2xl font-bold gradient-text">
            Cosmic Tasks
          </h1>
        </div>
        <div className="flex items-center gap-4">
          {username && (
            <>
              <div className="hidden md:block text-sm">
                <span className="font-medium">{greeting}, </span>
                <span className="font-bold text-primary">{username}</span>
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 gap-1 bg-black/50 border-white/10 hover:bg-black/70">
                    <Briefcase className="h-4 w-4" />
                    <span className="max-w-[100px] truncate">{currentWorkspace}</span>
                    <ChevronDown className="h-4 w-4 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-black/80 backdrop-blur-xl border-white/10">
                  {workspaces.map((workspace) => (
                    <DropdownMenuItem 
                      key={workspace}
                      onClick={() => handleWorkspaceChange(workspace)}
                      className={currentWorkspace === workspace ? "bg-primary/20" : ""}
                    >
                      {workspace}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator className="bg-white/10" />
                  <DropdownMenuItem onClick={() => handleWorkspaceChange('+ New Workspace')}>
                    + New Workspace
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
          <ThemeToggle />
          {username && (
            <Button variant="ghost" size="icon" onClick={handleLogout} className="text-white/70 hover:text-white hover:bg-white/10">
              <LogOut className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
