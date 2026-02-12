import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

interface AdminLoginProps {
  onLoginSuccess: () => void;
}

export const AdminLogin = ({ onLoginSuccess }: AdminLoginProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast({
          variant: "destructive",
          title: "Login mislukt",
          description: error.message,
        });
      } else {
        toast({
          title: "Ingelogd",
          description: "Welkom terug!",
        });
        onLoginSuccess();
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Fout",
        description: "Er is een onverwachte fout opgetreden",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 via-white to-cyan-50">
      <div className="w-full max-w-sm mx-4">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-600 shadow-lg shadow-teal-500/20 mb-4">
            <span className="text-2xl font-bold text-white">F</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">FinnApp</h1>
          <p className="text-sm text-muted-foreground mt-1">Klantbeheer Dashboard</p>
        </div>
        <Card className="border-0 shadow-xl shadow-gray-200/50 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Inloggen</CardTitle>
            <CardDescription>
              Log in om het klantbeheersysteem te openen
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-11 rounded-xl bg-muted/50 border-0 focus-visible:ring-teal-500"
                />
              </div>
              <div className="space-y-2">
                <Input
                  type="password"
                  placeholder="Wachtwoord"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-11 rounded-xl bg-muted/50 border-0 focus-visible:ring-teal-500"
                />
              </div>
              <Button type="submit" className="w-full h-11 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white font-medium shadow-md shadow-teal-500/20 transition-all" disabled={loading}>
                {loading ? "Inloggen..." : "Inloggen"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};