export interface Expense {
  id: string;
  amount: number; // Stored in FMG
  label: string;
  date: Date;
  currency: 'FMG' | 'Ariary';
}
