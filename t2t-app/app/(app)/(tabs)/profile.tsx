import { View, Text, StyleSheet } from 'react-native';
import { useAuth } from '@/hooks/useAuth';

export default function ProfileScreen() {
  const { user } = useAuth();
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Il tuo Profilo</Text>
      <Text style={styles.info}>Email: {user?.email}</Text>
      <Text style={styles.info}>Username: {user?.user_metadata?.username}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 16,
  },
  info: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
});
