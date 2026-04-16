import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet,
  Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';

type Step = { step: string; expectedResult: string };

type TestCase = {
  tc_id?: string;
  title: string;
  type?: string;
  steps?: Step[];
};

type Props = {
  visible: boolean;
  testCase: TestCase | null;
  onSave: (tcId: string, data: { title: string; type: string; steps: Step[] }) => void;
  onCancel: () => void;
};

const TYPES = ['Happy Path', 'Negative', 'Boundary', 'Edge Case'];
const TYPE_COLORS: Record<string, string> = {
  'Happy Path': '#22c55e',
  'Negative':   '#ef4444',
  'Boundary':   '#f59e0b',
  'Edge Case':  '#a855f7',
};

export default function TestCaseEditor({ visible, testCase, onSave, onCancel }: Props) {
  const { theme } = useTheme();

  const [title, setTitle] = useState('');
  const [type,  setType]  = useState('Happy Path');
  const [steps, setSteps] = useState<Step[]>([]);

  useEffect(() => {
    if (testCase) {
      setTitle(testCase.title || '');
      setType(testCase.type || 'Happy Path');
      setSteps(testCase.steps ? testCase.steps.map(s => ({ ...s })) : []);
    }
  }, [testCase]);

  function updateStep(index: number, field: 'step' | 'expectedResult', value: string) {
    setSteps(prev => prev.map((s, i) => i === index ? { ...s, [field]: value } : s));
  }

  function deleteStep(index: number) {
    setSteps(prev => prev.filter((_, i) => i !== index));
  }

  function addStep() {
    setSteps(prev => [...prev, { step: '', expectedResult: '' }]);
  }

  function handleSave() {
    if (!testCase?.tc_id) return;
    onSave(testCase.tc_id, { title, type, steps });
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: theme.bg }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.border, backgroundColor: theme.surface }]}>
          <TouchableOpacity onPress={onCancel} style={styles.headerBtn}>
            <Text style={[styles.cancelText, { color: theme.textMuted }]}>Cancel</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.textBright }]}>Edit Test Case</Text>
          <TouchableOpacity onPress={handleSave} style={styles.headerBtn}>
            <Text style={[styles.saveText, { color: theme.accent }]}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">

          {testCase?.tc_id && (
            <Text style={[styles.tcId, { color: theme.textMuted }]}>{testCase.tc_id}</Text>
          )}

          {/* Title */}
          <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>TITLE</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            style={[styles.titleInput, { color: theme.textBright, borderColor: theme.border, backgroundColor: theme.surface }]}
            placeholderTextColor={theme.textMuted}
            placeholder="Test case title"
          />

          {/* Type */}
          <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>TYPE</Text>
          <View style={styles.typeRow}>
            {TYPES.map(t => {
              const isSelected = type === t;
              const color = TYPE_COLORS[t];
              return (
                <TouchableOpacity
                  key={t}
                  onPress={() => setType(t)}
                  style={[
                    styles.typeChip,
                    { borderColor: color, backgroundColor: isSelected ? color : color + '22' },
                  ]}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.typeChipText, { color: isSelected ? '#fff' : color }]}>{t}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Steps */}
          <View style={styles.stepsHeader}>
            <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>STEPS</Text>
            <Text style={[styles.stepCount, { color: theme.textMuted }]}>{steps.length}</Text>
          </View>

          {steps.map((s, i) => (
            <View key={i} style={[styles.stepCard, { borderColor: theme.border, backgroundColor: theme.surface }]}>
              <View style={styles.stepCardHeader}>
                <Text style={[styles.stepNum, { color: theme.accent }]}>{i + 1}</Text>
                <TouchableOpacity onPress={() => deleteStep(i)} activeOpacity={0.7}>
                  <Text style={[styles.deleteStep, { color: theme.textMuted }]}>✕</Text>
                </TouchableOpacity>
              </View>
              <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>Action</Text>
              <TextInput
                value={s.step}
                onChangeText={v => updateStep(i, 'step', v)}
                style={[styles.stepInput, { color: theme.text, borderColor: theme.border, backgroundColor: theme.bg }]}
                multiline
                placeholderTextColor={theme.textMuted}
                placeholder="Describe the action…"
                textAlignVertical="top"
              />
              <Text style={[styles.fieldLabel, { color: theme.textMuted, marginTop: 8 }]}>Expected Result</Text>
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
            onPress={addStep}
            style={[styles.addStepBtn, { borderColor: theme.accent }]}
            activeOpacity={0.7}
          >
            <Text style={[styles.addStepText, { color: theme.accent }]}>+ Add Step</Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

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
  cancelText: { fontSize: 15 },
  saveText:   { fontSize: 15, fontWeight: '700' },
  headerTitle: { fontSize: 17, fontWeight: '700' },
  body: { padding: 16, paddingBottom: 60, gap: 6 },
  tcId: { fontSize: 11, fontWeight: '600', letterSpacing: 0.5, marginBottom: 4 },
  sectionLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1, marginTop: 12 },
  titleInput: {
    fontSize: 15,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 6,
  },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 },
  typeChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1.5 },
  typeChipText: { fontSize: 12, fontWeight: '600' },
  stepsHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 },
  stepCount: { fontSize: 12 },
  stepCard: { borderWidth: 1, borderRadius: 10, padding: 12, marginTop: 8 },
  stepCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  stepNum: { fontSize: 15, fontWeight: '700' },
  deleteStep: { fontSize: 16, paddingHorizontal: 4 },
  fieldLabel: { fontSize: 11, fontWeight: '600', marginBottom: 4 },
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
  addStepText: { fontSize: 14, fontWeight: '600' },
});
