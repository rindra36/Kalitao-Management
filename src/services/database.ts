import { db } from "@/lib/firebase";
import type { Expense } from "@/types";
import {
  collection,
  addDoc,
  getDocs,
  Timestamp,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import { isSameDay, startOfDay, endOfDay } from "date-fns";

// This is our data converter for Firestore
const expenseConverter = {
  toFirestore: (expense: Omit<Expense, "id">) => {
    return {
      amount: expense.amount,
      label: expense.label,
      date: Timestamp.fromDate(expense.date),
      currency: expense.currency,
    };
  },
  fromFirestore: (snapshot: any, options: any): Expense => {
    const data = snapshot.data(options);
    return {
      id: snapshot.id,
      amount: data.amount,
      label: data.label,
      date: data.date.toDate(),
      currency: data.currency,
    };
  },
};

const expensesCollection = collection(db, "expenses").withConverter(expenseConverter);

/**
 * Fetches all expenses from the database.
 */
export async function getExpenses(): Promise<Expense[]> {
  try {
    const querySnapshot = await getDocs(
      query(expensesCollection, orderBy("date", "desc"))
    );
    return querySnapshot.docs.map((doc) => doc.data());
  } catch (error) {
    console.error("Error fetching expenses:", error);
    return [];
  }
}

/**
 * Adds a new expense to the database.
 * The expense object should not include an 'id'.
 */
export async function addExpense(expenseData: Omit<Expense, "id">): Promise<Expense> {
  try {
    const docRef = await addDoc(expensesCollection, expenseData);
    return {
      id: docRef.id,
      ...expenseData,
    };
  } catch (error) {
    console.error("Error adding expense:", error);
    throw new Error("Could not add expense.");
  }
}
