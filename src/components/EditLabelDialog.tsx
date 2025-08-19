"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

const formSchema = z.object({
  label: z.string().min(1, { message: "L'étiquette ne peut pas être vide." }),
})

type FormValues = z.infer<typeof formSchema>

interface EditLabelDialogProps {
  currentLabel: string
  isOpen: boolean
  onClose: () => void
  onConfirm: (newLabel: string) => void
}

export function EditLabelDialog({
  currentLabel,
  isOpen,
  onClose,
  onConfirm,
}: EditLabelDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      label: currentLabel,
    },
  })

  useEffect(() => {
    if (currentLabel) {
      form.reset({ label: currentLabel })
    }
  }, [currentLabel, form])

  async function onSubmit(data: FormValues) {
    setIsSubmitting(true)
    onConfirm(data.label)
    // The parent component will handle closing and feedback.
    setIsSubmitting(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Modifier l'étiquette</DialogTitle>
          <DialogDescription>
            Renommez l'étiquette. Cela la mettra à jour pour toutes les dépenses associées.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="label"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nouveau nom de l'étiquette</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
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
  )
}
