import { useState } from "react";
import { Search, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useStore } from "@/lib/pms-store";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export function GuestAutocomplete({
  firstName,
  lastName,
  onSelect,
}: {
  firstName: string;
  lastName: string;
  onSelect: (data: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    nationality: string;
    idType: string;
    idNumber: string;
  }) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const guests = useStore((s) => s.guests);

  const fullName = `${firstName} ${lastName}`.trim();
  const filtered = guests.filter(
    (g) =>
      g.fullName.toLowerCase().includes(search.toLowerCase()) ||
      g.email.toLowerCase().includes(search.toLowerCase()) ||
      g.phone.includes(search),
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div
          role="combobox"
          aria-expanded={open}
          className="sm:col-span-2"
        >
          <div className="group relative cursor-text">
            <div className="relative rounded-xl border border-border/70 bg-card/30 transition focus-within:border-primary/60 focus-within:bg-card/60 focus-within:shadow-[0_0_0_4px_color-mix(in_oklab,var(--color-primary)_18%,transparent)]">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary">
                <Search className="h-4 w-4" />
              </span>
              <input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  if (!open) setOpen(true);
                }}
                onFocus={() => setOpen(true)}
                placeholder="Search existing guest…"
                className="peer block w-full bg-transparent px-11 pb-2.5 pt-6 text-sm outline-none placeholder:text-muted-foreground/60"
              />
              <label
                className={cn(
                  "pointer-events-none absolute left-11 top-1.5 text-[11px] text-muted-foreground",
                  search && "text-primary",
                )}
              >
                Existing guest
              </label>
            </div>
          </div>
        </div>
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] p-0"
        align="start"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search by name, email or phone…"
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            {filtered.length > 0 ? (
              <CommandGroup>
                {filtered.slice(0, 10).map((guest) => (
                  <CommandItem
                    key={guest.id}
                    value={guest.fullName}
                    onSelect={() => {
                      const parts = guest.fullName.split(" ");
                      const fn = parts[0] ?? "";
                      const ln = parts.slice(1).join(" ");
                      onSelect({
                        firstName: fn,
                        lastName: ln,
                        email: guest.email,
                        phone: guest.phone,
                        nationality: guest.nationality,
                        idType: guest.idType,
                        idNumber: guest.idNumber,
                      });
                      setSearch("");
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4 shrink-0",
                        guest.fullName.toLowerCase() === fullName.toLowerCase()
                          ? "opacity-100"
                          : "opacity-0",
                      )}
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{guest.fullName}</p>
                      <p className="text-[11px] text-muted-foreground">
                        <span className="font-mono text-muted-foreground/50">{guest.id}</span> &middot; {guest.email} &middot; {guest.phone}
                        {guest.nationality && ` · ${guest.nationality}`}
                      </p>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            ) : (
              <CommandEmpty>No guest found. Type a new name below.</CommandEmpty>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
