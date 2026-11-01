from pathlib import Path
p = Path("frontend/src/app/audit/page.tsx")
text = p.read_text(encoding="utf-8")
text = text.replace('import { formatMYT } from "@/lib/date";', 'import { formatMYT, parseDateToTime } from "@/lib/date";')
old_sort = """      const timeA = new Date(a.timestamp).getTime() || 0;
      const timeB = new Date(b.timestamp).getTime() || 0;"""
new_sort = """      const timeA = parseDateToTime(a.timestamp, a.id);
      const timeB = parseDateToTime(b.timestamp, b.id);"""
text = text.replace(old_sort, new_sort)
p.write_text(text, encoding="utf-8")
print("audit/page.tsx updated!")

