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
        // supabase_auth_id is NOT set here — it gets linked when the client
        // first logs into the FinnApp via link_client_auth_id RPC.
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

  const inputClass = "h-11 rounded-xl bg-muted/50 border-0 focus-visible:ring-teal-500";
  const selectTriggerClass = "h-11 rounded-xl bg-muted/50 border-0 focus:ring-teal-500";

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky header */}
      <div className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="text-muted-foreground hover:text-foreground h-9 w-9 p-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold tracking-tight">Nieuwe klant</h1>
              <p className="text-xs text-muted-foreground">Vul de gegevens in om een klant toe te voegen</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-6 py-6">
        <Card className="max-w-2xl mx-auto border-0 shadow-sm rounded-2xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-teal-50">
                <Plus className="h-4 w-4 text-teal-600" />
              </div>
              Klantgegevens
            </CardTitle>
            <CardDescription className="text-xs">
              Verplichte velden zijn gemarkeerd met *
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="first_name" className="text-xs font-medium text-muted-foreground">Voornaam *</Label>
                  <Input
                    id="first_name"
                    value={formData.first_name}
                    onChange={(e) => handleInputChange("first_name", e.target.value)}
                    placeholder="Voornaam"
                    required
                    className={inputClass}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="last_name" className="text-xs font-medium text-muted-foreground">Achternaam *</Label>
                  <Input
                    id="last_name"
                    value={formData.last_name}
                    onChange={(e) => handleInputChange("last_name", e.target.value)}
                    placeholder="Achternaam"
                    required
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-medium text-muted-foreground">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="email@voorbeeld.nl"
                  required
                  className={inputClass}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="phone" className="text-xs font-medium text-muted-foreground">Telefoon</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    placeholder="06-12345678"
                    className={inputClass}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="company" className="text-xs font-medium text-muted-foreground">Bedrijf</Label>
                  <Input
                    id="company"
                    value={formData.company}
                    onChange={(e) => handleInputChange("company", e.target.value)}
                    placeholder="Bedrijfsnaam"
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="advisor" className="text-xs font-medium text-muted-foreground">Adviseur</Label>
                <Select
                  value={formData.advisor_id}
                  onValueChange={(value) => handleInputChange("advisor_id", value)}
                >
                  <SelectTrigger className={selectTriggerClass}>
                    <SelectValue placeholder="Selecteer een adviseur" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
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
                <div className="space-y-1.5">
                  <Label htmlFor="city" className="text-xs font-medium text-muted-foreground">Stad</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => handleInputChange("city", e.target.value)}
                    placeholder="Stad"
                    className={inputClass}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="country" className="text-xs font-medium text-muted-foreground">Land</Label>
                  <Input
                    id="country"
                    value={formData.country}
                    onChange={(e) => handleInputChange("country", e.target.value)}
                    placeholder="Land"
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="risk_profile" className="text-xs font-medium text-muted-foreground">Risicoprofiel</Label>
                  <Select
                    value={formData.risk_profile}
                    onValueChange={(value) => handleInputChange("risk_profile", value)}
                  >
                    <SelectTrigger className={selectTriggerClass}>
                      <SelectValue placeholder="Selecteer risicoprofiel" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="conservatief">Conservatief</SelectItem>
                      <SelectItem value="gematigd">Gematigd</SelectItem>
                      <SelectItem value="offensief">Offensief</SelectItem>
                      <SelectItem value="zeer offensief">Zeer Offensief</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="gross_income" className="text-xs font-medium text-muted-foreground">Bruto Inkomen (€)</Label>
                  <Input
                    id="gross_income"
                    type="number"
                    step="0.01"
                    value={formData.gross_income}
                    onChange={(e) => handleInputChange("gross_income", e.target.value)}
                    placeholder="0"
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => navigate("/")} className="rounded-xl h-10 px-5 text-sm">
                  Annuleren
                </Button>
                <Button type="submit" disabled={isSubmitting} className="rounded-xl h-10 px-5 text-sm bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white shadow-sm shadow-teal-500/20">
                  {isSubmitting ? "Aanmaken..." : "Klant aanmaken"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}