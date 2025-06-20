import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Card, Text, Switch, Button, Portal, Modal, List } from 'react-native-paper';
import { useUser } from '../context/UserContext';
import { TeenPermissions } from '../types';

const SettingsScreen = () => {
  const { currentRole } = useUser();
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [permissions, setPermissions] = useState<TeenPermissions>({
    id: 1,
    teenUserId: 3,
    canModifyAssignments: false,
    canAddEvents: true,
    canAddTasks: true,
    isReadOnly: false,
    modifiedBy: 1,
    modifiedAt: '2025-06-19'
  });

  const isParent = currentRole === 'mom' || currentRole === 'dad';

  const handlePermissionChange = (key: keyof TeenPermissions, value: boolean) => {
    setPermissions(prev => ({ ...prev, [key]: value }));
  };

  const savePermissions = () => {
    console.log('Saving teen permissions:', permissions);
    setShowPermissionsModal(false);
  };

  return (
    <ScrollView style={styles.container}>
      {/* User Role Info */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>Current User</Text>
          <View style={styles.roleInfo}>
            <Text variant="bodyLarge" style={styles.roleText}>
              Logged in as: <Text style={styles.roleValue}>{currentRole.charAt(0).toUpperCase() + currentRole.slice(1)}</Text>
            </Text>
          </View>
        </Card.Content>
      </Card>

      {/* Teen Permissions (Only for Parents) */}
      {isParent && (
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>Teen Permissions</Text>
            <Text variant="bodyMedium" style={styles.description}>
              Control what your teen can do in the app
            </Text>
            
            <View style={styles.permissionRow}>
              <View style={styles.permissionText}>
                <Text variant="bodyLarge">Modify Calendar Assignments</Text>
                <Text variant="bodySmall" style={styles.permissionDescription}>
                  Allow teen to change who's assigned to dates
                </Text>
              </View>
              <Switch
                value={permissions.canModifyAssignments}
                onValueChange={(value) => handlePermissionChange('canModifyAssignments', value)}
              />
            </View>

            <View style={styles.permissionRow}>
              <View style={styles.permissionText}>
                <Text variant="bodyLarge">Add Events</Text>
                <Text variant="bodySmall" style={styles.permissionDescription}>
                  Allow teen to add events to the calendar
                </Text>
              </View>
              <Switch
                value={permissions.canAddEvents}
                onValueChange={(value) => handlePermissionChange('canAddEvents', value)}
              />
            </View>

            <View style={styles.permissionRow}>
              <View style={styles.permissionText}>
                <Text variant="bodyLarge">Add Tasks</Text>
                <Text variant="bodySmall" style={styles.permissionDescription}>
                  Allow teen to create new tasks
                </Text>
              </View>
              <Switch
                value={permissions.canAddTasks}
                onValueChange={(value) => handlePermissionChange('canAddTasks', value)}
              />
            </View>

            <View style={styles.permissionRow}>
              <View style={styles.permissionText}>
                <Text variant="bodyLarge">Read-Only Mode</Text>
                <Text variant="bodySmall" style={styles.permissionDescription}>
                  Restrict teen to view-only access
                </Text>
              </View>
              <Switch
                value={permissions.isReadOnly}
                onValueChange={(value) => handlePermissionChange('isReadOnly', value)}
              />
            </View>

            <Button 
              mode="contained" 
              onPress={savePermissions}
              style={styles.saveButton}
            >
              Save Permissions
            </Button>
          </Card.Content>
        </Card>
      )}

      {/* App Info */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>App Information</Text>
          <List.Item
            title="Version"
            description="1.0.0"
            left={props => <List.Icon {...props} icon="information" />}
          />
          <List.Item
            title="Last Updated"
            description="June 19, 2025"
            left={props => <List.Icon {...props} icon="calendar" />}
          />
        </Card.Content>
      </Card>

      {/* Features */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>Features</Text>
          <List.Item
            title="Calendar Coordination"
            description="Schedule and assign custody dates"
            left={props => <List.Icon {...props} icon="calendar-check" />}
          />
          <List.Item
            title="Task Management"
            description="Shared to-do lists and assignments"
            left={props => <List.Icon {...props} icon="checkbox-marked-circle" />}
          />
          <List.Item
            title="Teen Permissions"
            description="Configurable access controls"
            left={props => <List.Icon {...props} icon="account-settings" />}
          />
        </Card.Content>
      </Card>

      {/* Teen View */}
      {currentRole === 'teen' && (
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>Your Permissions</Text>
            <View style={styles.teenPermissions}>
              <View style={styles.permissionStatus}>
                <Text>Calendar Changes: </Text>
                <Text style={[styles.status, permissions.canModifyAssignments && styles.statusEnabled]}>
                  {permissions.canModifyAssignments ? 'Allowed' : 'Not Allowed'}
                </Text>
              </View>
              <View style={styles.permissionStatus}>
                <Text>Add Events: </Text>
                <Text style={[styles.status, permissions.canAddEvents && styles.statusEnabled]}>
                  {permissions.canAddEvents ? 'Allowed' : 'Not Allowed'}
                </Text>
              </View>
              <View style={styles.permissionStatus}>
                <Text>Add Tasks: </Text>
                <Text style={[styles.status, permissions.canAddTasks && styles.statusEnabled]}>
                  {permissions.canAddTasks ? 'Allowed' : 'Not Allowed'}
                </Text>
              </View>
              <View style={styles.permissionStatus}>
                <Text>Access Level: </Text>
                <Text style={[styles.status, !permissions.isReadOnly && styles.statusEnabled]}>
                  {permissions.isReadOnly ? 'Read-Only' : 'Full Access'}
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  card: {
    margin: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    marginBottom: 12,
    fontWeight: 'bold',
  },
  description: {
    marginBottom: 16,
    color: '#666',
  },
  roleInfo: {
    padding: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  roleText: {
    textAlign: 'center',
  },
  roleValue: {
    fontWeight: 'bold',
    color: '#2196F3',
  },
  permissionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  permissionText: {
    flex: 1,
    marginRight: 16,
  },
  permissionDescription: {
    color: '#666',
    marginTop: 4,
  },
  saveButton: {
    marginTop: 16,
  },
  teenPermissions: {
    gap: 12,
  },
  permissionStatus: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  status: {
    fontWeight: 'bold',
    color: '#f44336',
  },
  statusEnabled: {
    color: '#4caf50',
  },
});

export default SettingsScreen;