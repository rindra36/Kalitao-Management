"use client"

import type { Expense } from "@/types";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { isSameDay } from "date-fns";
import { PiggyBank, ReceiptText, Pencil, Trash2 } from "lucide-react";
import { Button } from "./ui/button";
import { useState } from "react";
import { EditExpenseDialog } from "./EditExpenseDialog";
import { DeleteConfirmationDialog } from "./DeleteConfirmationDialog";
import { EditLabelDialog } from "./EditLabelDialog";

interface ExpenseListProps {
  expenses: Expense[];
  selectedDate: Date;
  onExpenseUpdate: (expense: Expense) => void;
  onExpenseDelete: (id: string) => void;
  onLabelEdit: (oldLabel: string, newLabel: string) => Promise<void>;
  onLabelDelete: (label: string) => Promise<void>;
}

type AggregatedExpense = {
  label: string;
  totalAmount: number; // in FMG
  transactions: Expense[];
};

export function ExpenseList({
  expenses,
  selectedDate,
  onExpenseUpdate,
  onExpenseDelete,
  onLabelEdit,
  onLabelDelete,
}: ExpenseListProps) {
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);
  const [editingLabel, setEditingLabel] = useState<string | null>(null);
  const [deletingLabel, setDeletingLabel] = useState<string | null>(null);

  const filteredExpenses = expenses.filter(
    (expense) => selectedDate && isSameDay(expense.date, selectedDate)
  );

  const aggregatedExpenses = filteredExpenses.reduce<
    Record<string, AggregatedExpense>
  >((acc, expense) => {
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

  const sortedAggregatedExpenses = Object.values(aggregatedExpenses).sort(
    (a, b) => b.totalAmount - a.totalAmount
  );

  if (sortedAggregatedExpenses.length === 0) {
    return (
      <Card className="mt-6 border-dashed border-2 shadow-none">
        <CardContent className="pt-6 text-center text-muted-foreground flex flex-col items-center justify-center h-48">
          <PiggyBank className="mx-auto h-12 w-12 mb-4" />
          <p className="font-semibold">No expenses for this day.</p>
          <p className="text-sm">
            Add an expense using the form above to see it here.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="mt-6 shadow-lg">
        <CardHeader>
          <CardTitle>Daily Summary</CardTitle>
          <CardDescription>
            Click on a category to see individual transactions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="multiple" className="w-full">
            {sortedAggregatedExpenses.map((aggExpense) => (
              <AccordionItem value={aggExpense.label} key={aggExpense.label}>
                <div className="flex items-center group w-full hover:no-underline">
                    <AccordionTrigger className="flex-1">
                      <div className="flex justify-between w-full pr-4 items-center">
                          <span className="font-medium text-lg text-left">{aggExpense.label}</span>
                          <div className="text-right">
                            <p className="font-bold text-primary">
                                {formatCurrency(aggExpense.totalAmount / 5, "Ariary")}
                            </p>
                            <p className="text-sm text-muted-foreground">
                                {formatCurrency(aggExpense.totalAmount, "FMG")}
                            </p>
                          </div>
                      </div>
                    </AccordionTrigger>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity pr-2">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditingLabel(aggExpense.label)}>
                        <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setDeletingLabel(aggExpense.label)}>
                        <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
                <AccordionContent>
                  <ul className="space-y-2 pt-2">
                    {aggExpense.transactions
                      .sort((a, b) => b.amount - a.amount)
                      .map((transaction) => (
                        <li
                          key={transaction.id}
                          className="flex justify-between items-center p-3 rounded-md bg-secondary/50 group"
                        >
                          <div className="flex items-center gap-3">
                            <ReceiptText className="h-4 w-4 text-muted-foreground" />
                            <div className="text-left">
                              <p className="font-semibold">
                                {formatCurrency(transaction.amount, "FMG")}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {formatCurrency(
                                  transaction.amount / 5,
                                  "Ariary"
                                )}
                              </p>
                            </div>
                          </div>
                           <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                             <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditingExpense(transaction)}>
                               <Pencil className="h-4 w-4" />
                             </Button>
                             <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setDeletingItemId(transaction.id)}>
                                <Trash2 className="h-4 w-4" />
                             </Button>
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
      
      {/* Dialogs for editing and deleting */}
      {editingExpense && (
        <EditExpenseDialog
          expense={editingExpense}
          isOpen={!!editingExpense}
          onClose={() => setEditingExpense(null)}
          onExpenseUpdate={onExpenseUpdate}
        />
      )}
      {deletingItemId && (
        <DeleteConfirmationDialog
            isOpen={!!deletingItemId}
            onClose={() => setDeletingItemId(null)}
            onConfirm={() => {
                onExpenseDelete(deletingItemId);
                setDeletingItemId(null);
            }}
            title="Delete Expense"
            description="Are you sure you want to delete this expense? This action cannot be undone."
        />
      )}
      {editingLabel && (
        <EditLabelDialog
            isOpen={!!editingLabel}
            onClose={() => setEditingLabel(null)}
            onConfirm={(newLabel) => {
                onLabelEdit(editingLabel, newLabel);
                setEditingLabel(null);
            }}
            currentLabel={editingLabel}
        />
      )}
       {deletingLabel && (
        <DeleteConfirmationDialog
            isOpen={!!deletingLabel}
            onClose={() => setDeletingLabel(null)}
            onConfirm={() => {
                onLabelDelete(deletingLabel);
                setDeletingLabel(null);
            }}
            title={`Delete Label "${deletingLabel}"`}
            description="Are you sure? This will delete all expenses associated with this label. This action cannot be undone."
        />
      )}
    </>
  );
}
