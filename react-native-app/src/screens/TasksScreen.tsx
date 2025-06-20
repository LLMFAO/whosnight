import React, { useState } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Card, Text, Button, Chip, IconButton, Portal, Modal, TextInput } from 'react-native-paper';
import { useUser } from '../context/UserContext';
import { Task } from '../types';

const TasksScreen = () => {
  const { currentRole } = useUser();
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');

  // Mock data
  const tasks: Task[] = [
    {
      id: 1,
      title: 'Pick up groceries',
      description: 'Get milk, bread, and fruits for the week',
      assignedTo: 'mom',
      status: 'pending',
      dueDate: '2025-06-20',
      createdBy: 1,
      createdAt: '2025-06-15',
      updatedAt: '2025-06-15'
    },
    {
      id: 2,
      title: 'Soccer practice pickup',
      description: 'Pick up from soccer practice at 5 PM',
      assignedTo: 'dad',
      status: 'in_progress',
      dueDate: '2025-06-18',
      createdBy: 2,
      createdAt: '2025-06-15',
      updatedAt: '2025-06-16'
    },
    {
      id: 3,
      title: 'Help with homework',
      description: 'Math homework due tomorrow',
      assignedTo: 'teen',
      status: 'completed',
      dueDate: '2025-06-17',
      createdBy: 1,
      createdAt: '2025-06-15',
      updatedAt: '2025-06-17'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#FFA726';
      case 'in_progress': return '#42A5F5';
      case 'completed': return '#66BB6A';
      default: return '#9E9E9E';
    }
  };

  const getAssignedToColor = (assignedTo: string | null) => {
    switch (assignedTo) {
      case 'mom': return '#FF6B9D';
      case 'dad': return '#4FC3F7';
      case 'teen': return '#81C784';
      default: return '#9E9E9E';
    }
  };

  const handleAddTask = () => {
    if (newTaskTitle.trim()) {
      console.log('Adding new task:', newTaskTitle, newTaskDescription);
      setNewTaskTitle('');
      setNewTaskDescription('');
      setShowAddModal(false);
    }
  };

  const handleToggleStatus = (taskId: number, currentStatus: string) => {
    const nextStatus = currentStatus === 'pending' ? 'in_progress' : 
                      currentStatus === 'in_progress' ? 'completed' : 'pending';
    console.log(`Updating task ${taskId} status to ${nextStatus}`);
  };

  const renderTask = ({ item }: { item: Task }) => (
    <Card style={styles.taskCard}>
      <Card.Content>
        <View style={styles.taskHeader}>
          <Text variant="titleMedium" style={styles.taskTitle}>{item.title}</Text>
          <IconButton
            icon={item.status === 'completed' ? 'check-circle' : 'circle-outline'}
            iconColor={getStatusColor(item.status)}
            size={24}
            onPress={() => handleToggleStatus(item.id, item.status)}
          />
        </View>
        
        {item.description && (
          <Text variant="bodyMedium" style={styles.taskDescription}>
            {item.description}
          </Text>
        )}
        
        <View style={styles.taskFooter}>
          <View style={styles.taskChips}>
            <Chip 
              style={[styles.chip, { backgroundColor: getStatusColor(item.status) }]}
              textStyle={{ color: 'white' }}
              compact
            >
              {item.status.replace('_', ' ')}
            </Chip>
            
            {item.assignedTo && (
              <Chip 
                style={[styles.chip, { backgroundColor: getAssignedToColor(item.assignedTo) }]}
                textStyle={{ color: 'white' }}
                compact
              >
                {item.assignedTo}
              </Chip>
            )}
          </View>
          
          {item.dueDate && (
            <Text variant="bodySmall" style={styles.dueDate}>
              Due: {new Date(item.dueDate).toLocaleDateString()}
            </Text>
          )}
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text variant="headlineSmall" style={styles.headerTitle}>Tasks</Text>
        <Button 
          mode="contained" 
          onPress={() => setShowAddModal(true)}
          icon="plus"
          compact
        >
          Add Task
        </Button>
      </View>

      <FlatList
        data={tasks}
        renderItem={renderTask}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />

      {/* Add Task Modal */}
      <Portal>
        <Modal 
          visible={showAddModal} 
          onDismiss={() => setShowAddModal(false)}
          contentContainerStyle={styles.modalContent}
        >
          <Text variant="titleMedium" style={styles.modalTitle}>
            Add New Task
          </Text>
          
          <TextInput
            label="Task Title"
            value={newTaskTitle}
            onChangeText={setNewTaskTitle}
            mode="outlined"
            style={styles.input}
          />
          
          <TextInput
            label="Description (optional)"
            value={newTaskDescription}
            onChangeText={setNewTaskDescription}
            mode="outlined"
            multiline
            numberOfLines={3}
            style={styles.input}
          />
          
          <View style={styles.modalButtons}>
            <Button 
              mode="outlined" 
              onPress={() => setShowAddModal(false)}
              style={styles.modalButton}
            >
              Cancel
            </Button>
            <Button 
              mode="contained" 
              onPress={handleAddTask}
              style={styles.modalButton}
              disabled={!newTaskTitle.trim()}
            >
              Add Task
            </Button>
          </View>
        </Modal>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    elevation: 2,
  },
  headerTitle: {
    fontWeight: 'bold',
  },
  listContainer: {
    padding: 16,
  },
  taskCard: {
    marginBottom: 12,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  taskTitle: {
    flex: 1,
    fontWeight: 'bold',
  },
  taskDescription: {
    marginBottom: 12,
    color: '#666',
  },
  taskFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  taskChips: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    height: 28,
  },
  dueDate: {
    color: '#666',
    fontStyle: 'italic',
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
  input: {
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalButton: {
    flex: 1,
  },
});

export default TasksScreen;