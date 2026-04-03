import { Button, TextField } from "@mui/material";
import React, { useEffect, useState } from "react";
import CloseIcon from "@mui/icons-material/Close";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import z from "zod";
import { auth, db } from "@/config/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { updatePassword } from "firebase/auth";

type IEditProps = {
  isEdit: () => void;
};

const EditProfileModal = ({ isEdit }: IEditProps) => {
  const [animate, setAnimate] = useState(false);
  const [fullname, setFullname] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");

  useEffect(() => {
    setAnimate(true);
  }, []);

  const handleTogglePassword = () => {
    setShowPassword((prev) => !prev);
  };

  const handleToggleConfirmPassword = () => {
    setShowConfirmPassword((prev) => !prev);
  };

  const registerSchema = z
    .object({
      password: z.string().min(8, "Password minimal 8 karakter"),
      confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: "Password tidak sama",
      path: ["confirmPassword"], // 🔥 error muncul di field ini
    });

  const handleSubmit = async () => {
    setPasswordError("");
    setConfirmPasswordError("");

    const result = registerSchema.safeParse({
      password,
      confirmPassword,
    });

    if (!result.success) {
      const errors = result.error.issues;

      errors.forEach((err) => {
        if (err.path[0] === "password") {
          setPasswordError(err.message);
        }
        if (err.path[0] === "confirmPassword") {
          setConfirmPasswordError(err.message);
        }
      });

      return;
    }

    try {
      const user = auth.currentUser;
      if (!user) {
        alert("User belum login");
        return;
      }

      const userRef = doc(db, "users", user.uid);

      await updatePassword(user, password);

      await updateDoc(userRef, {
        fullname: fullname,
      });

      alert("Berhasil diganti 🔥");
    } catch (error: any) {
      console.log(error);

      // 🔥 error umum firebase
      if (error.code === "auth/requires-recent-login") {
        alert("Harus login ulang sebelum ganti password");
      } else {
        alert("Gagal ganti password");
      }
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div
        className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${
          animate ? "opacity-100" : "opacity-0"
        }`}
      />
      <div
        className={`relative flex flex-col rounded-4xl w-[600px] bg-white
          transform transition-all duration-300 ease-out
          ${
            animate
              ? "scale-100 opacity-100 translate-y-0"
              : "scale-90 opacity-0 translate-y-4"
          }`}
      >
        <div className="bg-gradient-to-r from-blue-800 to-blue-400 w-full px-[40px] py-[20px] rounded-t-4xl flex items-center justify-between">
          <h1 className="font-lalezar text-white text-[35px] items-center mt-[10px]">
            Edit your profile
          </h1>
          <CloseIcon
            fontSize="large"
            sx={{ color: "white", cursor: "pointer" }}
            onClick={isEdit}
          />
        </div>

        <div className="px-[40px] py-[25px]">
          <div className="mb-[15px]">
            <p className="font-inter font-bold mb-[5px] text-[18px]">
              Change your full Name
            </p>
            <TextField
              id="fullname"
              value={fullname}
              variant="outlined"
              placeholder="Insert your full name here ..."
              fullWidth
              sx={{
                "& input::placeholder": {
                  fontSize: "15px",
                },
              }}
              onChange={(e) => setFullname(e.target.value)}
            />
          </div>
          <div className="mb-[15px]">
            <p className="font-inter font-bold mb-[5px] text-[18px]">
              Enter new password
            </p>
            <TextField
              id="password"
              value={password}
              variant="outlined"
              placeholder="Insert your password ..."
              type={showPassword ? "text" : "password"}
              fullWidth
              sx={{
                "& input::placeholder": {
                  fontSize: "15px",
                },
              }}
              onChange={(e) => setPassword(e.target.value)}
              error={!!passwordError}
              helperText={passwordError}
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={handleTogglePassword}
                        onMouseDown={(e) => e.preventDefault()}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />
          </div>
          <div className="mb-[5px]">
            <p className="font-inter font-bold mb-[5px] text-[18px]">
              Confirm new password
            </p>
            <TextField
              id="confirmPassword"
              value={confirmPassword}
              variant="outlined"
              placeholder="Confirm your password ..."
              type={showConfirmPassword ? "text" : "password"}
              fullWidth
              sx={{
                "& input::placeholder": {
                  fontSize: "15px",
                },
              }}
              onChange={(e) => setConfirmPassword(e.target.value)}
              error={!!passwordError}
              helperText={passwordError}
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={handleToggleConfirmPassword}
                        onMouseDown={(e) => e.preventDefault()}
                        edge="end"
                      >
                        {showConfirmPassword ? (
                          <VisibilityOff />
                        ) : (
                          <Visibility />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />
          </div>
        </div>
        <Button
          variant="contained"
          sx={{
            fontFamily: "var(--font-inter-sans)",
            marginX: "40px",
            bgcolor: "blue-900",
            marginBottom: "40px",
          }}
          onClick={handleSubmit}
        >
          Submit
        </Button>
      </div>
    </div>
  );
};

export default EditProfileModal;
