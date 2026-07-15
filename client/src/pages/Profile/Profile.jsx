import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { HiPhotograph, HiUserCircle } from "react-icons/hi";
import { useAuth } from "../../context/AuthContext";
import { updateProfile } from "../../services/profileService";
import { getMe } from "../../services/authService";
import { PageShell } from "../../components/common/PageShell";
import { uploadProfileAvatar } from "../../services/profileAvatarService";
import { getAvatarSrc } from "../../utils/avatar";

const emptyProfile = { name: "", email: "", avatar: "", bio: "" };

function normalizeProfile(value = {}) {
   return {
      name: value.name || "",
      email: value.email || "",
      avatar: value.avatar || "",
      bio: value.bio || "",
   };
}

export default function Profile() {
   const { setUser, setWorkspace } = useAuth();
   const navigate = useNavigate();
   const [profile, setProfile] = useState(emptyProfile);
   const [editProfile, setEditProfile] = useState(emptyProfile);
   const [message, setMessage] = useState(null);
   const [loading, setLoading] = useState(true);
   const [uploading, setUploading] = useState(false);
   const [isEditing, setIsEditing] = useState(false);

   useEffect(() => {
      const load = async () => {
         try {
            const res = await getMe();
            const nextProfile = normalizeProfile(res.data.user);
            setProfile(nextProfile);
            setEditProfile(nextProfile);
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
         const nextAvatar = res.data.file?.secure_url || res.data.file?.url || editProfile.avatar;
         setEditProfile((current) => ({ ...current, avatar: nextAvatar }));
      } catch (err) {
         setMessage(err.response?.data?.message || "Unable to upload avatar.");
      } finally {
         setUploading(false);
         event.target.value = "";
      }
   };

   const handleStartEdit = () => {
      setMessage(null);
      setEditProfile(normalizeProfile(profile));
      setIsEditing(true);
   };

   const handleCancelEdit = () => {
      setEditProfile(normalizeProfile(profile));
      setIsEditing(false);
      setMessage(null);
   };

   const handleSave = async (e) => {
      e.preventDefault();
      try {
         const res = await updateProfile({ name: editProfile.name, bio: editProfile.bio, avatar: editProfile.avatar });
         const nextProfile = normalizeProfile(res.data.user);
         setProfile(nextProfile);
         setEditProfile(nextProfile);
         setUser(res.data.user);
         setIsEditing(false);
         setMessage("Profile updated successfully.");
      } catch (err) {
         setMessage(err.response?.data?.message || "Unable to save profile.");
      }
   };

   const handleLogout = () => {
      localStorage.removeItem("token");
      setUser(null);
      setWorkspace(null);
      navigate("/login");
   };

   if (loading) {
      return <div className="rounded-3xl border border-border bg-card/80 p-6 shadow-soft">Loading profile...</div>;
   }

   return (
      <PageShell
         title="Your account"
         subtitle="Keep your workspace presence polished and update your profile whenever you need to."
         actions={
            <div className="flex flex-wrap gap-2">
               {!isEditing ? (
                  <button
                     type="button"
                     onClick={handleStartEdit}
                     className="rounded-[1rem] border border-gold/20 bg-[rgba(245,181,50,0.1)] px-4 py-2 text-sm font-semibold text-gold transition hover:bg-[rgba(245,181,50,0.16)]"
                  >
                     Edit profile
                  </button>
               ) : null}
               <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-[1rem] border border-red-400/30 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-300 transition hover:bg-red-500/20"
               >
                  Logout
               </button>
            </div>
         }
      >
         {!isEditing ? (
            <div className="grid gap-6">
               <div className="flex flex-col gap-5 rounded-[24px] border border-white/10 bg-white/[0.03] p-5 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex items-center gap-4">
                     <img src={avatarSrc} alt={profile.name || profile.email || "Profile"} className="h-20 w-20 rounded-[1.3rem] border border-white/10 object-cover" />
                     <div>
                        <div className="text-sm uppercase tracking-[0.22em] text-gold">Profile overview</div>
                        <h3 className="mt-2 text-xl font-semibold text-white">{profile.name || "Your name"}</h3>
                        <p className="mt-1 max-w-md text-sm text-muted-foreground">
                           {profile.bio || "Add a short bio so your teammates know what you’re working on."}
                        </p>
                     </div>
                  </div>
                  <div className="rounded-[1rem] border border-white/10 bg-[rgba(255,255,255,0.04)] px-4 py-3 text-sm text-muted-foreground">
                     <div className="font-medium text-white">{profile.email || "No email linked"}</div>
                     <div className="mt-1">Workspace presence is ready to update.</div>
                  </div>
               </div>

               <div className="grid gap-4 lg:grid-cols-2">
                  <div className="rounded-[20px] border border-white/10 bg-[rgba(255,255,255,0.04)] p-4">
                     <div className="text-sm uppercase tracking-[0.24em] text-gold">Display name</div>
                     <div className="mt-2 text-lg font-semibold text-white">{profile.name || "—"}</div>
                  </div>
                  <div className="rounded-[20px] border border-white/10 bg-[rgba(255,255,255,0.04)] p-4">
                     <div className="text-sm uppercase tracking-[0.24em] text-gold">Email</div>
                     <div className="mt-2 text-lg font-semibold text-white">{profile.email || "—"}</div>
                  </div>
               </div>

               <div className="rounded-[20px] border border-white/10 bg-[rgba(255,255,255,0.04)] p-4">
                  <div className="text-sm uppercase tracking-[0.24em] text-gold">About you</div>
                  <p className="mt-3 text-sm leading-7 text-muted-foreground">
                     {profile.bio || "Tell your team a little about your focus, role, or current priorities."}
                  </p>
               </div>

               {message ? <div className="text-sm text-muted-foreground">{message}</div> : null}
            </div>
         ) : (
            <form onSubmit={handleSave} className="grid gap-6">
               <div className="flex flex-col gap-4 rounded-[24px] border border-white/10 bg-white/[0.03] p-5 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex items-center gap-4">
                     <img src={getAvatarSrc(editProfile)} alt={editProfile.name || editProfile.email || "Profile"} className="h-20 w-20 rounded-[1.3rem] border border-white/10 object-cover" />
                     <div>
                        <div className="text-sm uppercase tracking-[0.22em] text-gold">Avatar preview</div>
                        <p className="mt-2 max-w-md text-sm text-muted-foreground">Upload a fresh image or keep the current avatar. Changes save instantly when you confirm.</p>
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
                        value={editProfile.name}
                        onChange={(e) => setEditProfile({ ...editProfile, name: e.target.value })}
                     />
                  </label>
                  <label className="space-y-2 text-sm text-muted-foreground">
                     Email
                     <input
                        className="w-full rounded-[1.2rem] border border-border bg-[rgba(255,255,255,0.06)] px-4 py-3 text-sm text-white outline-none"
                        value={editProfile.email}
                        readOnly
                     />
                  </label>
               </div>
               <label className="space-y-2 text-sm text-muted-foreground">
                  Bio
                  <textarea
                     className="w-full rounded-[1.5rem] border border-border bg-[rgba(255,255,255,0.06)] p-4 text-sm text-white outline-none focus:border-gold"
                     rows={5}
                     value={editProfile.bio}
                     onChange={(e) => setEditProfile({ ...editProfile, bio: e.target.value })}
                  />
               </label>
               <label className="space-y-2 text-sm text-muted-foreground">
                  Avatar URL or uploaded image
                  <input
                     className="w-full rounded-[1.2rem] border border-border bg-[rgba(255,255,255,0.06)] px-4 py-3 text-sm text-white outline-none focus:border-gold"
                     value={editProfile.avatar}
                     onChange={(e) => setEditProfile({ ...editProfile, avatar: e.target.value })}
                  />
               </label>
               <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-wrap gap-3">
                     <button type="submit" className="rounded-[1.2rem] bg-gradient-gold px-6 py-3 text-sm font-semibold text-[var(--noir-900)] transition hover:-translate-y-0.5">
                        Save profile
                     </button>
                     <button type="button" onClick={handleCancelEdit} className="rounded-[1.2rem] border border-white/10 px-6 py-3 text-sm font-semibold text-white transition hover:border-white/20">
                        Cancel
                     </button>
                  </div>
                  {message ? <div className="text-sm text-muted-foreground">{message}</div> : null}
               </div>
            </form>
         )}
      </PageShell>
   );
}
