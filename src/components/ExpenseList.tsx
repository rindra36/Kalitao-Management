"use client"

import type { BalanceStatus, Expense } from "@/types";
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
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { isAfter, format as formatDate, startOfDay } from "date-fns";
import { fr } from 'date-fns/locale';
import { PiggyBank, ReceiptText, Pencil, Trash2, Search as SearchIcon, CheckCircle2, Filter } from "lucide-react";
import { Button } from "./ui/button";
import { useState, useMemo, useEffect } from "react";
import { EditExpenseDialog } from "./EditExpenseDialog";
import { DeleteConfirmationDialog } from "./DeleteConfirmationDialog";
import { EditLabelDialog } from "./EditLabelDialog";
import { PaginationControls } from "./PaginationControls";
import { Badge } from "./ui/badge";
import { clearExpenseBalance } from "@/services/database";
import { useToast } from "@/hooks/use-toast";
import { ClearBalanceDialog } from "./ClearBalanceDialog";
import type { SortOption } from "@/app/page";


type AccordionState = 'all-open' | 'all-closed' | 'default';

export interface ActiveFilters {
  balanceStatus: BalanceStatus[];
  hasRemark: boolean;
}
interface ExpenseListProps {
  expenses: Expense[];
  onExpenseUpdate: (expense: Expense) => void;
  onExpenseDelete: (id: string) => void;
  onLabelEdit: (oldLabel: string, newLabel: string) => Promise<void>;
  onLabelDelete: (label: string) => Promise<void>;
  uniqueLabels: string[];
  searchQuery: string;
  accordionState: AccordionState;
  onAccordionStateChange: (state: AccordionState) => void;
  sortOption: SortOption;
  activeFilters: ActiveFilters;
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

type PaginationState = {
    [dateISO: string]: {
        currentPage: number;
        itemsPerPage: number;
    }
}

const BalanceBadge = ({ transaction }: { transaction: Expense }) => {
  if (transaction.balanceStatus === 'paid' || !transaction.balanceAmount) {
    return null;
  }
  
  const balanceInFmg = transaction.currency === 'Ariary' ? transaction.balanceAmount * 5 : transaction.balanceAmount;
  const displayAmount = formatCurrency(transaction.balanceAmount, transaction.currency);
  
  const variant = transaction.balanceStatus === 'i_owe' ? 'destructive' : 'default';
  const text = transaction.balanceStatus === 'i_owe' ? `- ${displayAmount}` : `+ ${displayAmount}`;
  
  return <Badge variant={variant}>{text}</Badge>;
}

const TransactionTimestamp = ({ createdAt, updatedAt }: { createdAt: Date, updatedAt: Date }) => {
  const wasUpdated = updatedAt && createdAt && isAfter(updatedAt, createdAt) && (updatedAt.getTime() - createdAt.getTime() > 1000);
  
  return (
    <div className="text-xs text-muted-foreground text-right" title={wasUpdated ? `Modifié: ${formatDate(updatedAt, "PPpp", { locale: fr })}`: `Créé: ${formatDate(createdAt, "PPpp", { locale: fr })}`}>
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
  uniqueLabels,
  searchQuery,
  accordionState,
  onAccordionStateChange,
  sortOption,
  activeFilters,
}: ExpenseListProps) {
  const { toast } = useToast();
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);
  const [editingLabel, setEditingLabel] = useState<string | null>(null);
  const [deletingLabel, setDeletingLabel] = useState<string | null>(null);
  const [clearingBalanceId, setClearingBalanceId] = useState<string | null>(null);
  const [openAccordions, setOpenAccordions] = useState<string[]>([]);
  const [paginationState, setPaginationState] = useState<PaginationState>({});

  const filteredAndGroupedExpenses = useMemo(() => {
    // 1. Apply primary filters (search and activeFilters)
    const primaryFilteredExpenses = expenses.filter(expense => {
        const balanceMatch = activeFilters.balanceStatus.length === 0 || activeFilters.balanceStatus.includes(expense.balanceStatus);
        const remarkMatch = !activeFilters.hasRemark || (expense.remark && expense.remark.trim() !== '');
        const searchMatch = !searchQuery || expense.label.toLowerCase().includes(searchQuery.toLowerCase());
        
        return balanceMatch && remarkMatch && searchMatch;
    });

    // 2. Group by day
    const groupedByDay = primaryFilteredExpenses.reduce<Record<string, DailyExpense>>((acc, expense) => {
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

    // 3. Convert to array and sort days
    return Object.values(groupedByDay).sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [expenses, searchQuery, activeFilters]);

  // Reset pagination when dependencies change
  useEffect(() => {
    setPaginationState({});
  }, [searchQuery, expenses, activeFilters]);


  useEffect(() => {
    const allLabels = filteredAndGroupedExpenses.flatMap(day => 
      Object.keys(day.expensesByLabel).map(label => `${day.date.toISOString()}-${label}`)
    );

    if (accordionState === 'all-open') {
        setOpenAccordions(allLabels);
    } else if (accordionState === 'all-closed') {
        setOpenAccordions([]);
    } else if (searchQuery || activeFilters.balanceStatus.length > 0 || activeFilters.hasRemark) {
        // Automatically open accordions that match the search/filter
        setOpenAccordions(allLabels);
    }
    // Reset the accordion state prop so it only acts as a trigger
    if (accordionState !== 'default') {
      onAccordionStateChange('default');
    }
  }, [accordionState, onAccordionStateChange, searchQuery, activeFilters, filteredAndGroupedExpenses]);
  
  const handleClearBalance = async () => {
    if (!clearingBalanceId) return;
    try {
      const updatedExpense = await clearExpenseBalance(clearingBalanceId);
      onExpenseUpdate(updatedExpense);
      toast({
        title: "Solde réglé",
        description: "La dépense a été marquée comme soldée.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de régler le solde.",
      });
    } finally {
      setClearingBalanceId(null);
    }
  };


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

  if(filteredAndGroupedExpenses.length === 0) {
     const hasFilters = activeFilters.balanceStatus.length > 0 || activeFilters.hasRemark;
     const Icon = hasFilters ? Filter : SearchIcon;
     const title = hasFilters ? "Aucune dépense ne correspond à vos filtres" : "Aucun résultat";
     const description = hasFilters ? "Essayez de modifier ou de supprimer certains filtres." : "Aucune étiquette ne correspond à votre recherche.";
     return (
      <Card className="mt-6 border-dashed border-2 shadow-none">
        <CardContent className="pt-6 text-center text-muted-foreground flex flex-col items-center justify-center h-48">
          <Icon className="mx-auto h-12 w-12 mb-4" />
          <p className="font-semibold">{title}</p>
          <p className="text-sm">
           {description}
          </p>
        </CardContent>
      </Card>
    );
  }


  return (
    <>
    <div className="space-y-6">
      {filteredAndGroupedExpenses.map(day => {
        const dayISO = day.date.toISOString();
        
        const { currentPage = 1, itemsPerPage = 10 } = paginationState[dayISO] || {};

        const sortedAggregatedExpenses = Object.values(day.expensesByLabel).sort((a, b) => {
          switch (sortOption) {
            case 'amount-asc':
              return a.totalAmount - b.totalAmount;
            case 'name-az':
              return a.label.localeCompare(b.label);
            case 'name-za':
              return b.label.localeCompare(a.label);
            case 'transactions-desc':
              return b.transactions.length - a.transactions.length;
            case 'amount-desc':
            default:
              return b.totalAmount - a.totalAmount;
          }
        });

        const totalItems = sortedAggregatedExpenses.length;
        const totalPages = Math.ceil(totalItems / itemsPerPage);

        const paginatedExpenses = sortedAggregatedExpenses.slice(
            (currentPage - 1) * itemsPerPage,
            currentPage * itemsPerPage
        );
        
        const handlePageChange = (page: number) => {
            setPaginationState(prev => ({
                ...prev,
                [dayISO]: { ... (prev[dayISO] || { itemsPerPage: 10 }), currentPage: page }
            }));
        };

        const handleItemsPerPageChange = (newSize: number) => {
            setPaginationState(prev => ({
                ...prev,
                [dayISO]: { ... (prev[dayISO] || { currentPage: 1 }), itemsPerPage: newSize, currentPage: 1 }
            }));
        };


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
                <Accordion 
                  type="multiple" 
                  className="w-full"
                  value={openAccordions}
                  onValueChange={setOpenAccordions}
                >
                    {paginatedExpenses.map((aggExpense) => (
                    <AccordionItem value={`${day.date.toISOString()}-${aggExpense.label}`} key={aggExpense.label}>
                        <AccordionTrigger className="hover:no-underline">
                           <div className="flex justify-between w-full pr-4 items-center">
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
                                    <ReceiptText className="h-5 w-5 text-muted-foreground" />
                                    <div className="flex-grow">
                                      <div className="flex items-center gap-2">
                                        <span className="font-semibold">
                                          {formatCurrency(transaction.amount, "FMG")}
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                          ({formatCurrency(transaction.amount / 5,"Ariary")})
                                        </span>
                                        <BalanceBadge transaction={transaction} />
                                      </div>
                                      {transaction.remark && <p className="text-sm text-muted-foreground italic mt-1">{transaction.remark}</p>}
                                    </div>
                                    <div className="flex items-center gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
                                      {transaction.balanceStatus !== 'paid' && (
                                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setClearingBalanceId(transaction.id)}>
                                            <CheckCircle2 className="h-4 w-4 text-green-600"/>
                                        </Button>
                                      )}
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
                {totalPages > 1 && (
                    <CardFooter>
                        <PaginationControls
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={handlePageChange}
                            itemsPerPage={itemsPerPage}
                            onItemsPerPageChange={handleItemsPerPageChange}
                            totalItems={totalItems}
                        />
                    </CardFooter>
                )}
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
          uniqueLabels={uniqueLabels}
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
      {clearingBalanceId && (
        <ClearBalanceDialog
            isOpen={!!clearingBalanceId}
            onClose={() => setClearingBalanceId(null)}
            onConfirm={handleClearBalance}
        />
      )}
    </>
  );
}
