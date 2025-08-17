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
import { cn } from "@/lib/utils"
import { formatCurrency } from "@/lib/utils"

const FMG_TO_ARIARY_RATE = 5;

const getInitialExpenses = (): Expense[] => {
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return [
    { id: "1", amount: 10000, label: "Groceries", date: today, currency: "FMG" },
    { id: "2", amount: 2500, label: "Coffee", date: today, currency: "FMG" },
    { id: "3", amount: 5000, label: "Groceries", date: today, currency: "FMG" },
    { id: "4", amount: 15000, label: "Transport", date: yesterday, currency: "FMG" },
    { id: "5", amount: 2000 * FMG_TO_ARIARY_RATE, label: "Lunch", date: yesterday, currency: "Ariary" },
  ];
};

export default function Home() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  
  useEffect(() => {
    setExpenses(getInitialExpenses());
  }, []);

  const addExpense = (newExpenseData: Omit<Expense, "id">) => {
    const amountInFmg = newExpenseData.currency === 'Ariary'
      ? newExpenseData.amount * FMG_TO_ARIARY_RATE
      : newExpenseData.amount;

    const newExpense: Expense = {
      ...newExpenseData,
      id: new Date().toISOString() + Math.random(),
      amount: amountInFmg,
    };

    setExpenses(prevExpenses => [...prevExpenses, newExpense]);
  };
  
  const uniqueLabels = useMemo(() => {
    const labels = new Set(expenses.map(e => e.label));
    return Array.from(labels);
  }, [expenses]);
  
  const totalForDay = useMemo(() => {
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
                <p className="text-2xl font-bold text-primary">{formatCurrency(totalForDay / FMG_TO_ARIARY_RATE, 'Ariary')}</p>
                <p className="text-md text-muted-foreground">{formatCurrency(totalForDay, 'FMG')}</p>
            </div>
        </div>

        <ExpenseList expenses={expenses} selectedDate={selectedDate} />

      </div>
    </main>
  );
}
