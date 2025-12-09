
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';

interface ExpandableTooltipProps {
  title: string;
  brief: string;
  detailed: string;
  icon?: string;
  iconAndroid?: string;
}

export default function ExpandableTooltip({ 
  title, 
  brief, 
  detailed, 
  icon = 'info.circle.fill',
  iconAndroid = 'info'
}: ExpandableTooltipProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <TouchableOpacity 
      style={styles.container}
      onPress={() => setExpanded(!expanded)}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <IconSymbol
          ios_icon_name={icon}
          android_material_icon_name={iconAndroid}
          size={20}
          color={colors.secondary}
        />
        <View style={styles.headerText}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.brief}>{brief}</Text>
        </View>
        <IconSymbol
          ios_icon_name={expanded ? 'chevron.up' : 'chevron.down'}
          android_material_icon_name={expanded ? 'expand-less' : 'expand-more'}
          size={20}
          color={colors.textSecondary}
        />
      </View>
      
      {expanded && (
        <View style={styles.detailedContainer}>
          <Text style={styles.detailed}>{detailed}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderColor: colors.secondary,
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  brief: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  detailedContainer: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  detailed: {
    fontSize: 13,
    color: colors.text,
    lineHeight: 20,
  },
});
