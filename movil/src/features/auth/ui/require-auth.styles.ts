import { StyleSheet } from 'react-native';
import { AUTH_COLORS } from './auth.tokens';

export const requireAuthStyles = StyleSheet.create({
  // ── Layout ──────────────────────────────────────────────────────
  container: {
    flex: 1,
    backgroundColor: AUTH_COLORS.bgNavy,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },

  // ── Loading ─────────────────────────────────────────────────────
  loadingText: {
    fontSize: 14,
    color: AUTH_COLORS.surfaceSky,
    fontWeight: '500',
    textAlign: 'center',
  },

  // ── Scroll ─────────────────────────────────────────────────────
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 32,
  },

  // ── Logo ───────────────────────────────────────────────────────
  logoWrap: {
    marginBottom: 28,
    alignItems: 'center',
  },
  logo: {
    width: 140,
    height: 48,
  },

  // ── Tarjeta ─────────────────────────────────────────────────────
  card: {
    backgroundColor: AUTH_COLORS.bgCard,
    borderRadius: 24,
    padding: 26,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },

  // ── Badge ─────────────────────────────────────────────────────────
  badge: {
    backgroundColor: AUTH_COLORS.bgNavy,
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 99,
    marginBottom: 14,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
    color: AUTH_COLORS.textWhite,
  },

  // ── Textos ─────────────────────────────────────────────────────
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: AUTH_COLORS.textNavy,
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    color: AUTH_COLORS.textSlate,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 19,
    paddingHorizontal: 4,
  },

  // ── Beneficios (más livianos: icono redondo + texto, sin caja) ──
  benefitsList: {
    width: '100%',
    marginBottom: 24,
    gap: 12,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  benefitIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: AUTH_COLORS.surfaceSky,
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitText: {
    flex: 1,
    fontSize: 12,
    color: AUTH_COLORS.textNavy,
    fontWeight: '500',
    lineHeight: 16,
  },

  // ── Botones ───────────────────────────────────────────────────
  primaryButton: {
    backgroundColor: AUTH_COLORS.bgNavy,
    borderRadius: 14,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    marginBottom: 10,
    shadowColor: AUTH_COLORS.shadowNavy,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  primaryButtonText: {
    color: AUTH_COLORS.textWhite,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderRadius: 14,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: AUTH_COLORS.bgNavy,
  },
  outlineButtonText: {
    color: AUTH_COLORS.bgNavy,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.3,
  },

  // ── Link invitado ───────────────────────────────────────────────
  guestLink: {
    paddingVertical: 8,
  },
  guestLinkText: {
    fontSize: 12,
    color: AUTH_COLORS.textSlate,
    fontWeight: '500',
  },
});