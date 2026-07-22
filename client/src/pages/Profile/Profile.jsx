import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { HiPhotograph, HiUserCircle, HiPencil, HiLogout, HiCheck } from "react-icons/hi";
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
      return (
         <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-500 border-t-transparent" />
         </div>
      );
   }

   return (
      <PageShell
         title="Account Profile"
         subtitle="Manage your personal workspace identity, avatar, and notification bio."
         actions={
            <div className="flex items-center gap-2">
               {!isEditing ? (
                  <button
                     type="button"
                     onClick={handleStartEdit}
                     className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#f9ebae] hover:bg-[#e6d695] text-zinc-950 text-xs font-bold shadow-md transition"
                  >
                     <HiPencil size={14} />
                     <span>Edit Profile</span>
                  </button>
               ) : null}
               <button
                  type="button"
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-xs font-semibold text-red-300 transition"
               >
                  <HiLogout size={14} />
                  <span>Sign Out</span>
               </button>
            </div>
         }
      >
         {!isEditing ? (
            <div className="space-y-6">
               {/* User Banner Card */}
               <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-950/60 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-6">
                  <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
                     <div className="relative">
                        <img src={avatarSrc} alt={profile.name || profile.email} className="h-20 w-20 rounded-xl border border-zinc-800 object-cover shadow-lg" />
                        <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full bg-emerald-500 border-2 border-zinc-950" />
                     </div>
                     <div>
                        <h2 className="text-xl font-bold text-zinc-100">{profile.name || "Workspace Member"}</h2>
                        <p className="text-xs text-zinc-400 mt-0.5">{profile.email}</p>
                        <p className="text-xs text-[#f9ebae] mt-2 font-medium">{profile.bio || "No bio added yet."}</p>
                     </div>
                  </div>
               </div>

               {/* Profile Info Grid */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-950/60">
                     <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Full Name</span>
                     <p className="text-sm font-semibold text-zinc-100 mt-1">{profile.name || "—"}</p>
                  </div>
                  <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-950/60">
                     <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Email Address</span>
                     <p className="text-sm font-semibold text-zinc-100 mt-1">{profile.email || "—"}</p>
                  </div>
               </div>

               <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-950/60">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">About Bio</span>
                  <p className="text-xs text-zinc-300 mt-1.5 leading-relaxed">{profile.bio || "Share a quick summary of your focus area or role with your teammates."}</p>
               </div>

               {message ? <div className="text-xs text-emerald-400 font-semibold">{message}</div> : null}
            </div>
         ) : (
            <form onSubmit={handleSave} className="space-y-6">
               {/* Avatar Editor */}
               <div className="p-5 rounded-xl border border-zinc-800 bg-zinc-950/60 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                     <img src={getAvatarSrc(editProfile)} alt="Avatar Preview" className="h-16 w-16 rounded-xl border border-zinc-800 object-cover" />
                     <div>
                        <h3 className="text-sm font-bold text-zinc-100">Avatar Image</h3>
                        <p className="text-xs text-zinc-400">Upload a fresh profile picture.</p>
                     </div>
                  </div>
                  <label className="cursor-pointer px-3.5 py-2 rounded-lg border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-xs font-semibold text-zinc-200 transition flex items-center gap-2">
                     <HiPhotograph className="h-4 w-4 text-[#f9ebae]" />
                     <span>{uploading ? "Uploading..." : "Upload Image"}</span>
                     <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={uploading} />
                  </label>
               </div>

               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                     <label className="block text-xs font-semibold text-zinc-300">Display Name</label>
                     <input
                        className="mt-1.5 w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3.5 py-2 text-sm text-zinc-100 outline-none focus:border-[#f9ebae]"
                        value={editProfile.name}
                        onChange={(e) => setEditProfile({ ...editProfile, name: e.target.value })}
                     />
                  </div>
                  <div>
                     <label className="block text-xs font-semibold text-zinc-300">Email Address (Read-only)</label>
                     <input
                        className="mt-1.5 w-full rounded-lg border border-zinc-800 bg-zinc-900/50 px-3.5 py-2 text-sm text-zinc-400 outline-none cursor-not-allowed"
                        value={editProfile.email}
                        readOnly
                     />
                  </div>
               </div>

               <div>
                  <label className="block text-xs font-semibold text-zinc-300">Personal Bio</label>
                  <textarea
                     className="mt-1.5 w-full rounded-lg border border-zinc-800 bg-zinc-900 p-3.5 text-sm text-zinc-100 outline-none focus:border-[#f9ebae]"
                     rows={4}
                     value={editProfile.bio}
                     onChange={(e) => setEditProfile({ ...editProfile, bio: e.target.value })}
                  />
               </div>

               <div className="flex items-center justify-between pt-2">
                  <div className="flex gap-2">
                     <button type="submit" className="px-4 py-2 rounded-lg bg-[#f9ebae] hover:bg-[#e6d695] text-zinc-950 text-xs font-bold shadow-md transition">
                        Save Changes
                     </button>
                     <button type="button" onClick={handleCancelEdit} className="px-4 py-2 rounded-lg border border-zinc-800 text-xs text-zinc-400 hover:text-white">
                        Cancel
                     </button>
                  </div>
                  {message ? <div className="text-xs text-red-400">{message}</div> : null}
               </div>
            </form>
         )}
      </PageShell>
   );
}

