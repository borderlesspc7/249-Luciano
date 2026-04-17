import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  Modal,
  RefreshControl,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { userService } from "../../services/userService";
import { useAuth } from "../../hooks/useAuth";
import type { User, UserRole } from "../../types/users";

type TabView = "pending" | "active";

const ROLE_LABELS: Record<UserRole, string> = {
  reader: "Leitor",
  writer: "Escritor",
  master: "Master",
};

const ROLE_COLORS: Record<UserRole, string> = {
  reader: "#2563eb",
  writer: "#16a34a",
  master: "#7c3aed",
};

export default function AdminUsersScreen() {
  const { user: currentUser } = useAuth();
  const [tab, setTab] = useState<TabView>("pending");
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [roleModalVisible, setRoleModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [pendingAction, setPendingAction] = useState<"approve" | "change" | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const loadUsers = useCallback(async () => {
    try {
      const all = await userService.listUsers();
      setUsers(all);
    } catch {
      Alert.alert("Erro", "Não foi possível carregar os usuários.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const onRefresh = () => {
    setRefreshing(true);
    loadUsers();
  };

  const pendingUsers = users.filter((u) => u.status === "pending");
  const activeUsers = users.filter(
    (u) => u.status === "active" && u.uid !== currentUser?.uid
  );

  const openApproveModal = (user: User) => {
    setSelectedUser(user);
    setPendingAction("approve");
    setRoleModalVisible(true);
  };

  const openChangeRoleModal = (user: User) => {
    setSelectedUser(user);
    setPendingAction("change");
    setRoleModalVisible(true);
  };

  const handleReject = (user: User) => {
    Alert.alert(
      "Rejeitar cadastro",
      `Deseja rejeitar o cadastro de "${user.name}"? O usuário não poderá acessar o sistema.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Rejeitar",
          style: "destructive",
          onPress: async () => {
            try {
              await userService.rejectUser(user.uid);
              setUsers((prev) =>
                prev.map((u) => (u.uid === user.uid ? { ...u, status: "rejected" } : u))
              );
            } catch {
              Alert.alert("Erro", "Não foi possível rejeitar o cadastro.");
            }
          },
        },
      ]
    );
  };

  const handleSelectRole = async (role: UserRole) => {
    if (!selectedUser) return;
    setRoleModalVisible(false);
    setActionLoading(true);
    try {
      if (pendingAction === "approve") {
        await userService.approveUser(selectedUser.uid, role);
        setUsers((prev) =>
          prev.map((u) =>
            u.uid === selectedUser.uid ? { ...u, status: "active", role } : u
          )
        );
      } else {
        await userService.updateRole(selectedUser.uid, role);
        setUsers((prev) =>
          prev.map((u) => (u.uid === selectedUser.uid ? { ...u, role } : u))
        );
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[admin-users] Erro ao atualizar usuário:", msg);
      Alert.alert("Erro", `Não foi possível atualizar o usuário.\n\n${msg}`);
    } finally {
      setActionLoading(false);
      setSelectedUser(null);
      setPendingAction(null);
    }
  };

  const renderPendingItem = ({ item }: { item: User }) => (
    <View style={styles.userCard}>
      <View style={styles.userAvatarWrapper}>
        <Text style={styles.userAvatarText}>
          {item.name.charAt(0).toUpperCase()}
        </Text>
      </View>
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.name}</Text>
        <Text style={styles.userEmail}>{item.email}</Text>
        <Text style={styles.userDate}>
          Solicitado em{" "}
          {item.createdAt.toLocaleDateString("pt-BR")}
        </Text>
      </View>
      <View style={styles.userActions}>
        <TouchableOpacity
          style={styles.approveButton}
          onPress={() => openApproveModal(item)}
          activeOpacity={0.8}
        >
          <Feather name="check" size={14} color="#fff" />
          <Text style={styles.approveButtonText}>Aprovar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.rejectButton}
          onPress={() => handleReject(item)}
          activeOpacity={0.8}
        >
          <Feather name="x" size={14} color="#dc2626" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderActiveItem = ({ item }: { item: User }) => (
    <View style={styles.userCard}>
      <View style={styles.userAvatarWrapper}>
        <Text style={styles.userAvatarText}>
          {item.name.charAt(0).toUpperCase()}
        </Text>
      </View>
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.name}</Text>
        <Text style={styles.userEmail}>{item.email}</Text>
        {item.role && (
          <View style={[styles.roleBadge, { backgroundColor: ROLE_COLORS[item.role] + "20" }]}>
            <Text style={[styles.roleBadgeText, { color: ROLE_COLORS[item.role] }]}>
              {ROLE_LABELS[item.role]}
            </Text>
          </View>
        )}
      </View>
      <TouchableOpacity
        style={styles.changeRoleButton}
        onPress={() => openChangeRoleModal(item)}
        activeOpacity={0.8}
      >
        <Feather name="edit-2" size={14} color="#1a472a" />
        <Text style={styles.changeRoleText}>Role</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1a472a" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {actionLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#1a472a" />
        </View>
      )}

      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tabButton, tab === "pending" && styles.tabButtonActive]}
          onPress={() => setTab("pending")}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabButtonText, tab === "pending" && styles.tabButtonTextActive]}>
            Pendentes
            {pendingUsers.length > 0 && (
              <Text style={styles.tabBadge}> ({pendingUsers.length})</Text>
            )}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, tab === "active" && styles.tabButtonActive]}
          onPress={() => setTab("active")}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabButtonText, tab === "active" && styles.tabButtonTextActive]}>
            Usuários ativos
          </Text>
        </TouchableOpacity>
      </View>

      {tab === "pending" ? (
        pendingUsers.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Feather name="user-check" size={40} color="#9ca3af" />
            <Text style={styles.emptyTitle}>Nenhum cadastro pendente</Text>
            <Text style={styles.emptySubtitle}>
              Novos cadastros aparecerão aqui para aprovação.
            </Text>
          </View>
        ) : (
          <FlatList
            data={pendingUsers}
            keyExtractor={(item) => item.uid}
            renderItem={renderPendingItem}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1a472a" />
            }
          />
        )
      ) : activeUsers.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Feather name="users" size={40} color="#9ca3af" />
          <Text style={styles.emptyTitle}>Nenhum usuário ativo</Text>
          <Text style={styles.emptySubtitle}>
            Aprove cadastros pendentes para eles aparecerem aqui.
          </Text>
        </View>
      ) : (
        <FlatList
          data={activeUsers}
          keyExtractor={(item) => item.uid}
          renderItem={renderActiveItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1a472a" />
          }
        />
      )}

      <Modal
        visible={roleModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setRoleModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {pendingAction === "approve" ? "Aprovar como" : "Alterar role"}
            </Text>
            {selectedUser && (
              <Text style={styles.modalSubtitle}>{selectedUser.name}</Text>
            )}

            {(["reader", "writer", "master"] as UserRole[]).map((role) => (
              <TouchableOpacity
                key={role}
                style={styles.roleOption}
                onPress={() => handleSelectRole(role)}
                activeOpacity={0.8}
              >
                <View style={[styles.roleOptionDot, { backgroundColor: ROLE_COLORS[role] }]} />
                <View style={styles.roleOptionInfo}>
                  <Text style={styles.roleOptionLabel}>{ROLE_LABELS[role]}</Text>
                  <Text style={styles.roleOptionDesc}>
                    {role === "reader" && "Somente visualização"}
                    {role === "writer" && "Criação e edição de conteúdo"}
                    {role === "master" && "Acesso total + gestão de usuários"}
                  </Text>
                </View>
                {selectedUser?.role === role && (
                  <Feather name="check" size={16} color="#1a472a" />
                )}
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={styles.modalCancel}
              onPress={() => {
                setRoleModalVisible(false);
                setSelectedUser(null);
                setPendingAction(null);
              }}
            >
              <Text style={styles.modalCancelText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.7)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  tabRow: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  tabButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabButtonActive: {
    borderBottomColor: "#1a472a",
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6b7280",
  },
  tabButtonTextActive: {
    color: "#1a472a",
    fontWeight: "600",
  },
  tabBadge: {
    color: "#dc2626",
    fontWeight: "700",
  },
  listContent: {
    padding: 16,
    gap: 10,
  },
  userCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 10,
  },
  userAvatarWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#1a472a",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  userAvatarText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
  },
  userEmail: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 2,
  },
  userDate: {
    fontSize: 11,
    color: "#9ca3af",
    marginTop: 2,
  },
  roleBadge: {
    alignSelf: "flex-start",
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: "600",
  },
  userActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  approveButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#16a34a",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    gap: 4,
  },
  approveButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  rejectButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#fee2e2",
    alignItems: "center",
    justifyContent: "center",
  },
  changeRoleButton: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#1a472a",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    gap: 4,
  },
  changeRoleText: {
    color: "#1a472a",
    fontSize: 12,
    fontWeight: "600",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#4b5563",
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 6,
    textAlign: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalContent: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 13,
    color: "#6b7280",
    textAlign: "center",
    marginBottom: 20,
  },
  roleOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
    gap: 12,
  },
  roleOptionDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  roleOptionInfo: {
    flex: 1,
  },
  roleOptionLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
  },
  roleOptionDesc: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 2,
  },
  modalCancel: {
    marginTop: 16,
    alignItems: "center",
    paddingVertical: 10,
  },
  modalCancelText: {
    fontSize: 14,
    color: "#6b7280",
  },
});
