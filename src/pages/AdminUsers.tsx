import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { ArrowLeft, Plus, Pencil, Trash2, Shield, Building2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface DashboardUserRow {
  id: string;
  auth_id: string;
  email: string;
  name: string;
  role: "super_admin" | "office_admin";
  office_id: number | null;
  is_active: boolean;
  created_at: string;
}

interface OfficeRow {
  id: number;
  name: string;
}

export default function AdminUsers() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<DashboardUserRow | null>(null);
  const [deleteUser, setDeleteUser] = useState<DashboardUserRow | null>(null);
  const [formData, setFormData] = useState({
    email: "",
    name: "",
    role: "office_admin" as "super_admin" | "office_admin",
    office_id: "",
  });

  const { data: users, isLoading } = useQuery({
    queryKey: ["dashboard_users"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("dashboard_users")
        .select("*")
        .order("name");
      if (error) throw error;
      return data as DashboardUserRow[];
    },
  });

  const { data: offices } = useQuery({
    queryKey: ["offices"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("offices")
        .select("id, name")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data as OfficeRow[];
    },
  });

  const resetForm = () => {
    setFormData({ email: "", name: "", role: "office_admin", office_id: "" });
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      // First, look up the auth user by email
      // We need the auth_id — the user must already have a Supabase Auth account
      const { data: authUsers, error: lookupError } = await supabase.rpc('get_auth_user_by_email' as any, {
        p_email: formData.email,
      });

      // If RPC doesn't exist, try inserting with a placeholder and let the user know
      // For now, we'll create the dashboard_user entry
      // The admin will need to ensure the user has a Supabase Auth account first

      // Try to find existing auth user via admin_users or by email match
      const { data: existingAdmin } = await supabase
        .from("admin_users")
        .select("id, email")
        .eq("email", formData.email)
        .maybeSingle();

      let authId: string;

      if (existingAdmin) {
        authId = existingAdmin.id;
      } else {
        // Create a new auth user via signUp (they'll get an email)
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: formData.email,
          password: crypto.randomUUID(), // Random password, user will reset
        });

        if (signUpError || !signUpData.user) {
          throw new Error(signUpError?.message || "Kon geen account aanmaken");
        }
        authId = signUpData.user.id;
      }

      const { error } = await supabase.from("dashboard_users").insert({
        auth_id: authId,
        email: formData.email,
        name: formData.name,
        role: formData.role,
        office_id: formData.office_id ? parseInt(formData.office_id) : null,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard_users"] });
      setShowAddDialog(false);
      resetForm();
      toast({ title: "Gebruiker aangemaakt" });
    },
    onError: (err: any) => {
      toast({ variant: "destructive", title: "Fout", description: err.message });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!editingUser) return;
      const { error } = await supabase
        .from("dashboard_users")
        .update({
          name: formData.name,
          role: formData.role,
          office_id: formData.office_id ? parseInt(formData.office_id) : null,
        })
        .eq("id", editingUser.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard_users"] });
      setEditingUser(null);
      resetForm();
      toast({ title: "Gebruiker bijgewerkt" });
    },
    onError: (err: any) => {
      toast({ variant: "destructive", title: "Fout", description: err.message });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!deleteUser) return;
      const { error } = await supabase
        .from("dashboard_users")
        .update({ is_active: false })
        .eq("id", deleteUser.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard_users"] });
      setDeleteUser(null);
      toast({ title: "Gebruiker gedeactiveerd" });
    },
    onError: (err: any) => {
      toast({ variant: "destructive", title: "Fout", description: err.message });
    },
  });

  const openEdit = (user: DashboardUserRow) => {
    setFormData({
      email: user.email,
      name: user.name,
      role: user.role,
      office_id: user.office_id?.toString() || "",
    });
    setEditingUser(user);
  };

  const getOfficeName = (officeId: number | null) => {
    if (!officeId || !offices) return "-";
    return offices.find((o) => o.id === officeId)?.name || "-";
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
                <h1 className="text-lg font-semibold tracking-tight">Gebruikersbeheer</h1>
                <p className="text-xs text-muted-foreground">Dashboard gebruikers en rollen</p>
              </div>
            </div>
            <Button
              onClick={() => { resetForm(); setShowAddDialog(true); }}
              className="rounded-xl bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white shadow-sm shadow-teal-500/20 h-9 px-4 text-sm"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Gebruiker toevoegen
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
                <TableHead className="h-11 py-2 text-xs font-medium text-muted-foreground">Naam</TableHead>
                <TableHead className="h-11 py-2 text-xs font-medium text-muted-foreground">Email</TableHead>
                <TableHead className="h-11 py-2 text-xs font-medium text-muted-foreground">Rol</TableHead>
                <TableHead className="h-11 py-2 text-xs font-medium text-muted-foreground">Kantoor</TableHead>
                <TableHead className="h-11 py-2 text-xs font-medium text-muted-foreground">Status</TableHead>
                <TableHead className="h-11 py-2 text-xs font-medium text-muted-foreground w-20">Acties</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="flex items-center justify-center gap-3">
                      <div className="w-5 h-5 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
                      <span className="text-muted-foreground text-sm">Laden...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                users?.map((user) => (
                  <TableRow key={user.id} className="h-10">
                    <TableCell className="py-2 text-sm font-medium">{user.name}</TableCell>
                    <TableCell className="py-2 text-sm text-muted-foreground">{user.email}</TableCell>
                    <TableCell className="py-2 text-sm">
                      {user.role === "super_admin" ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-purple-50 px-2 py-0.5 text-xs font-medium text-purple-700">
                          <Shield className="h-3 w-3" />
                          Super Admin
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-md bg-teal-50 px-2 py-0.5 text-xs font-medium text-teal-700">
                          <Building2 className="h-3 w-3" />
                          Kantoor Admin
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="py-2 text-sm text-muted-foreground">
                      {getOfficeName(user.office_id)}
                    </TableCell>
                    <TableCell className="py-2 text-sm">
                      {user.is_active ? (
                        <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">Actief</span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">Inactief</span>
                      )}
                    </TableCell>
                    <TableCell className="py-2">
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(user)} className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground">
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setDeleteUser(user)} className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
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
            <DialogTitle>Gebruiker toevoegen</DialogTitle>
            <DialogDescription>Voeg een nieuwe dashboard gebruiker toe.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Naam *</Label>
              <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Volledige naam" className="h-11 rounded-xl bg-muted/50 border-0 focus-visible:ring-teal-500" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Email *</Label>
              <Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="email@voorbeeld.nl" className="h-11 rounded-xl bg-muted/50 border-0 focus-visible:ring-teal-500" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Rol *</Label>
              <Select value={formData.role} onValueChange={(v: any) => setFormData({ ...formData, role: v })}>
                <SelectTrigger className="h-11 rounded-xl bg-muted/50 border-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                  <SelectItem value="office_admin">Kantoor Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {formData.role === "office_admin" && (
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Kantoor *</Label>
                <Select value={formData.office_id} onValueChange={(v) => setFormData({ ...formData, office_id: v })}>
                  <SelectTrigger className="h-11 rounded-xl bg-muted/50 border-0">
                    <SelectValue placeholder="Selecteer kantoor" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {offices?.map((office) => (
                      <SelectItem key={office.id} value={office.id.toString()}>{office.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)} className="rounded-xl">Annuleren</Button>
            <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending || !formData.name || !formData.email} className="rounded-xl bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white">
              {createMutation.isPending ? "Aanmaken..." : "Toevoegen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingUser} onOpenChange={(open) => { if (!open) setEditingUser(null); }}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Gebruiker bewerken</DialogTitle>
            <DialogDescription>{editingUser?.email}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Naam</Label>
              <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="h-11 rounded-xl bg-muted/50 border-0 focus-visible:ring-teal-500" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Rol</Label>
              <Select value={formData.role} onValueChange={(v: any) => setFormData({ ...formData, role: v })}>
                <SelectTrigger className="h-11 rounded-xl bg-muted/50 border-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                  <SelectItem value="office_admin">Kantoor Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {formData.role === "office_admin" && (
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Kantoor</Label>
                <Select value={formData.office_id} onValueChange={(v) => setFormData({ ...formData, office_id: v })}>
                  <SelectTrigger className="h-11 rounded-xl bg-muted/50 border-0">
                    <SelectValue placeholder="Selecteer kantoor" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {offices?.map((office) => (
                      <SelectItem key={office.id} value={office.id.toString()}>{office.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingUser(null)} className="rounded-xl">Annuleren</Button>
            <Button onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending} className="rounded-xl bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white">
              {updateMutation.isPending ? "Opslaan..." : "Opslaan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteUser} onOpenChange={(open) => { if (!open) setDeleteUser(null); }}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Gebruiker deactiveren?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteUser?.name} ({deleteUser?.email}) wordt gedeactiveerd en kan niet meer inloggen op het dashboard.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Annuleren</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteMutation.mutate()} className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Deactiveren
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
