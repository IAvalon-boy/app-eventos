import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, StatusBar, SafeAreaView, TextInput, TouchableOpacity, ScrollView, Alert, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

const FILTERS = {
  all: 'all',
  upcoming: 'upcoming',
  past: 'past',
};

const createEvent = (id, title, type, isoDate, attending = false) => ({
  id,
  title,
  type,
  date: isoDate,
  attending,
});

const isUpcomingEvent = (eventDate) => {
  const date = new Date(eventDate);
  return !Number.isNaN(date.getTime()) && date.getTime() >= Date.now();
};

const formatEventDate = (eventDate) => {
  const date = new Date(eventDate);
  if (Number.isNaN(date.getTime())) {
    return 'Fecha invalida';
  }
  return date.toLocaleString();
};

export default function App() {
  // --- ESTADOS ---
  const [mostrarSplash, setMostrarSplash] = useState(true); // Controla la pantalla de entrada
  const [events, setEvents] = useState([
    createEvent('1', 'Cyberhack Colectivo', 'Seguridad', '2026-06-10T19:00:00', false),
    createEvent('2', 'Synth-Wave Night', 'Musica', '2026-04-05T21:00:00', true),
  ]);
  const [inputTitle, setInputTitle] = useState('');
  const [inputType, setInputType] = useState('');
  const [inputDate, setInputDate] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [activeFilter, setActiveFilter] = useState(FILTERS.all);

  // --- LÓGICA DEL LOGO DE ENTRADA ---
  useEffect(() => {
    // Esperar 3 segundos y luego ocultar el Splash
    const timer = setTimeout(() => {
      setMostrarSplash(false);
    }, 3500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const setupNotifications = async () => {
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('event-reminders', {
          name: 'Event reminders',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: COLORS.primaryNeon,
        });
      }

      const { status } = await Notifications.getPermissionsAsync();
      if (status !== 'granted') {
        await Notifications.requestPermissionsAsync();
      }
    };

    setupNotifications();
  }, []);

  const selectedEvent = events.find((event) => event.id === selectedEventId) || null;

  const filteredEvents = events.filter((event) => {
    if (activeFilter === FILTERS.upcoming) return isUpcomingEvent(event.date);
    if (activeFilter === FILTERS.past) return !isUpcomingEvent(event.date);
    return true;
  });

  // --- OPERACIONES DEL CRUD ---
  const handleSaveEvent = () => {
    if (inputTitle.trim() === '' || inputType.trim() === '' || inputDate.trim() === '') {
      Alert.alert('SISTEMA_ERROR', 'Completa titulo, tipo y fecha (YYYY-MM-DDTHH:mm).');
      return;
    }

    const parsedDate = new Date(inputDate);
    if (Number.isNaN(parsedDate.getTime())) {
      Alert.alert('SISTEMA_ERROR', 'Fecha invalida. Usa formato YYYY-MM-DDTHH:mm.');
      return;
    }

    const normalizedDate = parsedDate.toISOString();

    if (editingId) {
      const updated = events.map((event) =>
        event.id === editingId
          ? { ...event, title: inputTitle.trim(), type: inputType.trim(), date: normalizedDate }
          : event
      );
      setEvents(updated);
      setEditingId(null);
    } else {
      setEvents([
        ...events,
        createEvent(Date.now().toString(), inputTitle.trim(), inputType.trim(), normalizedDate, false),
      ]);
    }

    setInputTitle('');
    setInputType('');
    setInputDate('');
  };

  const handleDeleteEvent = (id) => {
    const filtered = events.filter((event) => event.id !== id);
    setEvents(filtered);
    if (selectedEventId === id) {
      setSelectedEventId(null);
    }
    if (editingId === id) {
      setEditingId(null);
      setInputTitle('');
      setInputType('');
      setInputDate('');
    }
  };

  const handleEditEvent = (event) => {
    setInputTitle(event.title);
    setInputType(event.type);
    const localDate = new Date(event.date);
    const normalized = Number.isNaN(localDate.getTime())
      ? ''
      : localDate.toISOString().slice(0, 16);
    setInputDate(normalized);
    setEditingId(event.id);
  };

  const toggleAttendance = (eventId) => {
    setEvents((prevEvents) =>
      prevEvents.map((event) =>
        event.id === eventId ? { ...event, attending: !event.attending } : event
      )
    );
  };

  const scheduleReminder = async (event) => {
    const eventTime = new Date(event.date).getTime();
    const triggerDate = new Date(eventTime - 60 * 60 * 1000);

    if (triggerDate.getTime() <= Date.now()) {
      Alert.alert('NOTIFICACION', 'No se puede programar: el evento es muy pronto o ya paso.');
      return;
    }

    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      const permission = await Notifications.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert('NOTIFICACION', 'Permiso de notificaciones denegado.');
        return;
      }
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: `Recordatorio: ${event.title}`,
        body: `Tu evento inicia a las ${formatEventDate(event.date)}`,
      },
      trigger: {
        channelId: 'event-reminders',
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: triggerDate,
      },
    });

    Alert.alert('NOTIFICACION', 'Recordatorio programado 1 hora antes del evento.');
  };

  // --- RENDERIZADO CONDICIONAL ---

  // 1. PANTALLA DE LOGO (SPLASH)
  if (mostrarSplash) {
    return (
      <View style={styles.splashContainer}>
        <StatusBar barStyle="light-content" />
        
        {/* LOGO DISEÑADO CON CÓDIGO */}
        <View style={styles.logoCircle}>
          <View style={styles.logoInner}>
            <Text style={styles.logoText}>C</Text>
            <View style={styles.logoDivider} />
            <Text style={styles.logoText}>A</Text>
          </View>
        </View>

        <Text style={styles.splashBrand}>COMUNIDAD_ACTIVA</Text>
        <Text style={styles.splashLoading}>CARGANDO_SISTEMA...</Text>
        
        {/* Adorno de líneas Tron */}
        <View style={styles.tronLine} />
      </View>
    );
  }

  // 2. PANTALLA PRINCIPAL (CRUD)
  if (selectedEvent) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />

        <View style={styles.header}>
          <TouchableOpacity onPress={() => setSelectedEventId(null)} style={styles.backButton}>
            <Text style={styles.backButtonText}>{'< VOLVER'}</Text>
          </TouchableOpacity>
          <Text style={styles.headerTextMain}>DETALLE_EVENTO</Text>
        </View>

        <View style={styles.contentWrapper}>
          <View style={styles.contentContainer}>
            <View style={styles.detailCard}>
              <Text style={styles.sectionTitle}>TITULO</Text>
              <Text style={styles.detailTitle}>{selectedEvent.title}</Text>

              <Text style={styles.sectionTitle}>TIPO</Text>
              <Text style={styles.detailText}>{selectedEvent.type}</Text>

              <Text style={styles.sectionTitle}>FECHA</Text>
              <Text style={styles.detailText}>{formatEventDate(selectedEvent.date)}</Text>

              <Text style={styles.sectionTitle}>ESTADO</Text>
              <Text style={styles.detailText}>
                {isUpcomingEvent(selectedEvent.date) ? 'Proximo' : 'Pasado'}
              </Text>

              <Text style={styles.sectionTitle}>ASISTENCIA</Text>
              <Text style={styles.detailText}>
                {selectedEvent.attending ? 'Confirmada' : 'Pendiente'}
              </Text>

              <TouchableOpacity
                style={styles.attendButton}
                onPress={() => toggleAttendance(selectedEvent.id)}
              >
                <Text style={styles.attendButtonText}>
                  {selectedEvent.attending
                    ? '[ CANCELAR_ASISTENCIA ]'
                    : '[ CONFIRMAR_ASISTENCIA ]'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.notificationButton}
                onPress={() => scheduleReminder(selectedEvent)}
              >
                <Text style={styles.notificationButtonText}>[ PROGRAMAR_RECORDATORIO ]</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.submitButton}
                onPress={() => {
                  handleEditEvent(selectedEvent);
                  setSelectedEventId(null);
                }}
              >
                <Text style={styles.submitButtonText}>[ EDITAR_EVENTO ]</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <View style={styles.header}>
        <View style={styles.cyberLineLeft} />
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTextPrefix}>📡 NODE_ID:</Text>
          <Text style={styles.headerTextMain}>COMUNIDAD_NEÓN</Text>
        </View>
        <View style={styles.cyberLineRight} />
      </View>

      <View style={styles.contentWrapper}>
        <View style={styles.contentContainer}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            
            <Text style={styles.sectionTitle}>
              {editingId ? '> MODIFICAR_NODO' : '> INYECTAR_EVENTO'}
            </Text>
            
            <TextInput style={styles.input} placeholder="Evento..." value={inputTitle} onChangeText={setInputTitle} />
            <TextInput style={styles.input} placeholder="Tipo..." value={inputType} onChangeText={setInputType} />
            <TextInput
              style={styles.input}
              placeholder="Fecha (YYYY-MM-DDTHH:mm)..."
              value={inputDate}
              onChangeText={setInputDate}
            />

            <TouchableOpacity 
              style={[styles.submitButton, editingId && {borderColor: COLORS.primaryNeon}]} 
              onPress={handleSaveEvent}
            >
              <Text style={[styles.submitButtonText, editingId && {color: COLORS.primaryNeon}]}>
                {editingId ? '[ ACTUALIZAR_NODO ]' : '[ EJECUTAR_CREACION ]'}
              </Text>
            </TouchableOpacity>

            <View style={styles.divider} />

            <Text style={styles.sectionTitle}>{`> EVENTOS_REGISTRADOS (${events.length})`}</Text>

            <View style={styles.filtersRow}>
              <TouchableOpacity
                style={[styles.filterButton, activeFilter === FILTERS.all && styles.filterButtonActive]}
                onPress={() => setActiveFilter(FILTERS.all)}
              >
                <Text style={styles.filterText}>TODOS</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterButton, activeFilter === FILTERS.upcoming && styles.filterButtonActive]}
                onPress={() => setActiveFilter(FILTERS.upcoming)}
              >
                <Text style={styles.filterText}>PROXIMOS</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterButton, activeFilter === FILTERS.past && styles.filterButtonActive]}
                onPress={() => setActiveFilter(FILTERS.past)}
              >
                <Text style={styles.filterText}>PASADOS</Text>
              </TouchableOpacity>
            </View>
            
            {filteredEvents.map((event) => (
              <View key={event.id} style={styles.eventCard}>
                <TouchableOpacity style={{ flex: 1 }} onPress={() => setSelectedEventId(event.id)}>
                  <Text style={styles.eventTitle}>{event.title}</Text>
                  <Text style={styles.eventType}>TYPE:// {event.type}</Text>
                  <Text style={styles.eventDate}>DATE:// {formatEventDate(event.date)}</Text>
                  <Text style={[styles.eventStatus, event.attending && styles.eventStatusAttending]}>
                    RSVP:// {event.attending ? 'CONFIRMADA' : 'PENDIENTE'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.editButton} onPress={() => handleEditEvent(event)}>
                  <Text style={styles.editButtonText}>EDIT</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeleteEvent(event.id)}>
                  <Text style={styles.deleteButtonText}>DEL</Text>
                </TouchableOpacity>
              </View>
            ))}

            {filteredEvents.length === 0 && (
              <Text style={styles.emptyText}>No hay eventos para este filtro.</Text>
            )}

          </ScrollView>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>CYBERNETIC INTERFACE V3.0</Text>
      </View>
    </SafeAreaView>
  );
}

// --- ESTILOS Y COLORES ---
const COLORS = {
  background: '#0D0E1F',
  centralBackground: '#FFFFFF',
  primaryNeon: '#00F2FF',   
  secondaryNeon: '#9D00FF', 
  alertNeon: '#FF0055',     
};

const styles = StyleSheet.create({
  // Estilos del Splash (Logo)
  splashContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoCircle: {
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 3,
    borderColor: COLORS.primaryNeon,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primaryNeon,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 20,
  },
  logoInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 60,
    fontWeight: 'bold',
    color: '#FFF',
    fontFamily: 'monospace',
  },
  logoDivider: {
    width: 4,
    height: 50,
    backgroundColor: COLORS.secondaryNeon,
    marginHorizontal: 5,
  },
  splashBrand: {
    marginTop: 30,
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.primaryNeon,
    letterSpacing: 3,
    fontFamily: 'monospace',
  },
  splashLoading: {
    marginTop: 10,
    fontSize: 12,
    color: COLORS.secondaryNeon,
    fontFamily: 'monospace',
  },
  tronLine: {
    position: 'absolute',
    bottom: 50,
    width: '80%',
    height: 2,
    backgroundColor: COLORS.primaryNeon,
    shadowColor: COLORS.primaryNeon,
    shadowRadius: 10,
    shadowOpacity: 0.8,
  },

  // Estilos de la Pantalla Principal (CRUD)
  container: { flex: 1, backgroundColor: COLORS.background },
  backButton: {
    borderWidth: 1,
    borderColor: COLORS.primaryNeon,
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 10,
  },
  backButtonText: {
    color: COLORS.primaryNeon,
    fontFamily: 'monospace',
    fontSize: 12,
    fontWeight: 'bold',
  },
  header: {
    backgroundColor: 'rgba(26, 26, 46, 0.95)',
    paddingVertical: 15,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: COLORS.secondaryNeon,
  },
  headerTitleContainer: { flexDirection: 'row', alignItems: 'center' },
  headerTextPrefix: { fontFamily: 'monospace', color: COLORS.primaryNeon, fontSize: 14, marginRight: 8 },
  headerTextMain: { fontFamily: 'monospace', fontWeight: 'bold', fontSize: 20, color: '#FFF' },
  cyberLineLeft: { flex: 1, height: 1, backgroundColor: COLORS.primaryNeon, marginRight: 10 },
  cyberLineRight: { flex: 1, height: 1, backgroundColor: COLORS.primaryNeon, marginLeft: 10 },
  contentWrapper: { flex: 1, padding: 15 },
  contentContainer: {
    flex: 1,
    backgroundColor: COLORS.centralBackground,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: COLORS.primaryNeon,
  },
  scrollContent: { padding: 20 },
  sectionTitle: { fontFamily: 'monospace', fontSize: 15, fontWeight: 'bold', color: '#000', marginBottom: 12 },
  detailCard: {
    padding: 20,
  },
  detailTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
    marginBottom: 14,
  },
  detailText: {
    fontSize: 16,
    color: '#111',
    marginBottom: 14,
  },
  input: {
    backgroundColor: '#F5F5FA',
    borderWidth: 1,
    borderColor: '#E2E2E8',
    borderRadius: 4,
    padding: 12,
    marginBottom: 12,
  },
  submitButton: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.secondaryNeon,
    paddingVertical: 12,
    borderRadius: 4,
    alignItems: 'center',
  },
  submitButtonText: { fontFamily: 'monospace', fontSize: 14, fontWeight: 'bold', color: COLORS.secondaryNeon },
  attendButton: {
    backgroundColor: '#112A44',
    borderWidth: 1,
    borderColor: COLORS.primaryNeon,
    paddingVertical: 12,
    borderRadius: 4,
    alignItems: 'center',
    marginBottom: 10,
  },
  attendButtonText: {
    fontFamily: 'monospace',
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.primaryNeon,
  },
  notificationButton: {
    backgroundColor: '#251231',
    borderWidth: 1,
    borderColor: COLORS.secondaryNeon,
    paddingVertical: 12,
    borderRadius: 4,
    alignItems: 'center',
    marginBottom: 10,
  },
  notificationButtonText: {
    fontFamily: 'monospace',
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.secondaryNeon,
  },
  divider: { height: 1, backgroundColor: '#E2E2E8', marginVertical: 20 },
  filtersRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
    gap: 8,
  },
  filterButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#999',
    borderRadius: 4,
    paddingVertical: 8,
    alignItems: 'center',
  },
  filterButtonActive: {
    borderColor: COLORS.primaryNeon,
    backgroundColor: '#EAFDFF',
  },
  filterText: {
    color: '#111',
    fontFamily: 'monospace',
    fontSize: 11,
    fontWeight: 'bold',
  },
  eventCard: {
    backgroundColor: '#F5F5FA',
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primaryNeon,
    padding: 15,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventTitle: { fontSize: 16, fontWeight: '700', color: '#000' },
  eventType: { fontFamily: 'monospace', fontSize: 12, color: COLORS.secondaryNeon },
  eventDate: {
    fontFamily: 'monospace',
    fontSize: 11,
    color: '#444',
    marginTop: 4,
  },
  eventStatus: {
    fontFamily: 'monospace',
    fontSize: 11,
    color: '#9B7200',
    marginTop: 4,
  },
  eventStatusAttending: {
    color: '#007650',
  },
  editButton: {
    borderWidth: 1,
    borderColor: '#007BA7',
    padding: 8,
    borderRadius: 3,
    marginRight: 8,
  },
  editButtonText: { color: '#007BA7', fontWeight: 'bold', fontSize: 10 },
  deleteButton: {
    borderWidth: 1,
    borderColor: COLORS.alertNeon,
    padding: 8,
    borderRadius: 3,
  },
  deleteButtonText: { color: COLORS.alertNeon, fontWeight: 'bold', fontSize: 10 },
  emptyText: {
    fontFamily: 'monospace',
    color: '#444',
    marginTop: 10,
  },
  footer: { paddingVertical: 10, alignItems: 'center' },
  footerText: { fontFamily: 'monospace', fontSize: 10, color: '#FFF', opacity: 0.5 },
});
