"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { CalendarIcon, PlusCircle } from "lucide-react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { useEffect, useState } from "react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Combobox } from "@/components/ui/combobox"
import type { BalanceStatus, Expense } from "@/types"
import { useToast } from "@/hooks/use-toast"
import { Textarea } from "./ui/textarea"
import { RadioGroup, RadioGroupItem } from "./ui/radio-group"

const formSchema = z.object({
  amount: z.coerce.number().positive({ message: "Le montant doit être positif." }),
  currency: z.enum(["FMG", "Ariary"]),
  label: z.string().min(1, { message: "L'étiquette est requise." }),
  date: z.date({ required_error: "Une date est requise." }),
  remark: z.string().optional(),
  balanceStatus: z.enum(['paid', 'i_owe', 'owes_me']),
  balanceAmount: z.coerce.number().optional(),
}).refine(data => {
  if (data.balanceStatus !== 'paid' && (data.balanceAmount === undefined || data.balanceAmount <= 0)) {
    return false;
  }
  return true;
}, {
  message: "Le montant du solde est requis et doit être positif.",
  path: ["balanceAmount"],
});


type ExpenseFormValues = z.infer<typeof formSchema>

interface ExpenseFormProps {
  addExpense: (expense: Omit<Expense, "id" | "createdAt" | "updatedAt">) => Promise<void>
  uniqueLabels: string[]
}

export function ExpenseForm({ addExpense, uniqueLabels }: ExpenseFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: "" as any,
      currency: "FMG",
      label: "",
      date: undefined,
      remark: "",
      balanceStatus: 'paid',
      balanceAmount: 0,
    },
  })
  
  useEffect(() => {
    // Set date only on client to avoid hydration mismatch
    form.setValue("date", new Date());
  }, [form]);
  
  const balanceStatus = form.watch('balanceStatus');

  const labelOptions = uniqueLabels.map(label => ({ value: label, label }));

  async function onSubmit(data: ExpenseFormValues) {
    setIsSubmitting(true);
    try {
      const expenseData = {
        ...data,
        balanceAmount: data.balanceStatus === 'paid' ? 0 : data.balanceAmount
      }
      await addExpense(expenseData)
      toast({
        title: "Dépense ajoutée",
        description: `La dépense "${data.label}" a été enregistrée avec succès.`,
      })
      form.reset({
        amount: "" as any,
        currency: 'FMG',
        label: '',
        remark: '',
        date: new Date(),
        balanceStatus: 'paid',
        balanceAmount: 0,
      })
    } catch (error) {
       toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible d'ajouter la dépense. Veuillez réessayer.",
      })
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Montant</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="5000" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="currency"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Devise</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une devise" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="FMG">FMG</SelectItem>
                    <SelectItem value="Ariary">Ariary (Ar)</SelectItem>
                  </SelectContent>
                </Select>
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
        </div>
         <FormField
          control={form.control}
          name="remark"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Remarque (facultatif)</FormLabel>
              <FormControl>
                <Textarea placeholder="ex: Poulet 1.5kg" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
            <FormField
              control={form.control}
              name="balanceStatus"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Statut du Solde</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex space-x-4"
                    >
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="paid" />
                        </FormControl>
                        <FormLabel className="font-normal">Soldée</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="i_owe" />
                        </FormControl>
                        <FormLabel className="font-normal">Je dois</FormLabel>
                      </FormItem>
                       <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="owes_me" />
                        </FormControl>
                        <FormLabel className="font-normal">On me doit</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {balanceStatus !== 'paid' && (
              <FormField
                control={form.control}
                name="balanceAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Montant du solde ({form.getValues('currency')})</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="1000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
        </div>
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Ajout...' : <><PlusCircle className="mr-2 h-4 w-4" /> Ajouter la Dépense</>}
        </Button>
      </form>
    </Form>
  )
}
