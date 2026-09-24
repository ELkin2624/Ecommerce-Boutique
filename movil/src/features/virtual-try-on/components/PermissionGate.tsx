import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/shared/ui/Button';
import type { PermissionStatus } from '../types/camera.types';

interface PermissionGateProps {
  status: PermissionStatus;
  onRequestPermission: () => Promise<boolean>;
  onOpenSettings: () => Promise<void>;
  onClose: () => void;
}

export const PermissionGate: React.FC<PermissionGateProps> = ({
  status,
  onRequestPermission,
  onOpenSettings,
  onClose,
}) => {
  const isDenied = status === 'denied';

  return (
    <SafeAreaView style={styles.container} className="flex-1 bg-slate-950 px-6 justify-between py-6">
      {/* Botón de cerrar superior */}
      <View className="flex-row justify-end">
        <TouchableOpacity
          onPress={onClose}
          style={styles.closeBtn}
          className="w-10 h-10 rounded-full bg-white/10 items-center justify-center"
          activeOpacity={0.8}
        >
          <Ionicons name="close" size={22} color="#ffffff" />
        </TouchableOpacity>
      </View>

      {/* Contenido central */}
      <View className="items-center max-w-sm self-center">
        <View
          style={styles.iconCircle}
          className="w-24 h-24 rounded-full bg-slate-900 border border-slate-800 items-center justify-center mb-6"
        >
          <Ionicons
            name={isDenied ? 'shield-outline' : 'camera-outline'}
            size={48}
            color={isDenied ? '#f87171' : '#38bdf8'}
          />
        </View>

        <Text style={styles.title} className="text-white text-2xl font-black text-center mb-3 tracking-tight">
          {isDenied ? 'Permiso de Cámara Denegado' : 'Acceso a la Cámara'}
        </Text>

        <Text style={styles.description} className="text-slate-400 text-sm text-center leading-relaxed mb-6">
          {isDenied
            ? 'Para usar el probador virtual necesitas habilitar el permiso de cámara desde los Ajustes de tu teléfono Android.'
            : 'FashionStore necesita acceso a la cámara frontal para mostrarte el espejo en tiempo real de tu probador virtual.'}
        </Text>

        {isDenied && (
          <View style={styles.tipBox} className="flex-row items-center bg-slate-900/90 border border-slate-800 rounded-xl p-3 mb-6 gap-2.5">
            <Ionicons name="information-circle" size={18} color="#94a3b8" />
            <Text style={styles.tipText} className="text-slate-300 text-xs flex-1">
              Pulsa el botón de abajo, selecciona Permisos y activa &quot;Cámara&quot;.
            </Text>
          </View>
        )}
      </View>

      {/* Botones de acción inferiores */}
      <View className="gap-3 w-full max-w-sm self-center">
        <Button
          title={isDenied ? 'Abrir Ajustes de la App' : 'Permitir Acceso a la Cámara'}
          onPress={isDenied ? onOpenSettings : onRequestPermission}
          size="lg"
          icon={
            <Ionicons
              name={isDenied ? 'settings-outline' : 'checkmark-circle-outline'}
              size={20}
              color="#ffffff"
            />
          }
        />
        <Button
          title="Volver a la Tienda"
          variant="outline"
          size="md"
          onPress={onClose}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: '#ffffff',
  },
  description: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 20,
  },
  tipBox: {
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 12,
    padding: 12,
  },
  tipText: {
    color: '#cbd5e1',
    fontSize: 12,
  },
});
