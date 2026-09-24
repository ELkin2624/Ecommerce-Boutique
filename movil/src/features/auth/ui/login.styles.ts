import { StyleSheet } from 'react-native';
import { AUTH_COLORS } from '@/features/auth/ui/auth.tokens';

export const loginStyles = StyleSheet.create({
  // ── Layout principal ──────────────────────────────────────────────
  container: {
    flex: 1,
    backgroundColor: AUTH_COLORS.bgNavy,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },

  // ── Header con logo/branding ───────────────────────────────────────
  brandArea: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  brandTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: AUTH_COLORS.textWhite,
    letterSpacing: 3,
    textAlign: 'center',
  },
  brandSubtitle: {
    fontSize: 11,
    color: AUTH_COLORS.surfaceSky,
    letterSpacing: 2,
    marginTop: 4,
    textAlign: 'center',
    fontWeight: '600',
  },

  // ── Tarjeta de formulario ──────────────────────────────────────────
  card: {
    backgroundColor: AUTH_COLORS.bgCard,
    borderRadius: 28,
    paddingHorizontal: 28,
    paddingVertical: 32,
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
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  cardSubtitle: {
    fontSize: 13,
    color: AUTH_COLORS.textSlate,
    textAlign: 'center',
    marginBottom: 28,
    lineHeight: 18,
  },

  // ── Campos ─────────────────────────────────────────────────────────
  fieldGroup: {
    marginBottom: 16,
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
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 54,
  },
  inputRowFocused: {
    borderColor: AUTH_COLORS.borderFocus,
    backgroundColor: AUTH_COLORS.bgInputFocused,
  },
  inputIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: AUTH_COLORS.textNavy,
    fontWeight: '500',
  },
  eyeButton: {
    padding: 6,
    marginLeft: 4,
  },

  // ── Error banner ───────────────────────────────────────────────────
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: AUTH_COLORS.errorBg,
    borderWidth: 1,
    borderColor: AUTH_COLORS.errorBorder,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    flex: 1,
    fontSize: 12,
    color: AUTH_COLORS.errorText,
    fontWeight: '600',
    lineHeight: 16,
  },

  // ── Botón principal ────────────────────────────────────────────────
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

  // ── Divider ─────────────────────────────────────────────────────────
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: AUTH_COLORS.borderLight,
  },
  dividerText: {
    fontSize: 11,
    color: AUTH_COLORS.textMuted,
    fontWeight: '600',
  },

  // ── Links de navegación ────────────────────────────────────────────
  linkRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
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

  // ── Botón invitado ─────────────────────────────────────────────────
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
