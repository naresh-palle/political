import subprocess

diff = subprocess.check_output(['git', 'show', '00db8ff'], text=True, errors='ignore')

checks = {
    '0 - Reach ratio': 'Reach ratio' in diff or 'reach ratio' in diff.lower(),
    '0 - Cap bars at 100%': 'Math.min(100' in diff or '100%' in diff,
    '0 - No account vs Not synced': 'No account' in diff or 'Not synced' in diff,
    '1 - Audit progress card': 'Audit progress' in diff,
    '1 - Pill tab switch (MLA/MLC/MP)': 'MLA ' in diff and 'tier.label' in diff,
    '2 - Reachable voters online': 'Reachable voters online' in diff,
    '2 - Stacked platform bar': 'share' in diff and ('Facebook' in diff or 'stacked' in diff.lower()),
    '3 - Against you / For you / Watch': 'Against you' in diff or 'For you' in diff,
    '3 - 3-color sentiment bar': 'sentiment' in diff.lower() and ('emerald' in diff or 'red' in diff or 'amber' in diff),
    '3 - Draft response button': 'Draft response' in diff,
    '4 - Breadcrumb picker': 'Change' in diff and '>' in diff,
    '4 - Single month control': 'Nov 2026' in diff or 'month' in diff.lower(),
    '4 - Rename Sync All': 'last synced' in diff.lower() or 'Refresh data' in diff,
    '5 - District row tappable': 'cursor-pointer' in diff and 'tr' in diff.lower(),
    '5 - Weakest 3 districts': 'Weakest' in diff or 'weakest' in diff.lower(),
    '5 - Where they stand ▲/▼': 'Where They Stand' in diff or 'Where they stand' in diff or 'rank' in diff.lower(),
}

print("=== AUDIT CHECK OF COMMIT 00db8ff ===")
for k, v in checks.items():
    print(f"{'[INCLUDED]' if v else '[MISSING]'} {k}")
