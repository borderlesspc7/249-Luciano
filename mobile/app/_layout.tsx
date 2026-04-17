import { Stack } from "expo-router";
import { AuthProvider } from "../contexts/AuthContext";
import { ForwardedChecklistsProvider } from "../contexts/ForwardedChecklistsContext";
import { ProjectProvider } from "../contexts/ProjectContext";
import { OfflineNotice } from "../components/OfflineNotice";
import { ChecklistDraftsProvider } from "../contexts/ChecklistDraftsContext";
import { ChecklistFoldersProvider } from "../contexts/ChecklistFoldersContext";
import { ChecklistAreasProvider } from "../contexts/ChecklistAreasContext";

export default function RootLayout() {
  return (
    <AuthProvider>
      <ProjectProvider>
        <ChecklistAreasProvider>
          <ChecklistFoldersProvider>
            <ChecklistDraftsProvider>
              <ForwardedChecklistsProvider>
                <OfflineNotice />
                <Stack
                  screenOptions={{
                    headerShown: false,
                  }}
                >
                  <Stack.Screen name="index" />
                  <Stack.Screen name="project-home" />
                  <Stack.Screen name="main-menu" />
                  <Stack.Screen name="commissioning-checklist" />
                  <Stack.Screen name="pending-approval" />
                  <Stack.Screen name="(auth)/login" />
                  <Stack.Screen name="(auth)/register" />
                  <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                </Stack>
              </ForwardedChecklistsProvider>
            </ChecklistDraftsProvider>
          </ChecklistFoldersProvider>
        </ChecklistAreasProvider>
      </ProjectProvider>
    </AuthProvider>
  );
}

