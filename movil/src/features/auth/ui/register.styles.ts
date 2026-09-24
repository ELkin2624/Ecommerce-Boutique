import { StyleSheet } from 'react-native';
import { AUTH_COLORS } from '@/features/auth/ui/auth.tokens';

export const registerStyles = StyleSheet.create({
  // ── Layout ──────────────────────────────────────────────────────
  container: {
    flex: 1,
    backgroundColor: AUTH_COLORS.bgNavy,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 32,
  },

  // ── Branding área ───────────────────────────────────────────────
  brandArea: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTextArea: {
    flex: 1,
  },
  brandTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: AUTH_COLORS.textWhite,
    letterSpacing: 2,
  },
  brandSubtitle: {
    fontSize: 10,
    color: AUTH_COLORS.surfaceSky,
    letterSpacing: 1.5,
    marginTop: 1,
  },

  // ── Tarjeta ──────────────────────────────────────────────────────
  card: {
    backgroundColor: AUTH_COLORS.bgCard,
    borderRadius: 28,
    paddingHorizontal: 24,
    paddingVertical: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 16,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: AUTH_COLORS.textNavy,
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  cardSubtitle: {
    fontSize: 13,
    color: AUTH_COLORS.textSlate,
    marginBottom: 24,
    lineHeight: 18,
  },

  // ── Campos ───────────────────────────────────────────────────────
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  rowCol: {
    flex: 1,
  },
  fieldGroup: {
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: AUTH_COLORS.textNavy,
    letterSpacing: 1,
    marginBottom: 6,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AUTH_COLORS.bgInput,
    borderWidth: 1.5,
    borderColor: AUTH_COLORS.borderInput,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 50,
  },
  inputRowFocused: {
    borderColor: AUTH_COLORS.borderFocus,
    backgroundColor: AUTH_COLORS.bgInputFocused,
  },
  inputIcon: {
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: AUTH_COLORS.textNavy,
    fontWeight: '500',
  },
  eyeButton: {
    padding: 6,
    marginLeft: 4,
  },

  // ── Error banner ─────────────────────────────────────────────────
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: AUTH_COLORS.errorBg,
    borderWidth: 1,
    borderColor: AUTH_COLORS.errorBorder,
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  errorText: {
    flex: 1,
    fontSize: 12,
    color: AUTH_COLORS.errorText,
    fontWeight: '600',
    lineHeight: 16,
  },

  // ── Indicador de seguridad de contraseña ─────────────────────────
  strengthContainer: {
    marginTop: 6,
    gap: 4,
  },
  strengthBars: {
    flexDirection: 'row',
    gap: 4,
  },
  strengthBar: {
    flex: 1,
    height: 3,
    borderRadius: 2,
    backgroundColor: AUTH_COLORS.borderLight,
  },
  strengthLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: AUTH_COLORS.textSlate,
  },

  // ── Botón ───────────────────────────────────────────────────────
  submitButton: {
    backgroundColor: AUTH_COLORS.bgNavy,
    borderRadius: 14,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
    shadowColor: AUTH_COLORS.shadowNavy,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  submitButtonDisabled: {
    opacity: 0.65,
  },
  submitButtonText: {
    color: AUTH_COLORS.textWhite,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  // ── Links ───────────────────────────────────────────────────────
  linkRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
    marginTop: 20,
    flexWrap: 'wrap',
  },
  linkText: {
    fontSize: 13,
    color: AUTH_COLORS.textSlate,
  },
  linkAction: {
    fontSize: 13,
    fontWeight: '800',
    color: AUTH_COLORS.bgNavy,
    textDecorationLine: 'underline',
  },

  // ── Invitado ────────────────────────────────────────────────────
  guestButton: {
    marginTop: 20,
    alignItems: 'center',
    paddingVertical: 12,
  },
  guestText: {
    color: AUTH_COLORS.surfaceSky,
    fontSize: 13,
    fontWeight: '600',
  },
});
