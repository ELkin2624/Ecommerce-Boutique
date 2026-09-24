import { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StatusBar,
  ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator,
  Animated, TouchableWithoutFeedback, Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { Ionicons } from '@expo/vector-icons';
import { AUTH_COLORS } from '@/features/auth/ui/auth.tokens';
import { loginStyles as s } from '@/features/auth/ui/login.styles';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const passwordRef = useRef<TextInput>(null);

  const { login, isLoading, error, clearError } = useAuth();
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -6, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const handleLogin = async () => {
    Keyboard.dismiss();
    clearError();
    if (!email.trim() || !password) {
      shake();
      return;
    }
    try {
      await login({ email: email.trim().toLowerCase(), password });
      router.replace('/(tabs)');
    } catch {
      shake();
    }
  };

  const handleEmailChange = (text: string) => {
    if (error) clearError();
    setEmail(text);
  };

  const handlePasswordChange = (text: string) => {
    if (error) clearError();
    setPassword(text);
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
            {/* ── Tarjeta ── */}
            <Animated.View style={[s.card, { transform: [{ translateX: shakeAnim }] }]}>
              <Text style={s.cardTitle}>Bienvenido de nuevo</Text>
              <Text style={s.cardSubtitle}>
                Ingresa tus credenciales para acceder a tu cuenta
              </Text>

              {/* Error banner */}
              {error ? (
                <View style={s.errorBanner}>
                  <Ionicons name="alert-circle" size={18} color={AUTH_COLORS.errorIcon} />
                  <Text style={s.errorText}>{error}</Text>
                </View>
              ) : null}

              {/* Email */}
              <View style={s.fieldGroup}>
                <Text style={s.fieldLabel}>CORREO ELECTRÓNICO</Text>
                <View style={[s.inputRow, emailFocused && s.inputRowFocused]}>
                  <Ionicons
                    name="mail-outline"
                    size={18}
                    color={emailFocused ? AUTH_COLORS.bgNavy : AUTH_COLORS.textTeal}
                    style={s.inputIcon}
                  />
                  <TextInput
                    style={s.textInput}
                    placeholder="tu@correo.com"
                    placeholderTextColor={AUTH_COLORS.textMuted}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="email"
                    value={email}
                    onChangeText={handleEmailChange}
                    onFocus={() => setEmailFocused(true)}
                    onBlur={() => setEmailFocused(false)}
                    returnKeyType="next"
                    onSubmitEditing={() => passwordRef.current?.focus()}
                  />
                </View>
              </View>

              {/* Contraseña */}
              <View style={s.fieldGroup}>
                <Text style={s.fieldLabel}>CONTRASEÑA</Text>
                <View style={[s.inputRow, passwordFocused && s.inputRowFocused]}>
                  <Ionicons
                    name="lock-closed-outline"
                    size={18}
                    color={passwordFocused ? AUTH_COLORS.bgNavy : AUTH_COLORS.textTeal}
                    style={s.inputIcon}
                  />
                  <TextInput
                    ref={passwordRef}
                    style={s.textInput}
                    placeholder="Tu contraseña"
                    placeholderTextColor={AUTH_COLORS.textMuted}
                    secureTextEntry={!showPassword}
                    autoComplete="current-password"
                    value={password}
                    onChangeText={handlePasswordChange}
                    onFocus={() => setPasswordFocused(true)}
                    onBlur={() => setPasswordFocused(false)}
                    returnKeyType="done"
                    onSubmitEditing={handleLogin}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={s.eyeButton}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                      color={AUTH_COLORS.textTeal}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Botón de Login */}
              <TouchableOpacity
                style={[s.submitButton, isLoading && s.submitButtonDisabled]}
                onPress={handleLogin}
                disabled={isLoading}
                activeOpacity={0.85}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <>
                    <Ionicons name="log-in-outline" size={20} color="#ffffff" />
                    <Text style={s.submitButtonText}>Iniciar Sesión</Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Divider */}
              <View style={s.divider}>
                <View style={s.dividerLine} />
                <Text style={s.dividerText}>¿nuevo aquí?</Text>
                <View style={s.dividerLine} />
              </View>

              {/* Ir a Registro */}
              <View style={s.linkRow}>
                <Text style={s.linkText}>¿Sin cuenta aún?</Text>
                <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
                  <Text style={s.linkAction}>Crear cuenta gratis</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>

            {/* Continuar como Invitado */}
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
