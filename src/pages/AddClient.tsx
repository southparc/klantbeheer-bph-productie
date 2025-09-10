import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AddClient() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    advisor_id: "",
    company: "",
    city: "",
    country: "Nederland",
    risk_profile: "",
    gross_income: "",
  });

  // Fetch advisors for the dropdown
  const { data: advisors, isLoading: advisorsLoading } = useQuery({
    queryKey: ["advisors"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("advisors")
        .select("id, name")
        .order("name");
      
      if (error) throw error;
      return data;
    },
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.first_name || !formData.last_name || !formData.email) {
      toast({
        title: "Validatiefout",
        description: "Vul alle verplichte velden in (Voornaam, Achternaam, Email)",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("Gebruiker niet geauthenticeerd");
      }

      const clientData = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        phone: formData.phone || null,
        advisor_id: formData.advisor_id ? parseInt(formData.advisor_id) : null,
        company: formData.company || null,
        city: formData.city || null,
        country: formData.country || null,
        risk_profile: formData.risk_profile || null,
        gross_income: formData.gross_income ? parseFloat(formData.gross_income) : null,
        supabase_auth_id: user.id,
      };

      const { data, error } = await supabase
        .from("clients")
        .insert([clientData])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Gelukt",
        description: "Klant is succesvol aangemaakt!",
      });

      navigate(`/client/${data.id}`);
    } catch (error: any) {
      console.error("Error creating client:", error);
      toast({
        title: "Fout",
        description: error.message || "Kon klant niet aanmaken",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" onClick={() => navigate("/")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Terug naar Klanten
          </Button>
        </div>

        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Nieuwe Klant Toevoegen
            </CardTitle>
            <CardDescription>
              Vul de klantgegevens hieronder in. Verplichte velden zijn gemarkeerd met *.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name">Voornaam *</Label>
                  <Input
                    id="first_name"
                    value={formData.first_name}
                    onChange={(e) => handleInputChange("first_name", e.target.value)}
                    placeholder="Voer voornaam in"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name">Achternaam *</Label>
                  <Input
                    id="last_name"
                    value={formData.last_name}
                    onChange={(e) => handleInputChange("last_name", e.target.value)}
                    placeholder="Voer achternaam in"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="Voer emailadres in"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefoon</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    placeholder="Voer telefoonnummer in"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company">Bedrijf</Label>
                  <Input
                    id="company"
                    value={formData.company}
                    onChange={(e) => handleInputChange("company", e.target.value)}
                    placeholder="Voer bedrijfsnaam in"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="advisor">Adviseur</Label>
                <Select
                  value={formData.advisor_id}
                  onValueChange={(value) => handleInputChange("advisor_id", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecteer een adviseur" />
                  </SelectTrigger>
                  <SelectContent>
                    {advisorsLoading ? (
                      <div className="px-2 py-1.5 text-sm text-muted-foreground">Adviseurs laden...</div>
                    ) : (
                      advisors?.map((advisor) => (
                        <SelectItem key={advisor.id} value={advisor.id.toString()}>
                          {advisor.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">Stad</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => handleInputChange("city", e.target.value)}
                    placeholder="Voer stad in"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Land</Label>
                  <Input
                    id="country"
                    value={formData.country}
                    onChange={(e) => handleInputChange("country", e.target.value)}
                    placeholder="Voer land in"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="risk_profile">Risicoprofiel</Label>
                  <Select
                    value={formData.risk_profile}
                    onValueChange={(value) => handleInputChange("risk_profile", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecteer risicoprofiel" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="conservatief">Conservatief</SelectItem>
                      <SelectItem value="gematigd">Gematigd</SelectItem>
                      <SelectItem value="offensief">Offensief</SelectItem>
                      <SelectItem value="zeer offensief">Zeer Offensief</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gross_income">Bruto Inkomen (€)</Label>
                  <Input
                    id="gross_income"
                    type="number"
                    step="0.01"
                    value={formData.gross_income}
                    onChange={(e) => handleInputChange("gross_income", e.target.value)}
                    placeholder="Voer bruto inkomen in"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => navigate("/")}>
                  Annuleren
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Aanmaken..." : "Klant Aanmaken"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}