
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/layout/Header';
import TaskCard from '@/components/tasks/TaskCard';
import TaskForm from '@/components/tasks/TaskForm';
import TaskFilter from '@/components/tasks/TaskFilter';
import TaskStats from '@/components/dashboard/TaskStats';
import MotivationalQuote from '@/components/dashboard/MotivationalQuote';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Task } from '@/types';
import { supabase } from '@/lib/supabase';
import { analyzeTask } from '@/services/ai-service';

export default function Dashboard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [currentTask, setCurrentTask] = useState<Task | undefined>();
  const [username, setUsername] = useState<string>('');
  const [currentWorkspace, setCurrentWorkspace] = useState<string>('Personal');
  const [workspaces, setWorkspaces] = useState<string[]>(['Personal', 'Work', 'Projects']);
  const { toast } = useToast();

  useEffect(() => {
    fetchTasks();
    fetchUserProfile();
    fetchWorkspaces();
  }, [currentWorkspace]);

  const fetchUserProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.email) {
      // Extract username from email for display
      const emailParts = user.email.split('@');
      setUsername(emailParts[0]);
    }
  };

  const fetchWorkspaces = async () => {
    // In a real app, you would fetch workspaces from the database
    // For now, we'll use the static list
    // Example of how you might fetch from Supabase:
    /*
    try {
      const { data, error } = await supabase
        .from('workspaces')
        .select('name')
        .eq('user_id', userId);
        
      if (error) throw error;
      setWorkspaces(data.map(w => w.name));
    } catch (error) {
      console.error('Error fetching workspaces:', error);
    }
    */
  };

  const fetchTasks = async () => {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (error) {
      toast({
        title: 'Error fetching tasks',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }
    
    // Filter tasks by current workspace
    // In a real implementation, you would have a workspace_id column
    // For now, we'll simulate this by filtering all tasks
    const workspaceTasks = currentWorkspace === 'Personal' 
      ? data || []
      : (data || []).filter((_, index) => index % workspaces.length === workspaces.indexOf(currentWorkspace));
    
    setTasks(workspaceTasks);
    setFilteredTasks(workspaceTasks);
  };

  const handleWorkspaceChange = (workspace: string) => {
    if (workspace === '+ New Workspace') {
      // In a real app, you would open a dialog to create a new workspace
      const newWorkspace = prompt('Enter new workspace name:');
      if (newWorkspace && !workspaces.includes(newWorkspace)) {
        setWorkspaces([...workspaces, newWorkspace]);
        setCurrentWorkspace(newWorkspace);
      }
    } else {
      setCurrentWorkspace(workspace);
    }
  };

  const handleCreateTask = async (taskData: Partial<Task>) => {
    setIsProcessingAI(true);
    
    try {
      // Analyze task with AI
      const aiAnalysis = await analyzeTask(taskData.title!, taskData.description);
      
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      
      // Add the task to Supabase
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          ...taskData,
          user_id: user.id,
          urgency: aiAnalysis.urgency,
          // In a real implementation, you would add workspace_id here
          // workspace_id: workspaceId
        })
        .select()
        .single();
        
      if (error) throw error;
      
      toast({
        title: 'Task created',
        description: 'Your task has been created successfully.',
      });
      
      // Refresh tasks
      fetchTasks();
      setIsFormOpen(false);
      
    } catch (error: any) {
      toast({
        title: 'Error creating task',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsProcessingAI(false);
    }
  };

  const handleUpdateTask = async (taskData: Partial<Task>) => {
    if (!taskData.id) return;
    
    try {
      // If title or description changed, re-analyze with AI
      let aiAnalysis = undefined;
      if (
        currentTask && 
        (currentTask.title !== taskData.title || currentTask.description !== taskData.description)
      ) {
        setIsProcessingAI(true);
        aiAnalysis = await analyzeTask(taskData.title!, taskData.description);
      }
      
      const { error } = await supabase
        .from('tasks')
        .update({
          ...taskData,
          ...(aiAnalysis ? { urgency: aiAnalysis.urgency } : {})
        })
        .eq('id', taskData.id);
        
      if (error) throw error;
      
      toast({
        title: 'Task updated',
        description: 'Your task has been updated successfully.',
      });
      
      // Refresh tasks
      fetchTasks();
      setIsFormOpen(false);
      setCurrentTask(undefined);
      
    } catch (error: any) {
      toast({
        title: 'Error updating task',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsProcessingAI(false);
    }
  };

  const handleDeleteTask = async (id: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      toast({
        title: 'Task deleted',
        description: 'Your task has been deleted successfully.',
      });
      
      // Refresh tasks
      fetchTasks();
      
    } catch (error: any) {
      toast({
        title: 'Error deleting task',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleEditTask = (task: Task) => {
    setCurrentTask(task);
    setIsFormOpen(true);
  };

  const handleStatusChange = async (id: string, status: Task['status']) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ status })
        .eq('id', id);
        
      if (error) throw error;
      
      // Refresh tasks
      fetchTasks();
      
    } catch (error: any) {
      toast({
        title: 'Error updating status',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleFilterChange = (filter: { status: string; search: string }) => {
    let filtered = [...tasks];
    
    // Filter by status
    if (filter.status !== 'all') {
      filtered = filtered.filter(task => task.status === filter.status);
    }
    
    // Filter by search query
    if (filter.search) {
      const searchLower = filter.search.toLowerCase();
      filtered = filtered.filter(task => 
        task.title.toLowerCase().includes(searchLower) || 
        (task.description && task.description.toLowerCase().includes(searchLower))
      );
    }
    
    setFilteredTasks(filtered);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header 
        username={username} 
        currentWorkspace={currentWorkspace}
        workspaces={workspaces}
        onWorkspaceChange={handleWorkspaceChange}
      />
      <main className="container px-4 md:px-6 py-8">
        <div className="grid gap-6">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold gradient-text">Dashboard</h2>
            <Button 
              onClick={() => { setCurrentTask(undefined); setIsFormOpen(true); }}
              className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Task
            </Button>
          </div>
          
          <div className="grid gap-6 md:grid-cols-4">
            <div className="md:col-span-3">
              <TaskStats tasks={tasks} />
            </div>
            <div>
              <MotivationalQuote />
            </div>
          </div>
          
          <TaskFilter onFilterChange={handleFilterChange} />
          
          {filteredTasks.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onDelete={handleDeleteTask}
                  onEdit={handleEditTask}
                  onStatusChange={handleStatusChange}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center glass-card p-8">
              <div className="text-5xl mb-4 float-animation">✨</div>
              <h3 className="text-2xl font-bold gradient-text">No tasks found</h3>
              <p className="text-white/70 mt-2 mb-6">
                {tasks.length > 0
                  ? "No tasks match your current filters."
                  : "You don't have any tasks yet. Let's create one!"}
              </p>
              {tasks.length === 0 && (
                <Button 
                  onClick={() => { setCurrentTask(undefined); setIsFormOpen(true); }}
                  className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Task
                </Button>
              )}
            </div>
          )}
        </div>
      </main>

      <TaskForm 
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={currentTask ? handleUpdateTask : handleCreateTask}
        task={currentTask}
        isProcessingAI={isProcessingAI}
        workspace={currentWorkspace}
      />
    </div>
  );
}
