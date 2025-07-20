import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, ArrowRight } from "lucide-react";

interface CompletionScreenProps {
  onComplete: () => void;
  onBack: () => void;
}

export function CompletionScreen({ onComplete, onBack }: CompletionScreenProps) {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center space-y-4">
        <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center">
          <CheckCircle className="w-12 h-12 text-green-600" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900">You're All Set!</h2>
        <p className="text-lg text-gray-600">
          Welcome to Who's Night?! Your account is ready and you can start coordinating with your family.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>What's Next?</CardTitle>
          <CardDescription>
            Here are some things you can do to get started:
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-blue-600 text-sm font-semibold">1</span>
            </div>
            <div>
              <h4 className="font-medium">Explore the Calendar</h4>
              <p className="text-sm text-gray-600">
                Start by checking out the calendar view and see how assignments work.
              </p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-blue-600 text-sm font-semibold">2</span>
            </div>
            <div>
              <h4 className="font-medium">Create Your First Task</h4>
              <p className="text-sm text-gray-600">
                Add a task to your to-do list and see how family coordination works.
              </p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-blue-600 text-sm font-semibold">3</span>
            </div>
            <div>
              <h4 className="font-medium">Invite Family Members</h4>
              <p className="text-sm text-gray-600">
                Share the app with other family members to start collaborating.
              </p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-blue-600 text-sm font-semibold">4</span>
            </div>
            <div>
              <h4 className="font-medium">Track Expenses</h4>
              <p className="text-sm text-gray-600">
                Start logging family expenses to keep everyone informed about spending.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={onComplete} className="flex items-center gap-2">
          Start Using Who's Night?
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}