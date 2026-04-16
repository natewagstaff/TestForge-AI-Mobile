import AntDesign from "@expo/vector-icons/AntDesign";
import React, { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Dropdown } from "react-native-element-dropdown";
import { useTheme } from "../context/ThemeContext";

type dropdownItem = {
  label: string;
  value: string;
};

type props = {
  data: dropdownItem[];
  onSelect: (reqId: string) => void;
};

// Renders a searchable dropdown populated with requirements; calls onSelect when a requirement is chosen
const DropdownComponent = ({ data, onSelect }: props) => {
  const { theme } = useTheme();
  const [value, setValue] = useState<string | null>(null);
  const [isFocus, setIsFocus] = useState(false);

  // Renders a floating label above the dropdown when an item is selected or the dropdown is focused
  const renderLabel = () => {
    if (value || isFocus) {
      return (
        <Text style={[styles.label, { color: isFocus ? theme.accent : theme.textMuted }]}>
          Choose a Requirement
        </Text>
      );
    }
    return null;
  };

  return (
    <View style={styles.container}>
      {renderLabel()}
      <Dropdown
        style={[
          styles.dropdown,
          {
            backgroundColor: theme.surface,
            borderColor: isFocus ? theme.accent : theme.border,
          },
        ]}
        placeholderStyle={[styles.placeholderStyle, { color: theme.textMuted }]}
        selectedTextStyle={[styles.selectedTextStyle, { color: theme.text }]}
        inputSearchStyle={[styles.inputSearchStyle, { color: theme.text, borderColor: theme.border }]}
        containerStyle={{ backgroundColor: theme.surface, borderColor: theme.border }}
        itemTextStyle={{ color: theme.text }}
        iconStyle={styles.iconStyle}
        data={data}
        search
        maxHeight={300}
        labelField="label"
        valueField="value"
        placeholder={!isFocus ? "Select requirement" : "..."}
        searchPlaceholder="Search..."
        value={value}
        onFocus={() => setIsFocus(true)}
        onBlur={() => setIsFocus(false)}
        onChange={item => {
          setValue(item.value);
          setIsFocus(false);
          onSelect(item.value);
        }}
        renderLeftIcon={() => (
          <AntDesign
            style={styles.icon}
            color={isFocus ? theme.accent : theme.textMuted}
            name="safety"
            size={20}
          />
        )}
      />
    </View>
  );
};

export default DropdownComponent;

const styles = StyleSheet.create({
  container: {
    padding: 16,
    width: 400,
  },
  dropdown: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
  },
  icon: {
    marginRight: 5,
  },
  label: {
    position: "absolute",
    left: 22,
    top: 8,
    zIndex: 999,
    paddingHorizontal: 8,
    fontSize: 14,
  },
  placeholderStyle: {
    fontSize: 16,
  },
  selectedTextStyle: {
    fontSize: 16,
  },
  iconStyle: {
    width: 20,
    height: 20,
  },
  inputSearchStyle: {
    height: 40,
    fontSize: 16,
  },
});
