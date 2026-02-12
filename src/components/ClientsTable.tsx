import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowUpDown, ArrowUp, ArrowDown, Search } from "lucide-react";

type SortField = "first_name" | "last_name" | "email" | "gender" | "age";
type SortDirection = "asc" | "desc";

interface Client {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  phone: string | null;
  gender: string | null;
  age: number | null;
  advisor_name: string | null;
  mortgage_amount: number | null;
}

const ITEMS_PER_PAGE = 100;

export function ClientsTable() {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<SortField>("last_name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, 1000); // Debounce delay to 1000ms

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { data, isLoading, error } = useQuery({
    queryKey: ["clients", currentPage, sortField, sortDirection, debouncedSearch],
    queryFn: async () => {
      console.log("Query with search term:", debouncedSearch);
      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      let query = supabase
        .from("clients")
        .select(`
          id, 
          first_name, 
          last_name, 
          email, 
          phone,
          gender,
          age,
          advisors(name),
          house_objects(mortgage_amount)
        `)
        .range(from, to);

      if (debouncedSearch && debouncedSearch.length >= 2) {
        console.log("Applying search filter:", debouncedSearch);
        query = query.or(`first_name.ilike.%${debouncedSearch}%,last_name.ilike.%${debouncedSearch}%,email.ilike.%${debouncedSearch}%`);
      }

      if (sortField && sortDirection) {
        query = query.order(sortField, { ascending: sortDirection === "asc" });
      }

      const { data, error, count } = await query;

      if (error) throw error;

      // Process the data to flatten nested relationships
      const processedClients = (data || []).map((client: any) => ({
        id: client.id,
        first_name: client.first_name,
        last_name: client.last_name,
        email: client.email,
        phone: client.phone,
        gender: client.gender,
        age: client.age,
        advisor_name: client.advisors?.name || null,
        mortgage_amount: client.house_objects?.[0]?.mortgage_amount || null
      }));

      console.log("Processed clients:", processedClients.length, processedClients);
      return { clients: processedClients, total: count || 0 };
    },
    staleTime: 30000, // Cache for 30 seconds
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
    setCurrentPage(1);
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="h-4 w-4" />;
    return sortDirection === "asc" ? 
      <ArrowUp className="h-4 w-4" /> : 
      <ArrowDown className="h-4 w-4" />;
  };

  const totalPages = data ? Math.ceil(data.total / ITEMS_PER_PAGE) : 0;


  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-muted-foreground text-sm">Klanten laden...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-destructive text-sm">Fout bij laden klanten</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-semibold tracking-tight">Klanten</h2>
          <span className="inline-flex items-center rounded-full bg-teal-50 px-2.5 py-0.5 text-xs font-medium text-teal-700">
            {data?.total || 0}
          </span>
        </div>
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Zoek op naam of email..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
            }}
            className="pl-9 h-10 text-sm rounded-xl bg-muted/50 border-0 focus-visible:ring-teal-500"
          />
        </div>
      </div>

      <div className="bg-card rounded-2xl border shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="h-11 bg-muted/30 hover:bg-muted/30">
              <TableHead className="h-11 py-2">
                <Button
                  variant="ghost"
                  onClick={() => handleSort("first_name")}
                  className="h-auto p-0 font-medium text-xs text-muted-foreground hover:text-foreground"
                >
                  Voornaam {getSortIcon("first_name")}
                </Button>
              </TableHead>
              <TableHead className="h-11 py-2">
                <Button
                  variant="ghost"
                  onClick={() => handleSort("last_name")}
                  className="h-auto p-0 font-medium text-xs text-muted-foreground hover:text-foreground"
                >
                  Achternaam {getSortIcon("last_name")}
                </Button>
              </TableHead>
              <TableHead className="h-11 py-2">
                <Button
                  variant="ghost"
                  onClick={() => handleSort("email")}
                  className="h-auto p-0 font-medium text-xs text-muted-foreground hover:text-foreground"
                >
                  Email {getSortIcon("email")}
                </Button>
              </TableHead>
              <TableHead className="h-11 py-2">
                <Button
                  variant="ghost"
                  onClick={() => handleSort("gender")}
                  className="h-auto p-0 font-medium text-xs text-muted-foreground hover:text-foreground"
                >
                  Geslacht {getSortIcon("gender")}
                </Button>
              </TableHead>
              <TableHead className="h-11 py-2">
                <Button
                  variant="ghost"
                  onClick={() => handleSort("age")}
                  className="h-auto p-0 font-medium text-xs text-muted-foreground hover:text-foreground"
                >
                  Leeftijd {getSortIcon("age")}
                </Button>
              </TableHead>
              <TableHead className="h-11 py-2 text-xs font-medium text-muted-foreground">Telefoon</TableHead>
              <TableHead className="h-11 py-2 text-xs font-medium text-muted-foreground">Adviseur</TableHead>
              <TableHead className="h-11 py-2 text-xs font-medium text-muted-foreground">Hypotheek</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.clients.map((client) => (
              <TableRow 
                key={client.id} 
                className="cursor-pointer hover:bg-teal-50/50 transition-colors h-10 group"
                onClick={() => navigate(`/client/${client.id}`)}
              >
                <TableCell className="py-2 text-sm font-medium">{client.first_name || "-"}</TableCell>
                <TableCell className="py-2 text-sm font-medium">{client.last_name || "-"}</TableCell>
                <TableCell className="py-2 text-sm text-muted-foreground">{client.email}</TableCell>
                <TableCell className="py-2 text-sm text-muted-foreground">{client.gender || "-"}</TableCell>
                <TableCell className="py-2 text-sm text-muted-foreground">{client.age || "-"}</TableCell>
                <TableCell className="py-2 text-sm text-muted-foreground">{client.phone || "-"}</TableCell>
                <TableCell className="py-2 text-sm">
                  {client.advisor_name 
                    ? <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">{client.advisor_name}</span>
                    : <span className="text-muted-foreground">-</span>
                  }
                </TableCell>
                <TableCell className="py-2 text-sm tabular-nums text-muted-foreground">
                  {client.mortgage_amount 
                    ? `€${client.mortgage_amount.toLocaleString('nl-NL')}` 
                    : "-"
                  }
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>

            {/* Show first page */}
            {currentPage > 3 && (
              <>
                <PaginationItem>
                  <PaginationLink
                    onClick={() => setCurrentPage(1)}
                    isActive={false}
                    className="cursor-pointer"
                  >
                    1
                  </PaginationLink>
                </PaginationItem>
                {currentPage > 4 && <span className="px-2">...</span>}
              </>
            )}

            {/* Show pages around current page */}
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const startPage = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
              const pageNum = startPage + i;
              
              if (pageNum > totalPages) return null;
              
              return (
                <PaginationItem key={pageNum}>
                  <PaginationLink
                    onClick={() => setCurrentPage(pageNum)}
                    isActive={currentPage === pageNum}
                    className="cursor-pointer"
                  >
                    {pageNum}
                  </PaginationLink>
                </PaginationItem>
              );
            })}

            {/* Show last page */}
            {currentPage < totalPages - 2 && (
              <>
                {currentPage < totalPages - 3 && <span className="px-2">...</span>}
                <PaginationItem>
                  <PaginationLink
                    onClick={() => setCurrentPage(totalPages)}
                    isActive={false}
                    className="cursor-pointer"
                  >
                    {totalPages}
                  </PaginationLink>
                </PaginationItem>
              </>
            )}

            <PaginationItem>
              <PaginationNext
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}