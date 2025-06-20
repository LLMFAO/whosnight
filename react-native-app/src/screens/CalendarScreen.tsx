import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Card, Text, Button, Chip, Portal, Modal } from 'react-native-paper';
import { Calendar } from 'react-native-calendars';
import { useUser } from '../context/UserContext';
import { CalendarAssignment } from '../types';

const CalendarScreen = () => {
  const { currentRole, setCurrentRole } = useUser();
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [showAssignModal, setShowAssignModal] = useState(false);

  // Mock data - in real app this would come from API
  const assignments: CalendarAssignment[] = [
    {
      id: 1,
      date: '2025-06-15',
      assignedTo: 'mom',
      status: 'confirmed',
      assignedBy: 1,
      createdAt: '2025-06-01',
      updatedAt: '2025-06-01'
    },
    {
      id: 2,
      date: '2025-06-16',
      assignedTo: 'dad',
      status: 'confirmed',
      assignedBy: 2,
      createdAt: '2025-06-01',
      updatedAt: '2025-06-01'
    },
    {
      id: 3,
      date: '2025-06-29',
      assignedTo: 'dad',
      status: 'pending',
      assignedBy: 2,
      createdAt: '2025-06-01',
      updatedAt: '2025-06-01'
    }
  ];

  const getMarkedDates = () => {
    const marked: any = {};
    assignments.forEach(assignment => {
      const color = assignment.assignedTo === 'mom' ? '#FF6B9D' : '#4FC3F7';
      marked[assignment.date] = {
        selected: true,
        selectedColor: color,
        selectedTextColor: 'white'
      };
    });
    return marked;
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'mom': return '#FF6B9D';
      case 'dad': return '#4FC3F7';
      case 'teen': return '#81C784';
      default: return '#9E9E9E';
    }
  };

  const handleAssignDate = (assignTo: string) => {
    // In real app, this would make API call
    console.log(`Assigning ${selectedDate} to ${assignTo}`);
    setShowAssignModal(false);
  };

  return (
    <ScrollView style={styles.container}>
      {/* Role Selector */}
      <Card style={styles.roleCard}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>Current User</Text>
          <View style={styles.roleButtons}>
            {(['mom', 'dad', 'teen'] as const).map(role => (
              <Chip
                key={role}
                selected={currentRole === role}
                onPress={() => setCurrentRole(role)}
                selectedColor="white"
                style={[
                  styles.roleChip,
                  currentRole === role && { backgroundColor: getRoleColor(role) }
                ]}
              >
                {role.charAt(0).toUpperCase() + role.slice(1)}
              </Chip>
            ))}
          </View>
        </Card.Content>
      </Card>

      {/* Calendar */}
      <Card style={styles.calendarCard}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>Calendar</Text>
          <Calendar
            onDayPress={(day) => {
              setSelectedDate(day.dateString);
              setShowAssignModal(true);
            }}
            markedDates={getMarkedDates()}
            theme={{
              selectedDayBackgroundColor: '#2196F3',
              todayTextColor: '#2196F3',
              arrowColor: '#2196F3',
            }}
          />
        </Card.Content>
      </Card>

      {/* Legend */}
      <Card style={styles.legendCard}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>Legend</Text>
          <View style={styles.legendRow}>
            <View style={[styles.legendDot, { backgroundColor: '#FF6B9D' }]} />
            <Text>Mom's Night</Text>
          </View>
          <View style={styles.legendRow}>
            <View style={[styles.legendDot, { backgroundColor: '#4FC3F7' }]} />
            <Text>Dad's Night</Text>
          </View>
          <View style={styles.legendRow}>
            <View style={[styles.legendDot, { backgroundColor: '#81C784' }]} />
            <Text>Teen's Choice</Text>
          </View>
        </Card.Content>
      </Card>

      {/* Assignment Modal */}
      <Portal>
        <Modal 
          visible={showAssignModal} 
          onDismiss={() => setShowAssignModal(false)}
          contentContainerStyle={styles.modalContent}
        >
          <Text variant="titleMedium" style={styles.modalTitle}>
            Assign {selectedDate}
          </Text>
          <View style={styles.assignButtons}>
            <Button 
              mode="contained" 
              onPress={() => handleAssignDate('mom')}
              buttonColor="#FF6B9D"
              style={styles.assignButton}
            >
              Mom's Night
            </Button>
            <Button 
              mode="contained" 
              onPress={() => handleAssignDate('dad')}
              buttonColor="#4FC3F7"
              style={styles.assignButton}
            >
              Dad's Night
            </Button>
            <Button 
              mode="contained" 
              onPress={() => handleAssignDate('teen')}
              buttonColor="#81C784"
              style={styles.assignButton}
            >
              Teen's Choice
            </Button>
          </View>
          <Button 
            mode="outlined" 
            onPress={() => setShowAssignModal(false)}
            style={styles.cancelButton}
          >
            Cancel
          </Button>
        </Modal>
      </Portal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  roleCard: {
    margin: 16,
    marginBottom: 8,
  },
  calendarCard: {
    margin: 16,
    marginTop: 8,
    marginBottom: 8,
  },
  legendCard: {
    margin: 16,
    marginTop: 8,
  },
  sectionTitle: {
    marginBottom: 12,
    fontWeight: 'bold',
  },
  roleButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  roleChip: {
    marginRight: 8,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 8,
  },
  modalTitle: {
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: 'bold',
  },
  assignButtons: {
    gap: 12,
    marginBottom: 16,
  },
  assignButton: {
    marginBottom: 8,
  },
  cancelButton: {
    marginTop: 8,
  },
});

export default CalendarScreen;