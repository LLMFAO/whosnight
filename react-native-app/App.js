import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import AppleSignInComponent from './src/components/AppleSignIn';

// Simple calendar component
const SimpleCalendar = () => {
  const [selectedDate, setSelectedDate] = useState(null);
  const [assignments, setAssignments] = useState({
    15: 'mom', 20: 'dad', 25: 'teen'
  });

  const days = Array.from({length: 30}, (_, i) => i + 1);

  const getDateColor = (day) => {
    const assignment = assignments[day];
    if (assignment === 'mom') return '#FF69B4';
    if (assignment === 'dad') return '#4A90E2';
    if (assignment === 'teen') return '#32CD32';
    return '#F0F0F0';
  };

  const assignDate = (day, assignment) => {
    setAssignments(prev => ({...prev, [day]: assignment}));
  };

  return (
    <View style={styles.calendar}>
      <Text style={styles.title}>June 2025 Calendar</Text>
      <View style={styles.grid}>
        {days.map(day => (
          <TouchableOpacity
            key={day}
            style={[styles.day, { backgroundColor: getDateColor(day) }]}
            onPress={() => setSelectedDate(day)}
          >
            <Text style={styles.dayText}>{day}</Text>
          </TouchableOpacity>
        ))}
      </View>
      
      {selectedDate && (
        <View style={styles.assignmentPanel}>
          <Text style={styles.assignmentTitle}>Assign June {selectedDate}:</Text>
          <View style={styles.buttonRow}>
            <TouchableOpacity 
              style={[styles.assignButton, {backgroundColor: '#FF69B4'}]}
              onPress={() => assignDate(selectedDate, 'mom')}
            >
              <Text style={styles.buttonText}>Mom</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.assignButton, {backgroundColor: '#4A90E2'}]}
              onPress={() => assignDate(selectedDate, 'dad')}
            >
              <Text style={styles.buttonText}>Dad</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.assignButton, {backgroundColor: '#32CD32'}]}
              onPress={() => assignDate(selectedDate, 'teen')}
            >
              <Text style={styles.buttonText}>Teen</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

// Simple task list
const TaskList = () => {
  const [tasks, setTasks] = useState([
    { id: 1, title: 'Pick up kids from school', completed: false, assignedTo: 'mom' },
    { id: 2, title: 'Soccer practice transportation', completed: true, assignedTo: 'dad' },
    { id: 3, title: 'Help with homework', completed: false, assignedTo: 'teen' }
  ]);

  const toggleTask = (id) => {
    setTasks(prev => prev.map(task => 
      task.id === id ? {...task, completed: !task.completed} : task
    ));
  };

  const getTaskColor = (assignedTo) => {
    if (assignedTo === 'mom') return '#FF69B4';
    if (assignedTo === 'dad') return '#4A90E2';
    if (assignedTo === 'teen') return '#32CD32';
    return '#666';
  };

  return (
    <View style={styles.tasks}>
      <Text style={styles.title}>Family Tasks</Text>
      {tasks.map(task => (
        <TouchableOpacity
          key={task.id}
          style={[styles.task, task.completed && styles.completedTask]}
          onPress={() => toggleTask(task.id)}
        >
          <View style={[styles.taskIndicator, {backgroundColor: getTaskColor(task.assignedTo)}]} />
          <Text style={[styles.taskText, task.completed && styles.completedText]}>
            {task.title}
          </Text>
          <Text style={styles.assignedText}>({task.assignedTo})</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

// Main app with tab navigation
export default function App() {
  const [currentTab, setCurrentTab] = useState('calendar');
  const [authenticatedUser, setAuthenticatedUser] = useState(null);

  const handleSignInSuccess = (userData) => {
    setAuthenticatedUser(userData);
    console.log('User authenticated successfully:', userData.user);
  };

  const renderContent = () => {
    switch (currentTab) {
      case 'calendar':
        return <SimpleCalendar />;
      case 'tasks':
        return <TaskList />;
      case 'auth':
        return <AppleSignInComponent onSignInSuccess={handleSignInSuccess} />;
      default:
        return <SimpleCalendar />;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.appTitle}>CoParent Connect</Text>
        <Text style={styles.subtitle}>Coordinate • Communicate • Connect</Text>
        {authenticatedUser && (
          <Text style={styles.userInfo}>
            Signed in as: {authenticatedUser.fullName?.givenName || 'User'}
          </Text>
        )}
      </View>

      <ScrollView style={styles.content}>
        {renderContent()}
      </ScrollView>

      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, currentTab === 'calendar' && styles.activeTab]}
          onPress={() => setCurrentTab('calendar')}
        >
          <Text style={[styles.tabText, currentTab === 'calendar' && styles.activeTabText]}>
            📅 Calendar
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, currentTab === 'tasks' && styles.activeTab]}
          onPress={() => setCurrentTab('tasks')}
        >
          <Text style={[styles.tabText, currentTab === 'tasks' && styles.activeTabText]}>
            ✓ Tasks
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, currentTab === 'auth' && styles.activeTab]}
          onPress={() => setCurrentTab('auth')}
        >
          <Text style={[styles.tabText, currentTab === 'auth' && styles.activeTabText]}>
             Sign In
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 20,
    backgroundColor: '#4A90E2',
    alignItems: 'center',
  },
  appTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  calendar: {
    marginBottom: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  day: {
    width: '13%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderRadius: 8,
  },
  dayText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  assignmentPanel: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
  },
  assignmentTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  assignButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  tasks: {},
  task: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    marginBottom: 10,
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
  },
  completedTask: {
    opacity: 0.6,
  },
  taskIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  taskText: {
    flex: 1,
    fontSize: 16,
  },
  completedText: {
    textDecorationLine: 'line-through',
  },
  assignedText: {
    fontSize: 12,
    color: '#666',
    textTransform: 'capitalize',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#F8F8F8',
    paddingVertical: 10,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#4A90E2',
    marginHorizontal: 10,
    borderRadius: 8,
  },
  tabText: {
    fontSize: 16,
    color: '#666',
  },
  activeTabText: {
    color: 'white',
    fontWeight: 'bold',
  },
  userInfo: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 5,
    textAlign: 'center',
    fontWeight: '500',
  },
});