import { fmtUGX } from "@/lib/pms-store";

type GuestRegistrationFormProps = {
  guestName: string;
  idType: string;
  idNumber: string;
  nationality: string;
  phone: string;
  email: string;
  roomNumber: string;
  roomType: string;
  checkInDate: string;
  checkOutDate: string;
  nights: number;
  adults: number;
  children: number;
  ratePerNight: number;
  totalAmount: number;
  specialRequests?: string;
  purpose?: string;
  vipFlag?: boolean;
  onClose: () => void;
};

function FieldRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-dotted border-slate-300 py-1.5 text-sm">
      <span className="shrink-0 font-semibold text-slate-700">{label}</span>
      <span className="text-right font-medium text-slate-900">{value}</span>
    </div>
  );
}

function SectionTitle({ title }: { title: string }) {
  return (
    <h4 className="mb-2 mt-5 border-b-2 border-slate-800 pb-1 text-xs font-bold uppercase tracking-wider text-slate-800">
      {title}
    </h4>
  );
}

export default function GuestRegistrationForm({
  guestName,
  idType,
  idNumber,
  nationality,
  phone,
  email,
  roomNumber,
  roomType,
  checkInDate,
  checkOutDate,
  nights,
  adults,
  children,
  ratePerNight,
  totalAmount,
  specialRequests,
  purpose,
  vipFlag,
  onClose,
}: GuestRegistrationFormProps) {
  const printedDate = new Date().toLocaleDateString();

  return (
    <div className="jambo-reg-print-wrap fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/40 p-4 backdrop-blur-sm">
      <div className="jambo-reg-form-print w-full max-w-2xl rounded-2xl border border-border bg-white text-slate-900 shadow-2xl">
        <div className="no-print flex items-center justify-between border-b border-slate-200 px-5 py-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">
            Guest Registration Form
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
            >
              Print
            </button>
            <button
              onClick={onClose}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-4 py-2 text-xs font-medium text-muted-foreground transition hover:text-foreground"
            >
              Close
            </button>
          </div>
        </div>

        <div className="p-6 sm:p-8">
          <div className="mb-4 border-b-4 border-double border-slate-800 pb-3 text-center">
            <div className="text-2xl font-black tracking-tight">JAMBO PMS</div>
            <div className="mt-1 text-lg font-bold uppercase tracking-wide">Guest Registration Form</div>
            <div className="mt-3 flex items-center justify-between text-xs text-slate-600">
              <span>Date printed: {printedDate}</span>
              <span>Reg. #: ___________</span>
            </div>
          </div>

          <SectionTitle title="1. Guest Information" />
          <div>
            <FieldRow label="Full Name" value={guestName} />
            <FieldRow label="Nationality" value={nationality || "—"} />
            <FieldRow label="ID Type" value={idType || "—"} />
            <FieldRow label="ID Number" value={idNumber || "—"} />
            <FieldRow label="Phone" value={phone || "—"} />
            <FieldRow label="Email" value={email || "—"} />
            {purpose && <FieldRow label="Purpose of Visit" value={purpose} />}
            {vipFlag && <FieldRow label="VIP" value="Yes" />}
          </div>

          <SectionTitle title="2. Stay Details" />
          <div>
            <FieldRow label="Room" value={roomNumber ? `${roomNumber}${roomType ? ` · ${roomType}` : ""}` : "—"} />
            <FieldRow label="Check-In Date" value={checkInDate} />
            <FieldRow label="Check-Out Date" value={checkOutDate} />
            <FieldRow label="Number of Nights" value={String(nights)} />
            <FieldRow
              label="Guests"
              value={`${adults} Adult${adults !== 1 ? "s" : ""}${children ? `, ${children} Child${children !== 1 ? "ren" : ""}` : ""}`}
            />
            <FieldRow label="Rate per Night" value={fmtUGX(ratePerNight)} />
            <FieldRow label="Total Estimated Amount" value={fmtUGX(totalAmount)} />
            <FieldRow label="Special Requests" value={specialRequests?.trim() ? specialRequests : "None"} />
          </div>

          <SectionTitle title="3. Declaration" />
          <p className="text-sm italic text-slate-700">
            I confirm that the details above are correct. I agree to abide by the hotel&apos;s terms and
            conditions. I accept responsibility for any charges incurred during my stay.
          </p>

          <SectionTitle title="4. Signatures" />
          <div className="mt-2 grid grid-cols-1 gap-8 sm:grid-cols-2">
            <div>
              <p className="text-sm text-slate-800">Guest Signature: _________________________</p>
              <p className="mt-8 text-sm text-slate-800">Date: _______________</p>
            </div>
            <div>
              <p className="text-sm text-slate-800">Received by (Staff): _________________________</p>
              <p className="mt-8 text-sm text-slate-800">Date: _______________</p>
            </div>
          </div>

          <div className="mt-8 border-t border-slate-300 pt-3 text-center text-xs text-slate-600">
            <p>This form is valid for the stated period only.</p>
            <p>Jambo Sphere Ltd · Kampala, Uganda</p>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          body * { visibility: hidden; }
          .jambo-reg-form-print, .jambo-reg-form-print * { visibility: visible; }
          .jambo-reg-print-wrap {
            position: static !important;
            display: block !important;
            overflow: visible !important;
            background: none !important;
            backdrop-filter: none !important;
            padding: 0 !important;
          }
          .jambo-reg-form-print {
            width: 100% !important;
            max-width: none !important;
            margin: 0 !important;
            border: none !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            background: #fff !important;
            color: #000 !important;
            font-family: Georgia, 'Times New Roman', serif;
          }
          .no-print { display: none !important; }
          body { background: #fff !important; }
          @page { size: A4 portrait; margin: 1.5cm; }
        }
      `}</style>
    </div>
  );
}
