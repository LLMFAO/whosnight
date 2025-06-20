import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Smartphone, Apple, Shield, Key, Download } from "lucide-react";

export default function MobileAppView() {
  return (
    <div className="space-y-6 p-4">
      <div className="text-center">
        <Smartphone className="mx-auto h-16 w-16 text-blue-500 mb-4" />
        <h1 className="text-2xl font-bold">CoParent Connect Mobile</h1>
        <p className="text-gray-600 mt-2">Native iOS & Android apps with Apple Sign In</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Apple className="h-5 w-5" />
            Apple Sign In Integration
          </CardTitle>
          <CardDescription>
            Secure authentication with Apple ID for iOS App Store compliance
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge variant="secondary">Complete</Badge>
            <span className="text-sm">expo-apple-authentication implemented</span>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2 text-sm">
              <Shield className="h-4 w-4 text-green-500" />
              Secure credential storage
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Key className="h-4 w-4 text-green-500" />
              JWT identity tokens
            </div>
          </div>

          <div className="bg-gray-50 p-3 rounded-lg">
            <h4 className="font-medium mb-2">Features Implemented:</h4>
            <ul className="text-sm space-y-1 text-gray-600">
              <li>• Native Apple Sign In button with iOS guidelines</li>
              <li>• Face ID / Touch ID / Passcode authentication</li>
              <li>• Secure keychain storage with expo-secure-store</li>
              <li>• Privacy protection - users can hide email/name</li>
              <li>• Automatic session restoration</li>
              <li>• Complete sign out functionality</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            App Deployment Options
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
            <div className="border rounded-lg p-4">
              <h4 className="font-medium text-blue-600">React Native Expo</h4>
              <p className="text-sm text-gray-600 mt-1">Cross-platform iOS/Android app with Apple Sign In</p>
              <Badge variant="outline" className="mt-2">Ready for testing</Badge>
            </div>
            
            <div className="border rounded-lg p-4">
              <h4 className="font-medium text-green-600">iOS Capacitor Native</h4>
              <p className="text-sm text-gray-600 mt-1">Native iOS app with Xcode project</p>
              <Badge variant="outline" className="mt-2">Production ready</Badge>
            </div>
            
            <div className="border rounded-lg p-4">
              <h4 className="font-medium text-purple-600">Web PWA</h4>
              <p className="text-sm text-gray-600 mt-1">Progressive web app with offline capabilities</p>
              <Badge variant="outline" className="mt-2">Currently viewing</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Testing Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="bg-blue-50 p-3 rounded-lg">
            <h4 className="font-medium text-blue-800">For React Native Expo:</h4>
            <code className="text-sm block mt-1 bg-white p-2 rounded border">
              cd react-native-app<br/>
              eas build --profile development --platform ios
            </code>
          </div>
          
          <div className="bg-green-50 p-3 rounded-lg">
            <h4 className="font-medium text-green-800">For iOS Simulator:</h4>
            <code className="text-sm block mt-1 bg-white p-2 rounded border">
              cd react-native-app<br/>
              expo run:ios
            </code>
          </div>

          <div className="text-sm text-gray-600">
            <p><strong>Note:</strong> Apple Sign In requires a real iOS device for full testing. The implementation includes comprehensive error handling and logs authentication details to console.</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Authentication Flow</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-xs mt-0.5">1</div>
              <div>
                <p className="font-medium">User taps "Sign In with Apple"</p>
                <p className="text-gray-600">Native Apple authentication modal appears</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-xs mt-0.5">2</div>
              <div>
                <p className="font-medium">Biometric/passcode verification</p>
                <p className="text-gray-600">Face ID, Touch ID, or device passcode</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-xs mt-0.5">3</div>
              <div>
                <p className="font-medium">Privacy choices</p>
                <p className="text-gray-600">User can share or hide email/name</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold text-xs mt-0.5">4</div>
              <div>
                <p className="font-medium">Credentials received</p>
                <p className="text-gray-600">JWT tokens securely stored in keychain</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}