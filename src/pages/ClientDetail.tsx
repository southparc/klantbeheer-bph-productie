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
  first_name: string | null;
  last_name: string | null;
  email: string;
  phone: string | null;
  birth_date: string | null;
  gender: string | null;
  city: string | null;
  country: string | null;
  gross_income: number | null;
  net_monthly_income: number | null;
  net_monthly_spending: number | null;
  saving_balance: number | null;
  investment_balance: number | null;
  pension_income: number | null;
  retirement_target_age: number | null;
  risk_profile: string | null;
  advisor_id: number | null;
  house_objects: Array<{
    id: number;
    display_name: string | null;
    home_value: number | null;
    mortgage_amount: number | null;
    mortgage_remaining: number | null;
    mortgage_interest_rate: number | null;
    energy_label: string | null;
  }>;
  insurances: Array<{
    id: number;
    display_name: string | null;
    type: string | null;
    value: number | null;
  }>;
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
      
      const { data, error } = await supabase
        .from('clients')
        .select(`
          *,
          house_objects(*),
          insurances(*),
          investments(*),
          liabilities(*),
          partners(*),
          pensions(*),
          financial_goals(*)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as ClientData;
    },
    enabled: !!id
  });

  const updateMutation = useMutation({
    mutationFn: async (updatedData: Partial<ClientData>) => {
      const { data, error } = await supabase
        .from('clients')
        .update(updatedData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
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
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="personal">Personal Info</TabsTrigger>
            <TabsTrigger value="financial">Financial</TabsTrigger>
            <TabsTrigger value="property">Property</TabsTrigger>
            <TabsTrigger value="insurance">Insurance</TabsTrigger>
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
                {client.house_objects && client.house_objects.length > 0 ? (
                  <div className="space-y-4">
                    {client.house_objects.map((house, index) => (
                      <div key={house.id} className="border rounded-lg p-4">
                        <h4 className="font-semibold mb-2">Property {index + 1}</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Name</Label>
                            <Input value={house.display_name || '-'} disabled />
                          </div>
                          <div>
                            <Label>Home Value</Label>
                            <Input value={house.home_value ? `€${house.home_value.toLocaleString('nl-NL')}` : '-'} disabled />
                          </div>
                          <div>
                            <Label>Mortgage Amount</Label>
                            <Input value={house.mortgage_amount ? `€${house.mortgage_amount.toLocaleString('nl-NL')}` : '-'} disabled />
                          </div>
                          <div>
                            <Label>Mortgage Remaining</Label>
                            <Input value={house.mortgage_remaining ? `€${house.mortgage_remaining.toLocaleString('nl-NL')}` : '-'} disabled />
                          </div>
                          <div>
                            <Label>Interest Rate</Label>
                            <Input value={house.mortgage_interest_rate ? `${house.mortgage_interest_rate}%` : '-'} disabled />
                          </div>
                          <div>
                            <Label>Energy Label</Label>
                            <Input value={house.energy_label || '-'} disabled />
                          </div>
                        </div>
                      </div>
                    ))}
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
                {client.insurances && client.insurances.length > 0 ? (
                  <div className="space-y-4">
                    {client.insurances.map((insurance, index) => (
                      <div key={insurance.id} className="border rounded-lg p-4">
                        <h4 className="font-semibold mb-2">Insurance {index + 1}</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Name</Label>
                            <Input value={insurance.display_name || '-'} disabled />
                          </div>
                          <div>
                            <Label>Type</Label>
                            <Input value={insurance.type || '-'} disabled />
                          </div>
                          <div>
                            <Label>Value</Label>
                            <Input value={insurance.value ? `€${insurance.value.toLocaleString('nl-NL')}` : '-'} disabled />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No insurance information available</p>
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