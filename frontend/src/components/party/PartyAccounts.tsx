import React, { useCallback, useEffect, useState } from "react";
import { Plus, Power, UserCog } from "lucide-react";
import { partyApi, type PartyAdminRecord } from "../../services/partyApi";
import type { PartyScreenProps } from "./PartyCommandCenter";
import { Btn, Card, Empty, ErrorBanner, Loading, Notice, SectionTitle, formatDate, inputCls, labelCls } from "./partyUi";

const ROLE_LABEL: Record<string, string> = { PARTY_PRESIDENT: "Party President", PARTY_ANALYST: "Party Analyst" };

export const PartyAccounts: React.FC<PartyScreenProps> = ({ userId, partyId, meta }) => {
  const [rows, setRows] = useState<PartyAdminRecord[]>([]);
  const [form, setForm] = useState({ name: "", username: "", phone: "", password: "", role: "PARTY_PRESIDENT", partyId });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await partyApi.admins(userId);
      setRows(res.items);
    } catch (e: any) {
      setError(e?.message || "Could not load party accounts.");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  const run = async (key: string, fn: () => Promise<unknown>, success: string) => {
    setBusy(key);
    setError("");
    setNotice("");
    try {
      await fn();
      setNotice(success);
      await load();
      return true;
    } catch (e: any) {
      setError(e?.message || "Something went wrong.");
      return false;
    } finally {
      setBusy("");
    }
  };

  const partyName = (id: string) => meta.parties.find((p) => p.id === id)?.abbreviation || id;

  return (
    <div data-testid="party-accounts" className="space-y-3">
      <SectionTitle title="Party accounts" subtitle="Only Super Admin can create Party President and Party Analyst logins. Each login sees only its own party." />
      <ErrorBanner message={error} onRetry={load} />
      <Notice message={notice} />
      <Card testId="account-form">
        <h3 className="text-sm font-bold text-[#F9E29C] mb-2">Create a party login</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div>
            <label className={labelCls} htmlFor="acc-name">Full name</label>
            <input id="acc-name" className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className={labelCls} htmlFor="acc-username">Username</label>
            <input id="acc-username" className={inputCls} autoComplete="off" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
          </div>
          <div>
            <label className={labelCls} htmlFor="acc-password">Password (8+ characters)</label>
            <input
              id="acc-password"
              type="password"
              autoComplete="new-password"
              className={inputCls}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>
          <div>
            <label className={labelCls} htmlFor="acc-phone">Phone</label>
            <input id="acc-phone" className={inputCls} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div>
            <label className={labelCls} htmlFor="acc-role">Role</label>
            <select id="acc-role" className={inputCls} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <option value="PARTY_PRESIDENT">Party President</option>
              <option value="PARTY_ANALYST">Party Analyst (view only)</option>
            </select>
          </div>
          <div>
            <label className={labelCls} htmlFor="acc-party">Party</label>
            <select id="acc-party" className={inputCls} value={form.partyId} onChange={(e) => setForm({ ...form, partyId: e.target.value })}>
              {meta.parties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.abbreviation} — {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-3 flex justify-end">
          <Btn
            variant="gold"
            busy={busy === "create"}
            data-testid="account-create"
            onClick={async () => {
              const ok = await run("create", () => partyApi.createAdmin(userId, form), `Login created for ${form.name}.`);
              if (ok) setForm({ ...form, name: "", username: "", phone: "", password: "" });
            }}
          >
            <Plus className="w-3.5 h-3.5" /> Create login
          </Btn>
        </div>
      </Card>

      {loading && rows.length === 0 ? (
        <Loading />
      ) : rows.length === 0 ? (
        <Empty message="No party logins created yet. The demo logins are listed in the user guide." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {rows.map((r) => (
            <Card key={r.id} testId="account-row" className={r.active ? "" : "opacity-70"}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-sm font-bold text-[#F5EFE0] break-words">{r.user?.name}</div>
                  <div className="text-[11px] text-[#D4A24C]">
                    {ROLE_LABEL[r.role] || r.role} · {partyName(r.partyId)}
                  </div>
                  <div className="text-[11px] text-[#B9AF95] break-all">
                    Username {r.user?.email}
                    {r.user?.phone ? ` · ${r.user.phone}` : ""}
                  </div>
                  <div className="text-[10px] text-[#8A8E9B]">
                    Created {formatDate(r.createdAt)} · {r.active ? "Active" : "Deactivated"}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Btn
                    busy={busy === `role:${r.id}`}
                    onClick={() =>
                      run(
                        `role:${r.id}`,
                        () => partyApi.updateAdmin(userId, r.id, { role: r.role === "PARTY_PRESIDENT" ? "PARTY_ANALYST" : "PARTY_PRESIDENT" }),
                        "Role changed."
                      )
                    }
                  >
                    <UserCog className="w-3.5 h-3.5" /> Make {r.role === "PARTY_PRESIDENT" ? "Analyst" : "President"}
                  </Btn>
                  <Btn
                    variant={r.active ? "danger" : "ghost"}
                    busy={busy === `active:${r.id}`}
                    data-testid="account-toggle"
                    onClick={() => run(`active:${r.id}`, () => partyApi.updateAdmin(userId, r.id, { active: !r.active }), r.active ? "Login deactivated." : "Login reactivated.")}
                  >
                    <Power className="w-3.5 h-3.5" /> {r.active ? "Deactivate" : "Reactivate"}
                  </Btn>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
