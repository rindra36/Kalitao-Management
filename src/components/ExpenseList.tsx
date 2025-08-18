"use client"

import type { Expense } from "@/types";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { isSameDay } from "date-fns";
import { PiggyBank, ReceiptText } from "lucide-react";

interface ExpenseListProps {
  expenses: Expense[];
  selectedDate: Date;
}

type AggregatedExpense = {
  label: string;
  totalAmount: number; // in FMG
  transactions: Expense[];
}

export function ExpenseList({ expenses, selectedDate }: ExpenseListProps) {
  const filteredExpenses = expenses.filter(expense => selectedDate && isSameDay(expense.date, selectedDate));

  const aggregatedExpenses = filteredExpenses.reduce<Record<string, AggregatedExpense>>((acc, expense) => {
    if (!acc[expense.label]) {
      acc[expense.label] = {
        label: expense.label,
        totalAmount: 0,
        transactions: [],
      };
    }
    acc[expense.label].totalAmount += expense.amount;
    acc[expense.label].transactions.push(expense);
    return acc;
  }, {});

  const sortedAggregatedExpenses = Object.values(aggregatedExpenses).sort((a, b) => b.totalAmount - a.totalAmount);

  if (sortedAggregatedExpenses.length === 0) {
    return (
      <Card className="mt-6 border-dashed border-2 shadow-none">
        <CardContent className="pt-6 text-center text-muted-foreground flex flex-col items-center justify-center h-48">
            <PiggyBank className="mx-auto h-12 w-12 mb-4" />
            <p className="font-semibold">No expenses for this day.</p>
            <p className="text-sm">Add an expense using the form above to see it here.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-6 shadow-lg">
        <CardHeader>
            <CardTitle>Daily Summary</CardTitle>
            <CardDescription>Click on a category to see individual transactions.</CardDescription>
        </CardHeader>
        <CardContent>
            <Accordion type="multiple" className="w-full">
            {sortedAggregatedExpenses.map((aggExpense) => (
                <AccordionItem value={aggExpense.label} key={aggExpense.label}>
                <AccordionTrigger className="hover:no-underline">
                    <div className="flex justify-between w-full pr-4 items-center">
                        <span className="font-medium text-lg text-left">{aggExpense.label}</span>
                        <div className="text-right">
                            <p className="font-bold text-primary">{formatCurrency(aggExpense.totalAmount / 5, 'Ariary')}</p>
                            <p className="text-sm text-muted-foreground">{formatCurrency(aggExpense.totalAmount, 'FMG')}</p>
                        </div>
                    </div>
                </AccordionTrigger>
                <AccordionContent>
                    <ul className="space-y-2 pt-2">
                        {aggExpense.transactions.sort((a, b) => b.amount - a.amount).map(transaction => (
                             <li key={transaction.id} className="flex justify-between items-center p-3 rounded-md bg-secondary/50">
                                <div className="flex items-center gap-3">
                                  <ReceiptText className="h-4 w-4 text-muted-foreground"/>
                                  <span className="font-medium">{formatCurrency(transaction.amount, 'FMG')}</span>
                                </div>
                                <div className="text-right text-sm">
                                    <p className="font-semibold">{formatCurrency(transaction.amount / 5, 'Ariary')}</p>
                                    <p className="text-xs text-muted-foreground">{formatCurrency(transaction.amount, 'FMG')}</p>
                                </div>
                            </li>
                        ))}
                    </ul>
                </AccordionContent>
                </AccordionItem>
            ))}
            </Accordion>
        </CardContent>
    </Card>
  );
}
