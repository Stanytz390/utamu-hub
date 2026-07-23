import { createFileRoute } from '@tanstack/react-router';
import { supabase } from '@/integrations/supabase/client';
import { useState, useEffect } from 'react';
import { spendCoins } from '@/lib/payment';

export const Route = createFileRoute('/dadaz/$id')({
  component: DadazProfile,
});

function DadazProfile() {
  const { id } = Route.useParams();
  const [profile, setProfile] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);
  const [showContact, setShowContact] = useState(false);
  const [contactBought, setContactBought] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();
      setProfile(profileData);

      const { data: settingsData } = await supabase
        .from('business_settings')
        .select('*')
        .eq('user_id', id)
        .single();
      setSettings(settingsData);

      // Check if contact already bought
      if (user) {
        const { data: tx } = await supabase
          .from('coin_transactions')
          .select('id')
          .eq('user_id', user.id)
          .eq('ref_id', `contact-${id}`)
          .eq('kind', 'contact_purchase')
          .maybeSingle();
        setContactBought(!!tx);
        if (tx) setShowContact(true);
      }
    };
    fetchData();
  }, [id]);

  const handleBuyContact = async () => {
    if (!userId) return alert('Login first');
    try {
      const price = settings?.whatsapp_price || 0;
      await spendCoins(userId, price, 'contact_purchase', `contact-${id}`, `Purchased contact for ${profile?.full_name}`);
      setContactBought(true);
      setShowContact(true);
    } catch (e: any) {
      alert(e.message);
    }
  };

  if (!profile || !settings) return <div className="p-6">Loading...</div>;

  return (
    <div className="max-w-2xl mx-auto p-6">
      <img src={profile.avatar_url || 'https://via.placeholder.com/150'} alt="Profile" className="w-32 h-32 rounded-full mx-auto" />
      <h1 className="text-2xl font-bold text-center mt-4">{profile.full_name}</h1>
      <p className="text-center text-gray-500">{profile.bio}</p>

      <div className="mt-6 space-y-4">
        {!showContact ? (
          <button
            onClick={handleBuyContact}
            className="w-full bg-purple-500 text-white py-3 rounded-xl font-semibold"
          >
            View Contact ({settings.whatsapp_price || 0} SQ)
          </button>
        ) : (
          <div className="flex gap-3 flex-wrap">
            {settings.whatsapp && (
              <a href={`https://wa.me/${settings.whatsapp}`} className="flex-1 bg-green-500 text-white py-2 rounded-xl text-center">
                <i className="fab fa-whatsapp mr-2" /> WhatsApp
              </a>
            )}
            {settings.phone && (
              <>
                <a href={`tel:${settings.phone}`} className="flex-1 bg-blue-500 text-white py-2 rounded-xl text-center">
                  <i className="fas fa-phone mr-2" /> Call
                </a>
                <a href={`sms:${settings.phone}`} className="flex-1 bg-gray-500 text-white py-2 rounded-xl text-center">
                  <i className="fas fa-sms mr-2" /> SMS
                </a>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}