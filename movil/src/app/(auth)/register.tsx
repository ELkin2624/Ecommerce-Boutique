import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StatusBar,
  ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator,
  Animated, TouchableWithoutFeedback, Keyboard, StyleProp, ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { Ionicons } from '@expo/vector-icons';
import { AUTH_COLORS } from '@/features/auth/ui/auth.tokens';
import { registerStyles as s } from '@/features/auth/ui/register.styles';

// ─── Indicador de fortaleza de contraseña ────────────────────────────────────
function getPasswordStrength(pw: string): { level: number; label: string; color: string } {
  if (!pw) return { level: 0, label: '', color: AUTH_COLORS.borderLight };
  if (pw.length < 6) return { level: 1, label: 'Muy corta', color: '#ef4444' };
  if (pw.length < 8) return { level: 2, label: 'Débil', color: '#f97316' };
  const hasUpper = /[A-Z]/.test(pw);
  const hasNumber = /[0-9]/.test(pw);
  const hasSpecial = /[^A-Za-z0-9]/.test(pw);
  const extras = [hasUpper, hasNumber, hasSpecial].filter(Boolean).length;
  if (extras === 0) return { level: 2, label: 'Débil', color: '#f97316' };
  if (extras === 1) return { level: 3, label: 'Moderada', color: '#eab308' };
  return { level: 4, label: 'Fuerte', color: '#22c55e' };
}

// ─── Componente de campo reutilizable con forwardRef ─────────────────────────
interface FieldProps {
  label: string;
  icon: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder: string;
  keyboardType?: any;
  autoCapitalize?: any;
  autoComplete?: any;
  returnKeyType?: any;
  onSubmitEditing?: () => void;
  secureTextEntry?: boolean;
  showToggle?: boolean;
  onToggle?: () => void;
  showPasswordVisible?: boolean;
  style?: StyleProp<ViewStyle>;
}

const Field = React.forwardRef<TextInput, FieldProps>(({
  label, icon, value, onChangeText, placeholder,
  keyboardType = 'default', autoCapitalize = 'sentences',
  autoComplete, returnKeyType = 'next', onSubmitEditing,
  secureTextEntry = false, showToggle = false,
  onToggle, showPasswordVisible, style,
}, ref) => {
  const [focused, setFocused] = useState(false);
  return (
    <View style={[s.fieldGroup, style]}>
      <Text style={s.fieldLabel}>{label}</Text>
      <View style={[s.inputRow, focused && s.inputRowFocused]}>
        <Ionicons
          name={icon as any}
          size={17}
          color={focused ? AUTH_COLORS.bgNavy : AUTH_COLORS.textTeal}
          style={s.inputIcon}
        />
        <TextInput
          ref={ref}
          style={s.textInput}
          placeholder={placeholder}
          placeholderTextColor={AUTH_COLORS.textMuted}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoComplete={autoComplete}
          autoCorrect={false}
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          secureTextEntry={secureTextEntry}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
        />
        {showToggle && (
          <TouchableOpacity
            onPress={onToggle}
            style={s.eyeButton}
            activeOpacity={0.7}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons
              name={showPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={AUTH_COLORS.textTeal}
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
});
Field.displayName = 'Field';

// ─── Pantalla principal ───────────────────────────────────────────────────────
export default function RegisterScreen() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Referencias para encadenar campos con "Siguiente"
  const lastNameRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);
  const phoneRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);

  const { register, isLoading, error, clearError } = useAuth();
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const strength = getPasswordStrength(password);

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -6, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const handleRegister = async () => {
    Keyboard.dismiss();
    clearError();
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password) {
      shake();
      return;
    }
    if (password.length < 6) {
      shake();
      return;
    }
    try {
      await register({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim() || undefined,
        password,
      });
      router.replace('/(tabs)');
    } catch {
      shake();
    }
  };

  return (
    <SafeAreaView style={s.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor={AUTH_COLORS.bgNavy} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={s.keyboardView}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={s.scrollContent}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
          >
            {/* ── Header ── */}
            <View style={s.brandArea}>
              <TouchableOpacity
                style={s.backButton}
                onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))}
                activeOpacity={0.7}
              >
                <Ionicons name="arrow-back" size={18} color={AUTH_COLORS.textWhite} />
              </TouchableOpacity>
              <View style={s.brandTextArea}>
                <Text style={s.brandTitle}>BOUTIQUE</Text>
                <Text style={s.brandSubtitle}>NUEVA CUENTA</Text>
              </View>
              <Ionicons name="sparkles" size={22} color={AUTH_COLORS.surfaceSky} />
            </View>

            {/* ── Tarjeta ── */}
            <Animated.View style={[s.card, { transform: [{ translateX: shakeAnim }] }]}>
              <Text style={s.cardTitle}>Crea tu cuenta</Text>
              <Text style={s.cardSubtitle}>
                Únete para acceder a reservas de probador, historial de compras y precios exclusivos.
              </Text>

              {/* Error */}
              {error ? (
                <View style={s.errorBanner}>
                  <Ionicons name="alert-circle" size={18} color={AUTH_COLORS.errorIcon} />
                  <Text style={s.errorText}>{error}</Text>
                </View>
              ) : null}

              {/* Nombre y Apellido */}
              <View style={s.row}>
                <Field
                  label="NOMBRE *"
                  icon="person-outline"
                  value={firstName}
                  onChangeText={(t) => {
                    if (error) clearError();
                    setFirstName(t);
                  }}
                  placeholder="Juan"
                  autoCapitalize="words"
                  returnKeyType="next"
                  onSubmitEditing={() => lastNameRef.current?.focus()}
                  style={s.rowCol}
                />
                <Field
                  ref={lastNameRef}
                  label="APELLIDO *"
                  icon="person-outline"
                  value={lastName}
                  onChangeText={(t) => {
                    if (error) clearError();
                    setLastName(t);
                  }}
                  placeholder="Pérez"
                  autoCapitalize="words"
                  returnKeyType="next"
                  onSubmitEditing={() => emailRef.current?.focus()}
                  style={s.rowCol}
                />
              </View>

              {/* Email */}
              <Field
                ref={emailRef}
                label="CORREO ELECTRÓNICO *"
                icon="mail-outline"
                value={email}
                onChangeText={(t) => {
                  if (error) clearError();
                  setEmail(t);
                }}
                placeholder="tu@correo.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                returnKeyType="next"
                onSubmitEditing={() => phoneRef.current?.focus()}
              />

              {/* Teléfono */}
              <Field
                ref={phoneRef}
                label="TELÉFONO (OPCIONAL)"
                icon="call-outline"
                value={phone}
                onChangeText={(t) => {
                  if (error) clearError();
                  setPhone(t);
                }}
                placeholder="+591 71234567"
                keyboardType="phone-pad"
                returnKeyType="next"
                onSubmitEditing={() => passwordRef.current?.focus()}
              />

              {/* Contraseña */}
              <Field
                ref={passwordRef}
                label="CONTRASEÑA *"
                icon="lock-closed-outline"
                value={password}
                onChangeText={(t) => {
                  if (error) clearError();
                  setPassword(t);
                }}
                placeholder="Mínimo 6 caracteres"
                autoComplete="new-password"
                secureTextEntry={!showPassword}
                showToggle
                onToggle={() => setShowPassword(!showPassword)}
                showPasswordVisible={showPassword}
                returnKeyType="done"
                onSubmitEditing={handleRegister}
              />

              {/* Indicador de fortaleza */}
              {password.length > 0 && (
                <View style={s.strengthContainer}>
                  <View style={s.strengthBars}>
                    {[1, 2, 3, 4].map((level) => (
                      <View
                        key={level}
                        style={[
                          s.strengthBar,
                          strength.level >= level && { backgroundColor: strength.color },
                        ]}
                      />
                    ))}
                  </View>
                  {strength.label ? (
                    <Text style={[s.strengthLabel, { color: strength.color }]}>
                      {strength.label}
                    </Text>
                  ) : null}
                </View>
              )}

              {/* Botón */}
              <TouchableOpacity
                style={[s.submitButton, isLoading && s.submitButtonDisabled]}
                onPress={handleRegister}
                disabled={isLoading}
                activeOpacity={0.85}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <>
                    <Ionicons name="person-add-outline" size={20} color="#ffffff" />
                    <Text style={s.submitButtonText}>Crear Cuenta</Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Ir a Login */}
              <View style={s.linkRow}>
                <Text style={s.linkText}>¿Ya tienes cuenta?</Text>
                <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
                  <Text style={s.linkAction}>Inicia sesión</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>

            {/* Invitado */}
            <TouchableOpacity
              style={s.guestButton}
              onPress={() => router.replace('/(tabs)')}
              activeOpacity={0.7}
            >
              <Text style={s.guestText}>Continuar sin cuenta →</Text>
            </TouchableOpacity>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
