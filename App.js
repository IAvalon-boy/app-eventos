import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, Text, View, StatusBar, SafeAreaView, 
  TextInput, TouchableOpacity, ScrollView, Alert, 
  KeyboardAvoidingView, Platform 
} from 'react-native';
import * as Notifications from 'expo-notifications';

// --- IMPORTACIONES DE FIREBASE ---
import { initializeApp } from 'firebase/app';
import { 
  getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged 
} from 'firebase/auth';
import { 
  getFirestore, collection, addDoc, deleteDoc, updateDoc, doc, onSnapshot, query, orderBy 
} from 'firebase/firestore';



Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const FILTERS = {
  all: 'all',
  upcoming: 'upcoming',
  past: 'past',
};

const isUpcomingEvent = (eventDate) => {
  const date = new Date(eventDate);
  return !Number.isNaN(date.getTime()) && date.getTime() >= Date.now();
};

const formatEventDate = (eventDate) => {
  const date = new Date(eventDate);
  if (Number.isNaN(date.getTime())) return 'Fecha inválida';
  return date.toLocaleString();
};

//  VALORES DE FIREBASE CONSOLA
const firebaseConfig = {
  apiKey: "AIzaSyAtMNT2GWOOx3-8rnpO04m_OMwsH-aiAtA",
  authDomain: "app-eventos-3affd.firebaseapp.com",
  projectId: "app-eventos-3affd",
  storageBucket: "app-eventos-3affd.firebasestorage.app",
  messagingSenderId: "322773459644",
  appId: "1:322773459644:web:05b96dc19a0b080be3a6b9"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export default function App() {
  // --- ESTADOS DE NAVEGACIÓN Y USUARIO ---
  const [currentScreen, setCurrentScreen] = useState('splash');
  const [user, setUser] = useState(null);

  // --- ESTADOS DEL CRUD Y NUEVAS FUNCIONES ---
  const [events, setEvents] = useState([]);
  const [inputTitle, setInputTitle] = useState('');
  const [inputType, setInputType] = useState('');
  const [inputDate, setInputDate] = useState('');
  const [editingId, setEditingId] = useState(null);
  
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [activeFilter, setActiveFilter] = useState(FILTERS.all);

  // --- ESTADOS DE AUTENTICACIÓN ---
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // --- CONFIGURACIÓN INICIAL (Auth y Notificaciones) ---
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    const timer = setTimeout(() => {
      if (auth.currentUser) setCurrentScreen('home');
      else setCurrentScreen('login');
    }, 3000);

    const setupNotifications = async () => {
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('event-reminders', {
          name: 'Event reminders',
          importance: Notifications.AndroidImportance.HIGH,
          lightColor: COLORS.elSalvadorBlue,
        });
      }
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== 'granted') await Notifications.requestPermissionsAsync();
    };
    setupNotifications();

    return () => {
      unsubscribeAuth();
      clearTimeout(timer);
    };
  }, []);

  // --- ESTADO DE FIRESTORE ---
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'eventos'), orderBy('createdAt', 'desc'));
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

  // --- LÓGICA DE FILTRADO ---
  const selectedEvent = events.find((event) => event.id === selectedEventId) || null;
  const filteredEvents = events.filter((event) => {
    if (activeFilter === FILTERS.upcoming) return isUpcomingEvent(event.date);
    if (activeFilter === FILTERS.past) return !isUpcomingEvent(event.date);
    return true;
  });

  // --- FUNCIONES DE AUTENTICACIÓN ---
  const handleLogin = async () => {
    if (email.trim() === '' || password.trim() === '') {
      Alert.alert('Acceso Denegado', 'Por favor, completa tus credenciales.');
      return;
    }
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      setCurrentScreen('home');
      setEmail(''); setPassword('');
    } catch (error) {
      Alert.alert('Error de Autenticación', error.message);
    }
  };

  const handleRegister = async () => {
    if (email.trim() === '' || password.trim() === '' || confirmPassword.trim() === '') {
      Alert.alert('Error', 'Todos los campos son obligatorios.'); return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden.'); return;
    }
    try {
      await createUserWithEmailAndPassword(auth, email.trim(), password);
      Alert.alert('Registro Exitoso', 'Tu cuenta ha sido creada.');
      setCurrentScreen('login');
      setEmail(''); setPassword(''); setConfirmPassword('');
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

  // --- OPERACIONES CRUD EN FIRESTORE ---
  const handleSaveEvent = async () => {
    if (inputTitle.trim() === '' || inputType.trim() === '' || inputDate.trim() === '') {
      Alert.alert('Error', 'Completa título, categoría y fecha (YYYY-MM-DDTHH:mm).');
      return;
    }
    const parsedDate = new Date(inputDate);
    if (Number.isNaN(parsedDate.getTime())) {
      Alert.alert('Error', 'Fecha inválida. Usa formato YYYY-MM-DDTHH:mm');
      return;
    }
    const normalizedDate = parsedDate.toISOString();

    try {
      if (editingId) {
        // Actualiza documento existente en Firebase
        await updateDoc(doc(db, 'eventos', editingId), {
          title: inputTitle.trim(),
          type: inputType.trim(),
          date: normalizedDate
        });
        setEditingId(null);
      } else {
        // Crea nuevo documento en Firebase con los campos nuevos
        await addDoc(collection(db, 'eventos'), {
          title: inputTitle.trim(),
          type: inputType.trim(),
          date: normalizedDate,
          attending: false,
          userId: user.uid,
          createdAt: Date.now()
        });
      }
      setInputTitle(''); setInputType(''); setInputDate('');
    } catch (error) {
      Alert.alert('Error en Firestore', error.message);
    }
  };

  const handleDeleteEvent = async (id) => {
    try {
      await deleteDoc(doc(db, 'eventos', id));
      if (selectedEventId === id) setSelectedEventId(null);
      if (editingId === id) {
        setEditingId(null); setInputTitle(''); setInputType(''); setInputDate('');
      }
    } catch (error) {
      Alert.alert('Error al eliminar', error.message);
    }
  };

  const handleEditEvent = (event) => {
    setInputTitle(event.title);
    setInputType(event.type);
    const localDate = new Date(event.date);
    const normalized = Number.isNaN(localDate.getTime()) ? '' : localDate.toISOString().slice(0, 16);
    setInputDate(normalized);
    setEditingId(event.id);
  };

  const toggleAttendance = async (event) => {
    try {
      // Actualiza el estado de asistencia directamente en la nube
      await updateDoc(doc(db, 'eventos', event.id), {
        attending: !event.attending
      });
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const scheduleReminder = async (event) => {
    const eventTime = new Date(event.date).getTime();
    const triggerDate = new Date(eventTime - 60 * 60 * 1000); // 1 hora antes

    if (triggerDate.getTime() <= Date.now()) {
      Alert.alert('Aviso', 'El evento es muy pronto o ya pasó.'); return;
    }

    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      const permission = await Notifications.requestPermissionsAsync();
      if (permission.status !== 'granted') return;
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: `Recordatorio: ${event.title}`,
        body: `Tu evento inicia a las ${formatEventDate(event.date)}`,
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: triggerDate },
    });
    Alert.alert('Éxito', 'Recordatorio programado 1 hora antes del evento.');
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

  // 4. PANTALLA DE DETALLE DEL EVENTO
  if (selectedEvent) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setSelectedEventId(null)}>
            <Text style={styles.logoutText}>{'< Volver'}</Text>
          </TouchableOpacity>
          <Text style={styles.headerText}>Detalles</Text>
        </View>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.panel}>
            <Text style={styles.inputLabel}>Título</Text>
            <Text style={styles.detailTitle}>{selectedEvent.title}</Text>

            <Text style={styles.inputLabel}>Categoría</Text>
            <Text style={styles.detailText}>{selectedEvent.type}</Text>

            <Text style={styles.inputLabel}>Fecha</Text>
            <Text style={styles.detailText}>{formatEventDate(selectedEvent.date)}</Text>

            <Text style={styles.inputLabel}>Estado</Text>
            <Text style={[styles.detailText, { color: isUpcomingEvent(selectedEvent.date) ? COLORS.primaryGreen : COLORS.danger }]}>
              {isUpcomingEvent(selectedEvent.date) ? 'Próximo' : 'Pasado'}
            </Text>

            <Text style={styles.inputLabel}>Mi Asistencia</Text>
            <Text style={[styles.detailText, { color: selectedEvent.attending ? COLORS.primaryGreen : COLORS.placeholder }]}>
              {selectedEvent.attending ? 'Confirmada' : 'Pendiente'}
            </Text>

            <View style={{ marginTop: 20 }}>
              <TouchableOpacity style={[styles.primaryButton, { backgroundColor: selectedEvent.attending ? COLORS.inputBg : COLORS.primaryGreen }]} onPress={() => toggleAttendance(selectedEvent)}>
                <Text style={styles.primaryButtonText}>{selectedEvent.attending ? 'Cancelar Asistencia' : 'Confirmar Asistencia'}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.secondaryButton} onPress={() => scheduleReminder(selectedEvent)}>
                <Text style={styles.secondaryButtonText}>Programar Recordatorio</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.secondaryButton} onPress={() => { handleEditEvent(selectedEvent); setSelectedEventId(null); }}>
                <Text style={styles.secondaryButtonText}>Editar Evento</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // 5. PANTALLA PRINCIPAL (CRUD)
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      <KeyboardAvoidingView style={styles.keyboardView} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        
        <View style={styles.header}>
          <View>
            <Text style={styles.headerText}>Comunidad SV</Text>
            {user && <Text style={{ color: COLORS.placeholder, fontSize: 12, marginTop: 2 }}>{user.email}</Text>}
          </View>
          <TouchableOpacity onPress={handleLogout}>
            <Text style={styles.logoutText}>Salir</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Formulario */}
          <View style={styles.panel}>
            <Text style={styles.mainTitle}>{editingId ? 'Editar Evento' : 'Crear Evento'}</Text>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Nombre del evento</Text>
              <TextInput style={styles.input} placeholder="Ej. Taller de React" placeholderTextColor={COLORS.placeholder} value={inputTitle} onChangeText={setInputTitle} />
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Categoría</Text>
              <TextInput style={styles.input} placeholder="Ej. Tecnología" placeholderTextColor={COLORS.placeholder} value={inputType} onChangeText={setInputType} />
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Fecha (Año-Mes-Dia-Hora:)</Text>
              <TextInput style={styles.input} placeholder="Ej. 2026-10-15" placeholderTextColor={COLORS.placeholder} value={inputDate} onChangeText={setInputDate} />
            </View>
            <TouchableOpacity style={styles.primaryButton} onPress={handleSaveEvent}>
              <Text style={styles.primaryButtonText}>{editingId ? 'Actualizar Evento' : 'Guardar Evento'}</Text>
            </TouchableOpacity>
          </View>

          {/* Lista y Filtros */}
          <View style={styles.listContainer}>
            <Text style={styles.listTitle}>Eventos Registrados</Text>
            
            <View style={styles.filtersRow}>
              <TouchableOpacity style={[styles.filterButton, activeFilter === FILTERS.all && styles.filterButtonActive]} onPress={() => setActiveFilter(FILTERS.all)}>
                <Text style={styles.filterText}>Todos</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.filterButton, activeFilter === FILTERS.upcoming && styles.filterButtonActive]} onPress={() => setActiveFilter(FILTERS.upcoming)}>
                <Text style={styles.filterText}>Próximos</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.filterButton, activeFilter === FILTERS.past && styles.filterButtonActive]} onPress={() => setActiveFilter(FILTERS.past)}>
                <Text style={styles.filterText}>Pasados</Text>
              </TouchableOpacity>
            </View>

            {filteredEvents.map((event) => (
              <View key={event.id} style={styles.card}>
                <TouchableOpacity style={styles.cardContent} onPress={() => setSelectedEventId(event.id)}>
                  <Text style={styles.cardTitle}>{event.title}</Text>
                  <Text style={styles.cardSubtitle}>{event.type} • {formatEventDate(event.date)}</Text>
                  <Text style={[styles.eventStatus, { color: event.attending ? COLORS.primaryGreen : COLORS.placeholder }]}>
                    {event.attending ? '✓ Asistencia Confirmada' : 'Pendiente'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeleteEvent(event.id)}>
                  <Text style={styles.deleteButtonText}>Eliminar</Text>
                </TouchableOpacity>
              </View>
            ))}

            {filteredEvents.length === 0 && (
              <Text style={styles.emptyText}>No hay eventos para este filtro.</Text>
            )}
          </View>
           <View style={styles.footer}>
            <Text style={styles.footerText}>© 2026 Comunidad SV</Text>
            <Text style={[styles.footerText, {fontSize: 10, marginTop: 4}]}>
              Licencia CC BY-NC-SA 4.0 (Uso No Comercial)
            </Text>
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
  
  // LOGO SPLASH
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
  
  // UI GENERAL
  panel: { padding: 24, margin: 20, backgroundColor: COLORS.background, justifyContent: 'center' },
  mainTitle: { fontSize: 26, fontWeight: 'bold', color: COLORS.textWhite, textAlign: 'center', marginBottom: 30 },
  inputContainer: { marginBottom: 20 },
  inputLabel: { fontSize: 16, color: COLORS.textWhite, fontWeight: '600', marginBottom: 8 },
  input: { backgroundColor: COLORS.inputBg, borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 6, padding: 16, color: COLORS.textWhite, fontSize: 16 },
  
  // BOTONES
  primaryButton: { backgroundColor: COLORS.primaryGreen, paddingVertical: 16, borderRadius: 6, alignItems: 'center', marginTop: 10 },
  primaryButtonText: { fontSize: 16, fontWeight: 'bold', color: COLORS.textWhite },
  secondaryButton: { backgroundColor: 'transparent', borderWidth: 1, borderColor: COLORS.border, paddingVertical: 16, borderRadius: 6, alignItems: 'center', marginTop: 10 },
  secondaryButtonText: { fontSize: 14, fontWeight: 'bold', color: COLORS.textWhite },
  linkButton: { marginTop: 25, alignItems: 'center' },
  linkText: { color: COLORS.border, fontSize: 15, fontWeight: '500' },
  
  // HEADER Y LISTAS
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' },
  headerText: { fontSize: 18, fontWeight: 'bold', color: COLORS.textWhite },
  logoutText: { fontSize: 15, color: COLORS.border, fontWeight: '600' },
  scrollContent: { paddingBottom: 40 },
  listContainer: { paddingHorizontal: 24, marginTop: 10 },
  listTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.textWhite, marginBottom: 15 },
  
  // FILTROS
  filtersRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15, gap: 10 },
  filterButton: { flex: 1, borderWidth: 1, borderColor: COLORS.border, borderRadius: 6, paddingVertical: 10, alignItems: 'center' },
  filterButtonActive: { backgroundColor: COLORS.primaryGreen, borderColor: COLORS.primaryGreen },
  filterText: { color: COLORS.textWhite, fontSize: 13, fontWeight: '600' },
  
  // TARJETAS (CARDS)
  card: { backgroundColor: COLORS.inputBg, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 8, padding: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardContent: { flex: 1 },
  cardTitle: { fontSize: 17, fontWeight: 'bold', color: COLORS.textWhite, marginBottom: 4 },
  cardSubtitle: { fontSize: 13, color: COLORS.placeholder, marginBottom: 4 },
  eventStatus: { fontSize: 12, fontWeight: 'bold' },
  deleteButton: { padding: 8 },
  deleteButtonText: { color: COLORS.danger, fontWeight: 'bold', fontSize: 14 },
  emptyText: { color: COLORS.placeholder, textAlign: 'center', marginTop: 20 },

  // DETALLES
  detailTitle: { fontSize: 24, fontWeight: 'bold', color: COLORS.textWhite, marginBottom: 20 },
  detailText: { fontSize: 16, color: COLORS.placeholder, marginBottom: 20 },
  footer: { paddingVertical: 25, alignItems: 'center', marginTop: 10 },
  footerText: { fontSize: 15, color: COLORS.placeholder, textAlign: 'center' },
});