import { useState } from "react";
import { createGroupBlock, type BillingArrangement } from "@/lib/pms-store";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface CreateGroupBlockDialogProps {
  checkIn: string;
  checkOut: string;
  currentRate: number;
  onClose: () => void;
  onCreated: (blockId: string, rate: number) => void;
}

export function CreateGroupBlockDialog({
  checkIn,
  checkOut,
  currentRate,
  onClose,
  onCreated,
}: CreateGroupBlockDialogProps) {
  const [groupName, setGroupName] = useState("");
  const [startDate, setStartDate] = useState(checkIn);
  const [endDate, setEndDate] = useState(checkOut);
  const [totalRoomsBlocked, setTotalRoomsBlocked] = useState(1);
  const [groupRate, setGroupRate] = useState(currentRate);
  const [organiserName, setOrganiserName] = useState("");
  const [billingArrangement, setBillingArrangement] = useState<BillingArrangement>("pay_at_checkout");
  const handleSubmit = () => {
    if (!groupName || !startDate || !endDate) {
      toast.error("Group name, start date, and end date are required.");
      return;
    }
    if (startDate > endDate) {
      toast.error("Start date must not be after end date.");
      return;
    }
    if (totalRoomsBlocked < 1) {
      toast.error("Rooms blocked must be at least 1.");
      return;
    }
    const block = createGroupBlock({
      groupName,
      startDate,
      endDate,
      totalRoomsBlocked,
      totalPax: totalRoomsBlocked,
      groupRate,
      organiserName: organiserName || undefined,
      billingArrangement,
    });
    onCreated(block.id, block.groupRate);
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create Group Block</DialogTitle>
          <DialogDescription>
            Define a new group block for the selected date range.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label>Group name *</Label>
            <Input
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="e.g. Annual Company Retreat"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Start date *</Label>
              <DatePicker value={startDate} onChange={setStartDate} />
            </div>
            <div>
              <Label>End date *</Label>
              <DatePicker value={endDate} onChange={setEndDate} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Rooms blocked *</Label>
              <Input
                type="number"
                min={1}
                value={totalRoomsBlocked}
                onChange={(e) => setTotalRoomsBlocked(Number(e.target.value))}
              />
            </div>
            <div>
              <Label>Group rate (UGX/night)</Label>
              <Input
                type="number"
                min={0}
                value={groupRate}
                onChange={(e) => setGroupRate(Number(e.target.value))}
              />
            </div>
          </div>
          <div>
            <Label>Organiser name (optional)</Label>
            <Input
              value={organiserName}
              onChange={(e) => setOrganiserName(e.target.value)}
              placeholder="e.g. Jane Doe"
            />
          </div>
          <div>
            <Label>Group type</Label>
            <Select value={billingArrangement} onValueChange={(v) => setBillingArrangement(v as BillingArrangement)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Group type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pay_at_checkout">Ad-hoc (Pay at Check-out)</SelectItem>
                <SelectItem value="city_ledger">Organisation (City Ledger)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Create Block</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}