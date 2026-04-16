import { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "../context/ThemeContext";

type Step = { step: string; expectedResult: string };

type Description = {
  objective?: string;
  scope?: string | string[];
  assumptions?: string[];
};

type Setup = {
  preconditions?: string[];
  environment?: string[];
  equipment?: string[];
  testData?: string[];
};

type Props = {
  testCase: {
    tc_id?: string;
    title: string;
    type?: string;
    status?: string;
    depth?: string;
    req_attribute?: string;
    generated_by?: string;
    linked_req_ids?: string[];
    kb_references?: string[];
    description?: string | Description;
    preconditions?: string | Setup;
    steps?: Step[];
  };
  selectable?: boolean;
  selected?: boolean;
  onToggleSelect?: () => void;
  onStatusChange?: (tcId: string, status: 'Reviewed' | 'Rejected') => void;
  onEdit?: (testCase: Props['testCase']) => void;
};

function parseJson<T>(raw: string | T | undefined, fallback: T): T {
  if (!raw) return fallback;
  if (typeof raw !== "string") return raw as T;
  try { return JSON.parse(raw) as T; } catch { return fallback; }
}

const TYPE_COLORS: Record<string, string> = {
  "Happy Path": "#22c55e",
  "Negative":   "#ef4444",
  "Boundary":   "#f59e0b",
  "Edge Case":  "#a855f7",
};

const STATUS_COLORS: Record<string, string> = {
  "Draft":    "#64748b",
  "Reviewed": "#22c55e",
  "Rejected": "#ef4444",
};

const DEPTH_LABELS: Record<string, string> = {
  basic: "Basic",
  standard: "Standard",
  comprehensive: "Comprehensive",
};

// ─── Sub-components ──────────────────────────────────────────────────────────

function SectionRow({
  label, expanded, onPress, accentColor, borderColor,
}: {
  label: string; expanded: boolean; onPress: () => void;
  accentColor: string; borderColor: string;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.sectionRow, { borderTopColor: borderColor }]}
      activeOpacity={0.7}
    >
      <Text style={[styles.sectionLabel, { color: accentColor }]}>{label.toUpperCase()}</Text>
      <Text style={[styles.chevron, { color: accentColor }]}>{expanded ? "▲" : "▼"}</Text>
    </TouchableOpacity>
  );
}

function FieldRow({ label, value, labelColor, valueColor }: {
  label: string; value: string; labelColor: string; valueColor: string;
}) {
  if (!value) return null;
  return (
    <View style={styles.fieldRow}>
      <Text style={[styles.fieldLabel, { color: labelColor }]}>{label}</Text>
      <Text style={[styles.fieldValue, { color: valueColor }]}>{value}</Text>
    </View>
  );
}

function BulletList({ items, color }: { items: string[]; color: string }) {
  if (!items || items.length === 0) return null;
  return (
    <View style={styles.bulletList}>
      {items.map((item, i) => (
        <View key={i} style={styles.bulletRow}>
          <Text style={[styles.bullet, { color }]}>•</Text>
          <Text style={[styles.bulletText, { color }]}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

// Renders a collapsible test case card. Tap the header to expand/collapse the
// whole card, then tap individual section headers to expand/collapse each section.
// When selectable is true, tapping the header toggles selection instead.
const TestcaseComponent = ({ testCase, selectable, selected, onToggleSelect, onStatusChange, onEdit }: Props) => {
  const { theme } = useTheme();

  const [cardOpen,    setCardOpen]    = useState(false);
  const [descOpen,    setDescOpen]    = useState(true);
  const [setupOpen,   setSetupOpen]   = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [stepsOpen,   setStepsOpen]   = useState(false);

  const desc  = parseJson<Description>(testCase.description, {});
  const setup = parseJson<Setup>(testCase.preconditions, {});
  const steps: Step[] = testCase.steps || [];

  const typeColor   = TYPE_COLORS[testCase.type   || ""] || theme.accent;
  const statusColor = STATUS_COLORS[testCase.status || ""] || theme.textMuted;

  const scopeStr = Array.isArray(desc.scope) ? desc.scope.join(", ") : (desc.scope || "");

  const hasDesc  = !!(desc.objective || scopeStr || (desc.assumptions?.length ?? 0) > 0);
  const hasSetup = (setup.preconditions?.length ?? 0) > 0
    || (setup.environment?.length  ?? 0) > 0
    || (setup.equipment?.length    ?? 0) > 0
    || (setup.testData?.length     ?? 0) > 0;

  const linkedReqs = testCase.linked_req_ids || [];
  const kbRefs     = testCase.kb_references  || [];

  const borderColor = selected ? theme.accent : theme.border;

  return (
    <View style={[styles.card, { backgroundColor: theme.surface, borderColor }]}>

      {/* ── Tap the header: toggle selection (selectable mode) or expand/collapse ── */}
      <TouchableOpacity
        onPress={selectable ? onToggleSelect : () => setCardOpen(o => !o)}
        activeOpacity={0.8}
      >
        <View style={styles.headerRow}>
          {/* Checkbox shown only in selection mode */}
          {selectable && (
            <View style={[
              styles.checkbox,
              { borderColor: selected ? theme.accent : theme.textMuted,
                backgroundColor: selected ? theme.accent : "transparent" },
            ]}>
              {selected && <Text style={styles.checkmark}>✓</Text>}
            </View>
          )}

          <Text style={[styles.tcId, { color: theme.textMuted, flex: 1 }]}>
            {testCase.tc_id || "—"}
          </Text>
          <View style={styles.badges}>
            {testCase.type && (
              <View style={[styles.badge, { backgroundColor: typeColor + "22", borderColor: typeColor }]}>
                <Text style={[styles.badgeText, { color: typeColor }]}>{testCase.type}</Text>
              </View>
            )}
            {testCase.status && (
              <View style={[styles.badge, { backgroundColor: statusColor + "22", borderColor: statusColor }]}>
                <Text style={[styles.badgeText, { color: statusColor }]}>{testCase.status}</Text>
              </View>
            )}
            {!selectable && (
              <Text style={[styles.chevron, { color: theme.textMuted }]}>
                {cardOpen ? "▲" : "▼"}
              </Text>
            )}
          </View>
        </View>

        <Text style={[styles.title, { color: theme.textBright, borderBottomColor: cardOpen && !selectable ? theme.border : "transparent" }]}>
          {testCase.title}
        </Text>
      </TouchableOpacity>

      {/* ── Expanded body ── */}
      {cardOpen && (
        <View>

          {/* DESCRIPTION */}
          {hasDesc && (
            <>
              <SectionRow
                label="Description"
                expanded={descOpen}
                onPress={() => setDescOpen(o => !o)}
                accentColor={theme.accent}
                borderColor={theme.border}
              />
              {descOpen && (
                <View style={[styles.sectionBody, { borderTopColor: theme.border }]}>
                  {desc.objective ? (
                    <Text style={[styles.objective, { color: theme.text }]}>{desc.objective}</Text>
                  ) : null}
                  {scopeStr ? (
                    <FieldRow label="Scope" value={scopeStr} labelColor={theme.textMuted} valueColor={theme.text} />
                  ) : null}
                  {(desc.assumptions?.length ?? 0) > 0 && (
                    <>
                      <Text style={[styles.subLabel, { color: theme.textMuted }]}>Assumptions</Text>
                      <BulletList items={desc.assumptions!} color={theme.text} />
                    </>
                  )}
                </View>
              )}
            </>
          )}

          {/* SETUP */}
          {hasSetup && (
            <>
              <SectionRow
                label="Setup"
                expanded={setupOpen}
                onPress={() => setSetupOpen(o => !o)}
                accentColor={theme.accent}
                borderColor={theme.border}
              />
              {setupOpen && (
                <View style={[styles.sectionBody, { borderTopColor: theme.border }]}>
                  {(setup.preconditions?.length ?? 0) > 0 && (
                    <>
                      <Text style={[styles.subLabel, { color: theme.textMuted }]}>Preconditions</Text>
                      <BulletList items={setup.preconditions!} color={theme.text} />
                    </>
                  )}
                  {(setup.environment?.length ?? 0) > 0 && (
                    <>
                      <Text style={[styles.subLabel, { color: theme.textMuted, marginTop: 8 }]}>Environment</Text>
                      <BulletList items={setup.environment!} color={theme.text} />
                    </>
                  )}
                  {(setup.equipment?.length ?? 0) > 0 && (
                    <>
                      <Text style={[styles.subLabel, { color: theme.textMuted, marginTop: 8 }]}>Equipment</Text>
                      <BulletList items={setup.equipment!} color={theme.text} />
                    </>
                  )}
                  {(setup.testData?.length ?? 0) > 0 && (
                    <>
                      <Text style={[styles.subLabel, { color: theme.textMuted, marginTop: 8 }]}>Test Data</Text>
                      <BulletList items={setup.testData!} color={theme.text} />
                    </>
                  )}
                </View>
              )}
            </>
          )}

          {/* DETAILS */}
          <SectionRow
            label="Details"
            expanded={detailsOpen}
            onPress={() => setDetailsOpen(o => !o)}
            accentColor={theme.accent}
            borderColor={theme.border}
          />
          {detailsOpen && (
            <View style={[styles.sectionBody, { borderTopColor: theme.border }]}>
              <FieldRow label="Depth"        value={DEPTH_LABELS[testCase.depth || ""] || testCase.depth || ""} labelColor={theme.textMuted} valueColor={theme.text} />
              <FieldRow label="Attribute"    value={testCase.req_attribute || ""}  labelColor={theme.textMuted} valueColor={theme.text} />
              <FieldRow label="Generated by" value={testCase.generated_by || ""}   labelColor={theme.textMuted} valueColor={theme.text} />
              {linkedReqs.length > 0 && (
                <FieldRow label="Linked req" value={linkedReqs.join(", ")} labelColor={theme.textMuted} valueColor={theme.text} />
              )}
              {kbRefs.length > 0 && (
                <FieldRow label="KB refs" value={kbRefs.join(", ")} labelColor={theme.textMuted} valueColor={theme.text} />
              )}
            </View>
          )}

          {/* STEPS */}
          {steps.length > 0 && (
            <>
              <SectionRow
                label={`Steps (${steps.length})`}
                expanded={stepsOpen}
                onPress={() => setStepsOpen(o => !o)}
                accentColor={theme.accent}
                borderColor={theme.border}
              />
              {stepsOpen && steps.map((s, i) => (
                <View key={i} style={[styles.step, { borderTopColor: theme.border }]}>
                  <Text style={[styles.stepNumber, { color: theme.accent }]}>{i + 1}</Text>
                  <View style={styles.stepContent}>
                    <Text style={[styles.stepAction, { color: theme.text }]}>{s.step}</Text>
                    {s.expectedResult ? (
                      <Text style={[styles.stepExpected, { color: theme.textMuted }]}>
                        ✓ {s.expectedResult}
                      </Text>
                    ) : null}
                  </View>
                </View>
              ))}
            </>
          )}

          {/* ACTION BUTTONS — approve / reject / edit */}
          {!selectable && (onStatusChange || onEdit) && (
            <View style={[styles.actionRow, { borderTopColor: theme.border }]}>
              {onEdit && (
                <TouchableOpacity
                  onPress={() => onEdit(testCase)}
                  style={[styles.actionBtn, { borderColor: theme.border }]}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.actionBtnText, { color: theme.text }]}>Edit</Text>
                </TouchableOpacity>
              )}
              {onStatusChange && testCase.status !== 'Rejected' && (
                <TouchableOpacity
                  onPress={() => onStatusChange(testCase.tc_id!, 'Rejected')}
                  style={[styles.rejectBtn, { backgroundColor: theme.red }]}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.actionBtnText, { color: '#fff' }]}>Reject</Text>
                </TouchableOpacity>
              )}
              {onStatusChange && testCase.status !== 'Reviewed' && (
                <TouchableOpacity
                  onPress={() => onStatusChange(testCase.tc_id!, 'Reviewed')}
                  style={styles.approveBtn}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.actionBtnText, { color: '#fff' }]}>Approve</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

        </View>
      )}
    </View>
  );
};

export default TestcaseComponent;

const styles = StyleSheet.create({
  card: {
    marginTop: 12,
    borderRadius: 10,
    borderWidth: 1,
    width: "90%",
    overflow: "hidden",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 4,
    gap: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  checkmark: {
    fontSize: 11,
    fontWeight: "700",
    color: "#fff",
  },
  tcId: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  badges: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 20,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "600",
  },
  title: {
    fontSize: 15,
    fontWeight: "600",
    paddingHorizontal: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  sectionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
  },
  chevron: {
    fontSize: 11,
  },
  sectionBody: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 12,
    borderTopWidth: 1,
  },
  objective: {
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 6,
  },
  fieldRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 4,
    gap: 4,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "600",
  },
  fieldValue: {
    fontSize: 12,
    flex: 1,
    flexShrink: 1,
  },
  subLabel: {
    fontSize: 11,
    fontWeight: "600",
    marginBottom: 4,
  },
  bulletList: {
    gap: 3,
  },
  bulletRow: {
    flexDirection: "row",
    gap: 6,
  },
  bullet: {
    fontSize: 12,
    lineHeight: 18,
  },
  bulletText: {
    fontSize: 12,
    lineHeight: 18,
    flex: 1,
  },
  step: {
    flexDirection: "row",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
    gap: 10,
  },
  stepNumber: {
    fontSize: 13,
    fontWeight: "700",
    width: 20,
    textAlign: "center",
    paddingTop: 1,
  },
  stepContent: {
    flex: 1,
    gap: 4,
  },
  stepAction: {
    fontSize: 13,
    lineHeight: 18,
  },
  stepExpected: {
    fontSize: 12,
    lineHeight: 17,
    fontStyle: "italic",
  },
  actionRow: {
    flexDirection: "row",
    gap: 8,
    padding: 12,
    borderTopWidth: 1,
    justifyContent: "flex-end",
  },
  actionBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
  },
  approveBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: "#22c55e",
  },
  rejectBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: "600",
  },
});
