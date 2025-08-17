"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { CalendarIcon, PlusCircle } from "lucide-react"
import { format } from "date-fns"

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
import type { Expense } from "@/types"
import { useToast } from "@/hooks/use-toast"

const formSchema = z.object({
  amount: z.coerce.number().positive({ message: "Amount must be positive." }),
  currency: z.enum(["FMG", "Ariary"]),
  label: z.string().min(1, { message: "Label is required." }),
  date: z.date(),
})

type ExpenseFormValues = z.infer<typeof formSchema>

interface ExpenseFormProps {
  addExpense: (expense: Omit<Expense, "id" | "amountInFmg">) => void
  uniqueLabels: string[]
}

export function ExpenseForm({ addExpense, uniqueLabels }: ExpenseFormProps) {
  const { toast } = useToast();
  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: undefined,
      currency: "FMG",
      label: "",
      date: new Date(),
    },
  })

  const labelOptions = uniqueLabels.map(label => ({ value: label, label }));

  function onSubmit(data: ExpenseFormValues) {
    addExpense(data)
    toast({
      title: "Expense Added",
      description: `${data.label} expense has been logged successfully.`,
    })
    form.reset()
    form.setValue("date", new Date())
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem className="lg:col-span-1">
              <FormLabel>Amount</FormLabel>
              <FormControl>
                <Input type="number" placeholder="5000" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : Number(e.target.value))} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="currency"
          render={({ field }) => (
            <FormItem className="lg:col-span-1">
              <FormLabel>Currency</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select currency" />
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
            <FormItem className="lg:col-span-1">
              <FormLabel>Label</FormLabel>
              <FormControl>
                <Combobox
                  options={labelOptions}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="e.g., Groceries"
                  searchPlaceholder="Search or create..."
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
            <FormItem className="lg:col-span-1">
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
                        format(field.value, "PPP")
                      ) : (
                        <span>Pick a date</span>
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
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full h-10 md:col-span-2 lg:col-span-1">
          <PlusCircle className="mr-2 h-4 w-4" /> Add Expense
        </Button>
      </form>
    </Form>
  )
}
