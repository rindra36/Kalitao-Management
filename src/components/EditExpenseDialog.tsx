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
import { updateExpense } from "@/services/database";
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

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: expense.amount,
    },
  });

  useEffect(() => {
    if (expense) {
      form.reset({ amount: expense.amount });
    }
  }, [expense, form]);

  async function onSubmit(data: FormValues) {
    setIsSubmitting(true);
    try {
      const updatedExpense = await updateExpense(expense.id, {
        amount: data.amount,
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
            Update the amount for this expense. The amount is in FMG.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount (FMG)</FormLabel>
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