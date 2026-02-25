import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";

export function BillingCycleTable({ cycles = [] }: { cycles: any[] }) {
    if (cycles.length === 0) {
        return <div className="text-zinc-500 text-sm p-4 border rounded-md bg-zinc-50">No billing cycles defined.</div>;
    }

    return (
        <div className="rounded-md border border-zinc-200 bg-white">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Cycle</TableHead>
                        <TableHead>Period</TableHead>
                        <TableHead className="text-right">Opening</TableHead>
                        <TableHead className="text-right">Interest</TableHead>
                        <TableHead className="text-right">Due</TableHead>
                        <TableHead className="text-right">Paid</TableHead>
                        <TableHead className="text-right">Balance</TableHead>
                        <TableHead>Status</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {cycles.map((cycle) => (
                        <TableRow key={cycle.id}>
                            <TableCell className="font-medium">#{cycle.cycleNumber}</TableCell>
                            <TableCell className="text-xs text-zinc-500">
                                {formatDate(cycle.cycleStartDate)} - {formatDate(cycle.cycleEndDate)}
                            </TableCell>
                            <TableCell className="text-right">{formatCurrency(parseFloat(cycle.openingPrincipal))}</TableCell>
                            <TableCell className="text-right text-red-500">+{formatCurrency(parseFloat(cycle.interestCharged))}</TableCell>
                            <TableCell className="text-right font-medium">{formatCurrency(parseFloat(cycle.totalDue))}</TableCell>
                            <TableCell className="text-right text-emerald-600 font-medium">-{formatCurrency(parseFloat(cycle.totalPaid))}</TableCell>
                            <TableCell className="text-right font-bold">{formatCurrency(parseFloat(cycle.balance))}</TableCell>
                            <TableCell>
                                <Badge
                                    variant={cycle.status === 'closed' ? "secondary" : cycle.status === 'overdue' ? "destructive" : "default"}
                                >
                                    {cycle.status}
                                </Badge>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
