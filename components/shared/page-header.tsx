export function PageHeader({
    title,
    description,
    action
}: {
    title: string;
    description?: string;
    action?: React.ReactNode;
}) {
    return (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
                {description && <p className="text-zinc-500 mt-1">{description}</p>}
            </div>
            {action && <div>{action}</div>}
        </div>
    );
}
