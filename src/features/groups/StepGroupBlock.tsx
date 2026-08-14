import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ChevronDown, Plus, Tag } from "lucide-react";
import { useStore, effectiveStatus, type GroupBlock } from "@/lib/pms-store";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CreateGroupBlockDialog } from "./CreateGroupBlockDialog";

interface StepGroupBlockProps {
  checkIn: string;
  checkOut: string;
  groupBlockId: string | undefined;
  currentRate: number;
  onSelect: (blockId: string | undefined, rate: number) => void;
}

export function StepGroupBlock({
  checkIn,
  checkOut,
  groupBlockId,
  currentRate,
  onSelect,
}: StepGroupBlockProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const groupBlocks = useStore((s) => s.groupBlocks);
  const reservations = useStore((s) => s.reservations);
  const [open, setOpen] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  const activeBlocks = groupBlocks.filter((b) => {
    const eff = effectiveStatus(b);
    return eff !== "cancelled" && eff !== "closed";
  });

  const dateFiltered = checkIn
    ? activeBlocks.filter((b) => b.startDate <= checkIn && b.endDate >= checkOut)
    : [];

  const selectedBlock = groupBlockId
    ? groupBlocks.find((b) => b.id === groupBlockId)
    : undefined;

  const pickedUpForSelected = selectedBlock
    ? reservations.filter(
        (r) => r.groupBlockId === selectedBlock.id && r.status !== "cancelled",
      ).length
    : 0;

  const remainingForSelected = selectedBlock
    ? selectedBlock.totalRoomsBlocked - pickedUpForSelected
    : 0;

  return (
    <div className="space-y-2">
      <label className="text-[10px] uppercase tracking-wider text-muted-foreground">
        Group Block
      </label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between h-auto py-3 px-4"
          >
            <span className="flex items-center gap-2 truncate">
              <Tag className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              {selectedBlock
                ? `${selectedBlock.groupName} — UGX ${selectedBlock.groupRate.toLocaleString()} (${remainingForSelected} remaining)`
                : "Select a group block…"}
            </span>
            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput placeholder="Search group blocks…" />
            <CommandEmpty>No matching group blocks.</CommandEmpty>
            <CommandGroup>
              {dateFiltered.map((b) => {
                const pickedUp = reservations.filter(
                  (r) => r.groupBlockId === b.id && r.status !== "cancelled",
                ).length;
                const rem = b.totalRoomsBlocked - pickedUp;
                return (
                  <CommandItem
                    key={b.id}
                    onSelect={() => {
                      onSelect(b.id, b.groupRate);
                      setOpen(false);
                    }}
                    className={cn(groupBlockId === b.id && "bg-primary/10")}
                  >
                    <div className="flex-1">
                      <div className="text-sm font-semibold">{b.groupName}</div>
                      <div className="text-xs text-muted-foreground">
                        {b.startDate} → {b.endDate} ·{" "}
                        {b.organiserName ?? "No organiser"}
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-2">
                      <div className="text-sm font-semibold text-success">
                        UGX {b.groupRate.toLocaleString()}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        {rem} remaining
                      </div>
                    </div>
                  </CommandItem>
                );
              })}
              {dateFiltered.length === 0 && (
                <CommandItem disabled>
                  No blocks available for these dates.
                </CommandItem>
              )}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 text-xs"
          onClick={() => setShowCreate(true)}
        >
          <Plus className="h-3 w-3 mr-1" /> Create
        </Button>
        {groupBlockId && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-muted-foreground"
            onClick={() => {
              onSelect(undefined, currentRate);
              searchParams.delete("groupBlockId");
              setSearchParams(searchParams);
            }}
          >
            Clear selection
          </Button>
        )}
      </div>
      {showCreate && (
        <CreateGroupBlockDialog
          checkIn={checkIn}
          checkOut={checkOut}
          currentRate={currentRate}
          onClose={() => setShowCreate(false)}
          onCreated={(blockId, rate) => {
            onSelect(blockId, rate);
            setShowCreate(false);
          }}
        />
      )}
    </div>
  );
}