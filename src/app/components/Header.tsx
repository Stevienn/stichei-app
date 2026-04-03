"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import FavoriteIcon from "@mui/icons-material/Favorite";
import { useAuthStore } from "@/store/auth";
import { signOut } from "firebase/auth";
import { auth } from "@/config/firebase";
import LogoutIcon from "@mui/icons-material/Logout";
import Image from "next/image";

type IHeaderProps = {
  isLogin: () => void;
  isEditProfileModal: () => void;
};

const Header = ({ isLogin, isEditProfileModal }: IHeaderProps) => {
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const handleLogout = async () => {
    alert("Logout berhasil !");
    await signOut(auth); // 🔥 ini yang penting
    const setUser = useAuthStore.getState().setUser;
    setUser(null);
    logout();
  };

  return (
    <>
      <div className="flex text-[32px] bg-white px-[50px] py-[25px] drop-shadow-sm fixed top-0 w-full z-5">
        <div className="flex justify-between items-center w-full">
          <div className="flex items-center">
            <FavoriteIcon className="mb-[5px]" />
            <h1 className="font-lalezar underline text-blue-800 mx-[8px]">
              Sticheii
            </h1>
            <h2 className="font-lalezar">Love Story</h2>
          </div>
          <div className="flex font-reemkufi gap-[60px] ml-[-30px]">
            <Link href="/">
              <p
                className={`${
                  pathname === "/"
                    ? "font-extrabold hover:scale-110 transition-all duration-300 ease-in-out"
                    : "hover:text-black text-gray-700 hover:scale-110 transition-all duration-300 ease-in-out"
                } text-[17px]`}
              >
                Home
              </p>
            </Link>
            <Link href="/">
              <p
                className={`${
                  pathname === "/comingsoon"
                    ? "font-extrabold hover:scale-110 transition-all duration-300 ease-in-out"
                    : "hover:text-black text-gray-700 hover:scale-110 transition-all duration-300 ease-in-out"
                } text-[17px]`}
              >
                Coming Soon ?
              </p>
            </Link>
            <Link href="/">
              <p
                className={`${
                  pathname === "/comingsoon"
                    ? "font-extrabold hover:scale-110 transition-all duration-300 ease-in-out"
                    : "hover:text-black text-gray-700 hover:scale-110 transition-all duration-300 ease-in-out"
                } text-[17px]`}
              >
                Coming Soon ?
              </p>
            </Link>
            <Link href="/">
              <p
                className={`${
                  pathname === "/comingsoon"
                    ? "font-extrabold hover:scale-110 transition-all duration-300 ease-in-out"
                    : "hover:text-black text-gray-700 hover:scale-110 transition-all duration-300 ease-in-out"
                } text-[17px]`}
              >
                Coming Soon ?
              </p>
            </Link>
          </div>
          <div className="font-reemkufi flex items-center">
            {user ? (
              <div className="flex gap-[20px] justify-center items-center">
                <div className="flex gap-[10px]">
                  <p className="text-[25px] font-lalezar mt-[5px]">Hello,</p>
                  <p className="text-[25px] font-lalezar mt-[5px] text-blue-800">
                    {user.fullname} !
                  </p>
                </div>
                <Image
                  src={"/profilePicture/ppgukguk.png"}
                  alt="pp"
                  width={50}
                  height={40}
                  className="border rounded-[200px] cursor-pointer hover:scale-110"
                  onClick={isEditProfileModal}
                />
                <div onClick={handleLogout}>
                  <LogoutIcon
                    className="cursor-pointer hover:scale-110 mb-[8px]"
                    fontSize="large"
                  />
                </div>
              </div>
            ) : (
              <button
                className="bg-gradient-to-r from-blue-800 to-blue-500 text-[17px] rounded-[20px] px-[30px] py-[7px] text-white cursor-pointer hover:scale-110 hover:shadow-2xl transition-all duration-300 ease-in-out"
                onClick={isLogin}
              >
                Login
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Header;
