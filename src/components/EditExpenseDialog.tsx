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

const formSchema = z.object({
  amount: z.coerce.number().positive({ message: "Amount must be positive." }),
});

type FormValues = z.infer<typeof formSchema>;

interface EditExpenseDialogProps {
  expense: Expense;
  isOpen: boolean;
  onClose: () => void;
  onExpenseUpdate: (expense: Expense) => void;
}

export function EditExpenseDialog({
  expense,
  isOpen,
  onClose,
  onExpenseUpdate,
}: EditExpenseDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // The amount displayed and edited should be in the currency it was entered in.
  // The conversion to FMG for storage is an implementation detail.
  const displayAmount =
    expense.currency === "Ariary" ? expense.amount / 5 : expense.amount;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: displayAmount,
    },
  });

  useEffect(() => {
    if (expense) {
      const displayAmount =
        expense.currency === "Ariary" ? expense.amount / 5 : expense.amount;
      form.reset({ amount: displayAmount });
    }
  }, [expense, form]);

  async function onSubmit(data: FormValues) {
    setIsSubmitting(true);
    try {
      // Convert back to FMG if the original entry was Ariary
      const amountInFmg =
        expense.currency === "Ariary" ? data.amount * 5 : data.amount;

      const updatedExpense = await updateExpenseInDb(expense.id, {
        amount: amountInFmg,
      });

      onExpenseUpdate(updatedExpense);
      toast({
        title: "Expense Updated",
        description: "The expense has been successfully updated.",
      });
      onClose();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update expense. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Expense</DialogTitle>
          <DialogDescription>
            Update the amount for this expense. The original currency was {expense.currency}.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount ({expense.currency})</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
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
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
