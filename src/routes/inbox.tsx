import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/inbox")({
  component: Inbox,
});

function Inbox() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/inbox" }) as { user?: string };
  const [userId, setUserId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(search?.user || null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [profileMap, setProfileMap] = useState<Record<string, any>>({});

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) navigate({ to: "/auth" });
      setUserId(data.user?.id || null);
    });
  }, []);

  useEffect(() => {
    if (!userId) return;

    const fetchConversations = async () => {
      const { data } = await supabase
        .from("messages")
        .select("sender_id, receiver_id")
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`);

      const users = new Set<string>();
      data?.forEach(m => {
        if (m.sender_id !== userId) users.add(m.sender_id);
        if (m.receiver_id !== userId) users.add(m.receiver_id);
      });

      if (users.size) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name, avatar_url")
          .in("id", [...users]);

        const map: Record<string, any> = {};
        profiles?.forEach(p => map[p.id] = p);
        setProfileMap(map);
        setConversations(profiles || []);
      }
    };

    fetchConversations();
  }, [userId]);

  useEffect(() => {
    if (!userId || !selectedUser) return;

    const loadMessages = async () => {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .or(`and(sender_id.eq.${userId},receiver_id.eq.${selectedUser}),and(sender_id.eq.${selectedUser},receiver_id.eq.${userId})`)
        .order("created_at", { ascending: true });

      setMessages(data || []);
    };

    loadMessages();

    // Mark messages as read
    supabase
      .from("messages")
      .update({ is_read: true })
      .eq("sender_id", selectedUser)
      .eq("receiver_id", userId);
  }, [userId, selectedUser]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedUser) return;
    await supabase.from("messages").insert({
      sender_id: userId,
      receiver_id: selectedUser,
      content: newMessage.trim(),
    });
    setNewMessage("");
    // Refresh messages
    const { data } = await supabase
      .from("messages")
      .select("*")
      .or(`and(sender_id.eq.${userId},receiver_id.eq.${selectedUser}),and(sender_id.eq.${selectedUser},receiver_id.eq.${userId})`)
      .order("created_at", { ascending: true });
    setMessages(data || []);
  };

  if (!userId) return null;

  return (
    <div className="flex h-[calc(100vh-64px)] max-w-lg mx-auto">
      <div className={`${selectedUser ? 'hidden md:block' : 'block'} w-full md:w-1/3 border-r p-4 overflow-y-auto`}>
        <h2 className="font-bold mb-4">Inbox</h2>
        {conversations.map(u => (
          <div
            key={u.id}
            onClick={() => {
              setSelectedUser(u.id);
              if (window.innerWidth < 768) {
                document.querySelector('.md\\:block')?.classList.add('hidden');
              }
            }}
            className={`p-2 rounded-lg hover:bg-muted cursor-pointer ${selectedUser === u.id ? 'bg-muted' : ''}`}
          >
            <img src={u.avatar_url || '/default.png'} className="w-8 h-8 rounded-full inline mr-2" />
            <span>{u.full_name}</span>
          </div>
        ))}
      </div>

      <div className={`${selectedUser ? 'block' : 'hidden'} md:block flex-1 flex flex-col`}>
        {selectedUser ? (
          <>
            <div className="p-4 border-b flex items-center gap-2">
              <button
                onClick={() => setSelectedUser(null)}
                className="md:hidden text-gray-500"
              >
                <i className="fas fa-arrow-left"></i>
              </button>
              <img
                src={profileMap[selectedUser]?.avatar_url || '/default.png'}
                className="w-8 h-8 rounded-full"
              />
              <span className="font-semibold">{profileMap[selectedUser]?.full_name}</span>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {messages.map(m => (
                <div
                  key={m.id}
                  className={`max-w-xs p-2 rounded-lg ${m.sender_id === userId ? 'bg-blue-500 text-white ml-auto' : 'bg-gray-200'}`}
                >
                  {m.content}
                </div>
              ))}
            </div>
            <div className="p-4 border-t flex gap-2">
              <input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                className="flex-1 border rounded-xl px-3 py-2"
                placeholder="Type message..."
              />
              <button onClick={sendMessage} className="bg-purple-500 text-white px-4 py-2 rounded-xl">
                <i className="fas fa-paper-plane"></i>
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            Select a conversation
          </div>
        )}
      </div>
    </div>
  );
}