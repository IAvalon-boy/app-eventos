import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, Text, View, StatusBar, SafeAreaView, 
  TextInput, TouchableOpacity, ScrollView, Alert, 
  KeyboardAvoidingView, Platform 
} from 'react-native';

export default function App() {
  // --- ESTADOS DE NAVEGACIÓN ---
  // Pantallas disponibles: 'splash', 'login', 'register', 'home'
  const [currentScreen, setCurrentScreen] = useState('splash');

  // --- ESTADOS DEL CRUD (HOME) ---
  const [events, setEvents] = useState([
    { id: '1', title: 'Cyberhack Colectivo', type: 'Seguridad' },
    { id: '2', title: 'Synth-Wave Night', type: 'Música' },
  ]);
  const [inputTitle, setInputTitle] = useState('');
  const [inputType, setInputType] = useState('');
  const [editingId, setEditingId] = useState(null);

  // --- ESTADOS DE AUTENTICACIÓN ---
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // --- LÓGICA DEL LOGO DE ENTRADA ---
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentScreen('login'); // Después del splash, va al login
    }, 3500);
    return () => clearTimeout(timer);
  }, []);

  // --- FUNCIONES DE AUTENTICACIÓN (SIMULADAS) ---
  const handleLogin = () => {
    if (email.trim() === '' || password.trim() === '') {
      Alert.alert('ACCESO_DENEGADO', 'Credenciales incompletas.');
      return;
    }
    // Aquí iría tu validación real (ej. Firebase o tu propia API)
    setCurrentScreen('home');
    setEmail('');
    setPassword('');
  };

  const handleRegister = () => {
    if (email.trim() === '' || password.trim() === '' || confirmPassword.trim() === '') {
      Alert.alert('ERROR_SISTEMA', 'Completa todos los campos.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('ERROR_SISTEMA', 'Las contraseñas no coinciden.');
      return;
    }
    Alert.alert('NODO_CREADO', 'Usuario registrado con éxito.');
    setCurrentScreen('login');
    setConfirmPassword('');
  };

  // --- OPERACIONES DEL CRUD ---
  const handleSaveEvent = () => {
    if (inputTitle.trim() === '' || inputType.trim() === '') {
      Alert.alert('SISTEMA_ERROR', 'Se requieren todos los parámetros.');
      return;
    }
    if (editingId) {
      const updated = events.map(e => e.id === editingId ? { ...e, title: inputTitle, type: inputType } : e);
      setEvents(updated);
      setEditingId(null);
    } else {
      setEvents([...events, { id: Date.now().toString(), title: inputTitle, type: inputType }]);
    }
    setInputTitle(''); 
    setInputType('');
  };

  const handleDeleteEvent = (id) => {
    const filtered = events.filter(e => e.id !== id);
    setEvents(filtered);
  };

  // --- RENDERIZADO POR PANTALLAS ---

  // 1. PANTALLA DE SPLASH
  if (currentScreen === 'splash') {
    return (
      <View style={styles.splashContainer}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
        <View style={styles.logoCircle}>
          <View style={styles.logoInner}>
            <Text style={styles.logoText}>C</Text>
            <View style={styles.logoDivider} />
            <Text style={styles.logoText}>A</Text>
          </View>
        </View>
        <Text style={styles.splashBrand}>COMUNIDAD_ACTIVA</Text>
        <Text style={styles.splashLoading}>CARGANDO_SISTEMA...</Text>
        <View style={styles.tronLine} />
      </View>
    );
  }

  // 2. PANTALLA DE LOGIN
  if (currentScreen === 'login') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
        <KeyboardAvoidingView style={styles.authContainer} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <Text style={styles.authTitle}>PORTAL_ACCESO</Text>
          
          <View style={styles.inputSection}>
            <TextInput 
              style={styles.input} 
              placeholder="Email_Operador..." 
              placeholderTextColor={COLORS.muted}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TextInput 
              style={styles.input} 
              placeholder="Contraseña..." 
              placeholderTextColor={COLORS.muted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            <TouchableOpacity style={[styles.submitButton, {borderColor: COLORS.primaryNeon}]} onPress={handleLogin}>
              <Text style={[styles.submitButtonText, {color: COLORS.primaryNeon}]}>[ INICIAR_SESIÓN ]</Text>
            </TouchableOpacity>

            <TouchableOpacity style={{marginTop: 20, alignItems: 'center'}} onPress={() => setCurrentScreen('register')}>
              <Text style={styles.linkText}>¿No tienes acceso? SOLICITAR_NODO_AQUÍ</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // 3. PANTALLA DE REGISTRO
  if (currentScreen === 'register') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
        <KeyboardAvoidingView style={styles.authContainer} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <Text style={[styles.authTitle, {color: COLORS.secondaryNeon}]}>CREAR_NODO</Text>
          
          <View style={styles.inputSection}>
            <TextInput 
              style={styles.input} 
              placeholder="Nuevo_Email..." 
              placeholderTextColor={COLORS.muted}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TextInput 
              style={styles.input} 
              placeholder="Contraseña..." 
              placeholderTextColor={COLORS.muted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
             <TextInput 
              style={styles.input} 
              placeholder="Confirmar_Contraseña..." 
              placeholderTextColor={COLORS.muted}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
            />

            <TouchableOpacity style={[styles.submitButton, {borderColor: COLORS.secondaryNeon}]} onPress={handleRegister}>
              <Text style={[styles.submitButtonText, {color: COLORS.secondaryNeon}]}>[ EJECUTAR_REGISTRO ]</Text>
            </TouchableOpacity>

            <TouchableOpacity style={{marginTop: 20, alignItems: 'center'}} onPress={() => setCurrentScreen('login')}>
              <Text style={styles.linkText}>CANCELAR Y VOLVER</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // 4. PANTALLA PRINCIPAL (CRUD)
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        
        {/* HEADER CON BOTÓN DE SALIDA */}
        <View style={styles.header}>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTextPrefix}>📡 NODE_ID:</Text>
            <Text style={styles.headerTextMain}>COMUNIDAD_NEÓN</Text>
          </View>
          <TouchableOpacity onPress={() => setCurrentScreen('login')} style={{marginLeft: 'auto'}}>
            <Text style={{color: COLORS.alertNeon, fontFamily: 'monospace', fontSize: 12}}>[ SALIR ]</Text>
          </TouchableOpacity>
        </View>

        {/* CONTENIDO PRINCIPAL */}
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.inputSection}>
            <Text style={styles.sectionTitle}>{editingId ? '> MODIFICAR_NODO' : '> INYECTAR_EVENTO'}</Text>
            <TextInput style={styles.input} placeholder="Nombre del evento..." placeholderTextColor={COLORS.muted} value={inputTitle} onChangeText={setInputTitle} />
            <TextInput style={styles.input} placeholder="Tipo de evento..." placeholderTextColor={COLORS.muted} value={inputType} onChangeText={setInputType} />
            <TouchableOpacity style={[styles.submitButton, editingId && { borderColor: COLORS.primaryNeon }]} onPress={handleSaveEvent}>
              <Text style={[styles.submitButtonText, editingId && { color: COLORS.primaryNeon }]}>
                {editingId ? '[ ACTUALIZAR_NODO ]' : '[ EJECUTAR_CREACION ]'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>{`> NOMBRES_REGISTRADOS [${events.length}]`}</Text>
          {events.map((event) => (
            <View key={event.id} style={styles.eventCard}>
              <TouchableOpacity style={styles.eventInfo} onPress={() => { setInputTitle(event.title); setInputType(event.type); setEditingId(event.id); }}>
                <Text style={styles.eventTitle}>{event.title}</Text>
                <Text style={styles.eventType}>TYPE // {event.type}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeleteEvent(event.id)}>
                <Text style={styles.deleteButtonText}>DEL</Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
        <View style={styles.footer}><Text style={styles.footerText}>CYBERNETIC INTERFACE V3.1</Text></View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// --- ESTILOS Y COLORES ---
const COLORS = {
  background: '#090A10',
  surface: '#161825',
  primaryNeon: '#00E5FF',
  secondaryNeon: '#B700FF',
  alertNeon: '#FF2A55',
  textMain: '#FFFFFF',
  muted: '#6B7280',
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  container: { flex: 1 },
  
  // NAVEGACIÓN Y AUTENTICACIÓN
  authContainer: { flex: 1, justifyContent: 'center', padding: 20 },
  authTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.primaryNeon,
    textAlign: 'center',
    marginBottom: 30,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    letterSpacing: 2,
  },
  linkText: {
    color: COLORS.muted,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 12,
    textDecorationLine: 'underline',
  },

  // SPLASH
  splashContainer: { flex: 1, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center' },
  logoCircle: { width: 140, height: 140, borderRadius: 70, borderWidth: 2, borderColor: COLORS.primaryNeon, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.surface },
  logoInner: { flexDirection: 'row', alignItems: 'center' },
  logoText: { fontSize: 50, fontWeight: 'bold', color: COLORS.textMain, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  logoDivider: { width: 3, height: 40, backgroundColor: COLORS.secondaryNeon, marginHorizontal: 8 },
  splashBrand: { marginTop: 35, fontSize: 20, fontWeight: 'bold', color: COLORS.primaryNeon, letterSpacing: 4, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  splashLoading: { marginTop: 12, fontSize: 12, color: COLORS.secondaryNeon, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', letterSpacing: 2 },
  tronLine: { position: 'absolute', bottom: 0, width: '100%', height: 3, backgroundColor: COLORS.primaryNeon },

  // HEADER PRINCIPAL
  header: { backgroundColor: COLORS.surface, paddingVertical: 18, paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#2A2D43' },
  headerTitleContainer: { flexDirection: 'row', alignItems: 'center' },
  headerTextPrefix: { fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', color: COLORS.secondaryNeon, fontSize: 14, marginRight: 8, fontWeight: '600' },
  headerTextMain: { fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontWeight: 'bold', fontSize: 18, color: COLORS.textMain, letterSpacing: 1 },
  
  // FORMS COMUNES (AUTH Y CRUD)
  scrollContent: { padding: 20, paddingBottom: 40 },
  inputSection: { backgroundColor: COLORS.surface, padding: 20, borderRadius: 8, borderWidth: 1, borderColor: '#2A2D43' },
  sectionTitle: { fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontSize: 14, color: COLORS.primaryNeon, marginBottom: 15, letterSpacing: 1 },
  input: { backgroundColor: COLORS.background, borderWidth: 1, borderColor: '#2A2D43', borderRadius: 6, padding: 15, marginBottom: 15, color: COLORS.textMain, fontSize: 15 },
  submitButton: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: COLORS.secondaryNeon, paddingVertical: 15, borderRadius: 6, alignItems: 'center', marginTop: 5 },
  submitButtonText: { fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontSize: 14, fontWeight: 'bold', color: COLORS.secondaryNeon, letterSpacing: 1 },
  divider: { height: 1, backgroundColor: '#2A2D43', marginVertical: 25 },

  // CARDS CRUD
  eventCard: { backgroundColor: COLORS.surface, borderLeftWidth: 4, borderLeftColor: COLORS.primaryNeon, borderRadius: 6, padding: 16, marginBottom: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  eventInfo: { flex: 1, paddingRight: 10 },
  eventTitle: { fontSize: 17, fontWeight: '600', color: COLORS.textMain, marginBottom: 6 },
  eventType: { fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontSize: 12, color: COLORS.secondaryNeon, letterSpacing: 0.5 },
  deleteButton: { borderWidth: 1, borderColor: COLORS.alertNeon, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 4, backgroundColor: 'rgba(255, 42, 85, 0.1)' },
  deleteButtonText: { color: COLORS.alertNeon, fontWeight: 'bold', fontSize: 12, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },

  // FOOTER
  footer: { paddingVertical: 15, alignItems: 'center', borderTopWidth: 1, borderTopColor: '#2A2D43' },
  footerText: { fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontSize: 10, color: COLORS.muted, letterSpacing: 2 },
});