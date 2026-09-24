import React from 'react';
import { View, Text, TouchableOpacity, StatusBar, ActivityIndicator, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../hooks/use-auth';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AUTH_COLORS } from './auth.tokens';
import { requireAuthStyles as s } from './require-auth.styles';

interface RequireAuthProps {
  children: React.ReactNode;
  fallbackMessage?: string;
}

const BENEFITS = [
  { icon: 'calendar-outline', text: 'Reserva el probador presencial sin espera' },
  { icon: 'cube-outline', text: 'Prueba ropa en 3D con el probador virtual' },
  { icon: 'bag-check-outline', text: 'Historial de compras y seguimiento de pedidos' },
  { icon: 'pricetag-outline', text: 'Precios mayoristas y cupones exclusivos' },
];

const LOGO_SOURCE = require('@/assets/expo.icon/kitty.svg');

export const RequireAuth: React.FC<RequireAuthProps> = ({
  children,
  fallbackMessage = 'Inicia sesión para acceder a todas las funciones de tu cuenta.',
}) => {
  const { isAuthenticated, isHydrated } = useAuth();

  // ── Cargando (hidratación) ─────────────────────────────────────
  if (!isHydrated) {
    return (
      <SafeAreaView style={s.container}>
        <StatusBar barStyle="light-content" backgroundColor={AUTH_COLORS.bgNavy} />
        <View style={s.center}>
          <ActivityIndicator size="large" color={AUTH_COLORS.surfaceSky} />
          <Text style={[s.loadingText, { marginTop: 16 }]}>Verificando sesión...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── Sin autenticación → pantalla de invitado ────────────────────
  if (!isAuthenticated) {
    return (
      <SafeAreaView style={s.container}>
        <StatusBar barStyle="light-content" backgroundColor={AUTH_COLORS.bgNavy} />
        <ScrollView
          contentContainerStyle={s.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* Logo */}
          <View style={s.logoWrap}>
            <Image source={LOGO_SOURCE} style={s.logo} resizeMode="contain" />
          </View>

          <View style={s.card}>
            {/* Badge */}
            <View style={s.badge}>
              <Text style={s.badgeText}>BOUTIQUE CLUB</Text>
            </View>

            {/* Textos */}
            <Text style={s.title}>Tu Cuenta</Text>
            <Text style={s.subtitle}>{fallbackMessage}</Text>

            {/* Beneficios */}
            <View style={s.benefitsList}>
              {BENEFITS.map((b, i) => (
                <View key={i} style={s.benefitItem}>
                  <View style={s.benefitIconWrap}>
                    <Ionicons name={b.icon as any} size={16} color={AUTH_COLORS.bgNavy} />
                  </View>
                  <Text style={s.benefitText}>{b.text}</Text>
                </View>
              ))}
            </View>

            {/* Botón principal */}
            <TouchableOpacity
              style={s.primaryButton}
              onPress={() => router.push('/(auth)/login')}
              activeOpacity={0.85}
            >
              <Ionicons name="log-in-outline" size={18} color="#fff" />
              <Text style={s.primaryButtonText}>Iniciar Sesión</Text>
            </TouchableOpacity>

            {/* Botón secundario */}
            <TouchableOpacity
              style={s.outlineButton}
              onPress={() => router.push('/(auth)/register')}
              activeOpacity={0.85}
            >
              <Ionicons name="person-add-outline" size={18} color={AUTH_COLORS.bgNavy} />
              <Text style={s.outlineButtonText}>Crear Cuenta Nueva</Text>
            </TouchableOpacity>

            {/* Invitado */}
            <TouchableOpacity
              style={s.guestLink}
              onPress={() => router.replace('/(tabs)')}
            >
              <Text style={s.guestLinkText}>Continuar explorando sin cuenta</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Autenticado → renderizar hijos ─────────────────────────────
  return <>{children}</>;
};