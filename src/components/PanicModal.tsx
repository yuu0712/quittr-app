import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme';

interface Props {
  visible: boolean;
  onClose: () => void;
  /** Extra line shown while a taper plan is active. */
  taperLine?: string | undefined;
}

/** Panic Button overlay — comp only defines the button; this is the destination. */
export function PanicModal({ visible, onClose, taperLine }: Props) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.title}>Ride it out.</Text>
          <Text style={styles.body}>
            A nicotine craving peaks and passes in{"\n"}
            about 3–5 minutes. You just have to outlast it.
          </Text>
          <Text style={styles.body}>
            Drink a glass of cold water, chew gum,{"\n"}
            step outside, and breathe — in for 4,{"\n"}
            hold for 4, out for 6. No pouch.
          </Text>
          {taperLine ? <Text style={styles.body}>{taperLine}</Text> : null}
          <Pressable
            onPress={onClose}
            style={({ pressed }) => [
              styles.button,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.buttonText}>I&apos;m okay</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 22,
  },
  sheet: {
    width: '100%',
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: 24,
    backgroundColor: colors.cardBg,
    padding: 24,
    alignItems: 'center',
    gap: 14,
  },
  title: { color: colors.text, fontSize: 24, fontWeight: '800' },
  body: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
  button: {
    marginTop: 6,
    height: 50,
    alignSelf: 'stretch',
    borderRadius: 25,
    backgroundColor: colors.panicMid,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.85 },
  buttonText: { color: colors.panicText, fontSize: 16, fontWeight: '800' },
});
