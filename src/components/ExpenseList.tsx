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
import { isAfter, format as formatDate, startOfDay } from "date-fns";
import { fr } from 'date-fns/locale';
import { PiggyBank, ReceiptText, Pencil, Trash2 } from "lucide-react";
import { Button } from "./ui/button";
import { useState, useMemo } from "react";
import { EditExpenseDialog } from "./EditExpenseDialog";
import { DeleteConfirmationDialog } from "./DeleteConfirmationDialog";
import { EditLabelDialog } from "./EditLabelDialog";

interface ExpenseListProps {
  expenses: Expense[];
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

type DailyExpense = {
    date: Date;
    total: number; // in FMG
    expensesByLabel: Record<string, AggregatedExpense>;
};

const TransactionTimestamp = ({ createdAt, updatedAt }: { createdAt: Date, updatedAt: Date }) => {
  const wasUpdated = updatedAt && isAfter(updatedAt, createdAt);
  
  return (
    <div className="text-xs text-muted-foreground" title={wasUpdated ? `Modifié: ${formatDate(updatedAt, "PPpp", { locale: fr })}`: `Créé: ${formatDate(createdAt, "PPpp", { locale: fr })}`}>
      {wasUpdated && (
        <span>
          {formatDate(updatedAt, "d MMM, HH:mm", { locale: fr })}{' '}
        </span>
      )}
      <span>
        ({formatDate(createdAt, "d MMM, HH:mm", { locale: fr })})
      </span>
    </div>
  );
};

export function ExpenseList({
  expenses,
  onExpenseUpdate,
  onExpenseDelete,
  onLabelEdit,
  onLabelDelete,
}: ExpenseListProps) {
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);
  const [editingLabel, setEditingLabel] = useState<string | null>(null);
  const [deletingLabel, setDeletingLabel] = useState<string | null>(null);

 const dailyExpenses = useMemo(() => {
    const groupedByDay = expenses.reduce<Record<string, DailyExpense>>((acc, expense) => {
        const day = startOfDay(expense.date).toISOString();
        if (!acc[day]) {
            acc[day] = {
                date: startOfDay(expense.date),
                total: 0,
                expensesByLabel: {},
            };
        }
        acc[day].total += expense.amount;
        if (!acc[day].expensesByLabel[expense.label]) {
            acc[day].expensesByLabel[expense.label] = {
                label: expense.label,
                totalAmount: 0,
                transactions: [],
            };
        }
        acc[day].expensesByLabel[expense.label].totalAmount += expense.amount;
        acc[day].expensesByLabel[expense.label].transactions.push(expense);
        return acc;
    }, {});
    return Object.values(groupedByDay).sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [expenses]);


  if (expenses.length === 0) {
    return (
      <Card className="mt-6 border-dashed border-2 shadow-none">
        <CardContent className="pt-6 text-center text-muted-foreground flex flex-col items-center justify-center h-48">
          <PiggyBank className="mx-auto h-12 w-12 mb-4" />
          <p className="font-semibold">Aucune dépense pour cette période.</p>
          <p className="text-sm">
            Ajoutez une dépense en utilisant le formulaire ci-dessus pour la voir ici.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
    <div className="space-y-6">
      {dailyExpenses.map(day => {
        const sortedAggregatedExpenses = Object.values(day.expensesByLabel).sort(
            (a, b) => b.totalAmount - a.totalAmount
        );
        return (
            <Card key={day.date.toISOString()} className="shadow-lg">
                <CardHeader className="flex flex-row justify-between items-center">
                    <div>
                        <CardTitle>{formatDate(day.date, "EEEE, d MMMM yyyy", { locale: fr })}</CardTitle>
                        <CardDescription>Total journalier toutes catégories confondues.</CardDescription>
                    </div>
                    <div className="text-right">
                         <p className="text-lg font-bold text-primary">{formatCurrency(day.total / 5, "Ariary")}</p>
                         <p className="text-sm text-muted-foreground">{formatCurrency(day.total, "FMG")}</p>
                    </div>
                </CardHeader>
                <CardContent>
                <Accordion type="multiple" className="w-full">
                    {sortedAggregatedExpenses.map((aggExpense) => (
                    <AccordionItem value={aggExpense.label} key={aggExpense.label}>
                        <AccordionTrigger className="hover:no-underline">
                           <div className="flex justify-between w-full items-center">
                                <div className="flex items-center gap-2 group/header">
                                    <span className="font-medium text-lg text-left">{aggExpense.label}</span>
                                    <div className="flex items-center opacity-0 group-hover/header:opacity-100 transition-opacity">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setEditingLabel(aggExpense.label);
                                            }}
                                        >
                                        <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setDeletingLabel(aggExpense.label);
                                            }}
                                        >
                                        <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="text-right">
                                        <p className="font-bold text-primary">
                                            {formatCurrency(aggExpense.totalAmount / 5, "Ariary")}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            {formatCurrency(aggExpense.totalAmount, "FMG")}
                                        </p>
                                    </div>
                                </div>
                           </div>
                        </AccordionTrigger>
                        <AccordionContent>
                        <ul className="space-y-2 pt-2">
                            {aggExpense.transactions
                            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                            .map((transaction) => (
                                <li
                                key={transaction.id}
                                className="flex justify-between items-center p-3 rounded-md bg-secondary/50 group/item"
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
                                <div className="flex items-center gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditingExpense(transaction)}>
                                    <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setDeletingItemId(transaction.id)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                                </div>
                                 <TransactionTimestamp 
                                    createdAt={transaction.createdAt} 
                                    updatedAt={transaction.updatedAt} 
                                />
                                </li>
                            ))}
                        </ul>
                        </AccordionContent>
                    </AccordionItem>
                    ))}
                </Accordion>
                </CardContent>
            </Card>
        )
      })}
    </div>
      
      {editingExpense && (
        <EditExpenseDialog
          expense={editingExpense}
          isOpen={!!editingExpense}
          onClose={() => setEditingExpense(null)}
          onExpenseUpdate={(updatedExpense) => {
            onExpenseUpdate(updatedExpense);
            setEditingExpense(null);
          }}
        />
      )}
      {deletingItemId && (
        <DeleteConfirmationDialog
            isOpen={!!deletingItemId}
            onClose={() => setDeletingItemId(null)}
            onConfirm={async () => {
                if (deletingItemId) {
                    await onExpenseDelete(deletingItemId);
                }
                setDeletingItemId(null);
            }}
            title="Supprimer la dépense"
            description="Êtes-vous sûr de vouloir supprimer cette dépense ? Cette action est irréversible."
        />
      )}
      {editingLabel && (
        <EditLabelDialog
            isOpen={!!editingLabel}
            onClose={() => setEditingLabel(null)}
            onConfirm={async (newLabel) => {
                if(editingLabel) {
                    await onLabelEdit(editingLabel, newLabel);
                }
                setEditingLabel(null);
            }}
            currentLabel={editingLabel}
        />
      )}
       {deletingLabel && (
        <DeleteConfirmationDialog
            isOpen={!!deletingLabel}
            onClose={() => setDeletingLabel(null)}
            onConfirm={async () => {
                if (deletingLabel) {
                    await onLabelDelete(deletingLabel);
                }
                setDeletingLabel(null);
            }}
            title={`Supprimer l'étiquette "${deletingLabel}"`}
            description="Êtes-vous sûr ? Cela supprimera définitivement toutes les dépenses associées à cette étiquette. Cette action est irréversible."
        />
      )}
    </>
  );
}
