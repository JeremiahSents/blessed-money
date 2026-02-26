import fs from 'fs';
import path from 'path';

// Map of common Lucide icons to Hugeicons (Core Free)
const iconMap: Record<string, string> = {
    BookOpenIcon: 'Book02Icon',
    LayoutDashboardIcon: 'DashboardSquare01Icon',
    UsersIcon: 'UserMultipleIcon',
    WalletIcon: 'Wallet01Icon',
    FileTextIcon: 'PropertyEditIcon', // Approximation
    SettingsIcon: 'Settings01Icon',
    XIcon: 'Cancel01Icon',
    FileIcon: 'DocumentIcon',
    ArrowUpRightIcon: 'ArrowUpRight01Icon',
    Trash2Icon: 'Delete02Icon',
    AlertCircleIcon: 'Alert02Icon',
    UploadCloudIcon: 'CloudUploadIcon',
    ArrowDownLeftIcon: 'ArrowDownLeft01Icon',
    PlusIcon: 'PlusSignIcon',
    Loader2Icon: 'Loading02Icon', // Wait, Next uses spin, we might just need any custom loader or keep lucide for spin? Hugeicons spin via CSS.
    DownloadIcon: 'Download04Icon',
    LogOutIcon: 'Logout03Icon',
    ActivityIcon: 'Activity01Icon',
    ArrowLeftIcon: 'ArrowLeft01Icon',
    HistoryIcon: 'TimeQuarterPastIcon',
    EditIcon: 'PencilEdit01Icon',
    MailIcon: 'Mail01Icon',
    PhoneIcon: 'TelephoneIcon',
    CheckCircleIcon: 'CheckmarkCircle02Icon'
};

const PROJECT_DIR = 'c:\\Users\\Jeremiah Sentomero\\Desktop\\Projects\\blessed-money';

function processFile(filePath: string) {
    let content = fs.readFileSync(filePath, 'utf-8');

    // Find the import line for lucide-react
    const lucideImportMatch = content.match(/import\s+{([^}]+)}\s+from\s+['"]lucide-react['"];?/);
    if (!lucideImportMatch) return;

    const lucideIcons = lucideImportMatch[1].split(',').map(i => i.trim());

    let importsHugeicons = [`import { HugeiconsIcon } from '@hugeicons/react';`];
    let hugeiconImportsCore = [];

    for (const lucideIcon of lucideIcons) {
        const hugeIcon = iconMap[lucideIcon] || lucideIcon.replace('Icon', '01Icon'); // fallback guessing
        hugeiconImportsCore.push(hugeIcon);

        // Replace <IconName ... /> with <HugeiconsIcon icon={IconName} size={24} color="currentColor" strokeWidth={1.5} ... />
        // Also we need to catch dynamic className parsing
        // Actually simpler: we can just map the import names, and when it's rendered in JSX:
        // <LucideIcon className="..." /> -> <HugeiconsIcon icon={HugeIcon} className="..." ... />

        const jsxRegex = new RegExp(`<${lucideIcon}([^>]*?)/?>`, 'g');

        content = content.replace(jsxRegex, (match, attrs) => {
            // preserve className etc but remove w- h- classes if preferred, though HugeiconsIcon can take className
            // Since HugeiconsIcon might need its own props, let's inject them.
            return `<HugeiconsIcon icon={${hugeIcon}} ${attrs.trim()} />`;
        });
    }

    // Replace old import with new imports
    const newImports = `import { HugeiconsIcon } from '@hugeicons/react';\nimport { ${hugeiconImportsCore.join(', ')} } from '@hugeicons/core-free-icons';`;
    content = content.replace(lucideImportMatch[0], newImports);

    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${filePath}`);
}

const files = [
    "components\\shared\\Navigation.tsx",
    "components\\shared\\FilePreviewThumbnail.tsx",
    "components\\loans\\LoanCard.tsx",
    "components\\layout\\MainLayout.tsx",
    "components\\loans\\LoanForm.tsx",
    "components\\dashboard\\OverduePanel.tsx",
    "components\\customers\\IdImageGallery.tsx",
    "components\\customers\\IdDocumentUploader.tsx",
    "components\\dashboard\\ActivityFeed.tsx",
    "components\\collateral\\CollateralUploader.tsx",
    "app\\payments\\page.tsx",
    "app\\settings\\page.tsx",
    "app\\page.tsx",
    "app\\reports\\page.tsx",
    "app\\loans\\[id]\\page.tsx",
    "app\\loans\\new\\page.tsx",
    "app\\customers\\page.tsx",
    "app\\customers\\[id]\\page.tsx",
    "components\\collateral\\CollateralList.tsx",
    "components\\collateral\\CollateralItemCard.tsx",
    "app\\(auth)\\signin\\page.tsx"
];

for (const file of files) {
    const fullPath = path.join(PROJECT_DIR, file);
    if (fs.existsSync(fullPath)) {
        processFile(fullPath);
    }
}
