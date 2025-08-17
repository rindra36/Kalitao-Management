# Currency Clarity

This is a Next.js expense tracking application created with Firebase Studio. It allows users to log, manage, and analyze their expenses with a focus on handling Ariary and FMG currencies.

## Project Overview

The application is built with Next.js and TypeScript, utilizing Server Components and client-side state management for a fast and interactive experience. It features a clean, modern UI styled with Tailwind CSS and ShadCN UI components.

### Core Features:

*   **Expense Logging:** A form to add expenses with amount, currency (FMG or Ariary), a custom label, and a date.
*   **Label Autocomplete:** As you type a label, a dropdown suggests previously used labels to speed up data entry. You can also create new labels on the fly.
*   **Dual Currency Display:** All financial amounts are displayed in both Malagasy Ariary (Ar) and Franc Malgache (FMG), based on a fixed conversion rate of 1 Ar = 5 FMG.
*   **Daily Summaries:** Expenses for a given day are grouped by label. These summaries are expandable to show the individual transactions.
*   **Date Picker:** A calendar control allows you to view expenses for any specific day.

## Folder Structure

The project follows a standard Next.js App Router structure:

-   `src/app/`: Contains the main pages and layouts of the application.
    -   `page.tsx`: The main dashboard page.
    -   `layout.tsx`: The root layout for the application.
    -   `globals.css`: Global styles and Tailwind CSS theme configuration.
-   `src/components/`: Reusable React components.
    -   `ui/`: UI components from ShadCN UI (Button, Card, etc.).
    -   `ExpenseForm.tsx`: The form for adding new expenses.
    -   `ExpenseList.tsx`: The component for displaying the list of daily expenses.
-   `src/lib/`: Utility functions.
    -   `utils.ts`: General helper functions, including currency formatting.
-   `src/types/`: TypeScript type definitions.
-   `public/`: Static assets.
-   `tailwind.config.ts`: Tailwind CSS configuration.
-   `next.config.ts`: Next.js configuration.

## Getting Started

Follow these instructions to get the project up and running on your local machine.

### Prerequisites

You need to have Node.js (version 18 or later) and npm installed on your system.

### Installation

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd <repository-directory>
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

### Running the Development Server

To start the application in development mode, run the following command:

```bash
npm run dev
```

This will start the development server, typically on `http://localhost:9002`. Open this URL in your web browser to see the application.

The page will reload automatically if you make any edits to the source files.

### Building for Production

To create a production-ready build of the application, run:

```bash
npm run build
```

This command bundles the application into static files for production. To run the production server locally, use:

```bash
npm run start
```
