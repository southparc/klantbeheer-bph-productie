import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ArrowLeft, Plus, Pencil, Building2, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface OfficeRow {
  id: number;
  name: string;
  city: string | null;
  is_active: boolean;
  advisor_count?: number;
}

export default function AdminOffices() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingOffice, setEditingOffice] = useState<OfficeRow | null>(null);
  const [formData, setFormData] = useState({ name: "", city: "" });

  const { data: offices, isLoading } = useQuery({
    queryKey: ["offices_admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("offices")
        .select("*")
        .order("name");
      if (error) throw error;

      // Get advisor counts per office
      const { data: advisors } = await supabase
        .from("advisors")
        .select("office_id");

      const counts: Record<number, number> = {};
      advisors?.forEach((a: any) => {
        if (a.office_id) {
          counts[a.office_id] = (counts[a.office_id] || 0) + 1;
        }
      });

      return (data as OfficeRow[]).map((o) => ({
        ...o,
        advisor_count: counts[o.id] || 0,
      }));
    },
  });

  const resetForm = () => setFormData({ name: "", city: "" });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("offices").insert({
        name: formData.name,
        city: formData.city || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["offices_admin"] });
      setShowAddDialog(false);
      resetForm();
      toast({ title: "Kantoor aangemaakt" });
    },
    onError: (err: any) => {
      toast({ variant: "destructive", title: "Fout", description: err.message });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!editingOffice) return;
      const { error } = await supabase
        .from("offices")
        .update({
          name: formData.name,
          city: formData.city || null,
        })
        .eq("id", editingOffice.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["offices_admin"] });
      setEditingOffice(null);
      resetForm();
      toast({ title: "Kantoor bijgewerkt" });
    },
    onError: (err: any) => {
      toast({ variant: "destructive", title: "Fout", description: err.message });
    },
  });

  const openEdit = (office: OfficeRow) => {
    setFormData({ name: office.name, city: office.city || "" });
    setEditingOffice(office);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="text-muted-foreground hover:text-foreground h-9 w-9 p-0">
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-lg font-semibold tracking-tight">Kantoorbeheer</h1>
                <p className="text-xs text-muted-foreground">Kantoren en hun adviseurs</p>
              </div>
            </div>
            <Button
              onClick={() => { resetForm(); setShowAddDialog(true); }}
              className="rounded-xl bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white shadow-sm shadow-teal-500/20 h-9 px-4 text-sm"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Kantoor toevoegen
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-6 py-6">
        <div className="bg-card rounded-2xl border shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="h-11 bg-muted/30 hover:bg-muted/30">
                <TableHead className="h-11 py-2 text-xs font-medium text-muted-foreground">Kantoor</TableHead>
                <TableHead className="h-11 py-2 text-xs font-medium text-muted-foreground">Stad</TableHead>
                <TableHead className="h-11 py-2 text-xs font-medium text-muted-foreground">Adviseurs</TableHead>
                <TableHead className="h-11 py-2 text-xs font-medium text-muted-foreground">Status</TableHead>
                <TableHead className="h-11 py-2 text-xs font-medium text-muted-foreground w-20">Acties</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <div className="flex items-center justify-center gap-3">
                      <div className="w-5 h-5 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
                      <span className="text-muted-foreground text-sm">Laden...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                offices?.map((office) => (
                  <TableRow key={office.id} className="h-10">
                    <TableCell className="py-2 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-teal-50">
                          <Building2 className="h-3.5 w-3.5 text-teal-600" />
                        </div>
                        <span className="font-medium">{office.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-2 text-sm text-muted-foreground">{office.city || "-"}</TableCell>
                    <TableCell className="py-2 text-sm">
                      <span className="inline-flex items-center gap-1 text-muted-foreground">
                        <Users className="h-3 w-3" />
                        {office.advisor_count}
                      </span>
                    </TableCell>
                    <TableCell className="py-2 text-sm">
                      {office.is_active ? (
                        <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">Actief</span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">Inactief</span>
                      )}
                    </TableCell>
                    <TableCell className="py-2">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(office)} className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground">
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Add Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Kantoor toevoegen</DialogTitle>
            <DialogDescription>Voeg een nieuw kantoor toe.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Naam *</Label>
              <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Kantoornaam" className="h-11 rounded-xl bg-muted/50 border-0 focus-visible:ring-teal-500" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Stad</Label>
              <Input value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} placeholder="Stad" className="h-11 rounded-xl bg-muted/50 border-0 focus-visible:ring-teal-500" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)} className="rounded-xl">Annuleren</Button>
            <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending || !formData.name} className="rounded-xl bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white">
              {createMutation.isPending ? "Aanmaken..." : "Toevoegen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingOffice} onOpenChange={(open) => { if (!open) setEditingOffice(null); }}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Kantoor bewerken</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Naam</Label>
              <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="h-11 rounded-xl bg-muted/50 border-0 focus-visible:ring-teal-500" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Stad</Label>
              <Input value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} className="h-11 rounded-xl bg-muted/50 border-0 focus-visible:ring-teal-500" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingOffice(null)} className="rounded-xl">Annuleren</Button>
            <Button onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending} className="rounded-xl bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white">
              {updateMutation.isPending ? "Opslaan..." : "Opslaan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
