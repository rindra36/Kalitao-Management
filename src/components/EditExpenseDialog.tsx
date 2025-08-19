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
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "./ui/calendar";
import { Combobox } from "./ui/combobox";
import { Textarea } from "./ui/textarea";

const formSchema = z.object({
  amount: z.coerce.number().positive({ message: "Le montant doit être positif." }),
  label: z.string().min(1, { message: "L'étiquette est requise." }),
  date: z.date({ required_error: "Une date est requise." }),
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
  uniqueLabels,
}: EditExpenseDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const displayAmount =
    expense.currency === "Ariary" ? expense.amount / 5 : expense.amount;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: displayAmount,
      label: expense.label,
      date: expense.date,
      remark: expense.remark || "",
    },
  });

  useEffect(() => {
    if (expense) {
      const displayAmount =
        expense.currency === "Ariary" ? expense.amount / 5 : expense.amount;
      form.reset({ 
        amount: displayAmount,
        label: expense.label,
        date: new Date(expense.date),
        remark: expense.remark || "",
      });
    }
  }, [expense, form]);

  const labelOptions = uniqueLabels.map(label => ({ value: label, label }));

  async function onSubmit(data: FormValues) {
    setIsSubmitting(true);
    try {
      const amountInFmg =
        expense.currency === "Ariary" ? data.amount * 5 : data.amount;

      const updatedExpenseData = {
        amount: amountInFmg,
        label: data.label,
        date: data.date,
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Détail de la dépense</DialogTitle>
          <DialogDescription>
            Modifiez les détails de votre dépense. La devise d'origine était {expense.currency}.
          </DialogDescription>
        </DialogHeader>
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
              name="label"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Étiquette</FormLabel>
                  <FormControl>
                    <Combobox
                      options={labelOptions}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="ex: Courses"
                      searchPlaceholder="Rechercher ou créer..."
                      emptyText="Aucun résultat."
                      createText={(value) => `Ajouter "${value}"`}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date</FormLabel>
                   <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP", { locale: fr })
                          ) : (
                            <span>Choisir une date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                        locale={fr}
                      />
                    </PopoverContent>
                  </Popover>
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
