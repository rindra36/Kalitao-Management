"use client"

import { useState, useMemo, useEffect } from "react"
import { ExpenseForm } from "@/components/ExpenseForm"
import { ExpenseList } from "@/components/ExpenseList"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { Expense } from "@/types"
import { Button } from "@/components/ui/button"
import { CalendarIcon } from "lucide-react"
import { format, isSameDay } from "date-fns"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn, formatCurrency } from "@/lib/utils"
import { getExpenses, addExpense as addExpenseToDb } from "@/services/database"
import { Skeleton } from "@/components/ui/skeleton"

const FMG_TO_ARIARY_RATE = 5;

export default function Home() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchExpenses = async () => {
      setIsLoading(true);
      const dbExpenses = await getExpenses();
      setExpenses(dbExpenses);
      setIsLoading(false);
    };

    fetchExpenses();
  }, []);

  const addExpense = async (newExpenseData: Omit<Expense, "id">) => {
    const amountInFmg = newExpenseData.currency === 'Ariary'
      ? newExpenseData.amount * FMG_TO_ARIARY_RATE
      : newExpenseData.amount;

    const expenseToSave: Omit<Expense, "id"> = {
      ...newExpenseData,
      amount: amountInFmg,
    };
    
    const newExpense = await addExpenseToDb(expenseToSave);
    setExpenses(prevExpenses => [newExpense, ...prevExpenses]);
  };
  
  const uniqueLabels = useMemo(() => {
    const labels = new Set(expenses.map(e => e.label));
    return Array.from(labels);
  }, [expenses]);
  
  const totalForDay = useMemo(() => {
    if (!selectedDate) return 0;
    return expenses
      .filter(expense => isSameDay(expense.date, selectedDate))
      .reduce((sum, expense) => sum + expense.amount, 0);
  }, [expenses, selectedDate]);


  return (
    <main className="container mx-auto p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary tracking-tight">Currency Clarity</h1>
          <p className="text-muted-foreground mt-2">Track your expenses with clarity between Ariary and FMG.</p>
        </header>

        <Card className="mb-8 shadow-lg">
            <CardHeader>
                <CardTitle>Add New Expense</CardTitle>
                <CardDescription>Log a new transaction to your expense tracker.</CardDescription>
            </CardHeader>
            <CardContent>
                <ExpenseForm addExpense={addExpense} uniqueLabels={uniqueLabels} />
            </CardContent>
        </Card>

        <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
            <div className="flex items-baseline gap-2">
                <h2 className="text-2xl font-bold">Expenses for</h2>
                 <Popover>
                    <PopoverTrigger asChild>
                        <Button
                        variant={"outline"}
                        className={cn("w-full sm:w-[280px] justify-start text-left font-normal")}
                        >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                        <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={(date) => date && setSelectedDate(date)}
                        initialFocus
                        />
                    </PopoverContent>
                </Popover>
            </div>
            <div className="text-right bg-card p-3 rounded-lg border w-full sm:w-auto">
                <p className="text-sm text-muted-foreground">Total for selected day</p>
                {isLoading ? (
                  <Skeleton className="h-8 w-[120px] my-1" />
                ) : (
                  <p className="text-2xl font-bold text-primary">{formatCurrency(totalForDay / FMG_TO_ARIARY_RATE, 'Ariary')}</p>
                )}
                {isLoading ? (
                  <Skeleton className="h-5 w-[100px]" />
                ) : (
                  <p className="text-md text-muted-foreground">{formatCurrency(totalForDay, 'FMG')}</p>
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
          selectedDate && <ExpenseList expenses={expenses} selectedDate={selectedDate} />
        )}
      </div>
    </main>
  );
}
