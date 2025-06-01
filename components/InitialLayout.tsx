import { useAuth } from "@clerk/clerk-expo";

import { useRouter, useSegments } from "expo-router";
import { useEffect } from "react";


export default function InitialLayout() {
      const { isLoaded, isSignedIn } = useAuth()
      
      const segments = useSegments();
      const router = useRouter();

      useEffect(() => {
            if (!isLoaded) return
            
            const inAuthScreen = segments[0] === "(auth)"

            if (!isSignedIn && inAuthScreen) router.replace("/(auth)/login")
        
      }, [isLoaded,isSignedIn,segments])
      
}