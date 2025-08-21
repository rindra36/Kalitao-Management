"use client"

import { useState, useMemo, useEffect, useCallback } from "react"
import { ExpenseForm } from "@/components/ExpenseForm"
import { ExpenseList, type ActiveFilters } from "@/components/ExpenseList"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { Expense } from "@/types"
import { Button } from "@/components/ui/button"
import { CalendarIcon, Search, ChevronsDown, ChevronsUp, ArrowUpDown, Filter } from "lucide-react"
import { format, startOfDay } from "date-fns"
import { fr } from 'date-fns/locale';
import { DateRange } from "react-day-picker"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn, formatCurrency } from "@/lib/utils"
import { getExpenses, addExpense as addExpenseToDb, deleteExpense as deleteExpenseFromDb, updateLabelInExpenses, deleteExpensesByLabel, updateExpense } from "@/services/database"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"


const FMG_TO_ARIARY_RATE = 5;

type AccordionState = 'all-open' | 'all-closed' | 'default';

export type SortOption = 
  | 'amount-desc' 
  | 'amount-asc' 
  | 'name-az' 
  | 'name-za' 
  | 'transactions-desc';


export default function Home() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [accordionState, setAccordionState] = useState<AccordionState>('default');
  const [sortOption, setSortOption] = useState<SortOption>('amount-desc');
  const [activeFilters, setActiveFilters] = useState<ActiveFilters>({
    balanceStatus: [],
    hasRemark: false,
  });
  const { toast } = useToast();

  useEffect(() => {
    const today = new Date();
    setDateRange({ from: startOfDay(today), to: today });
  }, []);

  const fetchExpenses = useCallback(async () => {
    setIsLoading(true);
    const dbExpenses = await getExpenses();
    setExpenses(dbExpenses);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const handleExpenseUpdate = (updatedExpense: Expense) => {
    setExpenses(prev => prev.map(e => e.id === updatedExpense.id ? updatedExpense : e));
  };
  
  const handleExpenseDelete = async (deletedExpenseId: string) => {
    try {
      const success = await deleteExpenseFromDb(deletedExpenseId);
      if (success) {
        setExpenses(prev => prev.filter(e => e.id !== deletedExpenseId));
        toast({
          title: "Dépense supprimée",
          description: "La dépense a été supprimée.",
        });
      } else {
         toast({
          variant: "destructive",
          title: "Erreur",
          description: "Impossible de supprimer la dépense. Elle a peut-être déjà été supprimée.",
        });
      }
    } catch (error) {
       toast({
        variant: "destructive",
        title: "Erreur",
        description: "Une erreur est survenue lors de la suppression de la dépense.",
      });
    }
  };

  const handleLabelEdit = async (oldLabel: string, newLabel: string) => {
    if (!newLabel || oldLabel === newLabel) return;
    try {
      await updateLabelInExpenses(oldLabel, newLabel);
      await fetchExpenses(); 
      toast({
        title: "Étiquette mise à jour",
        description: `L'étiquette "${oldLabel}" a été renommée en "${newLabel}".`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de mettre à jour l'étiquette.",
      });
    }
  };
  
  const handleLabelDelete = async (labelToDelete: string) => {
    try {
      await deleteExpensesByLabel(labelToDelete);
      await fetchExpenses();
      toast({
        title: "Étiquette supprimée",
        description: `Toutes les dépenses avec l'étiquette "${labelToDelete}" ont été supprimées.`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de supprimer les dépenses pour cette étiquette.",
      });
    }
  };

  const addExpense = async (newExpenseData: Omit<Expense, "id" | "createdAt" | "updatedAt">) => {
    const amountInFmg = newExpenseData.currency === 'Ariary'
      ? newExpenseData.amount * FMG_TO_ARIARY_RATE
      : newExpenseData.amount;
  
    const expenseToSave = {
      ...newExpenseData,
      amount: amountInFmg,
    };
      
    const newExpense = await addExpenseToDb(expenseToSave);
    setExpenses(prevExpenses => [newExpense, ...prevExpenses].sort((a, b) => b.date.getTime() - a.date.getTime()));
  };
  
  const uniqueLabels = useMemo(() => {
    const labels = new Set(expenses.map(e => e.label));
    return Array.from(labels);
  }, [expenses]);
  
  const filteredExpensesByDate = useMemo(() => {
    if (!dateRange?.from) return [];
    const fromDate = startOfDay(dateRange.from);
    const toDate = dateRange.to ? startOfDay(dateRange.to) : fromDate;

    return expenses.filter(expense => {
        const expenseDate = startOfDay(expense.date);
        return expenseDate >= fromDate && expenseDate <= toDate;
    });
  }, [expenses, dateRange]);

  const totalForRange = useMemo(() => {
    return filteredExpensesByDate.reduce((sum, expense) => sum + expense.amount, 0);
  }, [filteredExpensesByDate]);

  const filterCount = useMemo(() => {
    let count = 0;
    if (activeFilters.balanceStatus.length > 0) count++;
    if (activeFilters.hasRemark) count++;
    return count;
  }, [activeFilters]);

  return (
    <main className="container mx-auto p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary tracking-tight">Kali...tao Management</h1>
          <p className="text-muted-foreground mt-2">Gestion des dépenses de Kali...tao</p>
        </header>

        <Card className="mb-8 shadow-lg">
            <CardHeader>
                <CardTitle>Ajouter une nouvelle dépense</CardTitle>
                <CardDescription>Enregistrez une nouvelle transaction dans votre suivi de dépenses.</CardDescription>
            </CardHeader>
            <CardContent>
                <ExpenseForm addExpense={addExpense} uniqueLabels={uniqueLabels} />
            </CardContent>
        </Card>

        <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
            <div className="flex items-baseline gap-2">
                <h2 className="text-2xl font-bold">Dépenses du</h2>
                 <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        id="date"
                        variant={"outline"}
                        className={cn(
                          "w-full sm:w-[300px] justify-start text-left font-normal"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateRange?.from ? (
                          dateRange.to ? (
                            <>
                              {format(dateRange.from, "d MMM y", { locale: fr })} -{" "}
                              {format(dateRange.to, "d MMM y", { locale: fr })}
                            </>
                          ) : (
                            format(dateRange.from, "d MMM y", { locale: fr })
                          )
                        ) : (
                          <span>Choisir une date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={dateRange?.from}
                        selected={dateRange}
                        onSelect={setDateRange}
                        numberOfMonths={2}
                        locale={fr}
                        />
                    </PopoverContent>
                </Popover>
            </div>
            <div className="text-right bg-card p-3 rounded-lg border w-full sm:w-auto">
                <p className="text-sm text-muted-foreground">Total pour la période</p>
                {isLoading ? (
                  <Skeleton className="h-8 w-[120px] my-1" />
                ) : (
                  <p className="text-2xl font-bold text-primary">{formatCurrency(totalForRange / FMG_TO_ARIARY_RATE, 'Ariary')}</p>
                )}
                {isLoading ? (
                  <Skeleton className="h-5 w-[100px]" />
                ) : (
                  <p className="text-md text-muted-foreground">{formatCurrency(totalForRange, 'FMG')}</p>
                )}
            </div>
        </div>
        
        {/* Search and Controls */}
        <Card className="mb-6 p-4">
          <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="relative flex-grow w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                      type="text"
                      placeholder="Rechercher une étiquette..."
                      className="pl-10"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                  />
              </div>
              <div className="flex items-center gap-2 w-full md:w-auto">
                <Select value={sortOption} onValueChange={(value) => setSortOption(value as SortOption)}>
                    <SelectTrigger className="w-full sm:w-[220px]">
                        <ArrowUpDown className="mr-2 h-4 w-4" />
                        <SelectValue placeholder="Trier par..." />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="amount-desc">Montant (Décroissant)</SelectItem>
                        <SelectItem value="amount-asc">Montant (Croissant)</SelectItem>
                        <SelectItem value="name-az">Nom (A-Z)</SelectItem>
                        <SelectItem value="name-za">Nom (Z-A)</SelectItem>
                        <SelectItem value="transactions-desc">Plus de transactions</SelectItem>
                    </SelectContent>
                </Select>
                 <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="relative w-full sm:w-auto">
                      <Filter className="mr-2 h-4 w-4" />
                      Filtres
                      {filterCount > 0 && (
                        <Badge variant="secondary" className="absolute -top-2 -right-2 h-5 w-5 justify-center p-0">{filterCount}</Badge>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56">
                    <DropdownMenuLabel>Statut du Solde</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuCheckboxItem
                      checked={activeFilters.balanceStatus.includes("i_owe")}
                      onCheckedChange={(checked) => {
                        setActiveFilters(prev => ({
                          ...prev,
                          balanceStatus: checked ? [...prev.balanceStatus, "i_owe"] : prev.balanceStatus.filter(s => s !== "i_owe")
                        }));
                      }}
                    >
                      Je dois
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={activeFilters.balanceStatus.includes("owes_me")}
                      onCheckedChange={(checked) => {
                        setActiveFilters(prev => ({
                          ...prev,
                          balanceStatus: checked ? [...prev.balanceStatus, "owes_me"] : prev.balanceStatus.filter(s => s !== "owes_me")
                        }));
                      }}
                    >
                      On me doit
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={activeFilters.balanceStatus.includes("paid")}
                      onCheckedChange={(checked) => {
                        setActiveFilters(prev => ({
                          ...prev,
                          balanceStatus: checked ? [...prev.balanceStatus, "paid"] : prev.balanceStatus.filter(s => s !== "paid")
                        }));
                      }}
                    >
                      Soldée
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuSeparator />
                     <DropdownMenuLabel>Autres</DropdownMenuLabel>
                    <DropdownMenuCheckboxItem
                       checked={activeFilters.hasRemark}
                       onCheckedChange={(checked) => {
                         setActiveFilters(prev => ({ ...prev, hasRemark: !!checked }))
                       }}
                    >
                      Avec remarque
                    </DropdownMenuCheckboxItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={() => setAccordionState('all-open')} className="p-2">
                        <ChevronsDown className="h-4 w-4" title="Tout ouvrir" />
                    </Button>
                    <Button variant="outline" onClick={() => setAccordionState('all-closed')} className="p-2">
                        <ChevronsUp className="h-4 w-4" title="Tout fermer" />
                    </Button>
                </div>
              </div>
          </div>
        </Card>

        {isLoading ? (
          <Card className="mt-6 shadow-lg">
            <CardHeader>
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-4 w-3/4" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </CardContent>
          </Card>
        ) : (
          dateRange && (
            <ExpenseList
              expenses={filteredExpensesByDate}
              onExpenseUpdate={handleExpenseUpdate}
              onExpenseDelete={handleExpenseDelete}
              onLabelEdit={handleLabelEdit}
              onLabelDelete={handleLabelDelete}
              uniqueLabels={uniqueLabels}
              searchQuery={searchQuery}
              accordionState={accordionState}
              onAccordionStateChange={setAccordionState}
              sortOption={sortOption}
              activeFilters={activeFilters}
            />
          )
        )}
      </div>
    </main>
  );
}
