export type Id = string;

export interface Customer {
  id: Id;
  name: string;
  phone: string | null;
  email: string | null;
  nationalIdType: string | null;
  nationalIdNumber: string | null;
  nationalIdExpiry: string | null;
  nationalIdImagePaths?: string[] | null;
  notes: string | null;
  isActive?: boolean;
  createdAt?: string | Date;
  loans?: LoanSummary[];
}

export interface LoanSummary {
  id: Id;
  customerId: Id;
  principalAmount: string;
  interestRate: string;
  startDate: string;
  dueDate: string;
  status: "active" | "overdue" | "settled";
  notes?: string | null;
}

export interface CollateralItem {
  id: Id;
  loanId: Id;
  description: string;
  estimatedValue: string | null;
  serialNumber: string | null;
  imagePaths: string[] | null;
  returnedAt: string | Date | null;
  notes: string | null;
}

export interface BillingCycle {
  id: Id;
  loanId: Id;
  cycleNumber: number;
  cycleStartDate: string;
  cycleEndDate: string;
  openingPrincipal: string;
  interestCharged: string;
  totalDue: string;
  totalPaid: string;
  balance: string;
  status: "open" | "closed" | "overdue";
}

export interface LoanDetail extends LoanSummary {
  customer: Customer;
  collateral: CollateralItem[];
  billingCycles: BillingCycle[];
}

export interface Payment {
  id: Id;
  loanId: Id;
  amount: string;
  paidAt: string;
  note: string | null;
  createdAt?: string | Date;
  loan?: {
    customer: Pick<Customer, "id" | "name">;
  };
}

export type ActivityItem =
  | { type: "PAYMENT"; date: string | Date; data: Payment }
  | { type: "LOAN"; date: string | Date; data: LoanSummary & { customer?: Pick<Customer, "id" | "name"> } };

export interface MonthlyReportRow {
  month: string;
  loansIssuedCount: number;
  loansIssuedPrincipal: number;
  collected: number;
  interestEarned: number;
}
