import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save } from 'lucide-react';
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

  useEffect(() => {
    if (client) {
      setFormData(client);
      setHasChanges(false);
    }
  }, [client]);

  const handleSave = () => {
    updateMutation.mutate(formData);
  };

  const handleInputChange = (field: string, value: string | number) => {
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto py-8">
          <div className="text-center">Loading client details...</div>
        </div>
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto py-8">
          <div className="text-center text-destructive">
            Error loading client details
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => navigate('/')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Clients
            </Button>
            <h1 className="text-3xl font-bold">
              {client.first_name} {client.last_name}
            </h1>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={handleReset}
              disabled={!hasChanges || updateMutation.isPending}
            >
              Reset
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={!hasChanges || updateMutation.isPending}
            >
              <Save className="h-4 w-4 mr-2" />
              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>

        <Tabs defaultValue="personal" className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="personal">Personal</TabsTrigger>
            <TabsTrigger value="financial">Financial</TabsTrigger>
            <TabsTrigger value="property">Property</TabsTrigger>
            <TabsTrigger value="insurance">Insurance</TabsTrigger>
            <TabsTrigger value="goals">Goals</TabsTrigger>
            <TabsTrigger value="advisor">Advisor</TabsTrigger>
          </TabsList>

          <TabsContent value="personal">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>Basic client details and contact information</CardDescription>
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
            <Card>
              <CardHeader>
                <CardTitle>Financial Information</CardTitle>
                <CardDescription>Income, expenses, and investment details</CardDescription>
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
            <Card>
              <CardHeader>
                <CardTitle>Property Information</CardTitle>
                <CardDescription>House and mortgage details</CardDescription>
              </CardHeader>
              <CardContent>
                {client.house_id ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Owner Occupied</Label>
                      <Input value={client.is_owner_occupied ? 'Yes' : 'No'} disabled />
                    </div>
                    <div>
                      <Label>Home Value</Label>
                      <Input value={client.home_value ? `€${client.home_value.toLocaleString('nl-NL')}` : '-'} disabled />
                    </div>
                    <div>
                      <Label>Mortgage Amount</Label>
                      <Input value={client.mortgage_amount ? `€${client.mortgage_amount.toLocaleString('nl-NL')}` : '-'} disabled />
                    </div>
                    <div>
                      <Label>Mortgage Remaining</Label>
                      <Input value={client.mortgage_remaining ? `€${client.mortgage_remaining.toLocaleString('nl-NL')}` : '-'} disabled />
                    </div>
                    <div>
                      <Label>Interest Rate</Label>
                      <Input value={client.mortgage_interest_rate ? `${client.mortgage_interest_rate}%` : '-'} disabled />
                    </div>
                    <div>
                      <Label>Annuity Amount</Label>
                      <Input value={client.annuity_amount ? `€${client.annuity_amount.toLocaleString('nl-NL')}` : '-'} disabled />
                    </div>
                    <div>
                      <Label>Annuity Target</Label>
                      <Input value={client.annuity_target_amount ? `€${client.annuity_target_amount.toLocaleString('nl-NL')}` : '-'} disabled />
                    </div>
                    <div>
                      <Label>Energy Label</Label>
                      <Input value={client.energy_label || '-'} disabled />
                    </div>
                    <div>
                      <Label>Current Rent</Label>
                      <Input value={client.current_rent ? `€${client.current_rent.toLocaleString('nl-NL')}` : '-'} disabled />
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">No property information available</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="insurance">
            <Card>
              <CardHeader>
                <CardTitle>Insurance Information</CardTitle>
                <CardDescription>Insurance policies and coverage</CardDescription>
              </CardHeader>
              <CardContent>
                {client.insurance_id ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Disability Percentage</Label>
                      <Input value={client.disability_percentage ? `${client.disability_percentage}%` : '-'} disabled />
                    </div>
                    <div>
                      <Label>Death Risk Assurance</Label>
                      <Input value={client.death_risk_assurance_amount ? `€${client.death_risk_assurance_amount.toLocaleString('nl-NL')}` : '-'} disabled />
                    </div>
                    <div>
                      <Label>Total Insurance Premiums</Label>
                      <Input value={client.insurance_premiums_total ? `€${client.insurance_premiums_total.toLocaleString('nl-NL')}` : '-'} disabled />
                    </div>
                    <div>
                      <Label>Is Damage Client</Label>
                      <Input value={client.is_damage_client ? 'Yes' : 'No'} disabled />
                    </div>
                    {client.dvo && (
                      <div>
                        <Label>DVO</Label>
                        <Input value={`€${client.dvo.toLocaleString('nl-NL')}`} disabled />
                      </div>
                    )}
                    {client.max_loan && (
                      <div>
                        <Label>Max Loan</Label>
                        <Input value={`€${client.max_loan.toLocaleString('nl-NL')}`} disabled />
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No insurance information available</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="goals">
            <Card>
              <CardHeader>
                <CardTitle>Financial Goals & Investments</CardTitle>
                <CardDescription>Goals, investments, and liabilities</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Financial Goals */}
                {client.financial_goal_id && (
                  <div>
                    <h4 className="font-semibold mb-3">Financial Goals</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Goal Description</Label>
                        <Input value={client.financial_goal_description || '-'} disabled />
                      </div>
                      <div>
                        <Label>Goal Amount</Label>
                        <Input value={client.financial_goal_amount ? `€${client.financial_goal_amount.toLocaleString('nl-NL')}` : '-'} disabled />
                      </div>
                      <div>
                        <Label>Priority</Label>
                        <Input value={client.goal_priority || '-'} disabled />
                      </div>
                    </div>
                  </div>
                )}

                {/* Investments */}
                {client.investment_current_value && (
                  <div>
                    <h4 className="font-semibold mb-3">Investments</h4>
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <Label>Total Investment Value</Label>
                        <Input value={`€${client.investment_current_value.toLocaleString('nl-NL')}`} disabled />
                      </div>
                    </div>
                  </div>
                )}

                {/* Liabilities */}
                {client.liability_total_amount && (
                  <div>
                    <h4 className="font-semibold mb-3">Liabilities</h4>
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <Label>Total Liabilities</Label>
                        <Input value={`€${client.liability_total_amount.toLocaleString('nl-NL')}`} disabled />
                      </div>
                    </div>
                  </div>
                )}

                {!client.financial_goal_id && !client.investment_current_value && !client.liability_total_amount && (
                  <p className="text-muted-foreground">No financial goals, investments, or liabilities information available</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="advisor">
            <Card>
              <CardHeader>
                <CardTitle>Advisor & Partner Information</CardTitle>
                <CardDescription>Assigned advisor and partner details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Advisor Info */}
                <div>
                  <h4 className="font-semibold mb-3">Assigned Advisor</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Advisor Name</Label>
                      <Input value={client.advisor_name || 'No advisor assigned'} disabled />
                    </div>
                    <div>
                      <Label>Advisor Email</Label>
                      <Input value={client.advisor_email || '-'} disabled />
                    </div>
                  </div>
                </div>

                {/* Partner Info */}
                {client.partner_gross_income && (
                  <div>
                    <h4 className="font-semibold mb-3">Partner Information</h4>
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <Label>Partner Gross Income</Label>
                        <Input value={`€${client.partner_gross_income.toLocaleString('nl-NL')}`} disabled />
                      </div>
                    </div>
                  </div>
                )}

                {!client.advisor_name && !client.partner_gross_income && (
                  <p className="text-muted-foreground">No advisor or partner information available</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ClientDetail;