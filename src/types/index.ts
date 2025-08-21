export type BalanceStatus = 'paid' | 'i_owe' | 'owes_me';

export interface Expense {
  id: string;
  amount: number; // Stored in FMG
  label: string;
  date: Date;
  currency: 'FMG' | 'Ariary';
  remark?: string; // Optional remark field
  createdAt: Date;
  updatedAt: Date;
  balanceStatus: BalanceStatus;
  balanceAmount?: number; // Optional amount for the balance
}
