import { Platform } from 'react-native'

// Cross-platform router hook
export const useAppRouter = () => {
  if (Platform.OS === 'web') {
    // For Next.js web
    const { useRouter } = require('next/navigation')
    return useRouter()
  } else {
    // For React Native
    const { useRouter } = require('solito/router')
    return useRouter()
  }
} 