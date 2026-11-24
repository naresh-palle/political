with open('frontend/src/components/intel/PoliticalIntelligence.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

checks = {
    '0.1 Reach ratio (replaces Penetration over 100%)': 'Reach ratio' in content or 'Reach Ratio' in content,
    '0.2 Cap bars at 100%': 'Math.min(100' in content,
    '0.3 No account vs Not synced badge distinction': 'Not synced' in content and 'No account' in content,
    '0.4 Hide/label estimated Posts and Engagement': 'Posts' in content and 'Engagement' in content,
    '1.1 Audit progress hero card': 'Audit progress' in content,
    '1.2 MLA / MLC / MP pill switch with greyed 0': 'tier.type' in content and 'disabled' in content,
    '1.3 Need attention tile': 'Need attention' in content,
    '2.1 Reachable voters online hero card': 'Reachable voters online' in content,
    '2.2 Stacked platform bar': 'Facebook · Instagram · X · YouTube share' in content or 'Facebook · Instagram' in content,
    '2.3 Collapsed line: 175 seats · 46,120 booths (details toggle)': '175 seats · 46,120 booths' in content or 'booths' in content and 'details' in content,
    '3.1 Client sentiment (Against you / For you / Watch)': 'Against you' in content and 'For you' in content,
    '3.2 3-color segmented sentiment bar': 'segmented' in content.lower() or ('from-[#E5636B]' in content or '#E5636B' in content and '#3FB68B' in content),
    '3.3 Quick action buttons (Draft response, Add to plan)': 'Draft response' in content,
    '3.4 Mini sparkline trend': 'sparkline' in content.lower() or 'trend' in content.lower(),
    '4.1 Breadcrumb picker (AP > District > Constituency)': 'Breadcrumb' in content or 'breadcrumb' in content.lower() or 'Change' in content,
    '4.2 Single month control (◀ Nov 2026 ▶)': 'Nov 2026' in content or 'month' in content.lower(),
    '4.3 Non-technical sync label (Refresh data · last synced)': 'last synced' in content.lower() or 'Refresh data' in content,
    '5.1 Full row tappable on district table': 'Inspect District' not in content or 'cursor-pointer' in content,
    '5.2 Capped bar + color band (green >=70, amber 40-70, red <40)': '40' in content and '70' in content,
    '5.3 Weakest 3 districts strip': 'Weakest' in content or 'weakest' in content.lower(),
    '5.4 Party color on left edge of constituency cards': 'border-l-' in content,
    '5.5 Where They Stand promoted with ▲/▼': 'Where They Stand' in content or 'Where they stand' in content,
}

print("=== CURRENT CODEBASE VERIFICATION (Items 0 to 5) ===")
for k, v in checks.items():
    print(f"{' [ALREADY INCLUDED] ' if v else ' [MISSING / TO DO] '} : {k}")
