"use server"

import clientPromise from "@/lib/mongodb";
import type { Expense } from "@/types";
import { ObjectId } from "mongodb";

async function getExpensesCollection() {
  const client = await clientPromise;
  const db = client.db(process.env.MONGODB_DB); 
  return db.collection("expenses");
}

export async function getExpenses(): Promise<Expense[]> {
  try {
    const expensesCollection = await getExpensesCollection();
    const expensesFromDb = await expensesCollection
      .find({})
      .sort({ date: -1 })
      .toArray();

    return expensesFromDb.map((expense) => {
      const { _id, ...rest } = expense;
      return {
        ...rest,
        id: _id.toString(),
        date: new Date(expense.date),
        createdAt: new Date(expense.createdAt),
        updatedAt: new Date(expense.updatedAt),
      } as Expense;
    });
  } catch (error) {
    console.error("Error fetching expenses:", error);
    return [];
  }
}

export async function addExpense(expenseData: Omit<Expense, "id" | "createdAt" | "updatedAt">): Promise<Expense> {
  try {
    const expensesCollection = await getExpensesCollection();
    
    const now = new Date();
    const documentToInsert = {
      ...expenseData,
      date: new Date(expenseData.date),
      createdAt: now,
      updatedAt: now,
    };

    const result = await expensesCollection.insertOne(documentToInsert);

    if (!result.insertedId) {
        throw new Error("Failed to insert expense.");
    }
    
    return {
      id: result.insertedId.toString(),
      ...expenseData,
      date: documentToInsert.date,
      createdAt: documentToInsert.createdAt,
      updatedAt: documentToInsert.updatedAt,
    };
  } catch (error) {
    console.error("Error adding expense:", error);
    throw new Error("Could not add expense.");
  }
}

export async function updateExpense(id: string, updates: Partial<Omit<Expense, "id" | "createdAt">>): Promise<Expense> {
  try {
    const expensesCollection = await getExpensesCollection();

    const updatesWithTimestamp = {
      ...updates,
      updatedAt: new Date(),
    };

    // Ensure date updates are handled correctly
    if (updates.date) {
      updatesWithTimestamp.date = new Date(updates.date);
    }
    
    const result = await expensesCollection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updatesWithTimestamp },
      { returnDocument: "after" }
    );
    
    if (!result) {
      throw new Error("Expense not found or failed to update.");
    }

    const { _id, ...updatedDoc } = result;

    return { 
        ...updatedDoc, 
        id: _id.toString(), 
        date: new Date(updatedDoc.date),
        createdAt: new Date(updatedDoc.createdAt),
        updatedAt: new Date(updatedDoc.updatedAt),
    } as Expense;
  } catch (error) {
    console.error("Error updating expense:", error);
    throw new Error("Could not update expense.");
  }
}


export async function deleteExpense(id: string): Promise<boolean> {
    try {
        const expensesCollection = await getExpensesCollection();
        const result = await expensesCollection.deleteOne({ _id: new ObjectId(id) });
        if (result.deletedCount === 0) {
            console.warn(`Could not find expense with id ${id} to delete.`);
            return false;
        }
        return true;
    } catch (error) {
        console.error("Error deleting expense:", error);
        throw new Error("Could not delete expense.");
    }
}


export async function updateLabelInExpenses(oldLabel: string, newLabel: string): Promise<number> {
    try {
        const expensesCollection = await getExpensesCollection();
        const result = await expensesCollection.updateMany(
            { label: oldLabel },
            { $set: { label: newLabel, updatedAt: new Date() } }
        );
        return result.modifiedCount;
    } catch (error) {
        console.error("Error updating labels:", error);
        throw new Error("Could not update labels.");
    }
}

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
