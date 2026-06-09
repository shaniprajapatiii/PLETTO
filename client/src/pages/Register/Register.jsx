import { useState } from "react";

import { registerUser } from "../../services/authService";

import { useNavigate } from "react-router-dom";

export default function Register() {
   const navigate = useNavigate();

   const [form, setForm] = useState({
      name: "",
      email: "",
      password: "",
   });

   const submit = async (e) => {
      e.preventDefault();

      try {
         const res = await registerUser(form);

         localStorage.setItem("token", res.data.token);

         navigate("/dashboard");
      } catch (err) {
         console.log(err);
      }
   };

   return (
      <div>
         <h1>Register</h1>

         <form onSubmit={submit}>
            <input
               placeholder="Name"
               onChange={(e) =>
                  setForm({
                     ...form,
                     name: e.target.value,
                  })
               }
            />

            <input
               placeholder="Email"
               onChange={(e) =>
                  setForm({
                     ...form,
                     email: e.target.value,
                  })
               }
            />

            <input
               type="password"
               placeholder="Password"
               onChange={(e) =>
                  setForm({
                     ...form,
                     password: e.target.value,
                  })
               }
            />

            <button>Register</button>
         </form>
      </div>
   );
}
