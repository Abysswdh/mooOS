# scaffold.ps1
# Jalanin dari root repo: PS C:\Users\putra\Desktop\mooOS\mooos> .\scaffold.ps1

function New-Stub {
    param([string]$Path)
    if (-not (Test-Path $Path)) {
        New-Item -ItemType File -Path $Path -Force | Out-Null
        Write-Host "created: $Path"
    } else {
        Write-Host "skip (exists): $Path"
    }
}

# ---------- BACKEND ----------
$backendFiles = @(
    "backend\app\__init__.py",
    "backend\app\main.py",
    "backend\app\config.py",
    "backend\app\database.py",
    "backend\app\dependencies.py",

    "backend\app\models\__init__.py",
    "backend\app\models\user.py",
    "backend\app\models\member.py",
    "backend\app\models\cow.py",
    "backend\app\models\feed.py",
    "backend\app\models\milk.py",
    "backend\app\models\waste.py",
    "backend\app\models\market_price.py",
    "backend\app\models\checklist.py",
    "backend\app\models\notification.py",
    "backend\app\models\attendance.py",

    "backend\app\schemas\__init__.py",
    "backend\app\schemas\auth.py",
    "backend\app\schemas\cow.py",
    "backend\app\schemas\member.py",
    "backend\app\schemas\checklist.py",

    "backend\app\routers\__init__.py",
    "backend\app\routers\auth.py",
    "backend\app\routers\attendance.py",
    "backend\app\routers\cows.py",
    "backend\app\routers\members.py",
    "backend\app\routers\feed.py",
    "backend\app\routers\milk.py",
    "backend\app\routers\waste.py",
    "backend\app\routers\checklist.py",
    "backend\app\routers\reports.py",
    "backend\app\routers\prices.py",
    "backend\app\routers\notifications.py",
    "backend\app\routers\health.py",

    "backend\app\services\__init__.py",
    "backend\app\services\mrp_engine.py",
    "backend\app\services\feed_mrp.py",
    "backend\app\services\milk_mrp.py",
    "backend\app\services\waste_mrp.py",
    "backend\app\services\report_generator.py",

    "backend\app\utils\__init__.py",
    "backend\app\utils\pdf.py",
    "backend\app\utils\qr.py",
    "backend\app\utils\security.py",

    "backend\tests\__init__.py",
    "backend\tests\test_mrp_engine.py",
    "backend\tests\test_auth.py",
    "backend\tests\test_cows.py",

    "backend\requirements.txt",
    "backend\.env.example"
)

# ---------- BOT (handlers already exist per your listing, but just in case) ----------
$botFiles = @(
    "bot\handlers\__init__.py",
    "bot\handlers\lapor.py",
    "bot\handlers\cows.py",
    "bot\handlers\sales.py",
    "bot\handlers\feed.py",
    "bot\bot.py",
    "bot\requirements.txt"
)

# ---------- FRONTEND ----------
$frontendFiles = @(
    "frontend\src\lib\api.ts",
    "frontend\src\lib\notify.ts",
    "frontend\src\lib\formatters.ts",

    "frontend\src\hooks\useCows.ts",
    "frontend\src\hooks\useMembers.ts",
    "frontend\src\hooks\useChecklist.ts",
    "frontend\src\hooks\useDashboard.ts",
    "frontend\src\hooks\useNotifications.ts",

    "frontend\src\components\ui\StatusBadge.tsx",
    "frontend\src\components\ui\DataTable.tsx",
    "frontend\src\components\ui\KPICard.tsx",
    "frontend\src\components\ui\Chart.tsx",
    "frontend\src\components\ui\ComingSoon.tsx",
    "frontend\src\components\ui\LoadingSpinner.tsx",
    "frontend\src\components\ui\EmptyState.tsx",
    "frontend\src\components\ui\ErrorState.tsx",

    "frontend\src\components\layout\Sidebar.tsx",
    "frontend\src\components\layout\Header.tsx",
    "frontend\src\components\layout\NotificationBell.tsx",

    "frontend\src\components\features\ChecklistPanel.tsx",
    "frontend\src\components\features\AbsensiCard.tsx",
    "frontend\src\components\features\CowTable.tsx",
    "frontend\src\components\features\PriceInputModal.tsx",

    "frontend\src\app\login\page.tsx",
    "frontend\src\app\dashboard\page.tsx",
    "frontend\src\app\dashboard\ternak\page.tsx",
    "frontend\src\app\dashboard\anggota\page.tsx",
    "frontend\src\app\dashboard\hasil\page.tsx",
    "frontend\src\app\dashboard\pakan\page.tsx",
    "frontend\src\app\dashboard\laporan\page.tsx",
    "frontend\src\app\dashboard\limbah\page.tsx",
    "frontend\src\app\dashboard\transaksi\page.tsx",
    "frontend\src\app\dashboard\pengaturan\page.tsx",

    "frontend\.env.example"
)

Write-Host "`n=== Backend ===" -ForegroundColor Cyan
$backendFiles | ForEach-Object { New-Stub $_ }

Write-Host "`n=== Bot ===" -ForegroundColor Cyan
$botFiles | ForEach-Object { New-Stub $_ }

Write-Host "`n=== Frontend ===" -ForegroundColor Cyan
$frontendFiles | ForEach-Object { New-Stub $_ }

Write-Host "`nDone. Run 'git status' to review before committing." -ForegroundColor Green