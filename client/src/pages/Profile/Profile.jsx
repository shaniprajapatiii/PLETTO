import { useEffect, useState } from "react";
import { HiUserCircle } from "react-icons/hi";
import { useAuth } from "../../context/AuthContext";
import { updateProfile } from "../../services/profileService";
import { getMe } from "../../services/authService";

export default function Profile() {
   const { setUser } = useAuth();
   const [profile, setProfile] = useState({ name: "", email: "", avatar: "", bio: "" });
   const [message, setMessage] = useState(null);
   const [loading, setLoading] = useState(true);

   useEffect(() => {
      const load = async () => {
         try {
            const res = await getMe();
            setProfile(res.data.user);
         } finally {
            setLoading(false);
         }
      };
      load();
   }, []);

   const handleSave = async (e) => {
      e.preventDefault();
      try {
         const res = await updateProfile({ name: profile.name, bio: profile.bio, avatar: profile.avatar });
         setProfile(res.data.user);
         setUser(res.data.user);
         setMessage("Profile updated successfully.");
      } catch (err) {
         setMessage(err.response?.data?.message || "Unable to save profile.");
      }
   };

   if (loading) {
      return <div className="rounded-3xl border border-border bg-card/80 p-6 shadow-soft">Loading profile...</div>;
   }

   return (
      <div className="rounded-3xl border border-border bg-card/80 p-6 shadow-soft">
         <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
               <div className="inline-flex items-center gap-3 rounded-3xl bg-[rgba(248,181,0,0.1)] px-4 py-2 text-sm text-gold">
                  <HiUserCircle className="h-5 w-5" />
                  Profile settings
               </div>
               <h2 className="mt-4 text-3xl font-semibold text-white">Your account</h2>
               <p className="mt-2 text-sm text-muted-foreground">Update your profile details and workspace presence.</p>
            </div>
         </div>

         <form onSubmit={handleSave} className="mt-8 grid gap-6">
            <div className="grid gap-4 sm:grid-cols-2">
               <label className="space-y-2 text-sm text-muted-foreground">
                  Name
                  <input
                     className="w-full rounded-3xl border border-border bg-[rgba(255,255,255,0.06)] px-4 py-3 text-sm text-white outline-none focus:border-gold"
                     value={profile.name}
                     onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  />
               </label>
               <label className="space-y-2 text-sm text-muted-foreground">
                  Email
                  <input
                     className="w-full rounded-3xl border border-border bg-[rgba(255,255,255,0.06)] px-4 py-3 text-sm text-white outline-none"
                     value={profile.email}
                     readOnly
                  />
               </label>
            </div>
            <label className="space-y-2 text-sm text-muted-foreground">
               Bio
               <textarea
                  className="w-full rounded-[1.75rem] border border-border bg-[rgba(255,255,255,0.06)] p-4 text-sm text-white outline-none focus:border-gold"
                  rows={5}
                  value={profile.bio}
                  onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
               />
            </label>
            <label className="space-y-2 text-sm text-muted-foreground">
               Avatar URL
               <input
                  className="w-full rounded-3xl border border-border bg-[rgba(255,255,255,0.06)] px-4 py-3 text-sm text-white outline-none focus:border-gold"
                  value={profile.avatar}
                  onChange={(e) => setProfile({ ...profile, avatar: e.target.value })}
               />
            </label>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
               <button className="rounded-3xl bg-gradient-gold px-6 py-3 text-sm font-semibold text-[var(--noir-900)] transition hover:-translate-y-0.5">
                  Save profile
               </button>
               {message && <div className="text-sm text-muted-foreground">{message}</div>}
            </div>
         </form>
      </div>
   );
}
