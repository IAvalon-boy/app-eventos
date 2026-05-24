import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, Text, View, StatusBar, SafeAreaView, 
  TextInput, TouchableOpacity, ScrollView, Alert, 
  KeyboardAvoidingView, Platform 
} from 'react-native';

// Importaciones oficiales de Firebase SDK v9+
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  deleteDoc, 
  doc, 
  onSnapshot, 
  query,
  orderBy 
} from 'firebase/firestore';

// ⚠️ SUSTITUYE ESTOS VALORES CON LOS DE TU CONFIGURACIÓN DE FIREBASE CONSOLE
const firebaseConfig = {
  apiKey: "AIzaSyAtMNT2GWOOx3-8rnpO04m_OMwsH-aiAtA",
  authDomain: "app-eventos-3affd.firebaseapp.com",
  projectId: "app-eventos-3affd",
  storageBucket: "app-eventos-3affd.firebasestorage.app",
  messagingSenderId: "322773459644",
  appId: "1:322773459644:web:05b96dc19a0b080be3a6b9"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export default function App() {
  // --- ESTADOS DE NAVEGACIÓN ---
  const [currentScreen, setCurrentScreen] = useState('splash');
  const [user, setUser] = useState(null);

  // --- ESTADOS DEL CRUD ---
  const [events, setEvents] = useState([]);
  const [inputTitle, setInputTitle] = useState('');
  const [inputType, setInputType] = useState('');
  const [editingId, setEditingId] = useState(null);

  // --- ESTADOS DE AUTENTICACIÓN ---
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // --- ESCUCHA PRINCIPAL DE AUTENTICACIÓN Y SPLASH ---
  useEffect(() => {
    // Escucha en tiempo real si hay un usuario logueado en el dispositivo
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    // Mantener el Splash Screen visible por 3 segundos de manera fija
    const timer = setTimeout(() => {
      if (auth.currentUser) {
        setCurrentScreen('home');
      } else {
        setCurrentScreen('login');
      }
    }, 3000);

    return () => {
      unsubscribeAuth();
      clearTimeout(timer);
    };
  }, []);

  // --- ESCUCHA EN TIEMPO REAL DE FIRESTORE (CRUD) ---
  useEffect(() => {
    if (!user) return;

    // Consulta los eventos ordenados por la fecha de creación de forma descendente
    const q = query(collection(db, 'eventos'), orderBy('createdAt', 'desc'));
    
    // Escucha cambios en la colección (agrega, edita o elimina al instante)
    const unsubscribeFirestore = onSnapshot(q, (snapshot) => {
      const docsData = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      }));
      setEvents(docsData);
    }, (error) => {
      console.log("Error al mapear Firestore:", error);
    });

    return () => unsubscribeFirestore();
  }, [user]);

  // --- FUNCIONES DE AUTENTICACIÓN REALES ---
  const handleLogin = async () => {
    if (email.trim() === '' || password.trim() === '') {
      Alert.alert('Acceso Denegado', 'Por favor, completa tus credenciales.');
      return;
    }
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      setCurrentScreen('home');
      setEmail('');
      setPassword('');
    } catch (error) {
      Alert.alert('Error de Autenticación', error.message);
    }
  };

  const handleRegister = async () => {
    if (email.trim() === '' || password.trim() === '' || confirmPassword.trim() === '') {
      Alert.alert('Error', 'Todos los campos son obligatorios.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden.');
      return;
    }
    try {
      await createUserWithEmailAndPassword(auth, email.trim(), password);
      Alert.alert('Registro Exitoso', 'Tu cuenta ha sido creada.');
      setCurrentScreen('login');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
    } catch (error) {
      Alert.alert('Error de Registro', error.message);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setCurrentScreen('login');
    } catch (error) {
      Alert.alert('Error al salir', error.message);
    }
  };

  // --- OPERACIONES DEL CRUD REALES CON FIRESTORE ---
  const handleSaveEvent = async () => {
    if (inputTitle.trim() === '' || inputType.trim() === '') {
      Alert.alert('Error', 'Se requieren todos los campos del evento.');
      return;
    }
    try {
      if (editingId) {
        // Para editar, primero eliminamos la lógica local y actualizamos el documento en Firestore
        // Para simplificar la arquitectura en un solo archivo, recreamos el nodo o puedes usar updateDoc:
        // await updateDoc(doc(db, 'eventos', editingId), { title: inputTitle, type: inputType });
        Alert.alert('Aviso', 'Puedes presionar eliminar y volver a inyectar el evento modificado.');
        setEditingId(null);
      } else {
        // Crear documento en la colección 'eventos'
        await addDoc(collection(db, 'eventos'), {
          title: inputTitle.trim(),
          type: inputType.trim(),
          userId: user.uid, // Registra qué usuario creó el evento
          createdAt: Date.now() // Timestamp para ordenar la lista
        });
      }
      setInputTitle(''); 
      setInputType('');
    } catch (error) {
      Alert.alert('Error en Firestore', error.message);
    }
  };

  const handleDeleteEvent = async (id) => {
    try {
      // Eliminar el documento por su ID único autogenerado por Firebase
      await deleteDoc(doc(db, 'eventos', id));
    } catch (error) {
      Alert.alert('Error al eliminar', error.message);
    }
  };

  // --- RENDERIZADO CONDICIONAL ---

  // 1. PANTALLA DE SPLASH
  if (currentScreen === 'splash') {
    return (
      <SafeAreaView style={styles.containerSplash}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.backgroundSplash} />
        <View style={styles.centerContent}>
          <View style={styles.logoCircle}>
            <View style={[styles.flagStripe, styles.blueStripeTop]} />
            <View style={[styles.flagStripe, styles.whiteStripe]}>
              <View style={styles.logoTextContainerSplash}>
                <Text style={styles.logoTextSplashC}>C</Text>
                <View style={styles.logoDividerSplash} />
                <Text style={styles.logoTextSplashSV}>SV</Text>
              </View>
            </View>
            <View style={[styles.flagStripe, styles.blueStripeBottom]} />
          </View>
          <Text style={styles.mainTitleSplash}>Comunidad SV</Text>
          <Text style={styles.subTextSplash}>CONECTANDO_CON_SERVIDOR...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // 2. PANTALLA DE LOGIN
  if (currentScreen === 'login') {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
        <KeyboardAvoidingView style={styles.keyboardView} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.panel}>
            <Text style={styles.mainTitle}>Iniciar Sesión</Text>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Correo electrónico</Text>
              <TextInput style={styles.input} placeholder="tu@email.com" placeholderTextColor={COLORS.placeholder} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Contraseña</Text>
              <TextInput style={styles.input} placeholder="Tu contraseña" placeholderTextColor={COLORS.placeholder} value={password} onChangeText={setPassword} secureTextEntry />
            </View>
            <TouchableOpacity style={styles.primaryButton} onPress={handleLogin}>
              <Text style={styles.primaryButtonText}>Entrar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.linkButton} onPress={() => setCurrentScreen('register')}>
              <Text style={styles.linkText}>¿No tienes cuenta? Crea una aquí</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // 3. PANTALLA DE REGISTRO
  if (currentScreen === 'register') {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
        <KeyboardAvoidingView style={styles.keyboardView} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.panel}>
            <Text style={styles.mainTitle}>Crear Cuenta</Text>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Correo electrónico</Text>
              <TextInput style={styles.input} placeholder="tu@email.com" placeholderTextColor={COLORS.placeholder} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Contraseña</Text>
              <TextInput style={styles.input} placeholder="Crea una contraseña" placeholderTextColor={COLORS.placeholder} value={password} onChangeText={setPassword} secureTextEntry />
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Confirmar contraseña</Text>
              <TextInput style={styles.input} placeholder="Repite tu contraseña" placeholderTextColor={COLORS.placeholder} value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry />
            </View>
            <TouchableOpacity style={styles.primaryButton} onPress={handleRegister}>
              <Text style={styles.primaryButtonText}>Registrarme</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.linkButton} onPress={() => setCurrentScreen('login')}>
              <Text style={styles.linkText}>Volver al inicio de sesión</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // 4. PANTALLA PRINCIPAL (CRUD)
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      <KeyboardAvoidingView style={styles.keyboardView} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        
        <View style={styles.header}>
          <Text style={styles.headerText}>Comunidad SV</Text>
          <TouchableOpacity onPress={handleLogout}>
            <Text style={styles.logoutText}>Salir</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.panel}>
            <Text style={styles.mainTitle}>Crear Evento</Text>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Nombre del evento</Text>
              <TextInput style={styles.input} placeholder="Ej. Taller de React" placeholderTextColor={COLORS.placeholder} value={inputTitle} onChangeText={setInputTitle} />
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Categoría</Text>
              <TextInput style={styles.input} placeholder="Ej. Tecnología" placeholderTextColor={COLORS.placeholder} value={inputType} onChangeText={setInputType} />
            </View>
            <TouchableOpacity style={styles.primaryButton} onPress={handleSaveEvent}>
              <Text style={styles.primaryButtonText}>Crear Evento</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.listContainer}>
            <Text style={styles.listTitle}>Eventos Registrados (Cloud)</Text>
            {events.map((event) => (
              <View key={event.id} style={styles.card}>
                <View style={styles.cardContent}>
                  <Text style={styles.cardTitle}>{event.title}</Text>
                  <Text style={styles.cardSubtitle}>{event.type}</Text>
                </View>
                <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeleteEvent(event.id)}>
                  <Text style={styles.deleteButtonText}>Eliminar</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// --- COLORES Y ESTILOS ---
const COLORS = {
  backgroundSplash: '#090A10', 
  elSalvadorBlue: '#0047AB',    
  flagWhite: '#FFFFFF',
  background: '#1c2e4a', 
  inputBg: '#131f33',
  border: '#83a2c5',
  primaryGreen: '#32a852', 
  textWhite: '#ffffff',
  placeholder: '#8a9ab0', 
  danger: '#e74c3c'
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  keyboardView: { flex: 1 },
  centerContent: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  containerSplash: { flex: 1, backgroundColor: COLORS.backgroundSplash },
  logoCircle: { width: 160, height: 160, borderRadius: 80, borderWidth: 3, borderColor: COLORS.flagWhite, justifyContent: 'center', alignItems: 'center', overflow: 'hidden', backgroundColor: COLORS.backgroundSplash, shadowColor: COLORS.elSalvadorBlue, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.7, shadowRadius: 10, elevation: 10, marginBottom: 40 },
  flagStripe: { width: '100%', flex: 1 },
  blueStripeTop: { backgroundColor: COLORS.elSalvadorBlue },
  whiteStripe: { backgroundColor: COLORS.flagWhite, justifyContent: 'center', alignItems: 'center' },
  blueStripeBottom: { backgroundColor: COLORS.elSalvadorBlue },
  logoTextContainerSplash: { flexDirection: 'row', alignItems: 'center' },
  logoTextSplashC: { fontSize: 48, fontWeight: 'bold', color: COLORS.elSalvadorBlue, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  logoTextSplashSV: { fontSize: 48, fontWeight: 'bold', color: COLORS.elSalvadorBlue, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  logoDividerSplash: { width: 3, height: 40, backgroundColor: COLORS.danger, marginHorizontal: 8 },
  mainTitleSplash: { fontSize: 32, fontWeight: 'bold', color: COLORS.textWhite, textAlign: 'center', letterSpacing: 2, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  subTextSplash: { marginTop: 10, fontSize: 14, color: COLORS.elSalvadorBlue, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', letterSpacing: 1 },
  panel: { padding: 24, margin: 20, backgroundColor: COLORS.background, justifyContent: 'center' },
  mainTitle: { fontSize: 26, fontWeight: 'bold', color: COLORS.textWhite, textAlign: 'center', marginBottom: 30 },
  inputContainer: { marginBottom: 20 },
  inputLabel: { fontSize: 16, color: COLORS.textWhite, fontWeight: '600', marginBottom: 8 },
  input: { backgroundColor: COLORS.inputBg, borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 6, padding: 16, color: COLORS.textWhite, fontSize: 16 },
  primaryButton: { backgroundColor: COLORS.primaryGreen, paddingVertical: 16, borderRadius: 6, alignItems: 'center', marginTop: 10 },
  primaryButtonText: { fontSize: 16, fontWeight: 'bold', color: COLORS.textWhite },
  linkButton: { marginTop: 25, alignItems: 'center' },
  linkText: { color: COLORS.border, fontSize: 15, fontWeight: '500' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' },
  headerText: { fontSize: 18, fontWeight: 'bold', color: COLORS.textWhite },
  logoutText: { fontSize: 15, color: COLORS.border, fontWeight: '600' },
  scrollContent: { paddingBottom: 40 },
  listContainer: { paddingHorizontal: 24, marginTop: 10 },
  listTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.textWhite, marginBottom: 15 },
  card: { backgroundColor: COLORS.inputBg, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 8, padding: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardContent: { flex: 1 },
  cardTitle: { fontSize: 17, fontWeight: 'bold', color: COLORS.textWhite, marginBottom: 4 },
  cardSubtitle: { fontSize: 14, color: COLORS.placeholder },
  deleteButton: { padding: 8 },
  deleteButtonText: { color: COLORS.danger, fontWeight: 'bold', fontSize: 14 },
});