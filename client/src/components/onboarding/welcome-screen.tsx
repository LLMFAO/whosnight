import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, CheckSquare, DollarSign, Users } from "lucide-react";

interface WelcomeScreenProps {
  onNext: () => void;
}

export function WelcomeScreen({ onNext }: WelcomeScreenProps) {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-gray-900">Welcome to Who'sNight!</h1>
        <p className="text-xl text-gray-600">
          The family coordination app that makes managing your household simple and stress-free.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="text-center">
            <Calendar className="w-12 h-12 mx-auto text-blue-500" />
            <CardTitle>Calendar Management</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Keep track of who's responsible for what on any given day. Assign duties and get confirmations.
            </CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="text-center">
            <CheckSquare className="w-12 h-12 mx-auto text-green-500" />
            <CardTitle>Task Lists</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Create and manage family tasks. Track completion and ensure nothing falls through the cracks.
            </CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="text-center">
            <DollarSign className="w-12 h-12 mx-auto text-yellow-500" />
            <CardTitle>Expense Tracking</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Monitor family expenses, track who paid for what, and maintain financial transparency.
            </CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="text-center">
            <Users className="w-12 h-12 mx-auto text-purple-500" />
            <CardTitle>Family Coordination</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Perfect for co-parents, families with teens, or any household that needs better organization.
            </CardDescription>
          </CardContent>
        </Card>
      </div>

      <div className="text-center">
        <Button onClick={onNext} size="lg" className="px-8">
          Get Started
        </Button>
      </div>
    </div>
  );
}