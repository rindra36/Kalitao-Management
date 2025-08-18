"use server"

import clientPromise from "@/lib/mongodb";
import type { Expense } from "@/types";
import { ObjectId } from "mongodb";

// Helper function to connect to the database and get the expenses collection
async function getExpensesCollection() {
  const client = await clientPromise;
  // Make sure to set MONGODB_DB in your .env.local file
  const db = client.db(process.env.MONGODB_DB); 
  return db.collection("expenses");
}

/**
 * Fetches all expenses from the database, sorted by date.
 */
export async function getExpenses(): Promise<Expense[]> {
  try {
    const expensesCollection = await getExpensesCollection();
    const expensesFromDb = await expensesCollection
      .find({})
      .sort({ date: -1 }) // Sort by date descending
      .toArray();

    // Convert MongoDB documents to plain objects for client-side usage
    return expensesFromDb.map((expense) => {
      const { _id, ...rest } = expense;
      return {
        ...rest,
        id: _id.toString(),
        date: new Date(expense.date), // Ensure date is a Date object
      };
    });
  } catch (error) {
    console.error("Error fetching expenses:", error);
    return [];
  }
}

/**
 * Adds a new expense to the database.
 */
export async function addExpense(expenseData: Omit<Expense, "id">): Promise<Expense> {
  try {
    const expensesCollection = await getExpensesCollection();
    
    // Create a new document, ensuring the date is a proper Date object
    const documentToInsert = {
      ...expenseData,
      date: new Date(expenseData.date),
    };

    const result = await expensesCollection.insertOne(documentToInsert);

    if (!result.insertedId) {
        throw new Error("Failed to insert expense.");
    }
    
    // Return a plain object that is safe to pass to the client
    return {
      id: result.insertedId.toString(),
      ...expenseData,
    };
  } catch (error) {
    console.error("Error adding expense:", error);
    throw new Error("Could not add expense.");
  }
}
