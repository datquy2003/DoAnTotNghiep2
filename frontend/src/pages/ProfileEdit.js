import React from "react";
import { useAuth } from "../context/AuthContext";
import BaseProfileForm from "../components/forms/BaseProfileForm";
import CandidateProfileForm from "../components/forms/CandidateProfileForm";
import EmployerProfileForm from "../components/forms/EmployerProfileForm";

const ProfileEdit = () => {
  const { appUser } = useAuth();

  if (!appUser) {
    return <div>Đang tải thông tin...</div>;
  }

  const { RoleID } = appUser;

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-8">
      <h1 className="text-3xl font-bold text-gray-800">Chỉnh sửa thông tin</h1>

      <BaseProfileForm />

      {RoleID === 4 && <CandidateProfileForm />}
      {RoleID === 3 && <EmployerProfileForm />}
    </div>
  );
};

export default ProfileEdit;
