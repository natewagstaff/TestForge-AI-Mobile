import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  LayoutAnimation,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  UIManager,
  View,
} from "react-native";

// Enable layout animation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}
import { getRequirements, getTestCases, getKbSections, getKbEntries, getCoverageGapInsight, refreshCoverageGapInsight } from "@/api/testforge";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";

// ── helpers ────────────────────────────────────────────────────────────────

function pct(n: number, total: number) {
  if (!total) return 0;
  return Math.round((n / total) * 100);
}

// ── sub-components ─────────────────────────────────────────────────────────

function StatCard({ label, value, sub, accent }: {
  label: string; value: string | number; sub?: string; accent?: string;
}) {
  const { theme } = useTheme();
  return (
    <View style={[styles.statCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <Text style={[styles.statValue, { color: accent ?? theme.textBright }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: theme.textMuted }]}>{label}</Text>
      {sub ? <Text style={[styles.statSub, { color: theme.textMuted }]}>{sub}</Text> : null}
    </View>
  );
}

function SectionBar({ label, count, total }: { label: string; count: number; total: number }) {
  const { theme } = useTheme();
  const ratio = total > 0 ? count / total : 0;
  return (
    <View style={styles.sectionBarRow}>
      <View style={styles.sectionBarMeta}>
        <Text style={[styles.sectionBarLabel, { color: theme.text }]} numberOfLines={1}>{label}</Text>
        <Text style={[styles.sectionBarCount, { color: theme.textMuted }]}>{count}</Text>
      </View>
      <View style={[styles.sectionBarTrack, { backgroundColor: theme.border }]}>
        <View style={[styles.sectionBarFill, { width: `${Math.round(ratio * 100)}%`, backgroundColor: theme.accent }]} />
      </View>
    </View>
  );
}

// ── main screen ────────────────────────────────────────────────────────────

export default function DashboardScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const canRefreshInsight = user?.role === 'Admin' || user?.role === 'QA Manager';

  const [requirements, setRequirements] = useState<any[]>([]);
  const [testCases,    setTestCases]    = useState<any[]>([]);
  const [kbSections,   setKbSections]   = useState<any[]>([]);
  const [kbEntries,    setKbEntries]    = useState<any[]>([]);
  const [refreshing,   setRefreshing]   = useState(false);

  const [gapInsight,    setGapInsight]    = useState<any | null>(null);
  const [gapLoading,    setGapLoading]    = useState(true);
  const [gapRefreshing, setGapRefreshing] = useState(false);
  const [expandedGapId, setExpandedGapId] = useState<string | null>(null);

  const toggleGapRow = (reqId: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedGapId(prev => (prev === reqId ? null : reqId));
  };

  const load = useCallback(async () => {
    const [reqs, tcs, sections, entries] = await Promise.all([
      getRequirements().catch(() => []),
      getTestCases().catch(() => []),
      getKbSections().catch(() => []),
      getKbEntries().catch(() => []),
    ]);
    setRequirements(reqs);
    setTestCases(tcs);
    setKbSections(sections);
    setKbEntries(entries);
  }, []);

  const loadInsight = useCallback(async () => {
    try {
      setGapLoading(true);
      const data = await getCoverageGapInsight();
      if (!data?.error) setGapInsight(data);
    } catch { /* non-critical */ } finally { setGapLoading(false); }
  }, []);

  useEffect(() => { load(); loadInsight(); }, [load, loadInsight]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const handleRefreshInsight = async () => {
    try {
      setGapRefreshing(true);
      const data = await refreshCoverageGapInsight();
      if (!data?.error) setGapInsight(data);
    } catch { /* silent */ } finally { setGapRefreshing(false); }
  };

  // ── derived metrics ──────────────────────────────────────────────────────

  const totalReqs     = requirements.length;
  const totalTcs      = testCases.length;
  const draftCount    = testCases.filter(tc => tc.status === 'Draft').length;
  const reviewedCount = testCases.filter(tc => tc.status === 'Reviewed').length;
  const rejectedCount = testCases.filter(tc => tc.status === 'Rejected').length;

  const linkedReqIds = new Set<string>();
  testCases.forEach(tc => {
    let ids: string[] = [];
    try {
      ids = typeof tc.linked_req_ids === 'string'
        ? JSON.parse(tc.linked_req_ids)
        : (tc.linked_req_ids ?? []);
    } catch { /* ignore */ }
    ids.forEach(id => linkedReqIds.add(id));
  });

  const coveredCount = requirements.filter(r => linkedReqIds.has(r.req_id)).length;
  const coveragePct  = pct(coveredCount, totalReqs);
  const untestedReqs = requirements.filter(r => !linkedReqIds.has(r.req_id));

  const entriesPerSection = kbSections.map(sec => ({
    label: sec.title ?? sec.name ?? sec.section_id ?? 'Section',
    count: kbEntries.filter(e => e.section_id === sec.section_id).length,
  })).filter(s => s.count > 0);

  const maxEntriesInSection = Math.max(1, ...entriesPerSection.map(s => s.count));

  // Priority color helper
  const priorityColor = (p?: string) => {
    const low = p?.toLowerCase();
    if (low === 'high' || low === 'critical') return theme.red;
    if (low === 'medium') return '#f59e0b';
    return '#22c55e';
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.bg }}
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.accent} />
      }
    >
      <Text style={[styles.title, { color: theme.textBright }]}>Coverage</Text>

      {/* ── Coverage gauge ── */}
      <View style={[styles.coverageCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={styles.coverageHeader}>
          <Text style={[styles.coveragePct, { color: theme.accent }]}>{coveragePct}%</Text>
          <Text style={[styles.coverageLabel, { color: theme.textMuted }]}>
            {coveredCount} / {totalReqs} requirements covered
          </Text>
        </View>
        <View style={[styles.progressTrack, { backgroundColor: theme.border }]}>
          <View style={[styles.progressFill, { width: `${coveragePct}%`, backgroundColor: theme.accent }]} />
        </View>
      </View>

      {/* ── Stat row ── */}
      <View style={styles.statRow}>
        <StatCard label="Total TCs"  value={totalTcs} />
        <StatCard label="Draft"      value={draftCount}    accent={theme.textMuted} />
        <StatCard label="Reviewed"   value={reviewedCount} accent="#22c55e" />
        <StatCard label="Rejected"   value={rejectedCount} accent={theme.red} />
      </View>

      {/* ── Coverage Gap Insight ── */}
      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={styles.insightHeader}>
          <Text style={[styles.sectionHeading, { color: theme.textBright }]}>Coverage Gap Insight</Text>
          <View style={[styles.dailyBadge, { backgroundColor: theme.accent + '22' }]}>
            <Text style={[styles.dailyBadgeText, { color: theme.accent }]}>DAILY</Text>
          </View>
          {canRefreshInsight && (
            <TouchableOpacity
              onPress={handleRefreshInsight}
              disabled={gapRefreshing || gapLoading}
              style={[styles.refreshBtn, { borderColor: theme.border, opacity: (gapRefreshing || gapLoading) ? 0.4 : 1 }]}
              activeOpacity={0.7}
            >
              <Text style={[styles.refreshBtnText, { color: theme.textMuted }]}>
                {gapRefreshing ? 'Refreshing…' : 'Refresh'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {gapLoading && (
          <View style={styles.insightLoading}>
            <ActivityIndicator size="small" color={theme.accent} />
            <Text style={[styles.insightLoadingText, { color: theme.textMuted }]}>
              Computing coverage gaps…
            </Text>
          </View>
        )}

        {!gapLoading && gapInsight && (
          <>
            {gapInsight.summary && (
              <View style={[styles.summaryBlock, { borderLeftColor: theme.accent }]}>
                <Text style={[styles.summaryText, { color: theme.text }]}>{gapInsight.summary}</Text>
              </View>
            )}

            {gapInsight.gaps?.length > 0 ? (
              <>
                <Text style={[styles.insightSubLabel, { color: theme.textMuted }]}>
                  TOP READY-TO-TEST REQUIREMENTS
                </Text>
                {gapInsight.gaps.map((gap: any, idx: number) => {
                  const expanded = expandedGapId === gap.req_id;
                  // Look up full requirement details from already-loaded requirements
                  const fullReq = requirements.find((r: any) => r.req_id === gap.req_id);
                  const tags: string[] = fullReq?.tags ?? [];
                  const criteria: string[] = fullReq?.acceptance_criteria ?? [];
                  const description: string = fullReq?.description ?? '';
                  const module: string = fullReq?.module ?? '';

                  return (
                    <TouchableOpacity
                      key={gap.req_id}
                      onPress={() => toggleGapRow(gap.req_id)}
                      activeOpacity={0.7}
                      style={[
                        styles.gapRow,
                        idx < gapInsight.gaps.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.border },
                      ]}
                    >
                      {/* ── collapsed row ── */}
                      <View style={styles.gapRowHeader}>
                        <Text style={[styles.gapIndex, { color: theme.textMuted }]}>{idx + 1}.</Text>
                        <Text style={[styles.gapReqId, { color: theme.accent }]}>{gap.req_id}</Text>
                        <Text
                          style={[styles.gapTitle, { color: theme.text }]}
                          numberOfLines={expanded ? undefined : 1}
                        >
                          {gap.title}
                        </Text>
                        <View style={[
                          styles.kbBadge,
                          { backgroundColor: gap.kb_match_count > 0 ? theme.accent + '22' : 'transparent',
                            borderColor: gap.kb_match_count > 0 ? 'transparent' : theme.border },
                        ]}>
                          <Text style={[styles.kbBadgeText, { color: gap.kb_match_count > 0 ? theme.accent : theme.textMuted }]}>
                            {gap.kb_match_count > 0 ? `${gap.kb_match_count} KB` : 'no KB'}
                          </Text>
                        </View>
                        {gap.priority && (
                          <View style={[styles.priorityBadge, { backgroundColor: priorityColor(gap.priority) + '22', borderColor: priorityColor(gap.priority) + '44' }]}>
                            <Text style={[styles.priorityBadgeText, { color: priorityColor(gap.priority) }]}>
                              {gap.priority}
                            </Text>
                          </View>
                        )}
                        <Text style={[styles.gapChevron, { color: theme.textMuted }]}>
                          {expanded ? '▲' : '▼'}
                        </Text>
                      </View>

                      {/* ── expanded details ── */}
                      {expanded && (
                        <View style={[styles.gapDetail, { borderTopColor: theme.border }]}>
                          {(module || fullReq?.status) && (
                            <View style={styles.gapDetailMeta}>
                              {module ? (
                                <View style={[styles.metaChip, { backgroundColor: theme.border }]}>
                                  <Text style={[styles.metaChipText, { color: theme.textMuted }]}>{module}</Text>
                                </View>
                              ) : null}
                              {fullReq?.status ? (
                                <View style={[styles.metaChip, { backgroundColor: theme.border }]}>
                                  <Text style={[styles.metaChipText, { color: theme.textMuted }]}>{fullReq.status}</Text>
                                </View>
                              ) : null}
                            </View>
                          )}

                          {description ? (
                            <>
                              <Text style={[styles.gapDetailLabel, { color: theme.textMuted }]}>DESCRIPTION</Text>
                              <Text style={[styles.gapDetailBody, { color: theme.text }]}>{description}</Text>
                            </>
                          ) : null}

                          {criteria.length > 0 && (
                            <>
                              <Text style={[styles.gapDetailLabel, { color: theme.textMuted }]}>ACCEPTANCE CRITERIA</Text>
                              {criteria.map((c, i) => (
                                <View key={i} style={styles.criteriaRow}>
                                  <Text style={[styles.criteriaBullet, { color: theme.accent }]}>·</Text>
                                  <Text style={[styles.criteriaText, { color: theme.text }]}>{c}</Text>
                                </View>
                              ))}
                            </>
                          )}

                          {tags.length > 0 && (
                            <View style={styles.tagRow}>
                              {tags.map((t: string) => (
                                <View key={t} style={[styles.tag, { backgroundColor: theme.accent + '18', borderColor: theme.accent + '44' }]}>
                                  <Text style={[styles.tagText, { color: theme.accent }]}>{t}</Text>
                                </View>
                              ))}
                            </View>
                          )}
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
                <Text style={[styles.insightFooter, { color: theme.textMuted }]}>
                  {gapInsight.total_untested} untested of {gapInsight.total_requirements} total requirements
                  {gapInsight.generated_at
                    ? `  ·  ${new Date(gapInsight.generated_at).toLocaleDateString()}`
                    : ''}
                </Text>
              </>
            ) : (
              <Text style={[styles.allCoveredInsight, { color: '#22c55e' }]}>
                All requirements have test cases.
              </Text>
            )}
          </>
        )}

        {!gapLoading && !gapInsight && (
          <Text style={[styles.insightUnavailable, { color: theme.textMuted }]}>
            Coverage gap data unavailable.
          </Text>
        )}
      </View>

      {/* ── KB by section ── */}
      {entriesPerSection.length > 0 && (
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.sectionHeading, { color: theme.textBright }]}>Knowledge Base</Text>
          <Text style={[styles.sectionSub, { color: theme.textMuted }]}>
            {kbEntries.length} entries across {entriesPerSection.length} sections
          </Text>
          {entriesPerSection.map(s => (
            <SectionBar
              key={s.label}
              label={s.label}
              count={s.count}
              total={maxEntriesInSection}
            />
          ))}
        </View>
      )}

      {/* ── Untested requirements ── */}
      {untestedReqs.length > 0 && (
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.sectionHeading, { color: theme.textBright }]}>Untested Requirements</Text>
          <Text style={[styles.sectionSub, { color: theme.textMuted }]}>
            {untestedReqs.length} requirement{untestedReqs.length !== 1 ? 's' : ''} with no test cases
          </Text>
          {untestedReqs.map((r, i) => (
            <View
              key={r.req_id}
              style={[
                styles.untestedRow,
                i < untestedReqs.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.border },
              ]}
            >
              <Text style={[styles.untestedId, { color: theme.accent }]}>{r.req_id}</Text>
              <Text style={[styles.untestedTitle, { color: theme.text }]} numberOfLines={2}>
                {r.title}
              </Text>
            </View>
          ))}
        </View>
      )}

      {untestedReqs.length === 0 && totalReqs > 0 && (
        <View style={[styles.allCoveredBadge, { backgroundColor: '#22c55e22', borderColor: '#22c55e' }]}>
          <Text style={[styles.allCoveredText, { color: '#22c55e' }]}>All requirements have test cases</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 40,
    gap: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    marginBottom: 4,
  },
  // coverage card
  coverageCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  coverageHeader: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 12,
  },
  coveragePct: {
    fontSize: 42,
    fontWeight: "800",
    lineHeight: 46,
  },
  coverageLabel: {
    fontSize: 13,
    flexShrink: 1,
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
  },
  // stat row
  statRow: {
    flexDirection: "row",
    gap: 8,
  },
  statCard: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    padding: 10,
    alignItems: "center",
  },
  statValue: {
    fontSize: 22,
    fontWeight: "700",
  },
  statLabel: {
    fontSize: 10,
    fontWeight: "600",
    marginTop: 2,
    textAlign: "center",
  },
  statSub: {
    fontSize: 9,
    marginTop: 1,
    textAlign: "center",
  },
  // generic card
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    gap: 4,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 2,
  },
  sectionSub: {
    fontSize: 12,
    marginBottom: 10,
  },
  // gap insight
  insightHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  dailyBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
  },
  dailyBadgeText: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  refreshBtn: {
    marginLeft: "auto",
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  refreshBtnText: {
    fontSize: 11,
    fontWeight: "600",
  },
  insightLoading: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
  },
  insightLoadingText: {
    fontSize: 12,
  },
  summaryBlock: {
    borderLeftWidth: 3,
    paddingLeft: 12,
    marginBottom: 14,
    marginTop: 4,
  },
  summaryText: {
    fontSize: 13,
    lineHeight: 20,
    fontStyle: "italic",
  },
  insightSubLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.8,
    marginBottom: 6,
    marginTop: 4,
  },
  gapRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 9,
    gap: 6,
  },
  gapIndex: {
    fontSize: 10,
    width: 16,
    textAlign: "right",
  },
  gapReqId: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.4,
    minWidth: 52,
  },
  gapTitle: {
    fontSize: 13,
    flex: 1,
  },
  kbBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  kbBadgeText: {
    fontSize: 10,
    fontWeight: "700",
  },
  priorityBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  priorityBadgeText: {
    fontSize: 10,
    fontWeight: "700",
  },
  insightFooter: {
    fontSize: 11,
    marginTop: 8,
  },
  allCoveredInsight: {
    fontSize: 13,
    fontWeight: "600",
    paddingVertical: 4,
  },
  insightUnavailable: {
    fontSize: 12,
    paddingVertical: 4,
  },
  // gap row expand/collapse
  gapRowHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  gapChevron: {
    fontSize: 10,
    marginLeft: 2,
  },
  gapDetail: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    gap: 6,
  },
  gapDetailMeta: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 4,
  },
  metaChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  metaChipText: {
    fontSize: 11,
    fontWeight: "600",
  },
  gapDetailLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.6,
    marginTop: 4,
  },
  gapDetailBody: {
    fontSize: 13,
    lineHeight: 19,
  },
  criteriaRow: {
    flexDirection: "row",
    gap: 6,
    alignItems: "flex-start",
  },
  criteriaBullet: {
    fontSize: 16,
    lineHeight: 20,
  },
  criteriaText: {
    fontSize: 13,
    lineHeight: 19,
    flex: 1,
  },
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 4,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
  },
  tagText: {
    fontSize: 11,
    fontWeight: "600",
  },
  // KB section bars
  sectionBarRow: {
    marginBottom: 10,
    gap: 4,
  },
  sectionBarMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionBarLabel: {
    fontSize: 13,
    flex: 1,
  },
  sectionBarCount: {
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 8,
  },
  sectionBarTrack: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  sectionBarFill: {
    height: "100%",
    borderRadius: 3,
  },
  // untested rows
  untestedRow: {
    paddingVertical: 10,
    gap: 2,
  },
  untestedId: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  untestedTitle: {
    fontSize: 13,
  },
  // all covered badge
  allCoveredBadge: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 14,
    alignItems: "center",
  },
  allCoveredText: {
    fontSize: 14,
    fontWeight: "600",
  },
});
