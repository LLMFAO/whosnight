import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Paperclip } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, getExpensesSummary, formatMonth } from "@/lib/utils";
import { format } from "date-fns";

const EXPENSE_CATEGORIES = [
  "Healthcare",
  "Clothing",
  "School",
  "Activities",
  "Food",
  "Transportation",
  "Other"
];

export default function ExpensesView() {
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    name: "",
    amount: "",
    category: "",
    date: format(new Date(), "yyyy-MM-dd"),
    paidBy: "mom",
    description: "",
  });
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const currentMonth = formatMonth(new Date());

  const { data: expenses = [], error: expensesError } = useQuery({
    queryKey: ["expenses"],
    queryFn: async () => {
      const { data, error } = await supabase.from("expenses").select("*");
      if (error) throw error;
      return data;
    },
  });

  const { data: pendingExpenses = [], error: pendingError } = useQuery({
    queryKey: ["pending_expenses", user?.family_id],
    queryFn: async () => {
      if (!user?.family_id) return [];
      
      const { data, error } = await supabase
        .from("expenses")
        .select("*")
        .eq("status", "pending")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
  });

  const createExpenseMutation = useMutation({
    mutationFn: async (expense: any) => {
      const { data, error } = await supabase.from("expenses").insert({
        ...expense,
        created_by: user?.id,
        status: "pending"
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["pending_expenses", user?.family_id] });
      setShowAddExpenseModal(false);
      setExpenseForm({
        name: "",
        amount: "",
        category: "",
        date: format(new Date(), "yyyy-MM-dd"),
        paidBy: "mom",
        description: "",
      });
    },
  });

  const updateExpenseStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const { data, error } = await supabase.from("expenses").update({ status }).eq("id", id);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["pending_expenses", user?.family_id] });
    },
  });

  const acceptAllExpensesMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("expenses")
        .update({ status: "confirmed" })
        .eq("status", "pending");
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["pending_expenses", user?.family_id] });
    },
  });

  const handleExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseForm.name.trim() || !expenseForm.amount || !expenseForm.category) return;

    createExpenseMutation.mutate({
      ...expenseForm,
      amount: parseFloat(expenseForm.amount),
    });
  };

  const handleAcceptExpense = (expenseId: number) => {
    updateExpenseStatusMutation.mutate({ id: expenseId, status: "confirmed" });
  };

  const handleDeclineExpense = (expenseId: number) => {
    updateExpenseStatusMutation.mutate({ id: expenseId, status: "declined" });
  };

  const pendingExpensesCount = pendingExpenses?.length || 0;
  const momTotal = getExpensesSummary(expenses, "mom");
  const dadTotal = getExpensesSummary(expenses, "dad");

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      Healthcare: "bg-blue-100 text-blue-800 border-blue-200",
      Clothing: "bg-green-100 text-green-800 border-green-200",
      School: "bg-yellow-100 text-yellow-800 border-yellow-200",
      Activities: "bg-purple-100 text-purple-800 border-purple-200",
      Food: "bg-orange-100 text-orange-800 border-orange-200",
      Transportation: "bg-indigo-100 text-indigo-800 border-indigo-200",
      Other: "bg-gray-100 text-gray-800 border-gray-200",
    };
    return colors[category] || colors.Other;
  };

  return (
    <div>
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-gray-100 z-10 p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-900">Shared Expenses</h1>
          <Button
            onClick={() => setShowAddExpenseModal(true)}
            className="bg-green-500 hover:bg-green-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Expense
          </Button>
        </div>
      </div>

      {/* Accept All Banner */}
      {pendingExpensesCount > 0 && (
        <div className="bg-green-50 border-b border-green-100 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-green-700">
              {pendingExpensesCount} expenses need your review
            </span>
            <Button
              size="sm"
              onClick={() => acceptAllExpensesMutation.mutate()}
              disabled={acceptAllExpensesMutation.isPending}
              className="bg-green-500 hover:bg-green-600"
            >
              Accept All
            </Button>
          </div>
        </div>
      )}

      {/* Monthly Summary */}
      <div className="p-4">
        <div className="bg-gray-50 rounded-xl p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-3">
            {format(new Date(), "MMMM yyyy")} Summary
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-2xl font-bold" style={{ color: "var(--mom-primary)" }}>
                {momTotal}
              </div>
              <div className="text-sm text-gray-500">Mom's Share</div>
            </div>
            <div>
              <div className="text-2xl font-bold" style={{ color: "var(--dad-primary)" }}>
                {dadTotal}
              </div>
              <div className="text-sm text-gray-500">Dad's Share</div>
            </div>
          </div>
        </div>
      </div>

      {/* Expense List */}
      <div className="p-4 space-y-3">
        {expenses.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No expenses yet. Add your first expense to get started!</p>
          </div>
        ) : (
          expenses.map((expense: any) => (
            <div
              key={expense.id}
              className={`bg-white border rounded-xl p-4 shadow-sm ${
                expense.status === "pending" && expense.createdBy !== 1 // Assuming current user ID is 1
                  ? "border-green-200 border-dashed"
                  : "border-gray-200"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-gray-900">{expense.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {expense.description} • {format(new Date(expense.date), "MMM d, yyyy")}
                  </p>
                  <div className="flex items-center space-x-2 mt-2">
                    <Badge variant="outline" className={getCategoryColor(expense.category)}>
                      {expense.category}
                    </Badge>
                    <span className="text-xs text-gray-500">
                      Paid by {expense.paidBy === "mom" ? "Mom" : "Dad"}.
                    </span>
                    {expense.hasReceipt && (
                      <Paperclip className="w-3 h-3 text-gray-400" title="Has receipt" />
                    )}
                    {expense.status === "confirmed" && (
                      <Badge variant="outline" className="text-green-600 bg-green-50 border-green-200">
                        Confirmed
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="text-right ml-4">
                  <div className="text-lg font-semibold text-gray-900">
                    {formatCurrency(expense.amount)}
                  </div>
                  {expense.status === "pending" && expense.createdBy !== 1 && (
                    <div className="flex space-x-2 mt-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-green-600 hover:text-green-700"
                        onClick={() => handleAcceptExpense(expense.id)}
                      >
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => handleDeclineExpense(expense.id)}
                      >
                        Decline
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Expense Modal */}
      <Dialog open={showAddExpenseModal} onOpenChange={setShowAddExpenseModal}>
        <DialogContent className="max-w-sm mx-4">
          <DialogHeader>
            <DialogTitle>Add New Expense</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleExpenseSubmit} className="space-y-4">
            <div>
              <Label htmlFor="expense-name">Expense Name *</Label>
              <Input
                id="expense-name"
                value={expenseForm.name}
                onChange={(e) => setExpenseForm({ ...expenseForm, name: e.target.value })}
                placeholder="e.g., Winter boots for Emma"
                required
              />
            </div>
            <div>
              <Label htmlFor="expense-amount">Amount *</Label>
              <Input
                id="expense-amount"
                type="number"
                step="0.01"
                min="0"
                value={expenseForm.amount}
                onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                placeholder="0.00"
                required
              />
            </div>
            <div>
              <Label htmlFor="expense-category">Category *</Label>
              <Select
                value={expenseForm.category}
                onValueChange={(value) => setExpenseForm({ ...expenseForm, category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {EXPENSE_CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="expense-date">Date *</Label>
              <Input
                id="expense-date"
                type="date"
                value={expenseForm.date}
                onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>Paid By</Label>
              <RadioGroup
                value={expenseForm.paidBy}
                onValueChange={(value) => setExpenseForm({ ...expenseForm, paidBy: value })}
                className="flex space-x-4 mt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="mom" id="paid-mom" />
                  <Label htmlFor="paid-mom">Mom</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="dad" id="paid-dad" />
                  <Label htmlFor="paid-dad">Dad</Label>
                </div>
              </RadioGroup>
            </div>
            <div>
              <Label htmlFor="expense-description">Description</Label>
              <Textarea
                id="expense-description"
                value={expenseForm.description}
                onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                placeholder="Store name, additional details..."
                rows={2}
              />
            </div>
            <div className="flex space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAddExpenseModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  createExpenseMutation.isPending ||
                  !expenseForm.name.trim() ||
                  !expenseForm.amount ||
                  !expenseForm.category
                }
                className="flex-1 bg-green-500 hover:bg-green-600"
              >
                {createExpenseMutation.isPending ? "Adding..." : "Add Expense"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
