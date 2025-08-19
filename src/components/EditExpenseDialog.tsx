"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { Expense } from "@/types";
import { updateExpense as updateExpenseInDb } from "@/services/database";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Textarea } from "./ui/textarea";

const formSchema = z.object({
  amount: z.coerce.number().positive({ message: "Le montant doit être positif." }),
  remark: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface EditExpenseDialogProps {
  expense: Expense;
  isOpen: boolean;
  onClose: () => void;
  onExpenseUpdate: (expense: Expense) => void;
  uniqueLabels: string[];
}

export function EditExpenseDialog({
  expense,
  isOpen,
  onClose,
  onExpenseUpdate,
}: EditExpenseDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const displayAmount =
    expense.currency === "Ariary" ? expense.amount / 5 : expense.amount;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: displayAmount,
      remark: expense.remark || "",
    },
  });

  useEffect(() => {
    if (expense) {
      const displayAmount =
        expense.currency === "Ariary" ? expense.amount / 5 : expense.amount;
      form.reset({
        amount: displayAmount,
        remark: expense.remark || "",
      });
    }
  }, [expense, form]);


  async function onSubmit(data: FormValues) {
    setIsSubmitting(true);
    try {
      const amountInFmg =
        expense.currency === "Ariary" ? data.amount * 5 : data.amount;

      const updatedExpenseData = {
        amount: amountInFmg,
        remark: data.remark,
      };

      const updatedExpense = await updateExpenseInDb(expense.id, updatedExpenseData);

      onExpenseUpdate(updatedExpense);
      toast({
        title: "Dépense mise à jour",
        description: "La dépense a été mise à jour avec succès.",
      });
      onClose();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de mettre à jour la dépense. Veuillez réessayer.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!expense) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Détail de la dépense</DialogTitle>
          <DialogDescription>
            Modifiez le montant ou la remarque. La devise d'origine était {expense.currency}.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 text-sm">
            <div>
                <span className="font-medium text-muted-foreground">Étiquette : </span>
                <span className="font-semibold">{expense.label}</span>
            </div>
            <div>
                <span className="font-medium text-muted-foreground">Date : </span>
                <span className="font-semibold">{format(expense.date, "PPP", { locale: fr })}</span>
            </div>
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
             <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Montant ({expense.currency})</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="remark"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Remarque</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Ajouter une note..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Enregistrement..." : "Enregistrer"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
