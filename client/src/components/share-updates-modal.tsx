import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Share, Check, Link, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ShareUpdatesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pendingCount: number;
  pendingItems: any;
}

export default function ShareUpdatesModal({
  open,
  onOpenChange,
  pendingCount,
  pendingItems,
}: ShareUpdatesModalProps) {
  const [isSharing, setIsSharing] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const shareLinkMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/share-link", {
        message: `CoParent Connect Update: ${pendingCount} changes have been made!`,
      });
    },
    onSuccess: (data: any) => {
      // Use native share API if available, otherwise copy to clipboard
      if (navigator.share) {
        navigator.share({
          title: "CoParent Connect Update",
          text: data.message,
          url: data.shareUrl,
        }).catch(() => {
          // Fallback to clipboard
          navigator.clipboard?.writeText(data.shareUrl);
          toast({
            title: "Link copied!",
            description: "Share link has been copied to clipboard.",
          });
        });
      } else {
        // Fallback to clipboard
        navigator.clipboard?.writeText(data.shareUrl);
        toast({
          title: "Link copied!",
          description: "Share link has been copied to clipboard.",
        });
      }
      
      queryClient.invalidateQueries({ queryKey: ["/api/pending"] });
      onOpenChange(false);
    },
  });

  const notifyExternalMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/notify-external", {});
    },
    onSuccess: () => {
      toast({
        title: "Notification logged",
        description: "External notification has been recorded.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/pending"] });
      onOpenChange(false);
    },
  });

  const handleShareViaLink = () => {
    setIsSharing(true);
    shareLinkMutation.mutate();
  };

  const handleNotifyExternal = () => {
    notifyExternalMutation.mutate();
  };

  const generateUpdateSummary = () => {
    const summary = [];
    
    if (pendingItems?.assignments?.length > 0) {
      summary.push(`• ${pendingItems.assignments.length} custody assignment${pendingItems.assignments.length > 1 ? 's' : ''}`);
    }
    
    if (pendingItems?.events?.length > 0) {
      summary.push(`• ${pendingItems.events.length} event${pendingItems.events.length > 1 ? 's' : ''}`);
    }
    
    if (pendingItems?.tasks?.length > 0) {
      summary.push(`• ${pendingItems.tasks.length} task${pendingItems.tasks.length > 1 ? 's' : ''}`);
    }
    
    if (pendingItems?.expenses?.length > 0) {
      summary.push(`• ${pendingItems.expenses.length} expense${pendingItems.expenses.length > 1 ? 's' : ''}`);
    }
    
    return summary;
  };

  const updateSummary = generateUpdateSummary();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm mx-4">
        <DialogHeader className="text-center">
          <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Share className="w-6 h-6 text-orange-600" />
          </div>
          <DialogTitle className="text-lg font-semibold">Share Your Updates</DialogTitle>
          <p className="text-sm text-gray-500 mt-2">
            You have {pendingCount} pending change{pendingCount !== 1 ? 's' : ''} to share with your co-parent
          </p>
        </DialogHeader>

        {/* Update Summary */}
        {updateSummary.length > 0 && (
          <div className="bg-gray-50 rounded-xl p-3 mb-6 text-sm">
            <ul className="space-y-1 text-gray-700">
              {updateSummary.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="space-y-3">
          <Button
            className="w-full h-12 bg-blue-500 hover:bg-blue-600"
            onClick={handleShareViaLink}
            disabled={shareLinkMutation.isPending || isSharing}
          >
            <Link className="w-4 h-4 mr-2" />
            {shareLinkMutation.isPending || isSharing ? "Generating Link..." : "Share via Link"}
          </Button>
          
          <Button
            variant="outline"
            className="w-full h-12"
            onClick={handleNotifyExternal}
            disabled={notifyExternalMutation.isPending}
          >
            <Check className="w-4 h-4 mr-2" />
            {notifyExternalMutation.isPending ? "Logging..." : "I've Already Notified Co-Parent"}
          </Button>
          
          <Button
            variant="ghost"
            className="w-full h-12 text-gray-500"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
