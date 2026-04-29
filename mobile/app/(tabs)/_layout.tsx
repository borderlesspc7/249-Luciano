import { Tabs, useRouter } from "expo-router";
import { TouchableOpacity, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useAuth } from "../../hooks/useAuth";
import { useProject } from "../../contexts/ProjectContext";

const TAB_LABELS: Record<string, string> = {
  menu: "Homepage",
  users: "Áreas",
  sharepoint: "Ações corretivas",
  templates: "Treinamentos",
  "completed-plans": "Concluídos",
  "templates-sair": "Sair",
  "admin-users": "Usuários",
};

function ProjectHeaderButton() {
  const { currentProject } = useProject();
  const router = useRouter();

  return (
    <TouchableOpacity
      onPress={() => router.push("/project-home")}
      activeOpacity={0.75}
      style={{
        flexDirection: "row",
        alignItems: "center",
        marginLeft: 12,
        gap: 6,
        backgroundColor: "rgba(255,255,255,0.15)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.3)",
        borderRadius: 20,
        paddingVertical: 5,
        paddingHorizontal: 10,
      }}
    >
      <Feather name="briefcase" size={13} color="#fff" />
      <Text
        style={{ color: "#fff", fontSize: 13, fontWeight: "700", maxWidth: 130 }}
        numberOfLines={1}
        ellipsizeMode="tail"
      >
        {currentProject}
      </Text>
      <Feather name="chevron-down" size={12} color="rgba(255,255,255,0.8)" />
    </TouchableOpacity>
  );
}

export default function TabsLayout() {
  const { user } = useAuth();
  const isMaster = user?.role === "master";

  return (
    <Tabs
      screenOptions={({ route }) => ({
        title: TAB_LABELS[route.name] ?? route.name,
        tabBarLabel: TAB_LABELS[route.name] ?? route.name,
        tabBarActiveTintColor: "#1a472a",
        tabBarInactiveTintColor: "#777",
        headerStyle: { backgroundColor: "#1a472a" },
        headerTintColor: "#fff",
        tabBarStyle: { borderTopColor: "#ddd" },
        headerLeft: () => <ProjectHeaderButton />,
        tabBarIcon: ({ color, size, focused }) => {
          const iconSize = size ?? 22;
          switch (route.name) {
            case "menu":
              return <Feather name="home" size={iconSize} color={color} />;
            case "users":
              return <Feather name="folder" size={iconSize} color={color} />;
            case "sharepoint":
              return <Feather name="tool" size={iconSize} color={color} />;
            case "templates":
              return <Feather name="book-open" size={iconSize} color={color} />;
            case "completed-plans":
              return <Feather name="check-circle" size={iconSize} color={color} />;
            case "templates-sair":
              return (
                <Feather
                  name="log-out"
                  size={iconSize}
                  color={focused ? "#dc2626" : "#f97373"}
                />
              );
            case "admin-users":
              return <Feather name="users" size={iconSize} color={color} />;
            default:
              return <Feather name="circle" size={iconSize} color={color} />;
          }
        },
      })}
    >
      <Tabs.Screen name="menu" />
      <Tabs.Screen
        name="users"
        options={{
          headerRight: () => null,
        }}
      />
      <Tabs.Screen name="sharepoint" />
      <Tabs.Screen
        name="templates"
        options={{
          href: isMaster ? undefined : null,
        }}
      />
      <Tabs.Screen name="completed-plans" />
      <Tabs.Screen
        name="projects"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="admin-users"
        options={{
          title: "Usuários",
          href: isMaster ? undefined : null,
        }}
      />
      <Tabs.Screen name="templates-sair" />
    </Tabs>
  );
}
