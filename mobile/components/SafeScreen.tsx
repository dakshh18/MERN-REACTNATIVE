import { View } from 'react-native'
import React from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const SafeScreen = ({ children }: { children: React.ReactNode }) => {
  const insets = useSafeAreaInsets();
  return (
    <View 
    className='flex-1 bg-background ' 
    style={{
        paddingTop : insets.top, 
        // paddingBottom : insets.bottom, 
        // paddingHorizontal : insets.left + insets.right,
    
    }}>
      {children}
    </View>
  )
}

export default SafeScreen