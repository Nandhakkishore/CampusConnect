import { Alert, Platform } from 'react-native';

export const showAlert = (title: string, message?: string) => {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.alert) {
      window.alert(`${title}${message ? '\n\n' + message : ''}`);
    } else {
      console.log(`[ALERT] ${title}: ${message}`);
    }
  } else {
    Alert.alert(title, message);
  }
};
