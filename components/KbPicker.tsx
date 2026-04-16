import { useEffect, useState } from 'react';
import {
  ActivityIndicator, Modal, ScrollView, StyleSheet,
  Text, TouchableOpacity, View,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { getKbSections, getKbEntries } from '../api/testforge';

type KbEntry = {
  kb_id: string;
  title: string;
  type: string;
  subsection_id: string | null;
};

type Subsection = {
  subsection_id: string;
  name: string;
  entry_count: number;
};

type Section = {
  section_id: string;
  name: string;
  is_default: boolean;
  entry_count?: number;
  subsections: Subsection[];
};

type Props = {
  visible: boolean;
  selectedIds: Set<string>;
  onToggle: (kbId: string) => void;
  onDone: () => void;
};

const TYPE_COLORS: Record<string, string> = {
  'UI Reference':    '#3b82f6',
  'Defect History':  '#ef4444',
  'Lessons Learned': '#f59e0b',
  'Process':         '#8b5cf6',
  'Technical':       '#06b6d4',
};

// Full-screen modal KB browser with sections → subsections → entries
export default function KbPicker({ visible, selectedIds, onToggle, onDone }: Props) {
  const { theme } = useTheme();

  const [sections, setSections]           = useState<Section[]>([]);
  const [entries, setEntries]             = useState<KbEntry[]>([]);
  const [loading, setLoading]             = useState(false);
  const [openSections, setOpenSections]   = useState<Set<string>>(new Set());
  const [openSubsections, setOpenSubsections] = useState<Set<string>>(new Set());

  // Load sections and entries when the modal opens
  useEffect(() => {
    if (!visible) return;
    setLoading(true);
    Promise.all([getKbSections(), getKbEntries()])
      .then(([secs, ents]) => {
        setSections(Array.isArray(secs) ? secs : []);
        setEntries(Array.isArray(ents) ? ents : []);
      })
      .finally(() => setLoading(false));
  }, [visible]);

  function toggleSection(id: string) {
    setOpenSections(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleSubsection(id: string) {
    setOpenSubsections(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  // Entries that belong to a given subsection (or null for the default section)
  function entriesFor(subsectionId: string | null) {
    return entries.filter(e => e.subsection_id === subsectionId);
  }

  function renderEntry(entry: KbEntry) {
    const isSelected = selectedIds.has(entry.kb_id);
    const typeColor = TYPE_COLORS[entry.type] || theme.accent;
    return (
      <TouchableOpacity
        key={entry.kb_id}
        onPress={() => onToggle(entry.kb_id)}
        style={[styles.entryRow, { borderTopColor: theme.border },
          isSelected && { backgroundColor: theme.surfaceRaised }]}
        activeOpacity={0.7}
      >
        <View style={[styles.checkbox, {
          borderColor: isSelected ? theme.accent : theme.textMuted,
          backgroundColor: isSelected ? theme.accent : 'transparent',
        }]}>
          {isSelected && <Text style={styles.checkmark}>✓</Text>}
        </View>
        <Text style={[styles.entryTitle, { color: isSelected ? theme.textBright : theme.text, flex: 1 }]}>
          {entry.title}
        </Text>
        <View style={[styles.typeBadge, { backgroundColor: typeColor + '22', borderColor: typeColor }]}>
          <Text style={[styles.typeText, { color: typeColor }]}>{entry.type}</Text>
        </View>
      </TouchableOpacity>
    );
  }

  function renderSubsection(sub: Subsection) {
    const isOpen = openSubsections.has(sub.subsection_id);
    const subEntries = entriesFor(sub.subsection_id);
    if (subEntries.length === 0) return null;
    const selectedCount = subEntries.filter(e => selectedIds.has(e.kb_id)).length;

    return (
      <View key={sub.subsection_id}>
        <TouchableOpacity
          onPress={() => toggleSubsection(sub.subsection_id)}
          style={[styles.subsectionRow, { borderTopColor: theme.border, backgroundColor: theme.surface }]}
          activeOpacity={0.7}
        >
          <Text style={[styles.subsectionName, { color: theme.text }]}>{sub.name}</Text>
          <View style={styles.subsectionRight}>
            {selectedCount > 0 && (
              <View style={[styles.countBadge, { backgroundColor: theme.accent }]}>
                <Text style={[styles.countText, { color: theme.bg }]}>{selectedCount}</Text>
              </View>
            )}
            <Text style={[styles.entryCount, { color: theme.textMuted }]}>{subEntries.length}</Text>
            <Text style={[styles.chevron, { color: theme.textMuted }]}>{isOpen ? '▲' : '▼'}</Text>
          </View>
        </TouchableOpacity>
        {isOpen && subEntries.map(renderEntry)}
      </View>
    );
  }

  function renderSection(sec: Section) {
    const isOpen = openSections.has(sec.section_id);

    // Default section: entries with no subsection_id
    const directEntries = sec.is_default ? entriesFor(null) : [];
    const totalEntries = sec.is_default ? directEntries.length : sec.subsections.reduce((n, s) => n + entriesFor(s.subsection_id).length, 0);
    if (totalEntries === 0) return null;

    const selectedCount = sec.is_default
      ? directEntries.filter(e => selectedIds.has(e.kb_id)).length
      : entries.filter(e => sec.subsections.some(s => s.subsection_id === e.subsection_id) && selectedIds.has(e.kb_id)).length;

    return (
      <View key={sec.section_id} style={[styles.sectionBlock, { borderColor: theme.border }]}>
        <TouchableOpacity
          onPress={() => toggleSection(sec.section_id)}
          style={[styles.sectionRow, { backgroundColor: theme.surfaceRaised }]}
          activeOpacity={0.7}
        >
          <Text style={[styles.sectionName, { color: theme.textBright }]}>{sec.name}</Text>
          <View style={styles.subsectionRight}>
            {selectedCount > 0 && (
              <View style={[styles.countBadge, { backgroundColor: theme.accent }]}>
                <Text style={[styles.countText, { color: theme.bg }]}>{selectedCount}</Text>
              </View>
            )}
            <Text style={[styles.entryCount, { color: theme.textMuted }]}>{totalEntries}</Text>
            <Text style={[styles.chevron, { color: theme.accent }]}>{isOpen ? '▲' : '▼'}</Text>
          </View>
        </TouchableOpacity>

        {isOpen && (
          <>
            {sec.is_default
              ? directEntries.map(renderEntry)
              : sec.subsections.map(renderSubsection)}
          </>
        )}
      </View>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={[styles.root, { backgroundColor: theme.bg }]}>

        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.border, backgroundColor: theme.surface }]}>
          <Text style={[styles.headerTitle, { color: theme.textBright }]}>Knowledge Base</Text>
          <View style={styles.headerRight}>
            {selectedIds.size > 0 && (
              <Text style={[styles.selectedCount, { color: theme.accent }]}>
                {selectedIds.size} selected
              </Text>
            )}
            <TouchableOpacity onPress={onDone} style={[styles.doneBtn, { backgroundColor: theme.accent }]}>
              <Text style={[styles.doneBtnText, { color: theme.bg }]}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>

        {loading ? (
          <ActivityIndicator style={{ marginTop: 60 }} color={theme.accent} />
        ) : (
          <ScrollView contentContainerStyle={styles.list}>
            {sections.map(renderSection)}
            {entries.length === 0 && !loading && (
              <Text style={[styles.empty, { color: theme.textMuted }]}>No knowledge base entries found.</Text>
            )}
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 20, fontWeight: '700' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  selectedCount: { fontSize: 14, fontWeight: '600' },
  doneBtn: { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 8 },
  doneBtnText: { fontSize: 14, fontWeight: '700' },
  list: { padding: 12, gap: 10, paddingBottom: 40 },
  sectionBlock: { borderWidth: 1, borderRadius: 12, overflow: 'hidden' },
  sectionRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14, paddingVertical: 12,
  },
  sectionName: { fontSize: 15, fontWeight: '700', flex: 1 },
  subsectionRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14, paddingVertical: 10,
    borderTopWidth: 1,
  },
  subsectionName: { fontSize: 14, fontWeight: '600', flex: 1 },
  subsectionRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  entryCount: { fontSize: 12 },
  chevron: { fontSize: 11, width: 14, textAlign: 'center' },
  countBadge: {
    minWidth: 20, height: 20, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 5,
  },
  countText: { fontSize: 11, fontWeight: '700' },
  entryRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 11,
    borderTopWidth: 1, gap: 10,
  },
  checkbox: {
    width: 20, height: 20, borderRadius: 4, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center',
  },
  checkmark: { fontSize: 11, fontWeight: '700', color: '#fff' },
  entryTitle: { fontSize: 13 },
  typeBadge: {
    paddingHorizontal: 7, paddingVertical: 2,
    borderRadius: 20, borderWidth: 1,
  },
  typeText: { fontSize: 10, fontWeight: '600' },
  empty: { textAlign: 'center', marginTop: 40, fontSize: 14 },
});
