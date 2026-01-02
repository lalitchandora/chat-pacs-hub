import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { pacsAPI } from '@/lib/api';
import { PACSConfiguration } from '@/types';
import { Plus, Trash2, Server, MapPin, Tag, Globe, Settings, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const PACSConfig = () => {
  const [configurations, setConfigurations] = useState<PACSConfiguration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    display_name: '',
    base_rs: '',
    location: '',
    tags: '',
  });
  const { toast } = useToast();

  useEffect(() => {
    loadConfigurations();
  }, []);

  const loadConfigurations = async () => {
    setIsLoading(true);
    const result = await pacsAPI.getConfigurations();
    if (result.configs) {
      setConfigurations(result.configs);
    } else {
      toast({
        title: 'Error',
        description: result.error || 'Failed to load configurations',
        variant: 'destructive',
      });
    }
    setIsLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.display_name.trim() || !formData.base_rs.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Display Name and Base RS URL are required fields.',
        variant: 'destructive',
      });
      return;
    }

    const tags = formData.tags
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);

    setIsSubmitting(true);
    const result = await pacsAPI.createConfiguration({
      display_name: formData.display_name.trim(),
      base_rs: formData.base_rs.trim(),
      location: formData.location.trim() || undefined,
      tags,
    });
    setIsSubmitting(false);

    if (result.config) {
      setFormData({ display_name: '', base_rs: '', location: '', tags: '' });
      setIsDialogOpen(false);
      loadConfigurations();
      toast({
        title: 'Configuration Added',
        description: 'The PACS configuration has been saved successfully.',
      });
    } else {
      toast({
        title: 'Error',
        description: result.error || 'Failed to create configuration',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string, name: string) => {
    const result = await pacsAPI.deleteConfiguration(id);
    if (result.success) {
      loadConfigurations();
      toast({
        title: 'Configuration Deleted',
        description: `"${name}" has been removed.`,
      });
    } else {
      toast({
        title: 'Error',
        description: result.error || 'Failed to delete configuration',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card/50 p-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Settings className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-foreground">PACS Configuration</h1>
              <p className="text-sm text-muted-foreground">Manage your imaging server connections</p>
            </div>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Configuration
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add PACS Configuration</DialogTitle>
                <DialogDescription>
                  Enter the details for the new PACS server connection.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="display_name">Display Name *</Label>
                  <Input
                    id="display_name"
                    placeholder="e.g., Hospital 1 – Mumbai PAC Server"
                    value={formData.display_name}
                    onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="base_rs">DICOMweb RS Base URL *</Label>
                  <Input
                    id="base_rs"
                    placeholder="e.g., http://host:port/dcm4chee-arc/aets/DCM/rs"
                    value={formData.base_rs}
                    onChange={(e) => setFormData({ ...formData, base_rs: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location (Optional)</Label>
                  <Input
                    id="location"
                    placeholder="e.g., Mumbai or Hyderabad"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tags">Tags (Optional, comma-separated)</Label>
                  <Input
                    id="tags"
                    placeholder="e.g., radiology, ct-scan, mri"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save Configuration'
                    )}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      {/* Content */}
      <ScrollArea className="flex-1 p-4">
        <div className="max-w-6xl mx-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">Loading configurations...</p>
            </div>
          ) : configurations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                <Server className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-xl font-semibold text-foreground mb-2">No Configurations</h2>
              <p className="text-muted-foreground max-w-md mb-6">
                You haven't added any PACS configurations yet. Add your first server connection to get started.
              </p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Configuration
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {configurations.map((config, index) => (
                <Card
                  key={config.id}
                  className={cn(
                    "group relative overflow-hidden border-border bg-card hover:border-primary/30 transition-all duration-300 animate-fade-in"
                  )}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Server className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-base">{config.display_name}</CardTitle>
                          {config.created_at && (
                            <CardDescription className="text-xs">
                              Added {new Date(config.created_at).toLocaleDateString()}
                            </CardDescription>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleDelete(config.id, config.display_name)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Globe className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground truncate">{config.base_rs}</span>
                    </div>
                    {config.location && (
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">{config.location}</span>
                      </div>
                    )}
                    {config.tags && config.tags.length > 0 && (
                      <div className="flex items-center gap-2 flex-wrap">
                        <Tag className="w-4 h-4 text-muted-foreground" />
                        {config.tags.map((tag, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default PACSConfig;
