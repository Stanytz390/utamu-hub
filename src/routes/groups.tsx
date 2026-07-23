import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { spendCoins } from "@/lib/payment";
import { shareContent } from "@/lib/share";

export const Route = createFileRoute("/groups")({
  head: () => ({
    meta: [
      { title: "Groups · UTAMU PORI" },
      { name: "description", content: "Jiunge groups za VIP, free na business. Links zote hapa." },
      { property: "og:title", content: "Groups · UTAMU PORI" },
      { property: "og:description", content: "Group links, descriptions, na join buttons." },
    ],
  }),
  component: Groups,
});

type Group = {
  id: string;
  name: string;
  description: string;
  logo_url: string;
  link: string;
  price_sq: number;
  created_by: string;
  created_at: string;
  member_count: number;
  user_joined?: boolean;
};

function Groups() {
  const navigate = useNavigate();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);

      // Fetch all groups with member count
      const { data: groupsData, error: groupsError } = await supabase
        .from('groups')
        .select(`
          *,
          memberships:group_memberships(count)
        `)
        .order('created_at', { ascending: false });

      if (groupsError) {
        console.error('Error fetching groups:', groupsError);
        setGroups([]);
        setLoading(false);
        return;
      }

      // Map data with member count and check user membership
      const mapped = await Promise.all((groupsData || []).map(async (g: any) => {
        const memberCount = g.memberships?.[0]?.count || 0;
        let userJoined = false;
        if (userId) {
          const { data: membership } = await supabase
            .from('group_memberships')
            .select('id')
            .eq('group_id', g.id)
            .eq('user_id', userId)
            .maybeSingle();
          userJoined = !!membership;
        }
        return {
          ...g,
          member_count: memberCount,
          user_joined: userJoined,
        };
      }));

      setGroups(mapped);
      setLoading(false);
    };

    fetchData();
  }, []);

  const handleJoin = async (group: Group) => {
    if (!userId) {
      alert('Please login first.');
      navigate({ to: '/auth' });
      return;
    }

    // Already a member – just open link
    if (group.user_joined) {
      window.open(group.link, '_blank');
      return;
    }

    // Free group – join immediately
    if (group.price_sq === 0) {
      const { error } = await supabase
        .from('group_memberships')
        .insert({ group_id: group.id, user_id: userId });
      if (error) {
        alert('Error joining group: ' + error.message);
        return;
      }
      // Update local state to reflect joined
      setGroups(prev => prev.map(g =>
        g.id === group.id ? { ...g, user_joined: true, member_count: g.member_count + 1 } : g
      ));
      window.open(group.link, '_blank');
      return;
    }

    // Paid group – spend coins
    try {
      await spendCoins(userId, group.price_sq, 'group_purchase', group.id, `Joined group ${group.name}`);
      // Insert membership
      const { error } = await supabase
        .from('group_memberships')
        .insert({ group_id: group.id, user_id: userId });
      if (error) {
        alert('Error joining group: ' + error.message);
        return;
      }
      // Update local state
      setGroups(prev => prev.map(g =>
        g.id === group.id ? { ...g, user_joined: true, member_count: g.member_count + 1 } : g
      ));
      window.open(group.link, '_blank');
    } catch (e: any) {
      alert('Not enough coins. Please top up.');
    }
  };

  const handleShare = (group: Group) => {
    shareContent('group', group.id, group.name, group.description);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <i className="fas fa-spinner fa-spin text-4xl text-purple-500"></i>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 px-4 py-3 backdrop-blur-xl">
        <h1 className="text-xl font-black">Groups</h1>
        <p className="text-xs text-muted-foreground">Jiunge na communities poa</p>
      </header>

      <section className="space-y-3 p-4">
        {groups.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">Hakuna groups zilizopo.</p>
        )}
        {groups.map((g) => (
          <div key={g.id} className="overflow-hidden rounded-2xl border border-border bg-card">
            <div className="flex gap-3 p-4">
              <img
                src={g.logo_url || 'https://via.placeholder.com/64'}
                alt={g.name}
                className="h-16 w-16 flex-shrink-0 rounded-2xl object-cover"
                loading="lazy"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="truncate text-base font-bold">{g.name}</h3>
                  <button
                    onClick={() => handleShare(g)}
                    className="text-gray-400 hover:text-purple-600 p-1 rounded-full hover:bg-gray-100"
                    aria-label="Share"
                  >
                    <i className="fas fa-share-alt text-sm"></i>
                  </button>
                </div>
                <p className="mt-1.5 line-clamp-2 text-xs text-muted-foreground">{g.description}</p>
                <div className="mt-1 flex items-center gap-3 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <i className="fas fa-users text-xs"></i> {g.member_count.toLocaleString()} members
                  </span>
                  {g.price_sq > 0 ? (
                    <span className="flex items-center gap-1 text-yellow-600">
                      <i className="fas fa-coins text-xs"></i> {g.price_sq} SQ
                    </span>
                  ) : (
                    <span className="text-green-600">
                      <i className="fas fa-gift text-xs mr-1"></i> Free
                    </span>
                  )}
                  {g.user_joined && (
                    <span className="text-purple-600">
                      <i className="fas fa-check-circle text-xs mr-1"></i> Joined
                    </span>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={() => handleJoin(g)}
              className="flex items-center justify-center gap-2 w-full border-t border-border bg-[image:var(--gradient-primary)] py-3 text-sm font-bold text-primary-foreground hover:opacity-90 transition"
            >
              {g.user_joined ? (
                <>
                  <i className="fas fa-arrow-right"></i> Open Group
                </>
              ) : g.price_sq === 0 ? (
                <>
                  <i className="fas fa-door-open"></i> Join Free
                </>
              ) : (
                <>
                  <i className="fas fa-unlock-alt"></i> Join ({g.price_sq} SQ)
                </>
              )}
            </button>
          </div>
        ))}
      </section>
    </div>
  );
}