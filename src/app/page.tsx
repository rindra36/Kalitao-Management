"use client"

import { useState, useMemo, useEffect, useCallback } from "react"
import { ExpenseForm } from "@/components/ExpenseForm"
import { ExpenseList } from "@/components/ExpenseList"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { Expense } from "@/types"
import { Button } from "@/components/ui/button"
import { CalendarIcon } from "lucide-react"
import { format, startOfDay } from "date-fns"
import { fr } from 'date-fns/locale';
import { DateRange } from "react-day-picker"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn, formatCurrency } from "@/lib/utils"
import { getExpenses, addExpense as addExpenseToDb, deleteExpense as deleteExpenseFromDb, updateLabelInExpenses, deleteExpensesByLabel } from "@/services/database"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"

const FMG_TO_ARIARY_RATE = 5;

export default function Home() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Set initial date range to today on the client to avoid hydration mismatch
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
    toast({
      title: "Dépense mise à jour",
      description: "La dépense a été mise à jour avec succès.",
    });
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
  
  const filteredExpenses = useMemo(() => {
    if (!dateRange?.from) return [];
    const fromDate = startOfDay(dateRange.from);
    // If no 'to' date, use the 'from' date for a single day range
    const toDate = dateRange.to ? startOfDay(dateRange.to) : fromDate;

    return expenses.filter(expense => {
        const expenseDate = startOfDay(expense.date);
        return expenseDate >= fromDate && expenseDate <= toDate;
    });
  }, [expenses, dateRange]);

  const totalForRange = useMemo(() => {
    return filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  }, [filteredExpenses]);


  return (
    <main className="container mx-auto p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary tracking-tight">Clarté Monétaire</h1>
          <p className="text-muted-foreground mt-2">Suivez vos dépenses avec clarté entre l'Ariary et le FMG.</p>
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
              expenses={filteredExpenses}
              onExpenseUpdate={handleExpenseUpdate}
              onExpenseDelete={handleExpenseDelete}
              onLabelEdit={handleLabelEdit}
              onLabelDelete={handleLabelDelete}
            />
          )
        )}
      </div>
    </main>
  );
}
