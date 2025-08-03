# Bugs Found and Fixes Attempted

## 1. Missing Utility Functions

### Bug Description
The `expenses-view.tsx` file was importing `formatCurrency` and `getExpensesSummary` functions from `@/lib/utils`, but these functions were not defined in the `utils.ts` file. This was causing a runtime error when the expenses view was loaded.

### Fix Attempted
I added the missing `formatCurrency` and `getExpensesSummary` functions to the `client/src/lib/utils.ts` file:

```typescript
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

export function getExpensesSummary(expenses: any[], parent: string): string {
  const total = expenses
    .filter(expense => expense.paidBy === parent && expense.status === 'confirmed')
    .reduce((sum, expense) => sum + parseFloat(expense.amount), 0);
  
  return formatCurrency(total);
}
```

## 2. Hardcoded User ID Comparisons

### Bug Description
In the `client/src/components/expenses-view.tsx` file, there were hardcoded user ID comparisons (`expense.createdBy !== 1`) that assumed the current user ID was always 1. This would cause incorrect behavior for other users.

### Fix Attempted
I fixed the hardcoded user ID comparisons to use the actual user ID from the auth context (`user?.id`):

```typescript
// Before
expense.status === "pending" && expense.createdBy !== 1

// After
expense.status === "pending" && expense.created_by !== user?.id
```

## 3. Descoped Expenses Feature

### Bug Description
The user indicated that the expenses view feature was descoped, but the code still contained references to expenses and the expenses view component.

### Fix Attempted
1. Removed references to expenses in the `client/src/pages/home.tsx` file:
   - Removed expenses from the pending items query
   - Removed expenses from the `handleAcceptAll` function
   - Removed expenses from the `DetailedNotificationsModal` pendingItems prop

2. Deleted the `client/src/components/expenses-view.tsx` file entirely since the feature was descoped.

## Summary
These fixes address runtime errors and inconsistencies in the application. The most critical fix was adding the missing utility functions that were causing the application to crash. The hardcoded user ID comparisons would have caused incorrect behavior for users with IDs other than 1. Finally, removing the descoped expenses feature ensures the codebase aligns with the current product requirements.