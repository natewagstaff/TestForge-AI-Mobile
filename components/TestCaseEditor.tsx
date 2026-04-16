import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet,
  Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';

// ─── Types ───────────────────────────────────────────────────────────────────

type Step = { step: string; expectedResult: string };

type DescState = { objective: string; scope: string[]; assumptions: string[] };
type SetupState = { preconditions: string[]; environment: string[]; equipment: string[]; testData: string[] };

type TestCaseInput = {
  tc_id?: string;
  title?: string;
  type?: string;
  req_attribute?: string;
  description?: any;
  preconditions?: any;
  steps?: Step[];
};

export type SaveData = {
  title: string;
  type: string;
  req_attribute: string;
  description: DescState;
  preconditions: SetupState;
  steps: Step[];
};

type Props = {
  visible: boolean;
  testCase: TestCaseInput | null;
  onSave: (tcId: string, data: SaveData) => void;
  onCancel: () => void;
};

// ─── Constants ───────────────────────────────────────────────────────────────

const TYPES = ['Happy Path', 'Negative', 'Boundary', 'Edge Case'];
const TYPE_COLORS: Record<string, string> = {
  'Happy Path': '#22c55e',
  'Negative':   '#ef4444',
  'Boundary':   '#f59e0b',
  'Edge Case':  '#a855f7',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function tryParse(val: any): any {
  if (!val || typeof val !== 'string') return val;
  try { return JSON.parse(val); } catch { return null; }
}

function toStringArray(val: any): string[] {
  if (Array.isArray(val)) return val.map(String);
  if (typeof val === 'string' && val.trim()) return [val];
  return [];
}

// ─── EditableList ─────────────────────────────────────────────────────────────

function EditableList({
  items, placeholder, addLabel, onChange,
  inputStyle, textColor, mutedColor, accentColor,
}: {
  items: string[];
  placeholder: string;
  addLabel: string;
  onChange: (items: string[]) => void;
  inputStyle: any;
  textColor: string;
  mutedColor: string;
  accentColor: string;
}) {
  return (
    <View style={{ marginTop: 6, gap: 6 }}>
      {items.map((item, i) => (
        <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <TextInput
            value={item}
            onChangeText={v => {
              const next = [...items];
              next[i] = v;
              onChange(next);
            }}
            style={[inputStyle, { flex: 1, color: textColor }]}
            placeholderTextColor={mutedColor}
            placeholder={placeholder}
          />
          <TouchableOpacity onPress={() => onChange(items.filter((_, j) => j !== i))} activeOpacity={0.7}>
            <Text style={{ color: mutedColor, fontSize: 16, paddingHorizontal: 4 }}>✕</Text>
          </TouchableOpacity>
        </View>
      ))}
      <TouchableOpacity onPress={() => onChange([...items, ''])} activeOpacity={0.7} style={{ paddingVertical: 2 }}>
        <Text style={{ color: accentColor, fontSize: 13, fontWeight: '600' }}>+ {addLabel}</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function TestCaseEditor({ visible, testCase, onSave, onCancel }: Props) {
  const { theme } = useTheme();

  const [title,        setTitle]        = useState('');
  const [type,         setType]         = useState('Happy Path');
  const [reqAttribute, setReqAttribute] = useState('');
  const [desc,         setDesc]         = useState<DescState>({ objective: '', scope: [], assumptions: [] });
  const [setup,        setSetup]        = useState<SetupState>({ preconditions: [], environment: [], equipment: [], testData: [] });
  const [steps,        setSteps]        = useState<Step[]>([]);

  useEffect(() => {
    if (!testCase) return;
    setTitle(testCase.title || '');
    setType(testCase.type || 'Happy Path');
    setReqAttribute(testCase.req_attribute || '');

    const d = tryParse(testCase.description) || testCase.description || {};
    setDesc({
      objective:   typeof d.objective === 'string' ? d.objective : '',
      scope:       toStringArray(d.scope),
      assumptions: toStringArray(d.assumptions),
    });

    const s = tryParse(testCase.preconditions) || testCase.preconditions || {};
    setSetup({
      preconditions: toStringArray(s.preconditions),
      environment:   toStringArray(s.environment),
      equipment:     toStringArray(s.equipment),
      testData:      toStringArray(s.testData),
    });

    setSteps(testCase.steps ? testCase.steps.map(st => ({ ...st })) : []);
  }, [testCase]);

  function updateStep(i: number, field: 'step' | 'expectedResult', value: string) {
    setSteps(prev => prev.map((s, j) => j === i ? { ...s, [field]: value } : s));
  }

  function handleSave() {
    if (!testCase?.tc_id) return;
    onSave(testCase.tc_id, { title, type, req_attribute: reqAttribute, description: desc, preconditions: setup, steps });
  }

  // Shared input style
  const inputStyle = {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 14 as const,
    borderColor: theme.border,
    backgroundColor: theme.surface,
    color: theme.text,
  };

  const listInputStyle = {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    fontSize: 13 as const,
    borderColor: theme.border,
    backgroundColor: theme.surface,
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: theme.bg }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.border, backgroundColor: theme.surface }]}>
          <TouchableOpacity onPress={onCancel} style={styles.headerBtn}>
            <Text style={{ fontSize: 15, color: theme.textMuted }}>Cancel</Text>
          </TouchableOpacity>
          <Text style={{ fontSize: 17, fontWeight: '700', color: theme.textBright }}>Edit Test Case</Text>
          <TouchableOpacity onPress={handleSave} style={styles.headerBtn}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: theme.accent }}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">

          {testCase?.tc_id && (
            <Text style={{ fontSize: 11, fontWeight: '600', letterSpacing: 0.5, color: theme.textMuted, marginBottom: 4 }}>
              {testCase.tc_id}
            </Text>
          )}

          {/* ── BASIC ────────────────────────────────────── */}
          <SectionDivider label="BASIC" theme={theme} />

          <FieldLabel label="Title" theme={theme} />
          <TextInput
            value={title}
            onChangeText={setTitle}
            style={[inputStyle, { color: theme.textBright, fontSize: 15 }]}
            placeholderTextColor={theme.textMuted}
            placeholder="Test case title"
          />

          <FieldLabel label="Type" theme={theme} />
          <View style={styles.typeRow}>
            {TYPES.map(t => {
              const isSelected = type === t;
              const color = TYPE_COLORS[t];
              return (
                <TouchableOpacity
                  key={t}
                  onPress={() => setType(t)}
                  style={[styles.typeChip, { borderColor: color, backgroundColor: isSelected ? color : color + '22' }]}
                  activeOpacity={0.7}
                >
                  <Text style={{ fontSize: 12, fontWeight: '600', color: isSelected ? '#fff' : color }}>{t}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <FieldLabel label="Req Attribute" theme={theme} />
          <TextInput
            value={reqAttribute}
            onChangeText={setReqAttribute}
            style={inputStyle}
            placeholderTextColor={theme.textMuted}
            placeholder="Which aspect of the requirement this validates"
          />

          {/* ── DESCRIPTION ──────────────────────────────── */}
          <SectionDivider label="DESCRIPTION" theme={theme} />

          <FieldLabel label="Objective" theme={theme} />
          <TextInput
            value={desc.objective}
            onChangeText={v => setDesc(d => ({ ...d, objective: v }))}
            style={[inputStyle, { minHeight: 72, textAlignVertical: 'top' }]}
            multiline
            placeholderTextColor={theme.textMuted}
            placeholder="What this test case verifies…"
          />

          <FieldLabel label="Scope" theme={theme} />
          <EditableList
            items={desc.scope}
            placeholder="Scope item…"
            addLabel="Add scope item"
            onChange={scope => setDesc(d => ({ ...d, scope }))}
            inputStyle={listInputStyle}
            textColor={theme.text}
            mutedColor={theme.textMuted}
            accentColor={theme.accent}
          />

          <FieldLabel label="Assumptions" theme={theme} />
          <EditableList
            items={desc.assumptions}
            placeholder="Assumption…"
            addLabel="Add assumption"
            onChange={assumptions => setDesc(d => ({ ...d, assumptions }))}
            inputStyle={listInputStyle}
            textColor={theme.text}
            mutedColor={theme.textMuted}
            accentColor={theme.accent}
          />

          {/* ── SETUP ────────────────────────────────────── */}
          <SectionDivider label="SETUP" theme={theme} />

          <FieldLabel label="Preconditions" theme={theme} />
          <EditableList
            items={setup.preconditions}
            placeholder="Precondition…"
            addLabel="Add precondition"
            onChange={preconditions => setSetup(s => ({ ...s, preconditions }))}
            inputStyle={listInputStyle}
            textColor={theme.text}
            mutedColor={theme.textMuted}
            accentColor={theme.accent}
          />

          <FieldLabel label="Environment" theme={theme} />
          <EditableList
            items={setup.environment}
            placeholder="Environment item…"
            addLabel="Add environment"
            onChange={environment => setSetup(s => ({ ...s, environment }))}
            inputStyle={listInputStyle}
            textColor={theme.text}
            mutedColor={theme.textMuted}
            accentColor={theme.accent}
          />

          <FieldLabel label="Equipment" theme={theme} />
          <EditableList
            items={setup.equipment}
            placeholder="Equipment item…"
            addLabel="Add equipment"
            onChange={equipment => setSetup(s => ({ ...s, equipment }))}
            inputStyle={listInputStyle}
            textColor={theme.text}
            mutedColor={theme.textMuted}
            accentColor={theme.accent}
          />

          <FieldLabel label="Test Data" theme={theme} />
          <EditableList
            items={setup.testData}
            placeholder="Test data item…"
            addLabel="Add test data"
            onChange={testData => setSetup(s => ({ ...s, testData }))}
            inputStyle={listInputStyle}
            textColor={theme.text}
            mutedColor={theme.textMuted}
            accentColor={theme.accent}
          />

          {/* ── STEPS ────────────────────────────────────── */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <SectionDivider label={`STEPS (${steps.length})`} theme={theme} />
          </View>

          {steps.map((s, i) => (
            <View key={i} style={[styles.stepCard, { borderColor: theme.border, backgroundColor: theme.surface }]}>
              <View style={styles.stepCardHeader}>
                <Text style={{ fontSize: 15, fontWeight: '700', color: theme.accent }}>{i + 1}</Text>
                <TouchableOpacity onPress={() => setSteps(prev => prev.filter((_, j) => j !== i))} activeOpacity={0.7}>
                  <Text style={{ fontSize: 16, color: theme.textMuted, paddingHorizontal: 4 }}>✕</Text>
                </TouchableOpacity>
              </View>
              <FieldLabel label="Action" theme={theme} />
              <TextInput
                value={s.step}
                onChangeText={v => updateStep(i, 'step', v)}
                style={[styles.stepInput, { color: theme.text, borderColor: theme.border, backgroundColor: theme.bg }]}
                multiline
                placeholderTextColor={theme.textMuted}
                placeholder="Describe the action…"
                textAlignVertical="top"
              />
              <FieldLabel label="Expected Result" theme={theme} top={8} />
              <TextInput
                value={s.expectedResult}
                onChangeText={v => updateStep(i, 'expectedResult', v)}
                style={[styles.stepInput, { color: theme.text, borderColor: theme.border, backgroundColor: theme.bg }]}
                multiline
                placeholderTextColor={theme.textMuted}
                placeholder="Describe the expected outcome…"
                textAlignVertical="top"
              />
            </View>
          ))}

          <TouchableOpacity
            onPress={() => setSteps(prev => [...prev, { step: '', expectedResult: '' }])}
            style={[styles.addStepBtn, { borderColor: theme.accent }]}
            activeOpacity={0.7}
          >
            <Text style={{ fontSize: 14, fontWeight: '600', color: theme.accent }}>+ Add Step</Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Small layout helpers ─────────────────────────────────────────────────────

function SectionDivider({ label, theme }: { label: string; theme: any }) {
  return (
    <View style={[styles.divider, { borderTopColor: theme.border }]}>
      <Text style={{ fontSize: 10, fontWeight: '700', letterSpacing: 1.2, color: theme.accent }}>{label}</Text>
    </View>
  );
}

function FieldLabel({ label, theme, top }: { label: string; theme: any; top?: number }) {
  return (
    <Text style={{ fontSize: 11, fontWeight: '600', color: theme.textMuted, marginTop: top ?? 10, marginBottom: 4 }}>
      {label}
    </Text>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerBtn: { minWidth: 60 },
  body: { padding: 16, paddingBottom: 60 },
  divider: {
    borderTopWidth: 1,
    marginTop: 20,
    paddingTop: 12,
  },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 },
  typeChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1.5 },
  stepCard: { borderWidth: 1, borderRadius: 10, padding: 12, marginTop: 8 },
  stepCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  stepInput: {
    fontSize: 13,
    lineHeight: 19,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    minHeight: 64,
  },
  addStepBtn: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 12,
  },
});
