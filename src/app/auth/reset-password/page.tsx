import React, { Suspense } from "react";
import ResetPasswordPageContent from "./content";

const ResetPasswordPage = () => {
  return (
    <Suspense>
      <ResetPasswordPageContent />
    </Suspense>
  );
};

export default ResetPasswordPage;
