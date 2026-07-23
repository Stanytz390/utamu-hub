import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { supabase } from '@/integrations/supabase/client';
import { useState, useEffect } from 'react';
import { spendCoins } from '@/lib/payment';
import { shareContent } from '@/lib/share';

export const Route = createFileRoute('/dadaz/$id')({
  component: DadazProfile,
});

function DadazProfile() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [contact, setContact] = useState<any>(null);
  const [showContact, setShowContact] = useState(false);
  const [contactBought, setContactBought] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const uid = user?.id || null;
      setUserId(uid);
      setIsOwner(uid === id);

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();
      setProfile(profileData);

      const { data: contactData } = await supabase
        .from('business_contacts')
        .select('*')
        .eq('business_id', id)
        .maybeSingle();
      setContact(contactData);

      if (uid && contactData) {
        const { data: tx } = await supabase
          .from('coin_transactions')
          .select('id')
          .eq('user_id', uid)
          .eq('ref_id', `contact-${id}`)
          .eq('kind', 'contact_purchase')
          .maybeSingle();
        if (tx) {
          setContactBought(true);
          setShowContact(true);
        }
      }
    };
    fetchData();
  }, [id]);

  const handleBuyContact = async () => {
    if (!userId) return alert('Please login first.');
    if (!contact?.is_confirmed) return alert('Contact not confirmed by admin yet.');

    const price = contact.contact_price || 0;

    if (price === 0) {
      setShowContact(true);
      setContactBought(true);
      return;
    }

    try {
      await spendCoins(userId, price, 'contact_purchase', `contact-${id}`, `Purchased contact for ${profile?.full_name}`);
      setContactBought(true);
      setShowContact(true);
    } catch (e: any) {
      alert('Not enough coins. Please top up.');
    }
  };

  const handleShare = () => {
    shareContent('dadaz', id, profile?.full_name || 'Dadaz Profile', profile?.bio || '');
  };

  const handleChat = () => {
    navigate({ to: '/inbox', search: { user: id } });
  };

  if (!profile) return <div className="p-6 text-center">Loading...</div>;

  const contactAvailable = contact && contact.is_confirmed === true;

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="flex items-start gap-4">
        <img
          src={profile.avatar_url || 'https://via.placeholder.com/100'}
          alt={profile.full_name}
          className="w-24 h-24 rounded-full object-cover border-2 border-purple-500"
        />
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold">{profile.full_name}</h1>
              <p className="text-gray-500 text-sm">{profile.bio || 'No bio'}</p>
              {contact?.location && (
                <p className="text-sm text-gray-600 mt-1">
                  <i className="fas fa-map-marker-alt mr-1"></i> {contact.location}
                </p>
              )}
            </div>
            <button
              onClick={handleShare}
              className="text-gray-500 hover:text-purple-600 p-2 rounded-full hover:bg-gray-100"
              aria-label="Share"
            >
              <i className="fas fa-share-alt text-xl"></i>
            </button>
          </div>
          {isOwner && (
            <button
              onClick={() => navigate({ to: '/dashboard/story-upload' })}
              className="mt-2 text-sm bg-purple-100 text-purple-700 px-4 py-1 rounded-full hover:bg-purple-200"
            >
              <i className="fas fa-plus-circle mr-1"></i> Upload Story
            </button>
          )}
        </div>
      </div>

      {contact?.services && (
        <div className="mt-4 p-4 border rounded-lg bg-gray-50">
          <h3 className="font-semibold text-gray-700">
            <i className="fas fa-concierge-bell mr-2"></i>Services & Pricing
          </h3>
          <p className="text-gray-600">{contact.services}</p>
          {contact.service_prices && (
            <div className="mt-2 text-sm">
              {Object.entries(JSON.parse(contact.service_prices)).map(([service, price]) => (
                <div key={service} className="flex justify-between border-b py-1">
                  <span>{service}</span>
                  <span className="font-medium">{price} SQ</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="mt-6 space-y-4">
        {!contactAvailable ? (
          <div className="text-center text-gray-500 py-4 border rounded-lg">
            <i className="fas fa-lock mr-2"></i> Contact not confirmed yet.
          </div>
        ) : !showContact ? (
          <button
            onClick={handleBuyContact}
            className="w-full bg-purple-500 text-white py-3 rounded-xl font-semibold hover:bg-purple-600 transition flex items-center justify-center gap-2"
          >
            <i className="fas fa-unlock-alt"></i> View Contact ({contact.contact_price || 0} SQ)
          </button>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              {contact.whatsapp && (
                <a
                  href={`https://wa.me/${contact.whatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-green-500 text-white py-3 rounded-xl font-semibold hover:bg-green-600 transition flex items-center justify-center gap-2"
                >
                  <i className="fab fa-whatsapp"></i> WhatsApp
                </a>
              )}
              {contact.phone && (
                <>
                  <a
                    href={`tel:${contact.phone}`}
                    className="bg-blue-500 text-white py-3 rounded-xl font-semibold hover:bg-blue-600 transition flex items-center justify-center gap-2"
                  >
                    <i className="fas fa-phone"></i> Call
                  </a>
                  <a
                    href={`sms:${contact.phone}`}
                    className="bg-gray-500 text-white py-3 rounded-xl font-semibold hover:bg-gray-600 transition flex items-center justify-center gap-2"
                  >
                    <i className="fas fa-sms"></i> SMS
                  </a>
                </>
              )}
            </div>
            <button
              onClick={handleChat}
              className="w-full bg-purple-500 text-white py-3 rounded-xl font-semibold hover:bg-purple-600 transition flex items-center justify-center gap-2"
            >
              <i className="fas fa-comment-dots"></i> Chat Now
            </button>
          </div>
        )}
      </div>
    </div>
  );
}