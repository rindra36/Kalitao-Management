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
      } as Expense;
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
      date: documentToInsert.date,
    };
  } catch (error) {
    console.error("Error adding expense:", error);
    throw new Error("Could not add expense.");
  }
}

/**
 * Updates an existing expense in the database.
 */
export async function updateExpense(id: string, updates: Partial<Omit<Expense, "id">>): Promise<Expense> {
  try {
    const expensesCollection = await getExpensesCollection();
    const { _id, ...updatedDoc } = await expensesCollection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updates },
      { returnDocument: "after" }
    );
    if (!updatedDoc) {
      throw new Error("Expense not found or failed to update.");
    }
    return { ...updatedDoc, id: _id.toString(), date: new Date(updatedDoc.date) } as Expense;
  } catch (error) {
    console.error("Error updating expense:", error);
    throw new Error("Could not update expense.");
  }
}


/**
 * Deletes an expense from the database by its ID.
 */
export async function deleteExpense(id: string): Promise<void> {
    try {
        const expensesCollection = await getExpensesCollection();
        const result = await expensesCollection.deleteOne({ _id: new ObjectId(id) });
        if (result.deletedCount === 0) {
            throw new Error("Could not find the expense to delete.");
        }
    } catch (error) {
        console.error("Error deleting expense:", error);
        throw new Error("Could not delete expense.");
    }
}


/**
 * Updates all expenses with a given label to a new label.
 */
export async function updateLabelInExpenses(oldLabel: string, newLabel: string): Promise<number> {
    try {
        const expensesCollection = await getExpensesCollection();
        const result = await expensesCollection.updateMany(
            { label: oldLabel },
            { $set: { label: newLabel } }
        );
        return result.modifiedCount;
    } catch (error) {
        console.error("Error updating labels:", error);
        throw new Error("Could not update labels.");
    }
}

/**
 * Deletes all expenses with a given label.
 */
export async function deleteExpensesByLabel(label: string): Promise<number> {
    try {
        const expensesCollection = await getExpensesCollection();
        const result = await expensesCollection.deleteMany({ label: label });
        return result.deletedCount;
    } catch (error) {
        console.error("Error deleting expenses by label:", error);
        throw new Error("Could not delete expenses by label.");
    }
}