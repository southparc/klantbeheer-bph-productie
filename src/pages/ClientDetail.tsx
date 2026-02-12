import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AdminLogin } from '@/components/AdminLogin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save, Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';

interface ClientData {
  id: string;
  supabase_auth_id: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string;
  phone: string | null;
  initials: string | null;
  prefix: string | null;
  gender: string | null;
  birth_date: string | null;
  age: number | null;
  city: string | null; // Added back for compatibility
  country: string | null;
  employment_type: string | null;
  planning_status: string | null;
  risk_profile: string | null;
  gross_income: number | null;
  net_monthly_income: number | null;
  net_monthly_spending: number | null;
  saving_balance: number | null;
  investment_balance: number | null;
  pension_income: number | null;
  retirement_target_age: number | null;
  monthly_fixed_costs: number | null;
  monthly_variable_costs: number | null;
  consumer_credit_amount: number | null;
  advisor_id: number | null; // Added back for compatibility
  
  // House data
  house_id: number | null;
  is_owner_occupied: boolean | null;
  home_value: number | null;
  mortgage_amount: number | null;
  mortgage_remaining: number | null;
  mortgage_interest_rate: number | null;
  annuity_amount: number | null;
  annuity_target_amount: number | null;
  energy_label: string | null;
  current_rent: number | null;
  
  // Contract data
  contract_id: number | null;
  dvo: number | null;
  max_loan: number | null;
  is_damage_client: boolean | null;
  
  // Insurance data
  insurance_id: number | null;
  disability_percentage: number | null;
  death_risk_assurance_amount: number | null;
  insurance_premiums_total: number | null;
  
  // Financial goals
  financial_goal_id: number | null;
  financial_goal_description: string | null;
  financial_goal_amount: number | null;
  goal_priority: string | null;
  
  // Liabilities
  liability_id: number | null;
  liability_total_amount: number | null;
  
  // Investments
  investment_id: number | null;
  investment_current_value: number | null;
  
  // Advisor
  advisor_name: string | null;
  advisor_email: string | null;
  
  // Partner
  partner_gross_income: number | null;
}

const ClientDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [hasChanges, setHasChanges] = useState(false);
  const [formData, setFormData] = useState<Partial<ClientData>>({});
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Check authentication status
  useEffect(() => {
    // Check current auth status
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const { data: advisors } = useQuery({
    queryKey: ['advisors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('advisors')
        .select('id, name')
        .order('name');
      
      if (error) throw error;
      return data;
    }
  });

  const { data: client, isLoading, error } = useQuery({
    queryKey: ['client', id],
    queryFn: async () => {
      if (!id) throw new Error('No client ID provided');
      
      // First get the basic client info to get the email
      const { data: basicClient, error: basicError } = await supabase
        .from('clients')
        .select('email')
        .eq('id', id)
        .maybeSingle();
      
      if (basicError) {
        console.error('Database error:', basicError);
        throw new Error(`Database error: ${basicError.message}`);
      }
      
      if (!basicClient) {
        throw new Error('Client not found. You may not have permission to view this client or the client may not exist.');
      }
      
      // Now use the full_client_v2 function to get comprehensive data
      const { data, error } = await supabase
        .rpc('full_client_v2', { p_email: basicClient.email });

      if (error) {
        console.error('Full client function error:', error);
        throw new Error(`Database error: ${error.message}`);
      }
      
      if (!data || data.length === 0) {
        throw new Error('Client data not found.');
      }
      
      return data[0] as ClientData;
    },
    enabled: !!id
  });

  const updateMutation = useMutation({
    mutationFn: async (updatedData: Partial<ClientData>) => {
      const { data, error } = await supabase.functions.invoke('update-client-data', {
        body: {
          clientId: id,
          updatedData
        }
      });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(`Update failed: ${error.message}`);
      }

      if (data?.error) {
        throw new Error(data.error);
      }
      
      return data?.data;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Client updated successfully",
      });
      setHasChanges(false);
      queryClient.invalidateQueries({ queryKey: ['client', id] });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc('delete_client_cascade', {
        p_client_id: id
      });
      if (error) throw new Error(`Verwijderen mislukt: ${error.message}`);
    },
    onSuccess: () => {
      toast({
        title: "Verwijderd",
        description: "Klant en alle gerelateerde data zijn verwijderd.",
      });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      navigate('/');
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Fout",
        description: error.message,
      });
    }
  });

  useEffect(() => {
    if (client) {
      setFormData(client);
      setHasChanges(false);
    }
  }, [client]);

  const handleSave = () => {
    updateMutation.mutate(formData);
  };

  const handleInputChange = (field: string, value: string | number | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value === '' ? null : value
    }));
    setHasChanges(true);
  };

  const handleReset = () => {
    setFormData(client);
    setHasChanges(false);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div>Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <AdminLogin onLoginSuccess={() => {}} />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-muted-foreground text-sm">Klantgegevens laden...</span>
        </div>
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-destructive text-sm">Fout bij laden klantgegevens</div>
          <Button variant="outline" onClick={() => navigate('/')} className="mt-4 rounded-xl">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Terug naar klanten
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky header */}
      <div className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="text-muted-foreground hover:text-foreground h-9 w-9 p-0">
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-lg font-semibold tracking-tight">
                  {client.first_name} {client.last_name}
                </h1>
                <p className="text-xs text-muted-foreground">{client.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive h-9 w-9 p-0">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="rounded-2xl">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Klant verwijderen?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Dit verwijdert {client?.first_name} {client?.last_name} en alle gerelateerde data
                      (woning, verzekeringen, contracten, doelen, etc.). Dit kan niet ongedaan worden gemaakt.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="rounded-xl">Annuleren</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => deleteMutation.mutate()}
                      className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {deleteMutation.isPending ? 'Verwijderen...' : 'Definitief verwijderen'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <div className="h-6 w-px bg-border" />
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleReset}
                disabled={!hasChanges || updateMutation.isPending}
                className="rounded-xl h-9 text-sm"
              >
                Reset
              </Button>
              <Button 
                onClick={handleSave} 
                disabled={!hasChanges || updateMutation.isPending}
                className="rounded-xl h-9 text-sm bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white shadow-sm shadow-teal-500/20"
              >
                <Save className="h-4 w-4 mr-1.5" />
                {updateMutation.isPending ? 'Opslaan...' : 'Opslaan'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-6 py-6">
        <Tabs defaultValue="personal" className="w-full">
          <TabsList className="grid w-full grid-cols-6 rounded-xl bg-muted/50 p-1 h-auto">
            <TabsTrigger value="personal" className="rounded-lg text-xs py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">Persoonlijk</TabsTrigger>
            <TabsTrigger value="financial" className="rounded-lg text-xs py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">Financieel</TabsTrigger>
            <TabsTrigger value="property" className="rounded-lg text-xs py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">Woning</TabsTrigger>
            <TabsTrigger value="insurance" className="rounded-lg text-xs py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">Verzekeringen</TabsTrigger>
            <TabsTrigger value="goals" className="rounded-lg text-xs py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">Doelen</TabsTrigger>
            <TabsTrigger value="advisor" className="rounded-lg text-xs py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">Adviseur</TabsTrigger>
          </TabsList>

          <TabsContent value="personal">
            <Card className="border-0 shadow-sm rounded-2xl mt-4">
              <CardHeader className="pb-4">
                <CardTitle className="text-base font-semibold">Persoonlijke gegevens</CardTitle>
                <CardDescription className="text-xs">Basisgegevens en contactinformatie</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="first_name">First Name</Label>
                  <Input
                    id="first_name"
                    value={formData.first_name || ''}
                    onChange={(e) => handleInputChange('first_name', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="last_name">Last Name</Label>
                  <Input
                    id="last_name"
                    value={formData.last_name || ''}
                    onChange={(e) => handleInputChange('last_name', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone || ''}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="birth_date">Birth Date</Label>
                  <Input
                    id="birth_date"
                    type="date"
                    value={formData.birth_date || ''}
                    onChange={(e) => handleInputChange('birth_date', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="gender">Gender</Label>
                  <Input
                    id="gender"
                    value={formData.gender || ''}
                    onChange={(e) => handleInputChange('gender', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={formData.city || ''}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    value={formData.country || ''}
                    onChange={(e) => handleInputChange('country', e.target.value)}
                  />
                </div>
                <div>
                  <Label>Advisor</Label>
                  <Select
                    value={formData.advisor_id?.toString() || 'none'}
                    onValueChange={(value) => handleInputChange('advisor_id', value === 'none' ? null : parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select an advisor...">
                        {formData.advisor_id 
                          ? advisors?.find(a => a.id === formData.advisor_id)?.name || 'Unknown advisor'
                          : 'No advisor assigned'
                        }
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No advisor assigned</SelectItem>
                      {advisors?.map((advisor) => (
                        <SelectItem key={advisor.id} value={advisor.id.toString()}>
                          {advisor.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="financial">
            <Card className="border-0 shadow-sm rounded-2xl mt-4">
              <CardHeader className="pb-4">
                <CardTitle className="text-base font-semibold">Financiële gegevens</CardTitle>
                <CardDescription className="text-xs">Inkomen, uitgaven en beleggingen</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="gross_income">Gross Income</Label>
                  <Input
                    id="gross_income"
                    type="text"
                    value={formData.gross_income ? formData.gross_income.toLocaleString('nl-NL') : ''}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\./g, '');
                      handleInputChange('gross_income', value ? parseFloat(value) : '');
                    }}
                  />
                </div>
                <div>
                  <Label htmlFor="net_monthly_income">Net Monthly Income</Label>
                  <Input
                    id="net_monthly_income"
                    type="text"
                    value={formData.net_monthly_income ? formData.net_monthly_income.toLocaleString('nl-NL') : ''}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\./g, '');
                      handleInputChange('net_monthly_income', value ? parseFloat(value) : '');
                    }}
                  />
                </div>
                <div>
                  <Label htmlFor="net_monthly_spending">Net Monthly Spending</Label>
                  <Input
                    id="net_monthly_spending"
                    type="text"
                    value={formData.net_monthly_spending ? formData.net_monthly_spending.toLocaleString('nl-NL') : ''}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\./g, '');
                      handleInputChange('net_monthly_spending', value ? parseFloat(value) : '');
                    }}
                  />
                </div>
                <div>
                  <Label htmlFor="saving_balance">Saving Balance</Label>
                  <Input
                    id="saving_balance"
                    type="text"
                    value={formData.saving_balance ? formData.saving_balance.toLocaleString('nl-NL') : ''}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\./g, '');
                      handleInputChange('saving_balance', value ? parseFloat(value) : '');
                    }}
                  />
                </div>
                <div>
                  <Label htmlFor="investment_balance">Investment Balance</Label>
                  <Input
                    id="investment_balance"
                    type="text"
                    value={formData.investment_balance ? formData.investment_balance.toLocaleString('nl-NL') : ''}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\./g, '');
                      handleInputChange('investment_balance', value ? parseFloat(value) : '');
                    }}
                  />
                </div>
                <div>
                  <Label htmlFor="pension_income">Pension Income</Label>
                  <Input
                    id="pension_income"
                    type="text"
                    value={formData.pension_income ? formData.pension_income.toLocaleString('nl-NL') : ''}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\./g, '');
                      handleInputChange('pension_income', value ? parseFloat(value) : '');
                    }}
                  />
                </div>
                <div>
                  <Label htmlFor="retirement_target_age">Retirement Target Age</Label>
                  <Input
                    id="retirement_target_age"
                    type="number"
                    value={formData.retirement_target_age || ''}
                    onChange={(e) => handleInputChange('retirement_target_age', parseInt(e.target.value))}
                  />
                </div>
                <div>
                  <Label htmlFor="risk_profile">Risk Profile</Label>
                  <Select
                    value={formData.risk_profile || ''}
                    onValueChange={(value) => handleInputChange('risk_profile', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select risk profile..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Zeer defensief">Zeer defensief</SelectItem>
                      <SelectItem value="Defensief">Defensief</SelectItem>
                      <SelectItem value="Neutraal">Neutraal</SelectItem>
                      <SelectItem value="Offensief">Offensief</SelectItem>
                      <SelectItem value="Zeer offensief">Zeer offensief</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="property">
            <Card className="border-0 shadow-sm rounded-2xl mt-4">
              <CardHeader className="pb-4">
                <CardTitle className="text-base font-semibold">Woninggegevens</CardTitle>
                <CardDescription className="text-xs">Woning en hypotheek details</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="is_owner_occupied">Owner Occupied</Label>
                    <Select
                      value={formData.is_owner_occupied ? 'true' : 'false'}
                      onValueChange={(value) => handleInputChange('is_owner_occupied', value === 'true' ? true : false)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Yes</SelectItem>
                        <SelectItem value="false">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="home_value">Home Value</Label>
                    <Input
                      id="home_value"
                      type="text"
                      value={formData.home_value ? formData.home_value.toLocaleString('nl-NL') : ''}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\./g, '');
                        handleInputChange('home_value', value ? parseFloat(value) : '');
                      }}
                    />
                  </div>
                  <div>
                    <Label htmlFor="mortgage_amount">Mortgage Amount</Label>
                    <Input
                      id="mortgage_amount"
                      type="text"
                      value={formData.mortgage_amount ? formData.mortgage_amount.toLocaleString('nl-NL') : ''}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\./g, '');
                        handleInputChange('mortgage_amount', value ? parseFloat(value) : '');
                      }}
                    />
                  </div>
                  <div>
                    <Label htmlFor="mortgage_remaining">Mortgage Remaining</Label>
                    <Input
                      id="mortgage_remaining"
                      type="text"
                      value={formData.mortgage_remaining ? formData.mortgage_remaining.toLocaleString('nl-NL') : ''}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\./g, '');
                        handleInputChange('mortgage_remaining', value ? parseFloat(value) : '');
                      }}
                    />
                  </div>
                  <div>
                    <Label htmlFor="mortgage_interest_rate">Interest Rate (%)</Label>
                    <Input
                      id="mortgage_interest_rate"
                      type="number"
                      step="0.01"
                      value={formData.mortgage_interest_rate || ''}
                      onChange={(e) => handleInputChange('mortgage_interest_rate', parseFloat(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="annuity_amount">Annuity Amount</Label>
                    <Input
                      id="annuity_amount"
                      type="text"
                      value={formData.annuity_amount ? formData.annuity_amount.toLocaleString('nl-NL') : ''}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\./g, '');
                        handleInputChange('annuity_amount', value ? parseFloat(value) : '');
                      }}
                    />
                  </div>
                  <div>
                    <Label htmlFor="annuity_target_amount">Annuity Target</Label>
                    <Input
                      id="annuity_target_amount"
                      type="text"
                      value={formData.annuity_target_amount ? formData.annuity_target_amount.toLocaleString('nl-NL') : ''}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\./g, '');
                        handleInputChange('annuity_target_amount', value ? parseFloat(value) : '');
                      }}
                    />
                  </div>
                  <div>
                    <Label htmlFor="energy_label">Energy Label</Label>
                    <Select
                      value={formData.energy_label || ''}
                      onValueChange={(value) => handleInputChange('energy_label', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select energy label..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A++">A++</SelectItem>
                        <SelectItem value="A+">A+</SelectItem>
                        <SelectItem value="A">A</SelectItem>
                        <SelectItem value="B">B</SelectItem>
                        <SelectItem value="C">C</SelectItem>
                        <SelectItem value="D">D</SelectItem>
                        <SelectItem value="E">E</SelectItem>
                        <SelectItem value="F">F</SelectItem>
                        <SelectItem value="G">G</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="current_rent">Current Rent</Label>
                    <Input
                      id="current_rent"
                      type="text"
                      value={formData.current_rent ? formData.current_rent.toLocaleString('nl-NL') : ''}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\./g, '');
                        handleInputChange('current_rent', value ? parseFloat(value) : '');
                      }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="insurance">
            <Card className="border-0 shadow-sm rounded-2xl mt-4">
              <CardHeader className="pb-4">
                <CardTitle className="text-base font-semibold">Verzekeringen</CardTitle>
                <CardDescription className="text-xs">Polissen en dekking</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="disability_percentage">Disability Percentage (%)</Label>
                    <Input
                      id="disability_percentage"
                      type="number"
                      min="0"
                      max="100"
                      value={formData.disability_percentage || ''}
                      onChange={(e) => handleInputChange('disability_percentage', parseInt(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="death_risk_assurance_amount">Death Risk Assurance</Label>
                    <Input
                      id="death_risk_assurance_amount"
                      type="text"
                      value={formData.death_risk_assurance_amount ? formData.death_risk_assurance_amount.toLocaleString('nl-NL') : ''}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\./g, '');
                        handleInputChange('death_risk_assurance_amount', value ? parseFloat(value) : '');
                      }}
                    />
                  </div>
                  <div>
                    <Label htmlFor="insurance_premiums_total">Total Insurance Premiums</Label>
                    <Input
                      id="insurance_premiums_total"
                      type="text"
                      value={formData.insurance_premiums_total ? formData.insurance_premiums_total.toLocaleString('nl-NL') : ''}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\./g, '');
                        handleInputChange('insurance_premiums_total', value ? parseFloat(value) : '');
                      }}
                    />
                  </div>
                  <div>
                    <Label htmlFor="is_damage_client">Is Damage Client</Label>
                    <Select
                      value={formData.is_damage_client ? 'true' : 'false'}
                      onValueChange={(value) => handleInputChange('is_damage_client', value === 'true' ? true : false)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Yes</SelectItem>
                        <SelectItem value="false">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="dvo">DVO</Label>
                    <Input
                      id="dvo"
                      type="text"
                      value={formData.dvo ? formData.dvo.toLocaleString('nl-NL') : ''}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\./g, '');
                        handleInputChange('dvo', value ? parseFloat(value) : '');
                      }}
                    />
                  </div>
                  <div>
                    <Label htmlFor="max_loan">Max Loan</Label>
                    <Input
                      id="max_loan"
                      type="text"
                      value={formData.max_loan ? formData.max_loan.toLocaleString('nl-NL') : ''}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\./g, '');
                        handleInputChange('max_loan', value ? parseFloat(value) : '');
                      }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="goals">
            <Card className="border-0 shadow-sm rounded-2xl mt-4">
              <CardHeader className="pb-4">
                <CardTitle className="text-base font-semibold">Doelen & Beleggingen</CardTitle>
                <CardDescription className="text-xs">Doelen, beleggingen en schulden</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Financial Goals */}
                <div>
                  <h4 className="font-semibold mb-3">Financial Goals</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="financial_goal_description">Goal Description</Label>
                      <Input
                        id="financial_goal_description"
                        type="text"
                        value={formData.financial_goal_description || ''}
                        onChange={(e) => handleInputChange('financial_goal_description', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="financial_goal_amount">Goal Amount</Label>
                      <Input
                        id="financial_goal_amount"
                        type="text"
                        value={formData.financial_goal_amount ? formData.financial_goal_amount.toLocaleString('nl-NL') : ''}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\./g, '');
                          handleInputChange('financial_goal_amount', value ? parseFloat(value) : '');
                        }}
                      />
                    </div>
                    <div>
                      <Label htmlFor="goal_priority">Priority</Label>
                      <Select
                        value={formData.goal_priority || ''}
                        onValueChange={(value) => handleInputChange('goal_priority', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Hoog">Hoog</SelectItem>
                          <SelectItem value="Gemiddeld">Gemiddeld</SelectItem>
                          <SelectItem value="Laag">Laag</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Investments */}
                <div>
                  <h4 className="font-semibold mb-3">Investments</h4>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <Label htmlFor="investment_current_value">Total Investment Value</Label>
                      <Input
                        id="investment_current_value"
                        type="text"
                        value={formData.investment_current_value ? formData.investment_current_value.toLocaleString('nl-NL') : ''}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\./g, '');
                          handleInputChange('investment_current_value', value ? parseFloat(value) : '');
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Liabilities */}
                <div>
                  <h4 className="font-semibold mb-3">Liabilities</h4>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <Label htmlFor="liability_total_amount">Total Liabilities</Label>
                      <Input
                        id="liability_total_amount"
                        type="text"
                        value={formData.liability_total_amount ? formData.liability_total_amount.toLocaleString('nl-NL') : ''}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\./g, '');
                          handleInputChange('liability_total_amount', value ? parseFloat(value) : '');
                        }}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="advisor">
            <Card className="border-0 shadow-sm rounded-2xl mt-4">
              <CardHeader className="pb-4">
                <CardTitle className="text-base font-semibold">Adviseur & Partner</CardTitle>
                <CardDescription className="text-xs">Gekoppelde adviseur en partnergegevens</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Advisor Info */}
                <div>
                  <h4 className="font-semibold mb-3">Assigned Advisor</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="advisor_name">Advisor Name</Label>
                      <Input
                        id="advisor_name"
                        type="text"
                        value={formData.advisor_name || ''}
                        onChange={(e) => handleInputChange('advisor_name', e.target.value)}
                        placeholder="No advisor assigned"
                      />
                    </div>
                    <div>
                      <Label htmlFor="advisor_email">Advisor Email</Label>
                      <Input
                        id="advisor_email"
                        type="email"
                        value={formData.advisor_email || ''}
                        onChange={(e) => handleInputChange('advisor_email', e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Partner Info */}
                <div>
                  <h4 className="font-semibold mb-3">Partner Information</h4>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <Label htmlFor="partner_gross_income">Partner Gross Income</Label>
                      <Input
                        id="partner_gross_income"
                        type="text"
                        value={formData.partner_gross_income ? formData.partner_gross_income.toLocaleString('nl-NL') : ''}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\./g, '');
                          handleInputChange('partner_gross_income', value ? parseFloat(value) : '');
                        }}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ClientDetail;