import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, StatusBar, SafeAreaView, TextInput, TouchableOpacity, ScrollView, Alert, Animated } from 'react-native';

export default function App() {
  // --- ESTADOS ---
  const [mostrarSplash, setMostrarSplash] = useState(true); // Controla la pantalla de entrada
  const [events, setEvents] = useState([
    { id: '1', title: 'Cyberhack Colectivo', type: 'Seguridad' },
    { id: '2', title: 'Synth-Wave Night', type: 'Música' },
  ]);
  const [inputTitle, setInputTitle] = useState('');
  const [inputType, setInputType] = useState('');
  const [editingId, setEditingId] = useState(null);

  // --- LÓGICA DEL LOGO DE ENTRADA ---
  useEffect(() => {
    // Esperar 3 segundos y luego ocultar el Splash
    const timer = setTimeout(() => {
      setMostrarSplash(false);
    }, 3500);
    return () => clearTimeout(timer);
  }, []);

  // --- OPERACIONES DEL CRUD ---
  const handleSaveEvent = () => {
    if (inputTitle.trim() === '' || inputType.trim() === '') {
      Alert.alert('SISTEMA_ERROR', 'Campos vacíos.');
      return;
    }
    if (editingId) {
      const updated = events.map(e => e.id === editingId ? { ...e, title: inputTitle, type: inputType } : e);
      setEvents(updated);
      setEditingId(null);
    } else {
      setEvents([...events, { id: Date.now().toString(), title: inputTitle, type: inputType }]);
    }
    setInputTitle(''); setInputType('');
  };

  const handleDeleteEvent = (id) => {
    const filtered = events.filter(e => e.id !== id);
    setEvents(filtered);
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
            
            {events.map((event) => (
              <View key={event.id} style={styles.eventCard}>
                <TouchableOpacity style={{flex:1}} onPress={() => {setInputTitle(event.title); setInputType(event.type); setEditingId(event.id);}}>
                  <Text style={styles.eventTitle}>{event.title}</Text>
                  <Text style={styles.eventType}>TYPE:// {event.type}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeleteEvent(event.id)}>
                  <Text style={styles.deleteButtonText}>DEL</Text>
                </TouchableOpacity>
              </View>
            ))}

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
  divider: { height: 1, backgroundColor: '#E2E2E8', marginVertical: 20 },
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
  deleteButton: {
    borderWidth: 1,
    borderColor: COLORS.alertNeon,
    padding: 8,
    borderRadius: 3,
  },
  deleteButtonText: { color: COLORS.alertNeon, fontWeight: 'bold', fontSize: 10 },
  footer: { paddingVertical: 10, alignItems: 'center' },
  footerText: { fontFamily: 'monospace', fontSize: 10, color: '#FFF', opacity: 0.5 },
});