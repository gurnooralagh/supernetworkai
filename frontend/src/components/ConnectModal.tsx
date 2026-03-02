import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

const BACKEND_URL = "https://supernetworkai-production.up.railway.app";

interface ConnectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requesterId: string;
  receiverId: string;
  receiverName: string;
}

const ConnectModal = ({ open, onOpenChange, requesterId, receiverId, receiverName }: ConnectModalProps) => {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    setSending(true);
    try {
      const res = await fetch(`${BACKEND_URL}/connect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requester_id: requesterId,
          receiver_id: receiverId,
          personal_message: message,
        }),
      });
      if (!res.ok) throw new Error("Failed to send");
      toast.success("Connection request sent!");
      setMessage("");
      onOpenChange(false);
    } catch {
      toast.error("Failed to send connection request.");
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-['Space_Grotesk']">Connect with {receiverName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Textarea
            placeholder="Add a personal message (optional)"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
          />
          <Button onClick={handleSend} disabled={sending} className="w-full glow-primary">
            {sending ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Sending…</> : "Send Connection"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ConnectModal;
