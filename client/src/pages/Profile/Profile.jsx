import { useEffect, useState } from "react";
import { HiPhotograph, HiUserCircle } from "react-icons/hi";
import { useAuth } from "../../context/AuthContext";
import { updateProfile } from "../../services/profileService";
import { getMe } from "../../services/authService";
import { PageShell } from "../../components/common/PageShell";
import { uploadProfileAvatar } from "../../services/profileAvatarService";
import { getAvatarSrc } from "../../utils/avatar";

export default function Profile() {
   const { setUser } = useAuth();
   const [profile, setProfile] = useState({ name: "", email: "", avatar: "", bio: "" });
   const [message, setMessage] = useState(null);
   const [loading, setLoading] = useState(true);
   const [uploading, setUploading] = useState(false);

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

   const avatarSrc = getAvatarSrc(profile);

   const handleAvatarUpload = async (event) => {
      const file = event.target.files?.[0];
      if (!file) return;

      setMessage(null);
      setUploading(true);
      try {
         const res = await uploadProfileAvatar(file);
         setProfile((current) => ({ ...current, avatar: res.data.file?.secure_url || res.data.file?.url || current.avatar }));
      } catch (err) {
         setMessage(err.response?.data?.message || "Unable to upload avatar.");
      } finally {
         setUploading(false);
         event.target.value = "";
      }
   };

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
      <PageShell title="Your account" subtitle="Update your profile details and workspace presence." actions={<div className="inline-flex items-center gap-3 rounded-[1.2rem] border border-gold/20 bg-[rgba(248,181,0,0.08)] px-4 py-2 text-sm text-gold"><HiUserCircle className="h-5 w-5" />Profile settings</div>}>
         <form onSubmit={handleSave} className="grid gap-6">
            <div className="flex flex-col gap-4 rounded-[24px] border border-white/10 bg-white/[0.03] p-5 lg:flex-row lg:items-center lg:justify-between">
               <div className="flex items-center gap-4">
                  <img src={avatarSrc} alt={profile.name || profile.email || "Profile"} className="h-20 w-20 rounded-[1.3rem] border border-white/10 object-cover" />
                  <div>
                     <div className="text-sm uppercase tracking-[0.22em] text-gold">Avatar preview</div>
                     <p className="mt-2 max-w-md text-sm text-muted-foreground">Upload an image or keep the generated default avatar. The preview updates immediately.</p>
                  </div>
               </div>
               <label className="inline-flex cursor-pointer items-center gap-2 rounded-[1rem] border border-white/10 bg-[rgba(255,255,255,0.05)] px-4 py-3 text-sm text-white transition hover:border-gold/30 hover:bg-[rgba(245,181,50,0.08)]">
                  <HiPhotograph className="h-4 w-4 text-gold" />
                  {uploading ? "Uploading..." : "Upload avatar"}
                  <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={uploading} />
               </label>
            </div>

            <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
               <label className="space-y-2 text-sm text-muted-foreground">
                  Name
                  <input
                     className="w-full rounded-[1.2rem] border border-border bg-[rgba(255,255,255,0.06)] px-4 py-3 text-sm text-white outline-none focus:border-gold"
                     value={profile.name}
                     onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  />
               </label>
               <label className="space-y-2 text-sm text-muted-foreground">
                  Email
                  <input
                     className="w-full rounded-[1.2rem] border border-border bg-[rgba(255,255,255,0.06)] px-4 py-3 text-sm text-white outline-none"
                     value={profile.email}
                     readOnly
                  />
               </label>
            </div>
            <label className="space-y-2 text-sm text-muted-foreground">
               Bio
               <textarea
                  className="w-full rounded-[1.5rem] border border-border bg-[rgba(255,255,255,0.06)] p-4 text-sm text-white outline-none focus:border-gold"
                  rows={5}
                  value={profile.bio}
                  onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
               />
            </label>
            <label className="space-y-2 text-sm text-muted-foreground">
               Avatar URL or uploaded image
               <input
                  className="w-full rounded-[1.2rem] border border-border bg-[rgba(255,255,255,0.06)] px-4 py-3 text-sm text-white outline-none focus:border-gold"
                  value={profile.avatar}
                  onChange={(e) => setProfile({ ...profile, avatar: e.target.value })}
               />
            </label>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
               <button className="rounded-[1.2rem] bg-gradient-gold px-6 py-3 text-sm font-semibold text-[var(--noir-900)] transition hover:-translate-y-0.5">
                  Save profile
               </button>
               {message ? <div className="text-sm text-muted-foreground">{message}</div> : null}
            </div>
         </form>
      </PageShell>
   );
}
